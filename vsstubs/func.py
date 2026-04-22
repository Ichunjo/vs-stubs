import sys
import tempfile
from collections.abc import Sequence
from datetime import datetime
from logging import getLogger
from os import PathLike
from pathlib import Path
from types import NoneType
from typing import IO, Any

from rich.console import Console

from .stubs import (
    construct_implementation,
    get_implementations_from_input,
    load_plugins,
    retrieve_plugins,
    write_implementations,
    write_plugins_bound,
)
from .template import get_template
from .types import Implementation, parse_type
from .utils import _get_cores, _get_default_stubs_path, _index_by_namespace, running_via_cli

log, console = getLogger(__name__), Console(stderr=True)


def output_stubs(
    input_file: str | PathLike[str] | IO[str] | None,
    output: str | PathLike[str] | IO[str] | None,
    wheel: bool = False,
    template: bool = False,
    load: Sequence[str | PathLike[str]] | None = None,
    check: bool = False,
    update: bool = False,
    add: set[str] | None = None,
    remove: set[str] | None = None,
) -> None:
    """
    Generate or update VapourSynth stub files.

    This function creates a `.pyi` stub file based on an existing stub, a blank template,
    or additional plugin definitions.
    It can also validate stubs against newly detected plugins or signatures.

    Args:
        input_file: Optional path to an existing `.pyi` file to use as the base for generating stubs.
            If None, a new stub is created from scratch.

        output: Path to the `.pyi` file where the generated stubs will be written.

        template: If True, generate a blank template with no existing plugins
            unless explicitly provided via `load` or `add`.

        wheel: If True, build a wheel and print to stdout the path to it.

        load: One or more paths to plugin definitions (either directories or individual library files)
            to be included in the stubs.

        check: If True, validate the generated stubs against newly discovered plugins or signatures,
            reporting any discrepancies.

        update: If True, only update the current stubs from the input_file.

        add: A set of plugin names to add or update in the stubs.

        remove: A set of plugin names to remove from the stubs.
    """

    if not running_via_cli():
        console.quiet = True

    if load:
        console.print(f"Loading plugins from: {load}")
        plugins_to_add = load_plugins(load)
        add = plugins_to_add if not add else add | plugins_to_add

    cores = _get_cores()
    pinters = retrieve_plugins(cores)

    if input_file:
        tmpl = Path(input_file).read_text() if isinstance(input_file, (str, PathLike)) else input_file.read()

        implementations = get_implementations_from_input(tmpl)

        if check:
            console.print("Checking stubs...")

            old_impl = _index_by_namespace(implementations)
            new_impl = _index_by_namespace(construct_implementation(pinter) for pinter in pinters)

            old_keys, new_keys = set(old_impl), set(new_impl)

            only_old = old_keys - new_keys
            only_new = new_keys - old_keys

            if only_old or only_new:
                console.print(
                    f"[yellow]"
                    f"Mismatched plugin(s): "
                    f"only in input={', '.join(sorted(only_old)) or 'none'}, "
                    f"only new={', '.join(sorted(only_new)) or 'none'}"
                    "[/yellow]"
                )

            for ns in old_keys & new_keys:
                _compare_plugins(old_impl[ns], new_impl[ns], ns)
        elif update:
            impl_ns = [i.namespace for i in implementations]

            console.print(f"Updating stubs... Found {len(impl_ns)} plugins to update: {impl_ns}")

            implementations = [construct_implementation(pinter) for pinter in pinters if pinter.namespace in impl_ns]

    elif template:
        tmpl = get_template()
        implementations = []
    else:
        tmpl = get_template()
        implementations = [construct_implementation(pinter) for pinter in pinters]

    if add or remove:
        impl_map = _index_by_namespace(implementations)

        log.debug("add: %s", add)
        log.debug("remove: %s", remove)

        warn_msg = '[yellow]"{ns}" isn\'t a valid plugin namespace.[/yellow]'

        if add:
            pinters_map = _index_by_namespace(pinters)

            for ns in add:
                if ns not in pinters_map:
                    console.print(warn_msg.format(ns=ns))
                    continue

                impl_map[ns] = construct_implementation(pinters_map[ns])

        if remove:
            for ns in remove:
                if ns not in impl_map:
                    console.print(warn_msg.format(ns=ns))
                    continue

                del impl_map[ns]

        implementations = list(impl_map.values())

    log.debug("parse_type: %s", parse_type.cache_info())

    tmpl = write_implementations(implementations, tmpl)
    tmpl = write_plugins_bound(implementations, tmpl)

    log.debug("output: %r", output)

    if isinstance(output, (str, PathLike, NoneType)):
        if wheel:
            output_dir = Path(output or tempfile.mkdtemp(prefix="vsstubs_"))

            if output_dir.exists() and not output_dir.is_dir():
                console.print(f"[red]Error: Output path '{output_dir}' is not a directory.[/red]")
                return

            try:
                wheel_path = build_wheel(output_dir, tmpl)
                print(wheel_path, file=sys.stdout)
                console.print(f"[green]Wheel built successfully at:[/green] {wheel_path}")
            except Exception as e:
                console.print(f"[red]Error building wheel: {e}[/red]")
                return
        else:
            output_path = Path(output) if output else _get_default_stubs_path()
            output_path.parent.mkdir(parents=True, exist_ok=True)
            output_path.write_text(tmpl)
            console.print("[green]Done![/green]")
            console.print(f"Stub written to {output_path}")
    else:
        output.write(tmpl)
        console.print("[green]Done![/green]")


def _compare_plugins(old: Implementation, new: Implementation, ns: str) -> None:
    checks: list[tuple[str, Any, Any]] = [
        ("functions", dict(old.functions), dict(new.functions)),
        ("description", old.description, new.description),
        ("extra types", old.extra_types, new.extra_types),
    ]
    for field, old_val, new_val in checks:
        if old_val != new_val:
            console.print(f'For the plugin {ns}, the "{field}" differ.')


_PYPROJECT_TOML = """
[build-system]
requires = ["uv_build>=0.11.7,<0.12.0"]
build-backend = "uv_build"

[project]
name = "vapoursynth-stubs"
version = "0.0.0"
"""


def build_wheel(path: Path, tmpl: str) -> str:
    import importlib.metadata
    import shutil

    import build
    import packaging.version
    import toml_rs

    src = path / "build_src"
    if src.exists():
        shutil.rmtree(src)
    src.mkdir(parents=True)

    try:
        v = packaging.version.parse(importlib.metadata.version("vsstubs"))
        d = datetime.now()
        metadata = toml_rs.loads(_PYPROJECT_TOML)
        # Use a PEP 440 compliant version string
        metadata["project"]["version"] = f"{v.base_version}.{d.strftime('%Y%m%d%H%M%S')}"
        toml_rs.dump(metadata, src / "pyproject.toml")

        module = src / "src" / "vapoursynth-stubs"
        module.mkdir(parents=True)

        (module / "__init__.pyi").write_text(tmpl)

        return build.ProjectBuilder(src).build("wheel", path)
    finally:
        shutil.rmtree(src, ignore_errors=True)
