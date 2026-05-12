/**
 * Shared constants for the extension.
 */

export const EXTENSION_ID = 'vsstubs';
export const OUTPUT_CHANNEL_NAME = 'VapourSynth Stubs';

export const COMMANDS = {
  GENERATE: 'vsstubs.generate',
  ADD_PLUGIN: 'vsstubs.addPlugin',
  REMOVE_PLUGIN: 'vsstubs.removePlugin',
} as const;

export const CONFIG = {
  SECTION: 'vsstubs',
  AUTO_GENERATE: 'autoGenerate',
  EXTRA_PLUGIN_DIRS: 'extraPluginDirs',
  WATCH_PLUGINS: 'watchPlugins',
  WATCH_DEBOUNCE_TIME: 'watchDebounceTime',
} as const;

export const PLUGIN_GLOB = '**/*.{dll,so,dylib}' as const;

export const PYTHON_CONFIG = {
  SECTION: 'python',
  DEFAULT_INTERPRETER: 'defaultInterpreterPath',
  ANALYSIS_SECTION: 'python.analysis',
  STUB_PATH: 'stubPath',
} as const;

export const FILENAMES = {
  UV_LOCK: 'uv.lock',
  PIPFILE: 'Pipfile',
  PIPFILE_LOCK: 'Pipfile.lock',
  STUB_INIT: '__init__.pyi',
} as const;

export const NAMESPACES = {
  VAPOURSYNTH: 'vapoursynth',
} as const;
