/**
 * Environment and package management for VapourSynth and vsstubs.
 */

import { join } from 'node:path';
import semver from 'semver';
import * as vscode from 'vscode';
import { VsstubsCli } from './cli.js';
import { FILENAMES, MINIMUM_VSSTUBS_VERSION } from './constants.js';
import { logger } from './logging.js';
import { WorkspaceContext } from './types.js';
import { existsAsync, isOnPath, isVapoursynthAvailable } from './utils.js';

export class EnvironmentManager {
  private isAvailable = false;
  private checkedPythonPath?: string | undefined;

  constructor(private cli: VsstubsCli) {}

  /**
   * Invalidate the cached interpreter status (e.g. when Python interpreter changes).
   */
  public invalidateCache(): void {
    this.isAvailable = false;
    this.checkedPythonPath = undefined;
  }

  /**
   * Verify that VapourSynth and the required vsstubs package are available.
   */
  public async ensureAvailable(ctx: WorkspaceContext, silent = false): Promise<boolean> {
    if (this.isAvailable && this.checkedPythonPath === ctx.pythonPath) {
      return true;
    }

    const vsAvailable = await isVapoursynthAvailable(ctx.pythonPath);
    if (!vsAvailable) {
      this.isAvailable = false;
      this.checkedPythonPath = ctx.pythonPath;
      logger.info(
        `VapourSynth module not found for interpreter "${ctx.pythonPath}". Silencing extension.`,
      );
      if (!silent) {
        vscode.window.showErrorMessage(
          `VapourSynth module is not installed for interpreter "${ctx.pythonPath}".`,
        );
      }
      return false;
    }

    const versionStr = await this.cli.getVersion(ctx.pythonPath, ctx.workspaceRoot);
    if (versionStr && semver.gte(versionStr, MINIMUM_VSSTUBS_VERSION)) {
      this.isAvailable = true;
      this.checkedPythonPath = ctx.pythonPath;
      return true;
    }

    this.isAvailable = false;
    this.checkedPythonPath = ctx.pythonPath;

    logger.info(
      `"vsstubs" module (v${MINIMUM_VSSTUBS_VERSION}+) not found for interpreter "${ctx.pythonPath}".`,
    );

    if (silent) {
      return false;
    }

    const installCommand = await this.detectInstallCommand(ctx.workspaceRoot);
    await this.promptInstall(ctx.pythonPath, installCommand);
    return false;
  }

  /**
   * Detect suitable package manager installation command.
   */
  public async detectInstallCommand(workspaceRoot: string): Promise<string> {
    const hasUvLock = await existsAsync(join(workspaceRoot, FILENAMES.UV_LOCK));
    const hasPyproject = await existsAsync(join(workspaceRoot, FILENAMES.PYPROJECT));
    if (hasUvLock && (await isOnPath('uv'))) {
      return hasPyproject ? 'uv add --dev vsstubs' : 'uv pip install vsstubs';
    }

    const hasPipfile =
      (await existsAsync(join(workspaceRoot, FILENAMES.PIPFILE))) ||
      (await existsAsync(join(workspaceRoot, FILENAMES.PIPFILE_LOCK)));
    if (hasPipfile) {
      return 'pipenv install --dev vsstubs';
    }

    return 'pip install vsstubs';
  }

  /**
   * Prompt user to install vsstubs via terminal or clipboard.
   */
  public async promptInstall(pythonPath: string, installCommand: string): Promise<void> {
    const choice = await vscode.window.showErrorMessage(
      `"vsstubs" module (v${MINIMUM_VSSTUBS_VERSION}+) not found for interpreter "${pythonPath}". ` +
        'Install it in your current environment.',
      'Install now',
      'Copy install command',
      'Open terminal',
    );

    switch (choice) {
      case 'Install now': {
        const terminal = vscode.window.createTerminal('VSStubs install');
        terminal.show();
        terminal.sendText(installCommand);
        break;
      }
      case 'Copy install command': {
        await vscode.env.clipboard.writeText(installCommand);
        vscode.window.showInformationMessage(`Copied: ${installCommand}`);
        break;
      }
      case 'Open terminal': {
        const terminal = vscode.window.createTerminal('VSStubs install');
        terminal.show();
        terminal.sendText(installCommand, false);
        break;
      }
    }
  }
}
