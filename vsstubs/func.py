from logging import getLogger
from pathlib import Path

from typer import echo, style

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
from .utils import _echo_quiet, _get_cores, _index_by_namespace, running_via_cli

log = getLogger(__name__)


def output_stubs(
    input_file: Path | None,
    output: Path,
    template: bool = False,
    load: list[Path] | None = None,
    check: bool = False,
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

        add: A set of plugin names to add or update in the stubs.

        remove: A set of plugin names to remove from the stubs.
    """

    if not running_via_cli():
        global echo
        echo = _echo_quiet

    if load:
        echo(f"Loading plugins from: {load}")
        plugins_to_add = load_plugins(load)
        add = plugins_to_add if not add else add | plugins_to_add

    cores = _get_cores()
    pinters = retrieve_plugins(cores)

    if input_file:
        tmpl = input_file.read_text()
        implementations = get_implementations_from_input(input_file)

        if check:
            old_impl = _index_by_namespace(implementations)
            new_impl = _index_by_namespace((construct_implementation(pinter) for pinter in pinters))

            old_keys, new_keys = set(old_impl), set(new_impl)

            only_old = old_keys - new_keys
            only_new = new_keys - old_keys

            if only_old or only_new:
                echo(
                    f"Mismatched plugin(s): "
                    f"only in input={', '.join(sorted(only_old)) or 'none'}, "
                    f"only new={', '.join(sorted(only_new)) or 'none'}"
                )

            for ns in old_keys & new_keys:
                _compare_plugins(old_impl[ns], new_impl[ns], ns)

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

        if add:
            pinters_map = _index_by_namespace(pinters)

            for ns in add:
                if ns not in pinters_map:
                    echo(style(f'"{ns}" isn\'t a valid plugin namespace.', "yellow"))
                    continue

                impl_map[ns] = construct_implementation(pinters_map[ns])

        if remove:
            for ns in remove:
                if ns not in impl_map:
                    echo(style(f'"{ns}" isn\'t a valid plugin namespace.', "yellow"))
                    continue

                del impl_map[ns]

        implementations = list(impl_map.values())

    log.debug("parse_type: %s", parse_type.cache_info())

    tmpl = write_implementations(implementations, tmpl)
    tmpl = write_plugins_bound(implementations, tmpl)

    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(tmpl)


def _compare_plugins(old: Implementation, new: Implementation, ns: str) -> None:
    checks = [
        ("functions", dict(old.functions), dict(new.functions)),
        ("description", old.description, new.description),
        ("extra types", old.extra_types, new.extra_types),
    ]
    for field, old_val, new_val in checks:
        if old_val != new_val:
            echo(f'For the plugin {ns}, the "{field}" differ.')
