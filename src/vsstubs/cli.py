import contextlib
import json
import os
import sys
from dataclasses import dataclass
from logging import DEBUG, basicConfig, getLogger
from pathlib import Path
from typing import IO, Annotated

from cyclopts import App, Group, Parameter
from cyclopts.help import HelpPanel
from cyclopts.help.formatters import DefaultFormatter
from rich.console import Console, ConsoleOptions
from rich.logging import RichHandler
from rich.pretty import pretty_repr

from .func import check_stubs, console, list_plugins, output_stubs
from .utils import _get_default_stubs_path

__all__ = ["AppConfig", "app", "main"]

log = getLogger(__name__)
io_group = Group("I/O", sort_key=0)
others_group = Group("Others", sort_key=1)
commands_group = Group("Commands", sort_key=2)


class CleanHelpFormatter(DefaultFormatter):
    def __call__(self, console: Console, options: ConsoleOptions, panel: HelpPanel) -> None:
        panel.entries = [
            entry.copy(positive_names=entry.positive_names[1:])
            if len(entry.positive_names) > 1 and not entry.positive_names[0].startswith("-")
            else entry
            for entry in panel.entries
        ]
        super().__call__(console, options, panel)


app = App(
    name="vsstubs",
    console=console,
    group_commands=commands_group,
    help_formatter=CleanHelpFormatter.with_newline_metadata(),  # type: ignore[no-untyped-call]
)


@Parameter(name="*")
@dataclass
class AppConfig:
    """App configuration options."""

    input: Annotated[str | None, Parameter(alias=["-i", "-I"], group=io_group)] = None
    """Path to the input .pyi file. Use '-' for piping."""
    output: Annotated[
        str | None,
        Parameter(
            alias=["-o", "-O"],
            show_default="vapoursynth-stubs/__init__.pyi inside the site-package folder",
            group=io_group,
        ),
    ] = None
    """Path to write the output .pyi file. '@' overwrites the input file and '-' writes to stdout.
    With --wheel, this is the directory where the wheel is built.
    """
    wheel: Annotated[bool, Parameter(alias="-w", negative=False, group=io_group)] = False
    """Build an installable vapoursynth-stubs wheel instead of writing a .pyi file.
    The wheel path is printed to stdout so it can be passed to pip."""
    load: Annotated[list[Path] | None, Parameter(alias="-L", negative_iterable="", group=io_group)] = None
    """Load plugins from a folder or a single library file."""
    template: Annotated[bool, Parameter(alias="-T", negative=False, group=others_group)] = False
    """Export blank template; excludes existing plugins unless --load or --add is used."""
    compat: Annotated[bool, Parameter(negative=False, group=others_group)] = False
    """Enable return type compatibility for APIv3 plugins."""
    quiet: Annotated[bool, Parameter(group=others_group, negative=False)] = False
    """Suppress message output."""
    debug: Annotated[bool, Parameter(show=False)] = False

    def process(self, command_name: str | None = None) -> tuple[IO[str] | str | None, Path | IO[str] | str | None]:
        """Process log settings and compute input/output files.

        Args:
            command_name: Optional subcommand name being executed.

        Returns:
            Tuple of (input_file, output_file).
        """
        if self.quiet:
            console.quiet = True

        if self.debug:
            basicConfig(level=DEBUG, handlers=[RichHandler(level=DEBUG, console=Console(stderr=True))])

        input_val = self.input
        if command_name in ["check", "update"] and input_val is None:
            default_path = _get_default_stubs_path()
            input_val = str(default_path) if default_path is not None else None
        elif not command_name:
            console.print("Running stub generation...")

        input_file: IO[str] | str | None = sys.stdin if input_val == "-" else input_val

        output_file: Path | IO[str] | str | None
        match self.output:
            case "@":
                if self.wheel:
                    console.print("[red]Error: Cannot use '@' as output when '--wheel' is enabled.[/red]")
                    raise SystemExit(1)
                if input_file is None:
                    console.print("[red]Error: You must provide an input_file when output is '@'.[/red]")
                    raise SystemExit(1)
                output_file = input_file
            case "-":
                if self.wheel:
                    console.print("[red]Error: Cannot use '-' as output when '--wheel' is enabled.[/red]")
                    raise SystemExit(1)
                output_file = sys.stdout
            case str():
                output_file = Path(self.output) if self.wheel else Path(self.output).with_suffix(".pyi")
            case _:
                output_file = _get_default_stubs_path() if not self.wheel else None

        return input_file, output_file


