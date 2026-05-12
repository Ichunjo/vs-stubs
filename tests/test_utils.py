from pathlib import Path
from unittest.mock import MagicMock

import pytest_mock

from vsstubs.utils import _get_default_stubs_path, _index_by_namespace, running_via_cli


def test_index_by_namespace() -> None:
    class MockHasNamespace:
        def __init__(self, namespace: str):
            self.namespace = namespace

    items = [MockHasNamespace("std"), MockHasNamespace("akarin")]
    indexed = _index_by_namespace(items)

    assert len(indexed) == 2
    assert indexed["std"].namespace == "std"
    assert indexed["akarin"].namespace == "akarin"


def test_running_via_cli_argv(mocker: pytest_mock.MockerFixture) -> None:
    # Mock sys.argv[0] to simulate running via entry point
    mocker.patch("sys.argv", ["vsstubs"])
    assert running_via_cli() is True

    mocker.patch("sys.argv", ["python", "-m", "vsstubs"])
    # This one is trickier as it checks sys.modules["__main__"]
    mock_main = MagicMock()
    mock_main.__package__ = "vsstubs"
    mocker.patch.dict("sys.modules", {"__main__": mock_main})
    assert running_via_cli() is True


def test_get_default_stubs_path(mocker: pytest_mock.MockerFixture) -> None:
    # Test when in a venv
    mocker.patch("sys.prefix", "venv")
    mocker.patch("sys.base_prefix", "base")

    mocker.patch("vapoursynth.__file__", str(Path("venv/lib/site-packages/vapoursynth/__init__.py")))

    _get_default_stubs_path.cache_clear()
    path = _get_default_stubs_path()
    assert "vapoursynth-stubs" in str(path)
    assert path.name == "__init__.pyi"

    # Test when not in a venv
    mocker.patch("sys.prefix", "base")
    mocker.patch("sys.base_prefix", "base")
    mocker.patch("site.getusersitepackages", return_value="usersite")

    _get_default_stubs_path.cache_clear()
    path = _get_default_stubs_path()
    assert str(path).startswith("usersite")
