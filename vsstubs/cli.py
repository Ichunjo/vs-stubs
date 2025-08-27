from pathlib import Path
from typing import Annotated

from typer import Context, Exit, Option, Typer, echo

from ._version import __version__
from .func import output_stubs
from .utils import _echo_quiet, _get_default_stubs_path

__all__ = ["__version__", "app"]


app = Typer(invoke_without_command=True, help="vs-stubs command line interface")


def _show_version(value: bool) -> None:
    """Show version info and exit"""

    if value:
        echo(f"vs-stubs version {__version__}")
        raise Exit()


input_opt = Option("--input", "-i", "-I", help="Path to the input .pyi file")
output_opt = Option("--output", "-o", "-O", help="Path to write the output .pyi file")
template_opt = Option(
    "--template", "-T", help="Export blank template; excludes existing plugins unless --load or --add is used"
)
load_opt = Option("--load", "-L", help="Load plugins from a folder or a single library file")
check_opt = Option("--check", "-C", help="Check for new plugins or new plugin signatures")
quiet_opt = Option("--quiet", help="Suppress non-error output")
version_opt = Option("--version", "-V", callback=_show_version, is_eager=True, help="Show version info and exit")


@app.command(help="Add or update the specified plugins in the stubs")
def add(plugins: list[str], ctx: Annotated[Context, Option(None)]) -> None:
    echo(f"Adding plugins: {', '.join(plugins)}")

    output_stubs(
        ctx.obj.input_file,
        ctx.obj.output,
        ctx.obj.template,
        ctx.obj.load,
        False,
        set(plugins),
        None,
    )
    raise Exit()


@app.command(help="Remove the specified plugins from the stubs")
def remove(plugins: list[str], ctx: Annotated[Context, Option(None)]) -> None:
    echo(f"Removing plugins: {', '.join(plugins)}")

    output_stubs(
        ctx.obj.input_file,
        ctx.obj.output,
        ctx.obj.template,
        ctx.obj.load,
        False,
        None,
        set(plugins),
    )
    raise Exit()


@app.callback()
def cli_main(
    ctx: Context,
    input_file: Annotated[Path | None, input_opt] = None,
    output: Annotated[Path | None, output_opt] = None,
    template: Annotated[bool, template_opt] = False,
    load: Annotated[list[Path] | None, load_opt] = None,
    check: Annotated[bool, check_opt] = False,
    quiet: Annotated[bool, quiet_opt] = False,
    version: Annotated[bool, version_opt] = False,
) -> None:
    """
    Generate or modify VapourSynth stubs
    """
    if version:
        raise Exit()

    if quiet:
        global echo
        echo = _echo_quiet

    if check:
        echo("Checking stubs...")
        if input_file is None:
            input_file = _get_default_stubs_path()
    else:
        echo("Running stub generation...")

    output = _get_default_stubs_path() if not output else output.with_suffix(".pyi")

    ctx.obj = type("obj", (type,), {})
    ctx.obj.input_file = input_file
    ctx.obj.output = output
    ctx.obj.template = template
    ctx.obj.load = load
    ctx.obj.check = check
    ctx.obj.quiet = quiet

    if ctx.invoked_subcommand is None:
        output_stubs(input_file, output, template, load, check)
        raise Exit()
