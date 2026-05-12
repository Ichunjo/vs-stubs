/**
 * Core logic for generating VapourSynth stubs.
 */

import { execFile as execFileCb, ExecFileException } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { promisify } from 'node:util';

import * as vscode from 'vscode';

import { CONFIG, FILENAMES } from './constants.js';
import { getPythonInterpreter, getStubFile, getWorkspaceRoot, isOnPath } from './helpers.js';
import { logger } from './logging.js';

const execFile = promisify(execFileCb);

export class VSStubs {
  isGenerationInProgress = false;

  /**
   * Generate VapourSynth stubs.
   *
   * @param trigger How generation was triggered:
   *   - `'manual'`: user ran the command explicitly. No guards, shows progress notification.
   *   - `'activation'`: workspace open auto-generation. Skips if stubs already exist.
   *   - `'watcher'`: plugin directory changed. Always regenerates, silent (no popup).
   */
  async generateStubs(trigger: 'manual' | 'activation' | 'watcher' = 'manual'): Promise<void> {
    const isSilent = trigger !== 'manual';

    if (this.isGenerationInProgress) {
      if (!isSilent) {
        vscode.window.showWarningMessage('Stub generation is already in progress.');
      }
      return;
    }

    const workspaceRoot = getWorkspaceRoot();
    if (!workspaceRoot) {
      return;
    }

    const stubFile = getStubFile(workspaceRoot);

    // On activation, skip if stubs already exist (first-time generation only).
    // The watcher and manual triggers always proceed.
    if (trigger === 'activation' && existsSync(stubFile)) {
      return;
    }

    if (!(await ensureVsstubsAvailable())) {
      return;
    }

    const args = buildArgs(stubFile);
    const pythonPath = await getPythonInterpreter();

    logger.info(`Generating stubs (${trigger}): ${pythonPath} -m ${args.join(' ')}`);

    this.isGenerationInProgress = true;
    try {
      const progressOptions: vscode.ProgressOptions = {
        location: isSilent ? vscode.ProgressLocation.Window : vscode.ProgressLocation.Notification,
        title: 'Generating VapourSynth stubs...',
        cancellable: false,
      };

      await vscode.window.withProgress(progressOptions, async () => {
        try {
          const result = await execFile(pythonPath, ['-m', ...args], { cwd: workspaceRoot });

          if (result.stdout) {
            logger.info(result.stdout);
          }
          if (result.stderr) {
            logger.info(result.stderr);
          }

          if (!isSilent) {
            vscode.window.showInformationMessage('VapourSynth stubs generated.');
          }
          logger.info('Stubs generated successfully.');
        } catch (error) {
          const execError = error as ExecFileException;
          vscode.window.showErrorMessage('Stub generation failed. See output channel for details.');
          logger.error(`${execError.message}`);
        }
      });
    } finally {
      this.isGenerationInProgress = false;
    }
  }

  /**
   * Add VapourSynth plugin stubs.
   */
  async addPlugins(): Promise<void> {
    const input = await vscode.window.showInputBox({
      prompt: 'Plugin namespace(s) to add (space-separated)',
      placeHolder: 'e.g. descale resize2',
    });
    if (!input) {
      return;
    }
    await this.runPluginSubcommand('add', input.trim().split(/\s+/));
  }

  /**
   * Remove VapourSynth plugin stubs.
   */
  async removePlugins(): Promise<void> {
    const input = await vscode.window.showInputBox({
      prompt: 'Plugin namespace(s) to remove (space-separated)',
      placeHolder: 'e.g. descale resize2',
    });
    if (!input) {
      return;
    }
    await this.runPluginSubcommand('remove', input.trim().split(/\s+/));
  }

