# vs-stubs

**Typing stubs for [VapourSynth](http://www.vapoursynth.com/)**

`vs-stubs` provides Python type stubs for VapourSynth plugins and core functions.
This helps editors, IDEs, and static type checkers (e.g. `mypy`, `pyright`) understand VapourSynth's API.

Due to the dynamic nature of VapourSynth's plugin system, any newly installed plugins are not automatically reflected in the stubs.
When adding plugins, you will need to regenerate stubs to keep the type information accurate and in sync with your environment.

Note that `vs-stubs` does not include or install any actual VapourSynth plugins. Only their type definitions.

> [!TIP]
> A VSCode extension is also available [here](https://marketplace.visualstudio.com/items?itemName=vd-varde.vsstubs).

---

## Installation

```bash
pip install vsstubs
```

---

## Usage

You can use `vsstubs` via the command line or as a Python module.

### Command Line

- Simply update the VapourSynth stubs:

  ```bash
  vsstubs
  ```

- Installing from the wheel output for a proper installation:

  ```powershell
  pip install $(vsstubs --wheel)
  ```

  `--wheel` builds an installable `vapoursynth-stubs` wheel instead of writing a `.pyi` file directly.

  By default, the wheel is created in a temporary directory and the wheel path is printed to stdout,
  which lets shells pass it straight to `pip install`.

  Use `--output` with `--wheel` to choose the directory where the wheel should be built:

  ```bash
  vsstubs --wheel --output dist
  ```

  When `--wheel` is enabled, `--output` must be a directory path.
  The special output values `@` and `-` are only for direct `.pyi` output and cannot be used with wheel output.

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

### Python API

```python
from vsstubs import output_stubs

# Example usage
output_stubs(None, "output.pyi", template=True)
```

---

## CLI Reference

![`vsstubs`](https://raw.githubusercontent.com/Ichunjo/vsstubs/master/assets/svg/vsstubs_help.svg)

### Add command

![`vsstubs add --help`](https://raw.githubusercontent.com/Ichunjo/vsstubs/master/assets/svg/vsstubs_add_help.svg)

### Check command

![`vsstubs check --help`](https://raw.githubusercontent.com/Ichunjo/vsstubs/master/assets/svg/vsstubs_check_help.svg)

### Remove command

![`vsstubs remove --help`](https://raw.githubusercontent.com/Ichunjo/vsstubs/master/assets/svg/vsstubs_remove_help.svg)

### Update command

![`vsstubs update --help`](https://raw.githubusercontent.com/Ichunjo/vsstubs/master/assets/svg/vsstubs_update_help.svg)
