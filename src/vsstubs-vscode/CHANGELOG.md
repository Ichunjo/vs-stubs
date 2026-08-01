# Change Log

All notable changes to the **VapourSynth Stubs** extension will be documented in this file.

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