DEFAULT_CONFIG = AppConfig()
_active_config = DEFAULT_CONFIG


def _get_effective_config(cmd_config: AppConfig) -> AppConfig:
    return cmd_config if cmd_config != DEFAULT_CONFIG else _active_config


@app.command
def add(plugins: list[str], /, config: Annotated[AppConfig, Parameter(show=False)] = DEFAULT_CONFIG) -> None:
    """Add or update the specified plugins in the stubs.

    Args:
        plugins: Plugins to add or update.
    """
    cfg = _get_effective_config(config)
    input_file, output_file = cfg.process("add")

    console.print(f"Adding plugins: {', '.join(plugins)}")

    output_stubs(
        input_file=input_file,
        output=output_file,
        wheel=cfg.wheel,
        template=cfg.template,
        load=cfg.load,
        update=False,
        add=set(plugins),
        remove=None,
        compat=cfg.compat,
    )
    raise SystemExit(0)


@app.command
def remove(plugins: list[str], /, config: Annotated[AppConfig, Parameter(show=False)] = DEFAULT_CONFIG) -> None:
    """Remove the specified plugins from the stubs.

    Args:
        plugins: Plugins to remove.
    """
    cfg = _get_effective_config(config)
    input_file, output_file = cfg.process("remove")

    console.print(f"Removing plugins: {', '.join(plugins)}")

    output_stubs(
        input_file=input_file,
        output=output_file,
        wheel=cfg.wheel,
        template=cfg.template,
        load=cfg.load,
        update=False,
        add=None,
        remove=set(plugins),
        compat=cfg.compat,
    )
    raise SystemExit(0)


@app.command
def check(
    config: Annotated[AppConfig, Parameter(show=False)] = DEFAULT_CONFIG,
    output_json: Annotated[bool, Parameter(name="json", group=io_group, negative=False)] = False,
) -> None:
    """Check for new plugins or new plugin signatures.

    Args:
        output_json: Print to stdout a json parseable string of the checked old and new plugins.
    """
    cfg = _get_effective_config(config)
    input_file, _ = cfg.process("check")

    console.print("Checking stubs...")

    if not input_file:
        console.print("[red]Error: You must provide an input file when checking for stubs[/red]")
        raise SystemExit(1)

    with open(os.devnull, "w") as devnull, contextlib.redirect_stdout(devnull):
        out = check_stubs(input_file)

    if output_json:
        json.dump(out, sys.stdout)

    raise SystemExit(0)


@app.command
def update(config: Annotated[AppConfig, Parameter(show=False)] = DEFAULT_CONFIG) -> None:
    """Update the current signatures from the input."""
    cfg = _get_effective_config(config)
    input_file, output_file = cfg.process("update")

    console.print("Updating stubs stubs...")

    output_stubs(
        input_file=input_file,
        output=output_file,
        wheel=cfg.wheel,
        template=cfg.template,
        load=cfg.load,
        update=True,
        add=None,
        remove=None,
        compat=cfg.compat,
    )
    raise SystemExit(0)


@app.command
def plugins(
    config: Annotated[AppConfig, Parameter(show=False)] = DEFAULT_CONFIG,
    output_json: Annotated[bool, Parameter(name="json", group=io_group, negative=False)] = False,
) -> None:
    """List available plugins or installed plugin stubs.

    Args:
        output_json: Print to stdout a JSON-parseable response.
    """
    cfg = _get_effective_config(config)
    input_file, _ = cfg.process("plugins")

    out = list_plugins(input_file=input_file, load=cfg.load)

    if output_json:
        json.dump(out, sys.stdout)
    else:
        console.print(pretty_repr(out))

    raise SystemExit(0)


@app.meta.default
def cli_main(
    *tokens: Annotated[str, Parameter(show=False, allow_leading_hyphen=True)],
    config: Annotated[AppConfig, Parameter(show=True)] = DEFAULT_CONFIG,
) -> None:
    """Generate or modify VapourSynth stubs."""
    global _active_config
    _active_config = config

    if tokens:
        app(tokens)
    else:
        input_file, output_file = config.process()
        output_stubs(
            input_file,
            output_file,
            config.wheel,
            config.template,
            config.load,
            False,
            compat=config.compat,
        )
        raise SystemExit(0)


def main() -> None:
    app.meta()