  private async runPluginSubcommand(
    subcommand: 'add' | 'remove',
    namespaces: string[],
  ): Promise<void> {
    if (!(await this.ensureStubsFileExist(subcommand, namespaces))) {
      return;
    }

    const workspaceRoot = getWorkspaceRoot();
    if (!(workspaceRoot && (await ensureVsstubsAvailable()))) {
      return;
    }

    const stubFile = getStubFile(workspaceRoot);

    if (!existsSync(stubFile)) {
      vscode.window.showErrorMessage(
        `Can't ${subcommand} "${namespaces.join(', ')} because there is no stubs file."`,
      );
    }

    const pythonPath = await getPythonInterpreter();
    const args = [...buildArgs(stubFile), subcommand, ...namespaces];

    const progressOptions: vscode.ProgressOptions = {
      location: vscode.ProgressLocation.Notification,
      title: `${subcommand === 'add' ? 'Adding' : 'Removing'} plugin stubs...`,
    };

    logger.info(`Running: ${pythonPath} -m ${args.join(' ')}`);

    await vscode.window.withProgress(progressOptions, async () => {
      try {
        const result = await execFile(pythonPath, ['-m', ...args], { cwd: workspaceRoot });

        if (result.stdout) {
          logger.info(result.stdout);
        }
        if (result.stderr) {
          logger.info(result.stderr);
        }

        vscode.window.showInformationMessage(
          `Plugin stubs ${subcommand === 'add' ? 'added' : 'removed'}: ${namespaces.join(', ')}`,
        );
      } catch (error) {
        const execError = error as ExecFileException;
        vscode.window.showErrorMessage(
          `Plugin ${subcommand} failed. See output channel for details.`,
        );
        logger.error(`${execError.message}`);
      }
    });
  }

  private async ensureStubsFileExist(
    subcommand: 'add' | 'remove',
    namespaces: string[],
  ): Promise<boolean> {
    const workspaceRoot = getWorkspaceRoot();
    if (!(workspaceRoot && (await ensureVsstubsAvailable()))) {
      return false;
    }

    const stubFile = getStubFile(workspaceRoot);

    if (!existsSync(stubFile)) {
      const errorMessage = `Can't ${subcommand} "${namespaces.join(', ')} because there is no stubs file."`;
      logger.error(`${errorMessage}`);
      vscode.window.showErrorMessage(errorMessage);
      return false;
    }
    return true;
  }
}

async function checkVsstubs(pythonPath: string): Promise<boolean> {
  try {
    await execFile(pythonPath, ['-m', 'vsstubs', '-V']);
    return true;
  } catch {
    return false;
  }
}

async function ensureVsstubsAvailable(): Promise<boolean> {
  const pythonPath = await getPythonInterpreter();

  if (await checkVsstubs(pythonPath)) {
    return true;
  }

  const installCommand = detectInstallCommand();
  const choice = await vscode.window.showErrorMessage(
    `"vsstubs" module not found for interpreter "${pythonPath}". Install it in your current environment.`,
    'Install now',
    'Copy install command',
    'Open terminal',
  );

  switch (choice) {
    case 'Install now': {
      const terminal = vscode.window.createTerminal('VSStubs install');
      terminal.show();
      terminal.sendText(installCommand);
      return false;
    }
    case 'Copy install command': {
      await vscode.env.clipboard.writeText(installCommand);
      vscode.window.showInformationMessage(`Copied: ${installCommand}`);
      return false;
    }
    case 'Open terminal': {
      const terminal = vscode.window.createTerminal('VSStubs install');
      terminal.show();
      terminal.sendText(installCommand, false);
      return false;
    }
    default:
      return false;
  }
}

/**
 * Package manager detection
 */
export function detectInstallCommand(): string {
  const workspaceRoot = getWorkspaceRoot();
  if (!workspaceRoot) {
    return 'pip install vsstubs';
  }

  if (existsSync(join(workspaceRoot, FILENAMES.UV_LOCK)) || isOnPath('uv')) {
    return 'uv add --dev vsstubs';
  }

  const hasPipFiles =
    existsSync(join(workspaceRoot, FILENAMES.PIPFILE)) ||
    existsSync(join(workspaceRoot, FILENAMES.PIPFILE_LOCK));

  if (hasPipFiles) {
    return 'pipenv install --dev vsstubs';
  }

  return 'pip install vsstubs';
}

/**
 * Build CLI arguments for `python -m vsstubs`.
 */
export function buildArgs(stubFile: string): string[] {
  const args = ['vsstubs', '-o', stubFile];
  const config = vscode.workspace.getConfiguration(CONFIG.SECTION);
  const extraDirs = config.get<string[]>(CONFIG.EXTRA_PLUGIN_DIRS, []);

  for (const dir of extraDirs) {
    args.push('--load', dir);
  }

  return args;
}
