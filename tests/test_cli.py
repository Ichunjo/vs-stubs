import pytest
from pytest_mock import MockerFixture

from vsstubs.cli import app


def test_cli_help(capsys: pytest.CaptureFixture[str]) -> None:
    with pytest.raises(SystemExit) as exc_info:
        app.meta(["--help"])
    assert exc_info.value.code == 0
    captured = capsys.readouterr()
    output = captured.out + captured.err
    assert "vsstubs" in output or "vs-stubs" in output


def test_cli_version(capsys: pytest.CaptureFixture[str]) -> None:
    with pytest.raises(SystemExit) as exc_info:
        app.meta(["--version"])
    assert exc_info.value.code == 0
    captured = capsys.readouterr()
    output = captured.out + captured.err
    assert len(output.strip()) > 0


def test_cli_add_dry_run(mocker: MockerFixture, capsys: pytest.CaptureFixture[str]) -> None:
    mock_output = mocker.patch("vsstubs.cli.output_stubs")
    with pytest.raises(SystemExit) as exc_info:
        app.meta(["add", "std", "akarin"])
    assert exc_info.value.code == 0
    captured = capsys.readouterr()
    output = captured.out + captured.err
    assert "Adding plugins: std, akarin" in output
    mock_output.assert_called_once()


def test_cli_check_error_no_input(mocker: MockerFixture) -> None:
    mocker.patch("vsstubs.cli._get_default_stubs_path", return_value="/non/existent/path")

    with pytest.raises((FileNotFoundError, SystemExit)):
        app.meta(["check"])
