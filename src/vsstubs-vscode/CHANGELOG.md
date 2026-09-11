# Change Log

All notable changes to the **VapourSynth Stubs** extension will be documented in this file.

## [0.4.0] - 2026-09-11

- Add status bar item displaying generation and check progress with quick actions
- Add new configuration options:
  - `vsstubs.checkOnStartup`: Toggle plugin checks when opening a workspace
  - `vsstubs.promptOnPluginChanges`: Toggle prompt notifications when plugin changes are detected
  - `vsstubs.showUpToDateNotification`: Toggle informational notification when stubs are verified to be up to date
- Refactor extension architecture into modular services (`VsstubsCli`, `EnvironmentManager`, `StatusBarController`, `PluginWatcher`)
- Extract standalone Node and path utility functions, including multi-root workspace folder picker
- Enhance cancellation token handling, background command execution, and error reporting
- Improve cross-platform filesystem watcher reliability, resource disposal, and event debouncing
- Lower minimum VS Code engine target to `^1.90.0`

## [0.3.1] - 2026-08-01

- Fix oudated README
- Add badges in README

## [0.3.0] - 2026-08-01

- Add multi-select QuickPick for `VapourSynth: Add Plugin Stubs` and `VapourSynth: Remove Plugin Stubs`
- Add `VapourSynth: Update Stubs` (`vsstubs.update`) command to update plugin stubs
- Add `VapourSynth: Check Stubs` (`vsstubs.check`) command to inspect stub status and detect missing or outdated plugin stubs
- Add VS Code path variable resolution support in config paths
- Refactor extension core logic into a unified `VSStubs` class architecture.
- Prioritize active editor workspace folder in multi-root workspace setups.
- Improve VapourSynth installation and Python environment availability detection.
- Enhance plugin file watcher reliability, path normalization, and resource disposal.

## [0.2.0] - 2026-07-28

- Add support for pyproject.toml detection in uv workflow
- Update dependencies

## [0.1.1] - 2026-07-07

- Update dependencies

## [0.1.0] -

- Add `vsstubs.enableCompatApi3` setting to match `vsstubs`

## [0.0.4] - 2026-05-13

### Added

- Add icon

## [0.0.3] - 2026-05-12

### Updated

- Change publisher to vd-varde

## [0.0.2] - 2026-05-12

### Updated

- Change logo size

## [0.0.1] - 2026-05-12

### Added

- Initial release of the VapourSynth Stubs VS Code extension.
- Automatic stub generation for VapourSynth plugins.
- Background watcher for real-time plugin updates.
- Integration with VS Code Python extension for environment detection.
- Commands for manual stub management (`Generate`, `Add`, `Remove`).
