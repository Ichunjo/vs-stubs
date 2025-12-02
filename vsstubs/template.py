import re
from collections import defaultdict
from collections.abc import Iterator
from importlib import resources
from pathlib import Path

_template_filenames = (
    "__all__",
    "_typing",
    "logging",
    "env",
    "constants",
    "formats",
    "props",
    "plugin",
    "_wrappers",
    "frames",
    "nodes",
    "outputs",
    "misc",
)


def get_stubs_files() -> Iterator[Path]:
    """Get the stubs file bundled with the package"""

    for name in _template_filenames:
        resource = resources.files("vsstubs._template").joinpath(f"{name}.pyi")

        with resources.as_file(resource) as path:
            yield path


def _extract_imports(code: str) -> tuple[defaultdict[str, set[str]], str]:
    """Extracts the imports from each stubs files."""

    # Regex to extract from-imports
    import_pattern = re.compile(
        r"""
        ^from\s+([.\w]+)\s+import\s+
        (
            \([^()]*?\)      # Parenthesized list
            |
            .+               # Or non-parenthesized list
        )
        """,
        re.MULTILINE | re.VERBOSE,
    )

    imports = defaultdict[str, set[str]](set)
    last_import_end = 0

    for match in import_pattern.finditer(code):
        module, imported = match.groups()
        imported = imported.strip()
        last_import_end = match.end()

        if imported.startswith("("):
            names = re.findall(r"\b\w+\b", imported)
        else:
            names = (name.strip() for name in imported.split(","))

        imports[module].update(names)

    remaining_code = code[last_import_end:].lstrip()

    return imports, remaining_code


def get_template() -> str:
    """Get the clean and merged template."""

    noqa = "# This file is auto-generated. DO NOT EDIT."
    noqa += "# ruff: noqa"
    noqa += "# flake8: noqa"
    noqa += "# fmt: off"
    noqa += "isort: skip_file"

    imports = defaultdict[str, set[str]](set)
    code = ""

    for file in get_stubs_files():
        fimports, fcode = _extract_imports(file.read_text())

        code += "\n" + fcode

        # Merge the imports
        for k, v in fimports.items():
            imports[k] |= v

    imports_codes = "\n".join(
        f"from {k} import {', '.join(sorted(v))}" for k, v in sorted(imports.items()) if not k.startswith(".")
    )

    return noqa + "\n" + imports_codes + "\n\n" + code
