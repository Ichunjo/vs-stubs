from pytest_mock import MockerFixture
from typer.testing import CliRunner

from vsstubs.cli import app

runner = CliRunner()


def test_cli_help() -> None:
    result = runner.invoke(app, ["--help"])
    assert result.exit_code == 0
    assert "vs-stubs" in result.output


def test_cli_add_dry_run(mocker: MockerFixture) -> None:
    # Mock output_stubs to avoid actually writing files
    mock_output = mocker.patch("vsstubs.cli.output_stubs")
    result = runner.invoke(app, ["add", "std", "akarin"])
    assert result.exit_code == 0
    assert "Adding plugins: std, akarin" in result.output
    mock_output.assert_called_once()


def test_cli_check_error_no_input(mocker: MockerFixture) -> None:
    mocker.patch("vsstubs.cli._get_default_stubs_path", return_value="/non/existent/path")

    result = runner.invoke(app, ["check"])
    # Should fail because it can't find the file
    assert result.exit_code != 0
