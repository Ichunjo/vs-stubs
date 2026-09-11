/**
 * Helper functions for VSStubs.
 */

import { execFile as execFileCb } from 'node:child_process';
import { constants } from 'node:fs';
import { access } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

import { PythonExtension } from '@vscode/python-extension';
import * as vscode from 'vscode';

import { FILENAMES, NAMESPACES, PYTHON_CONFIG } from './constants.js';
import { logger } from './logging.js';

export const execFile = promisify(execFileCb);

export async function existsAsync(pathStr: string): Promise<boolean> {
  try {
    await access(pathStr, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the workspace root path.
 * Priority is given to active document workspace folder in multi-root setups.
 * Does NOT produce UI side-effects on missing workspace.
 */
export function getWorkspaceRoot(): string | undefined {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    return undefined;
  }

  const activeUri = vscode.window.activeTextEditor?.document.uri;
  if (activeUri) {
    const activeFolder = vscode.workspace.getWorkspaceFolder(activeUri);
    if (activeFolder) {
      return activeFolder.uri.fsPath;
    }
  }

  return folders[0].uri.fsPath;
}

/**
 * Resolve variables like ${workspaceFolder}, ${userHome}, and ~ in path strings.
 */
export function resolvePathVariables(filePath: string, workspaceRoot?: string): string {
  let resolved = filePath;
  const root = workspaceRoot ?? getWorkspaceRoot();
  if (root) {
    resolved = resolved.replace(/\$\{workspaceFolder\}/g, root);
  }
  if (resolved.startsWith('~')) {
    resolved = path.join(os.homedir(), resolved.slice(1));
  }
  resolved = resolved.replace(/\$\{userHome\}/g, os.homedir());
  if (root && !path.isAbsolute(resolved)) {
    resolved = path.resolve(root, resolved);
  }
  return resolved;
}

/**
 * Get stub output directory from user settings.
 * Reads `python.analysis.stubPath` (Pylance default: `typings`) and resolves path variables.
 */
export function getStubDir(workspaceRoot?: string): string {
  const root = workspaceRoot ?? getWorkspaceRoot();
  const resource = root ? vscode.Uri.file(root) : undefined;
  const config = vscode.workspace.getConfiguration(PYTHON_CONFIG.ANALYSIS_SECTION, resource);
  const configuredPath = config.get<string>(PYTHON_CONFIG.STUB_PATH) || 'typings';
  return resolvePathVariables(configuredPath, root);
}

/**
 * Get absolute path to the vapoursynth stub file inside the workspace.
 */
export function getStubFile(workspaceRoot: string): string {
  const stubDir = getStubDir(workspaceRoot);
  const baseDir = path.isAbsolute(stubDir) ? stubDir : path.join(workspaceRoot, stubDir);
  return path.join(baseDir, NAMESPACES.VAPOURSYNTH, FILENAMES.STUB_INIT);
}

/**
 * Asynchronously check if a command executable is available on the system PATH.
 */
export async function isOnPath(command: string): Promise<boolean> {
  try {
    const executable = process.platform === 'win32' ? 'where.exe' : 'which';
    await execFile(executable, [command]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Resolve the Python interpreter for the current workspace.
 */
export async function getPythonInterpreter(workspaceRoot?: string): Promise<string> {
  const root = workspaceRoot ?? getWorkspaceRoot();
  const resource = root ? vscode.Uri.file(root) : vscode.window.activeTextEditor?.document.uri;

  try {
    const api = await PythonExtension.api();
    const envPath = api.environments.getActiveEnvironmentPath(resource);
    const resolved = await api.environments.resolveEnvironment(envPath);

    if (resolved?.executable.uri) {
      return resolved.executable.uri.fsPath;
    }
  } catch (error) {
    logger.warn(`Python extension API not available, falling back to settings: ${String(error)}`);
  }

  // Fallback: check VSCode python.defaultInterpreterPath
  const pythonConfig = vscode.workspace.getConfiguration(PYTHON_CONFIG.SECTION, resource);
  const defaultPath = pythonConfig.get<string>(PYTHON_CONFIG.DEFAULT_INTERPRETER);
  if (defaultPath) {
    return resolvePathVariables(defaultPath, root);
  }
  return 'python';
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
export async function resolvePluginDir(pythonPath?: string): Promise<string | undefined> {
  try {
    const interpreter = pythonPath ?? (await getPythonInterpreter());
    const { stdout } = await execFile(interpreter, ['-m', 'vapoursynth', 'get-plugin-dir']);
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

/**
 * Check if the `vapoursynth` module is installed in the active Python environment.
 */
export async function isVapoursynthAvailable(pythonPath: string): Promise<boolean> {
  try {
    await execFile(pythonPath, ['-c', 'import vapoursynth']);
    return true;
  } catch {
    return false;
  }
}
