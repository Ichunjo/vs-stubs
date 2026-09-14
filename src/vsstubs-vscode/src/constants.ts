/**
 * Shared constants for the extension.
 */

export const EXTENSION_ID = 'vsstubs';
export const OUTPUT_CHANNEL_NAME = 'VapourSynth Stubs';
export const MINIMUM_VSSTUBS_VERSION = '2.3.0';

export const COMMANDS = {
  GENERATE: 'vsstubs.generate',
  ADD_PLUGIN: 'vsstubs.addPlugin',
  REMOVE_PLUGIN: 'vsstubs.removePlugin',
  CHECK_PLUGIN: 'vsstubs.check',
  UPDATE_PLUGIN: 'vsstubs.update',
} as const;

export const CONFIG = {
  SECTION: 'vsstubs',
  AUTO_GENERATE: 'autoGenerate',
  CHECK_ON_STARTUP: 'checkOnStartup',
  EXTRA_PLUGIN_DIRS: 'extraPluginDirs',
  PROMPT_ON_PLUGIN_CHANGES: 'promptOnPluginChanges',
  WATCH_PLUGINS: 'watchPlugins',
  WATCH_DEBOUNCE_TIME: 'watchDebounceTime',
  SHOW_UP_TO_DATE_NOTIFICATION: 'showUpToDateNotification',
} as const;

export const PLUGIN_GLOB = '**/*.{dll,so,dylib}' as const;

export const PYTHON_CONFIG = {
  SECTION: 'python',
  DEFAULT_INTERPRETER: 'defaultInterpreterPath',
  ANALYSIS_SECTION: 'python.analysis',
  STUB_PATH: 'stubPath',
} as const;

export const FILENAMES = {
  PYPROJECT: 'pyproject.toml',
  UV_LOCK: 'uv.lock',
  PIPFILE: 'Pipfile',
  PIPFILE_LOCK: 'Pipfile.lock',
  STUB_INIT: '__init__.pyi',
} as const;

export const NAMESPACES = {
  VAPOURSYNTH: 'vapoursynth',
} as const;
