/**
 * Pure Node.js utilities without VS Code runtime dependencies.
 */

import { execFile as execFileCb } from 'node:child_process';
import { constants } from 'node:fs';
import { access } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

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
 * Resolve variables like ${workspaceFolder}, ${userHome}, and ~ in path strings.
 */
export function resolvePathVariables(filePath: string, workspaceRoot?: string): string {
  let resolved = filePath;
  const root = workspaceRoot;
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
 * Check if a filename looks like a native plugin library.
 */
export function isPluginFile(filename: string): boolean {
  const lower = filename.toLowerCase();
  return lower.endsWith('.dll') || lower.endsWith('.so') || lower.endsWith('.dylib');
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
