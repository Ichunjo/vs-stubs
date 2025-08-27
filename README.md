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

╭─ Options ────────────────────────────────────────────────────────────────────────────╮
│ --input               -i,-I      PATH  Path to the input .pyi file [default: None]   │
│ --output              -o,-O      PATH  Path to write the output .pyi file. Default   │
│                                        is vapoursynth-stubs/__init__.pyi inside the  │
│                                        site-package folder                           │
│ --template            -T               Export blank template; excludes existing      │
│                                        plugins unless --load or --add is used        │
│ --load                -L         PATH  Load plugins from a folder or a single        │
│                                        library file                                  │
│                                        [default: None]                               │
│ --check               -C               Check for new plugins or new plugin           │
│                                        signatures                                    │
│ --quiet                                Suppress non-error output                     │
│ --version             -V               Show version info and exit                    │
│ --install-completion                   Install completion for the current shell.     │
│ --show-completion                      Show completion for the current shell, to     │
│                                        copy it or customize the installation.        │
│ --help                                 Show this message and exit.                   │
╰──────────────────────────────────────────────────────────────────────────────────────╯
╭─ Commands ───────────────────────────────────────────────────────────────────────────╮
│ add      Add or update the specified plugins in the stubs                            │
│ remove   Remove the specified plugins from the stubs                                 │
╰──────────────────────────────────────────────────────────────────────────────────────╯
```

---

## Examples

* Simply update the VapourSynth stubs:

  ```bash
  vsstubs
  ```

* Generate a template stubs:

  ```bash
  vsstubs -o out.pyi --template
  ```

* Add plugin stubs:

  ```bash
  vsstubs -i out.pyi -o out.pyi add resize2
  ```

* Remove plugin stubs:

  ```bash
  vsstubs -i out.pyi -o out.pyi remove resize2
  ```

---

## License

MIT

---

## Why use this over `vsrepo genstubs`?
- **Modern Python typing**.
- Easier to **maintain** and **extend** than `genstubs`.
- More **flexible workflow**: supports generating blank templates, checking for new plugin signatures, and selectively adding/removing plugins.
