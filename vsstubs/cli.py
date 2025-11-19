from logging import DEBUG, basicConfig
from pathlib import Path
from types import SimpleNamespace
from typing import Annotated

from rich.console import Console
from rich.logging import RichHandler
from typer import Context, Exit, Option, Typer

from ._version import __version__
from .func import console, output_stubs
from .utils import _get_default_stubs_path

__all__ = ["__version__", "app"]


app = Typer(
    invoke_without_command=True,
    help="[bold]vs-stubs command line interface[/bold]",
    rich_markup_mode="rich",
    pretty_exceptions_enable=False,
    add_completion=False,
)


def _show_version(value: bool) -> None:
    """Show version info and exit"""

    if value:
        console.print(f"vs-stubs version {__version__}")
        raise Exit()


input_opt = Option(
    "--input",
    "-i",
    "-I",
    help="Path to the input .pyi file. Use '-' for piping.",
    rich_help_panel="I/O options",
    allow_dash=True,
    path_type=str,
)
output_opt = Option(
    "--output",
    "-o",
    "-O",
    help="Path to write the output .pyi file. '@' to overwrite the input file. '-' for piping.",
    show_default="vapoursynth-stubs/__init__.pyi inside the site-package folder",
    rich_help_panel="I/O options",
    allow_dash=True,
    path_type=str,
)
load_opt = Option(
    "--load",
    "-L",
    help="Load plugins from a folder or a single library file",
    rich_help_panel="I/O options",
)
template_opt = Option(
    "--template",
    "-T",
    help="Export blank template; excludes existing plugins unless --load or --add is used",
)
check_opt = Option(
    "--check",
    "-C",
    help="Check for new plugins or new plugin signatures",
)
quiet_opt = Option(
    "--quiet",
    help="Suppress non-error output",
    rich_help_panel="Informations",
)
debug_opt = Option(
    "--debug",
    hidden=True,
)
version_opt = Option(
    "--version",
    "-V",
    callback=_show_version,
    is_eager=True,
    help="Show version info and exit",
    rich_help_panel="Informations",
)


@app.command(help="Add or update the specified plugins in the stubs")
def add(plugins: list[str], ctx: Annotated[Context, Option(None)]) -> None:
    console.print(f"Adding plugins: {', '.join(plugins)}")

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
    console.print(f"Removing plugins: {', '.join(plugins)}")

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
    input: Annotated[str | None, input_opt] = None,
    output: Annotated[str | None, output_opt] = None,
    template: Annotated[bool, template_opt] = False,
    load: Annotated[list[Path] | None, load_opt] = None,
    check: Annotated[bool, check_opt] = False,
    quiet: Annotated[bool, quiet_opt] = False,
    debug: Annotated[bool, debug_opt] = False,
    version: Annotated[bool, version_opt] = False,
) -> None:
    """
    Generate or modify VapourSynth stubs
    """

    if quiet:
        console.quiet = True

    if debug:
        basicConfig(level=DEBUG, handlers=[RichHandler(level=DEBUG, console=Console(stderr=True))])

    if version:
        raise Exit()

    if check:
        console.print("Checking stubs...")
        if input is None:
            input = str(_get_default_stubs_path())
    else:
        console.print("Running stub generation...")

    if input == "-":
        input_file = sys.stdin
    elif isinstance(input, str):
        input_file = Path(input)
    else:
        input_file = _get_default_stubs_path()

    if output == "@":
        if input_file is None:
            console.print("[red]Error: You must provide an input_file when output is '@'.[/red]")
            raise Exit(1)
        output_file = input_file
    elif output == "-":
        output_file = sys.stdout
    else:
        output_file = _get_default_stubs_path() if not output else Path(output).with_suffix(".pyi")

    ctx.obj = SimpleNamespace()
    ctx.obj.input_file = input_file
    ctx.obj.output = output_file
    ctx.obj.template = template
    ctx.obj.load = load
    ctx.obj.check = check
    ctx.obj.quiet = quiet

    if ctx.invoked_subcommand is None:
        output_stubs(input_file, output_file, template, load, check)
        raise Exit()
