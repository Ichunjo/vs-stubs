import json
import sys
from logging import DEBUG, basicConfig, getLogger
from pathlib import Path
from types import SimpleNamespace
from typing import Annotated

from rich.console import Console
from rich.logging import RichHandler
from typer import BadParameter, Context, Exit, Option, Typer

from .func import check_stubs, console, output_stubs
from .utils import _get_default_stubs_path

__all__ = ["app"]


log = getLogger(__name__)

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
        import importlib.metadata

        console.print(f"{importlib.metadata.version('vsstubs')}")
        raise Exit


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
    help=(
        "Path to write the output .pyi file. '@' overwrites the input file and '-' writes to stdout. "
        "With --wheel, this is the directory where the wheel is built."
    ),
    show_default="vapoursynth-stubs/__init__.pyi inside the site-package folder",
    rich_help_panel="I/O options",
    allow_dash=True,
    path_type=str,
)
wheel_opt = Option(
    "--wheel",
    "-w",
    help=(
        "Build an installable vapoursynth-stubs wheel instead of writing a .pyi file. "
        "The wheel path is printed to stdout so it can be passed to pip."
    ),
    rich_help_panel="I/O options",
)
load_opt = Option(
    "--load",
    "-L",
    help="Load plugins from a folder or a single library file.",
    rich_help_panel="I/O options",
)
template_opt = Option(
    "--template",
    "-T",
    help="Export blank template; excludes existing plugins unless --load or --add is used.",
)
compat_opt = Option("--compat", help="Enable return type compatibility for APIv3 plugins.")
quiet_opt = Option(
    "--quiet",
    help="Suppress message output.",
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
    help="Show version info and exit.",
    rich_help_panel="Informations",
)


@app.command(help="Add or update the specified plugins in the stubs")
def add(plugins: list[str], ctx: Annotated[Context, Option(None)]) -> None:
    console.print(f"Adding plugins: {', '.join(plugins)}")

    output_stubs(
        input_file=ctx.obj.input_file,
        output=ctx.obj.output,
        wheel=ctx.obj.wheel,
        template=ctx.obj.template,
        load=ctx.obj.load,
        update=False,
        add=set(plugins),
        remove=None,
        compat=ctx.obj.compat,
    )
    raise Exit


@app.command(help="Remove the specified plugins from the stubs")
def remove(plugins: list[str], ctx: Annotated[Context, Option(None)]) -> None:
    console.print(f"Removing plugins: {', '.join(plugins)}")

    output_stubs(
        input_file=ctx.obj.input_file,
        output=ctx.obj.output,
        wheel=ctx.obj.wheel,
        template=ctx.obj.template,
        load=ctx.obj.load,
        update=False,
        add=None,
        remove=set(plugins),
        compat=ctx.obj.compat,
    )
    raise Exit


@app.command(help="Check for new plugins or new plugin signatures")
def check(
    ctx: Annotated[Context, Option(None)],
    output_json: Annotated[
        bool,
        Option(
            "--json",
            help="Print to stdout a json parseable string of the checked old and new plugins",
            rich_help_panel="I/O options",
        ),
    ] = False,
) -> None:
    console.print("Checking stubs...")

    if not ctx.obj.input_file:
        raise BadParameter("You must provide an input file when checking for stubs", ctx)

    out = check_stubs(ctx.obj.input_file)

    if output_json:
        json.dump(out, sys.stdout)

    raise Exit


@app.command(help="Update the current signatures from the input")
def update(ctx: Annotated[Context, Option(None)]) -> None:
    console.print("Updating stubs stubs...")

    output_stubs(
        input_file=ctx.obj.input_file,
        output=ctx.obj.output,
        wheel=ctx.obj.wheel,
        template=ctx.obj.template,
        load=ctx.obj.load,
        update=True,
        add=None,
        remove=None,
        compat=ctx.obj.compat,
    )
    raise Exit


@app.callback()
def cli_main(
    ctx: Context,
    input: Annotated[str | None, input_opt] = None,
    output: Annotated[str | None, output_opt] = None,
    wheel: Annotated[bool, wheel_opt] = False,
    template: Annotated[bool, template_opt] = False,
    load: Annotated[list[Path] | None, load_opt] = None,
    compat: Annotated[bool, compat_opt] = False,
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
        raise Exit

    if (ctx.invoked_subcommand in ["check", "update"]) and input is None:
        input = str(_get_default_stubs_path())
    else:
        console.print("Running stub generation...")

    input_file = sys.stdin if input == "-" else input

    match output:
        case "@":
            if wheel:
                console.print("[red]Error: Cannot use '@' as output when '--wheel' is enabled.[/red]")
                raise Exit(1)
            if input_file is None:
                console.print("[red]Error: You must provide an input_file when output is '@'.[/red]")
                raise Exit(1)
            output_file = input_file
        case "-":
            if wheel:
                console.print("[red]Error: Cannot use '-' as output when '--wheel' is enabled.[/red]")
                raise Exit(1)
            output_file = sys.stdout
        case str():
            output_file = Path(output) if wheel else Path(output).with_suffix(".pyi")
        case _:
            output_file = _get_default_stubs_path() if not wheel else None

    ctx.obj = SimpleNamespace()
    ctx.obj.input_file = input_file
    ctx.obj.output = output_file
    ctx.obj.wheel = wheel
    ctx.obj.template = template
    ctx.obj.load = load
    ctx.obj.quiet = quiet
    ctx.obj.compat = compat

    if ctx.invoked_subcommand is None:
        output_stubs(input_file, output_file, wheel, template, load, False, compat=compat)
        raise Exit
