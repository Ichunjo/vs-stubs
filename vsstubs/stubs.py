from __future__ import annotations

import re
from collections import defaultdict
from contextlib import suppress
from functools import cache
from inspect import Parameter
from pathlib import Path
from typing import Any, Iterable, Mapping, Sequence, is_typeddict

from vapoursynth import Error, core

from .constants import (
    _ATTR_IMPL_END,
    _ATTR_IMPL_START,
    _CORE_IMPL_END,
    _CORE_IMPL_START,
    _IMPL_END,
    _IMPL_START,
    _PLUGINS_IMPL_END,
    _PLUGINS_IMPL_START,
    _callback_signatures,
)
from .types import FunctionInterface, Implementation, PluginInterface, VideoNodeType, _CoreLike, parse_type
from .utils import _get_cores, _get_dir, _get_plugins, _get_typed_dict_repr, _replace_known_callback_signature


def load_plugins(paths: Iterable[Path]) -> set[str]:
    """
    Load the plugins from a list of dll or path folders.

    Returns the new loaded namespace plugins.
    """
    old_plugins = {p.namespace for p in core.plugins()}

    for path in paths:
        if not path.exists():
            raise ValueError(f'This path "{path}" doesn\'t exist.')

        if path.is_dir():
            core.std.LoadAllPlugins(str(path))
        else:
            # std.LoadAllPlugins silently skips the plugins that fail to load.
            with suppress(Error):
                core.std.LoadPlugin(str(path))

    return {p.namespace for p in _get_plugins()} - old_plugins


def retrieve_plugins(core_like: Sequence[_CoreLike]) -> Sequence[PluginInterface]:
    """
    Get a sequence of PluginInferface.

    A PluginInferface offers an interface for each core-like it owns with its functions attached to it.
    """
    plugins = list[PluginInterface]()

    for plugin in _get_plugins():
        functions = defaultdict[str, list[FunctionInterface]](list)

        for cl in core_like:
            # Some plugins only have vs.Core as bound core
            if plugin.namespace not in _get_dir(cl):
                continue

            # Get the actual plugin attached to its core to get the right functions signatures.
            if cl is not core.core:
                plugin = getattr(cl, plugin.namespace)

            functions[cl.__class__.__name__].extend(
                # Only gets the functions that __dir__ provides
                FunctionInterface(f.name, f.__signature__)
                for f in plugin.functions()
                if f.name in _get_dir(plugin)
            )

        plugins.append(PluginInterface(plugin.namespace, functions, plugin.name))

    return plugins


def construct_implementation(interface: PluginInterface) -> Implementation:
    """Contructs a full implementation block with all the functions for all the cores-like."""

    functions_map = dict[str, list[str]]()
    extras = list[str]()

    for core_name, functions in interface.functions.items():
        functions_list = list[str]()

        for function in functions:
            parameters = function.signature.parameters.copy()

            for k, v in parameters.items():
                parameters[k] = v.replace(annotation=parse_type(v.annotation))

            # Replaces the anonymous callback types to known signatures.
            if param_names := _callback_signatures.get(interface.namespace, {}).get(function.name):
                for name in param_names:
                    parameters[name] = _replace_known_callback_signature(parameters[name], interface, function)

            signature = function.signature.replace(
                parameters=(Parameter("self", Parameter.POSITIONAL_OR_KEYWORD), *parameters.values()),
                # If a function returns Any, it's probably a APIv3 plugin.
                # We assume it always returns a VideoNode but we know it's not always the case...
                return_annotation=VideoNodeType()
                if function.signature.return_annotation == Any
                else parse_type(function.signature.return_annotation, True),
            )

            functions_list.append(f"def {function.name}{signature}: ...")

            if is_typeddict(td := signature.return_annotation):
                extras.append(_get_typed_dict_repr(td))

        functions_map[core_name] = functions_list

    return Implementation(interface.namespace, functions_map, interface.description, extras)


