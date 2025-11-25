# vs-stubs

**Typing stubs for [VapourSynth](http://www.vapoursynth.com/)**

`vs-stubs` provides Python type stubs for VapourSynth plugins and core functions. This helps editors, IDEs, and static type checkers (e.g. `mypy`, `pyright`) understand VapourSynth’s API.

---

## Installation

```bash
pip install vsstubs
```

---

## Usage

You can use `vsstubs` via the command line or as a Python module.

### Command Line

```bash
vsstubs
```

Example:

```bash
vsstubs -o output.pyi --template
```

### Python API

```python
from vsstubs import output_stubs

# Example usage
output_stubs(None, "output.pyi", template=True)
```

---

## CLI Reference

```
 Usage: vsstubs [OPTIONS] COMMAND [ARGS]...

 vs-stubs command line interface

╭─ Options ─────────────────────────────────────────────────────────────────────╮
│ --template  -T        Export blank template; excludes existing plugins unless │
│                       --load or --add is used.                                │
│ --check     -C        Check for new plugins or new plugin signatures.         │
│ --update    -U        Update the current stubs from the input.                │
│ --help                Show this message and exit.                             │
╰───────────────────────────────────────────────────────────────────────────────╯
╭─ I/O options ─────────────────────────────────────────────────────────────────╮
│ --input   -i,-I      TEXT  Path to the input .pyi file. Use '-' for piping.   │
│ --output  -o,-O      TEXT  Path to write the output .pyi file. '@' to         │
│                            overwrite the input file. '-' for piping.          │
│                            [default: (vapoursynth-stubs/__init__.pyi inside   │
│                            the site-package folder)]                          │
│ --load    -L         PATH  Load plugins from a folder or a single library     │
│                            file.                                              │
╰───────────────────────────────────────────────────────────────────────────────╯
╭─ Informations ────────────────────────────────────────────────────────────────╮
│ --quiet              Suppress message output.                                 │
│ --version  -V        Show version info and exit.                              │
╰───────────────────────────────────────────────────────────────────────────────╯
╭─ Commands ────────────────────────────────────────────────────────────────────╮
│ add      Add or update the specified plugins in the stubs                     │
│ remove   Remove the specified plugins from the stubs                          │
╰───────────────────────────────────────────────────────────────────────────────╯
```

---

## Examples

- Simply update the VapourSynth stubs:

  ```bash
  vsstubs
  ```

- Generate a template stubs:

  ```bash
  vsstubs -o out.pyi --template
  ```

- Add plugin stubs:

  ```bash
  vsstubs -i out.pyi -o @ add resize2
  ```

- Remove plugin stubs (On Powershell you will need to escape the `@` character):

  ```pwsh
  vsstubs -i out.pyi -o "@" remove resize2
  ```

---

## License

MIT

---

## Why use this over `vsrepo genstubs`?

- **Much faster** than `genstubs`.
- **More accurate typing**: the generated stubs better reflect the actual signatures of plugins, core classes, and functions.
- **Modern Python typing**.
- Easier to **maintain** and **extend** than `genstubs`.
- More **flexible workflow**: supports generating blank templates, checking for new plugin signatures, and selectively adding/removing plugins.
