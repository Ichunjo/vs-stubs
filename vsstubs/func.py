from logging import getLogger
from os import PathLike
from pathlib import Path
from typing import IO, Any, Sequence

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
from .utils import _get_cores, _index_by_namespace, running_via_cli

log, console = getLogger(__name__), Console(stderr=True)


def output_stubs(
    input_file: str | PathLike[str] | IO[str] | None,
    output: str | PathLike[str] | IO[str],
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
            new_impl = _index_by_namespace((construct_implementation(pinter) for pinter in pinters))

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

    if isinstance(output, (str, PathLike)):
        output = Path(output)
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(tmpl)
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