def get_implementations_from_input(file: Path) -> list[Implementation]:
    """Parse a file to extract plugin implementations."""
    text = file.read_text()

    plugins_impl_block_matched = re.search(rf"{_PLUGINS_IMPL_START}(.*?){_PLUGINS_IMPL_END}", text, re.DOTALL)

    if not plugins_impl_block_matched:
        return []

    # Regex to capture class blocks like "_Core_bound", "_VideoNode_bound" or _AudioNode_bound"
    plugins_impl_block_pattern = re.compile(
        r"class _(\w+)_bound:\s*class Plugin.*?:([\s\S]*?)(?=\n\s*class _\w+_bound:|\Z)", re.MULTILINE
    )
    # Regex to capture full function definition lines
    func_pattern = re.compile(r"^\s*def [\s\S]+?-> [\w\[\], |]+: \.\.\.", re.MULTILINE)

    implementations = list[Implementation]()

    # Regex to capture <implementation/{plugin_name}>
    for name, body in re.findall(
        rf"{_IMPL_START.format(name='([^>]+)')}(.*?){_IMPL_END.format(name='\\1')}",
        plugins_impl_block_matched.group(),
        re.DOTALL,
    ):
        if not body:
            raise ValueError(f"No plugin implementation block found for {name}.")

        extras = list[str]()
        body_lines = [s for s in body.splitlines() if s]

        while not body_lines[0].startswith("class") and body_lines[0]:
            extras.append(body_lines.pop(0))

        functions = defaultdict[str, list[str]](list)

        for core_like, fbody in plugins_impl_block_pattern.findall(body):
            funcs = func_pattern.findall(fbody)
            # Normalize each function definition into one stripped line
            functions[core_like].extend(" ".join(f.split()).replace("( ", "(").replace(", )", ")") for f in funcs)

        doc = _extract_description(text, name, functions)

        implementations.append(Implementation(name, functions, doc, extras))

    return implementations


@cache
def _search_core_impl(core_name: str, text: str) -> re.Match[str] | None:
    """Regex to capture the whole plugins bound block"""
    return re.search(rf"{_CORE_IMPL_START}(.*?){_CORE_IMPL_END}".format(core_name=core_name), text, re.DOTALL)


def _extract_description(text: str, ns: str, functions: Mapping[str, Sequence[str]]) -> str:
    core_name = next(iter(functions))

    core_impl_matched = _search_core_impl(core_name, text)

    if core_impl_matched is None:
        raise ValueError(f"No core implementation block found for {core_name}.")

    # Regex to capture the attribute block
    attr_matched = re.search(
        rf"{_ATTR_IMPL_START}(.*?){_ATTR_IMPL_END}".format(core_name=core_name, name=ns),
        core_impl_matched.group(0),
        re.DOTALL,
    )
    if not attr_matched:
        raise ValueError(f"No attribute block found for {core_name}.")

    doc_matched = re.search(r"(?:\"\"\"(.*?)\"\"\"|)$", attr_matched.group(1), re.DOTALL)

    return "" if not doc_matched else doc_matched.group(1)


def write_implementations(implementations: list[Implementation], template: str) -> str:
    """Replace the plugin implementations block in `template` with the given implementations."""
    body = "\n".join(impl.as_stub() for impl in sorted(implementations))
    replacement = f"{_PLUGINS_IMPL_START}\n{body}\n{_PLUGINS_IMPL_END}"

    return re.sub(
        rf"{_PLUGINS_IMPL_START}.*{_PLUGINS_IMPL_END}",
        replacement,
        template,
        flags=re.DOTALL,
    )


def write_plugins_bound(implementations: list[Implementation], template: str) -> str:
    """Replace the plugin bound blocks in `template` with the given implementations."""
    for core_like in _get_cores():
        cname = core_like.__class__.__name__

        plugins_bound = "\n".join(
            (
                f"{_ATTR_IMPL_START.format(core_name=cname, name=i.namespace)}\n"
                f"    {i.namespace}: Final[_{i.namespace}._{cname}_bound.Plugin]\n"
                f'    """{i.description}"""\n'
                f"{_ATTR_IMPL_END.format(core_name=cname, name=i.namespace)}"
            )
            for i in sorted(implementations, key=lambda i: i.namespace)
            if cname in i.functions
        )

        template = re.sub(
            rf"{_CORE_IMPL_START}.*{_CORE_IMPL_END}".format(core_name=cname),
            rf"{_CORE_IMPL_START}\n{plugins_bound}\n{_CORE_IMPL_END}".format(core_name=cname),
            template,
            flags=re.DOTALL,
        )

    return template
