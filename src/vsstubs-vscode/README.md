# VapourSynth Stubs

<!-- [![Visual Studio Marketplace](https://img.shields.io/visual-studio-marketplace/v/Ichunjo.vsstubs.svg?color=blue&label=VS%20Marketplace)](https://marketplace.visualstudio.com/items?itemName=Ichunjo.vsstubs)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) -->

**VapourSynth Stubs** provides automated Python stub generation to enable better IntelliSense and autocompletion for VapourSynth scripts in VS Code.

## Features

A **Live Watcher** monitors your plugin directories to automatically regenerate stubs, while seamless **Pylance Integration** ensures your workspace is always configured for instant IntelliSense.

Powered by the `vsstubs` CLI, the extension provides both automated background processing and **Manual Control** via dedicated commands.

## Getting Started

Once the extension is installed, you can use it by opening a VapourSynth script in VS Code.

If `vsstubs` is missing from your Python environment, the extension will prompt you to install it.

## Commands

Access these via the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`):

- `VapourSynth: Generate Stubs` — Full regeneration of all stubs.
- `VapourSynth: Add Plugin Stubs` — Generate stubs for specific plugins.
- `VapourSynth: Remove Plugin Stubs` — Remove stubs for specific plugins.

## Configuration

| Setting                     | Default | Description                                                                   |
| :-------------------------- | :------ | :---------------------------------------------------------------------------- |
| `vsstubs.autoGenerate`      | `true`  | Automatically generate stubs when a workspace with `.vpy` files is opened.    |
| `vsstubs.enableCompatApi3`  | `false` | Enable return type compatibility for APIv3 plugins.                           |
| `vsstubs.extraPluginDirs`   | `[]`    | Additional directories to search for plugins (e.g., portable plugin folders). |
| `vsstubs.watchPlugins`      | `true`  | Watch VapourSynth plugin directories and regenerate stubs on changes.         |
| `vsstubs.watchDebounceTime` | `3000`  | Delay (ms) before regenerating stubs after a plugin change is detected.       |

## Requirements

- **VS Code Python Extension**: [ms-python.python](https://marketplace.visualstudio.com/items?itemName=ms-python.python)

## Contributing

Contributions are welcome. Please submit a Pull Request or open an issue on the [GitHub repository](https://github.com/Ichunjo/vs-stubs).

## License

This extension is licensed under the [MIT License](LICENSE).
