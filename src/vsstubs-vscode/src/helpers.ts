/**
 * Helper functions for VSStubs.
 */

import { execFile as execFileCb, execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { promisify } from 'node:util';

import { PythonExtension } from '@vscode/python-extension';
import * as vscode from 'vscode';

import { FILENAMES, NAMESPACES, PYTHON_CONFIG } from './constants.js';
import { logger } from './logging.js';

const execFile = promisify(execFileCb);
/**
 * Get the workspace root path.
 */
export function getWorkspaceRoot(): string | undefined {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    vscode.window.showWarningMessage('VapourSynth Stubs: No workspace folder is open.');
    return undefined;
  }
  return folders[0].uri.fsPath;
}

/**
 * Get absolute path to the vapoursynth stub file inside the workspace.
 */
export function getStubFile(workspaceRoot: string): string {
  return join(workspaceRoot, getStubDir(), NAMESPACES.VAPOURSYNTH, FILENAMES.STUB_INIT);
}

export function isOnPath(command: string): boolean {
  try {
    const executable = process.platform === 'win32' ? 'where.exe' : 'which';
    execFileSync(executable, [command], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Resolve the Python interpreter for the current workspace.
 */
export async function getPythonInterpreter(): Promise<string> {
  try {
    const api = await PythonExtension.api();
    const envPath = api.environments.getActiveEnvironmentPath();
    const resolved = await api.environments.resolveEnvironment(envPath);

    if (resolved?.executable.uri) {
      return resolved.executable.uri.fsPath;
    }
  } catch (error) {
    // If Python extension is not available, we use fallback settings
    console.warn('Python extension API not available, falling back to settings:', error);
  }

  // Fallback: check VSCode python.defaultInterpreterPath
  const pythonConfig = vscode.workspace.getConfiguration(PYTHON_CONFIG.SECTION);
  const defaultPath = pythonConfig.get<string>(PYTHON_CONFIG.DEFAULT_INTERPRETER);
  if (defaultPath) {
    return defaultPath;
  }
  return 'python';
}

/**
 * Get stub output directory from user settings.
 * Reads `python.analysis.stubPath` (Pylance default: `typings`).
 */
function getStubDir(): string {
  const config = vscode.workspace.getConfiguration(PYTHON_CONFIG.ANALYSIS_SECTION);
  return config.get<string>(PYTHON_CONFIG.STUB_PATH) || 'typings';
}

/**
 * Check if a filename looks like a native plugin library.
 */
export function isPluginFile(filename: string): boolean {
  const lower = filename.toLowerCase();
  return lower.endsWith('.dll') || lower.endsWith('.so') || lower.endsWith('.dylib');
}

/**
 * Get the VapourSynth plugin directory.
 */
export async function resolvePluginDir(): Promise<string | undefined> {
  try {
    const pythonPath = await getPythonInterpreter();
    const { stdout } = await execFile(pythonPath, [
      '-c',
      'from vapoursynth import get_plugin_dir; print(get_plugin_dir())',
    ]);
    const dir = stdout.trim();
    if (dir) {
      logger.info(`Resolved plugin dir: ${dir}`);
      return dir;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.warn(`Could not resolve plugin dir: ${message}`);
  }
  return undefined;
}
