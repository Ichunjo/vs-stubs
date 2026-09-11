/**
 * Helper functions for VSStubs with VS Code runtime integration.
 */

import path from 'node:path';
import { PythonExtension } from '@vscode/python-extension';
import * as vscode from 'vscode';

import { FILENAMES, NAMESPACES, PYTHON_CONFIG } from './constants.js';
import { logger } from './logging.js';
import { execFile, existsAsync, isOnPath, isPluginFile, resolvePathVariables } from './utils.js';

export { execFile, existsAsync, isOnPath, isPluginFile, resolvePathVariables };

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
 * Interactively resolve a workspace folder in multi-root setups.
 * Prompts user with showWorkspaceFolderPick if no editor is active in a multi-folder workspace.
 */
export async function pickWorkspaceFolder(): Promise<vscode.WorkspaceFolder | undefined> {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    return undefined;
  }

  if (folders.length === 1) {
    return folders[0];
  }

  const activeUri = vscode.window.activeTextEditor?.document.uri;
  if (activeUri) {
    const activeFolder = vscode.workspace.getWorkspaceFolder(activeUri);
    if (activeFolder) {
      return activeFolder;
    }
  }

  return vscode.window.showWorkspaceFolderPick({
    placeHolder: 'Select the workspace folder for VapourSynth stubs',
  });
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
