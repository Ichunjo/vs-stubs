/**
 * Core logic for generating VapourSynth stubs.
 */

import { join } from 'node:path';
import semver from 'semver';
import * as vscode from 'vscode';
import { CONFIG, FILENAMES, MINIMUM_VSSTUBS_VERSION } from './constants.js';
import {
  execFile,
  existsAsync,
  getPythonInterpreter,
  getStubFile,
  getWorkspaceRoot,
  isOnPath,
  isVapoursynthAvailable,
  resolvePathVariables,
} from './helpers.js';
import { logger } from './logging.js';
import {
  CheckJSONResponse,
  PluginInfo,
  PluginPickItem,
  SubCommand,
  VSStubsCommandOptions,
  WorkspaceContext,
} from './types.js';

const COMMAND_TEXT_MAP: Record<SubCommand, { completion: string; pending: string }> = {
  add: { completion: 'added', pending: 'Adding' },
  remove: { completion: 'removed', pending: 'Removing' },
  check: { completion: 'checked', pending: 'Checking' },
  update: { completion: 'updated', pending: 'Updating' },
};

export class VSStubs {
  private isGenerationInProgress = false;
  private needsRegeneration = false;
  private isAvailable = false;
  private checkedPythonPath?: string;

  /**
   * Resolve workspace context once per action.
   * If showWarning is true, an error notification is displayed when no folder is open.
   */
  public async getWorkspaceContext(showWarning = false): Promise<WorkspaceContext | undefined> {
    const workspaceRoot = getWorkspaceRoot();
    if (!workspaceRoot) {
      if (showWarning) {
        vscode.window.showWarningMessage('VapourSynth Stubs: No workspace folder is open.');
      }
      return undefined;
    }

    const stubFile = getStubFile(workspaceRoot);
    const pythonPath = await getPythonInterpreter(workspaceRoot);
    return { workspaceRoot, stubFile, pythonPath };
  }

  /**
   * Generate VapourSynth stubs.
   *
   * @param trigger How generation was triggered:
   *   - `'manual'`: user ran the command explicitly. No guards, shows progress notification.
   *   - `'activation'`: workspace open auto-generation. Skips if stubs already exist.
   *   - `'watcher'`: plugin directory changed. Always regenerates, silent (no popup).
   */
  public async generateStubs(
    trigger: 'manual' | 'activation' | 'watcher' = 'manual',
  ): Promise<void> {
    const isSilent = trigger !== 'manual';

    if (this.isGenerationInProgress) {
      if (isSilent) {
        this.needsRegeneration = true;
        logger.info('Stub generation already in progress; queued subsequent generation.');
      } else {
        vscode.window.showWarningMessage('Stub generation is already in progress.');
      }
      return;
    }

    const ctx = await this.getWorkspaceContext(!isSilent);
    if (!ctx) return;

    // On activation, skip if stubs already exist (first-time generation only).
    if (trigger === 'activation' && (await existsAsync(ctx.stubFile))) {
      return;
    }

    this.isGenerationInProgress = true;
    try {
      await this.runVsstubsCommand(ctx, {
        args: this.buildArgs(ctx),
        title: 'Generating VapourSynth stubs...',
        successMessage: 'VapourSynth stubs generated.',
        errorMessage: 'Stub generation failed.',
        silent: isSilent,
      });
    } finally {
      this.isGenerationInProgress = false;
      if (this.needsRegeneration) {
        this.needsRegeneration = false;
        logger.info('Executing queued stub generation...');
        void this.generateStubs('watcher');
      }
    }
  }

  /**
   * Add VapourSynth plugin stubs.
   */
  public async addPlugins(): Promise<void> {
    const ctx = await this.getWorkspaceContext(true);
    if (!ctx) return;

    const resource = vscode.Uri.file(ctx.workspaceRoot);
    const config = vscode.workspace.getConfiguration(CONFIG.SECTION, resource);
    const extraDirs = config.get<string[]>(CONFIG.EXTRA_PLUGIN_DIRS, []);

    const [availablePlugins, existingNamespaces] = await Promise.all([
      this.queryPluginsJson(ctx, extraDirs),
      this.queryPluginsJson(ctx),
    ]);

    if (!availablePlugins) return;

    const existingSet = new Set((existingNamespaces || []).map((ns) => ns.namespace));
    const items: PluginPickItem[] = availablePlugins
      .filter((plugin) => !existingSet.has(plugin.namespace))
      .map((plugin) => ({
        label: plugin.namespace,
        description: plugin.description,
        picked: true,
        namespace: plugin.namespace,
      }));

    if (items.length === 0) {
      vscode.window.showInformationMessage(
        'No additional VapourSynth plugin stubs available to add.',
      );
      return;
    }

    const selected = await this.promptPluginSelection({
      title: 'Select VapourSynth Plugin Stubs to Include',
      placeholder: 'Select plugin namespaces to include in stubs',
      items,
    });

    if (selected && selected.length > 0) {
      await this.runPluginSubcommand(ctx, 'add', selected);
    }
  }

  /**
   * Remove VapourSynth plugin stubs.
   */
  public async removePlugins(): Promise<void> {
    const ctx = await this.getWorkspaceContext(true);
    if (!ctx) return;

    if (!(await existsAsync(ctx.stubFile))) {
      vscode.window.showErrorMessage("Can't remove plugins because there is no stubs file.");
      return;
    }

    const plugins = await this.queryPluginsJson(ctx);
    if (!plugins) return;

    const items: PluginPickItem[] = plugins.map((plugin) => ({
      label: plugin.namespace,
      description: plugin.description,
      namespace: plugin.namespace,
    }));

    if (items.length === 0) {
      vscode.window.showInformationMessage('No VapourSynth plugin stubs found to remove.');
      return;
    }

    const selected = await this.promptPluginSelection({
      title: 'Select VapourSynth Plugin Stubs to Remove',
      placeholder: 'Select plugin namespaces to remove from stubs',
      items,
    });

    if (selected && selected.length > 0) {
      await this.runPluginSubcommand(ctx, 'remove', selected);
    }
  }

  /**
   * Check VapourSynth stubs for outdated or new plugins / signature updates.
   *
   * @param silent If true (background check), only notify if updates are detected.
   */
  public async checkPlugins(silent = false): Promise<void> {
    const ctx = await this.getWorkspaceContext(!silent);
    if (!ctx) return;

    if (!(await existsAsync(ctx.stubFile))) {
      if (!silent) vscode.window.showWarningMessage('No stubs file found. Generate stubs first.');
      return;
    }

    const result = await this.runPluginSubcommand(ctx, 'check', ['--json'], { silent: true });

    if (!result) {
      if (!silent) {
        void this.showErrorWithOutput('Stub check failed. See output channel for details.');
      }
      return;
    }

    let report: CheckJSONResponse;
    try {
      report = JSON.parse(result.stdout);
    } catch (error) {
      logger.error(
        `Stub check parse error: ${error instanceof Error ? error.message : String(error)}`,
      );
      if (!silent) {
        void this.showErrorWithOutput('Stub check failed. See output channel for details.');
      }
      return;
    }

    const hasNew = Boolean(report.new && report.new.length > 0);
    const hasOld = Boolean(report.old && report.old.length > 0);
    const hasModified = Boolean(report.modified && report.modified.length > 0);

    if (hasNew || hasOld || hasModified) {
      const resource = vscode.Uri.file(ctx.workspaceRoot);
      const config = vscode.workspace.getConfiguration(CONFIG.SECTION, resource);
      const shouldPrompt = config.get<boolean>(CONFIG.PROMPT_ON_PLUGIN_CHANGES, true);

      if (shouldPrompt || !silent) {
        const changeParts: string[] = [];
        if (hasNew) changeParts.push(`${report.new!.length} new`);
        if (hasModified) changeParts.push(`${report.modified!.length} updated`);
        if (hasOld) changeParts.push(`${report.old!.length} removed`);
        const details = changeParts.join(', ');
        const promptMessage = `VapourSynth plugin changes detected (${details}).`;

        const items = shouldPrompt
          ? (['Regenerate Stubs', "Don't Ask Again"] as const)
          : (['Regenerate Stubs'] as const);
        const choice = await vscode.window.showInformationMessage(promptMessage, ...items);

        if (choice === 'Regenerate Stubs') {
          await this.generateStubs('manual');
        } else if (choice === "Don't Ask Again") {
          await config.update(
            CONFIG.PROMPT_ON_PLUGIN_CHANGES,
            false,
            vscode.ConfigurationTarget.Global,
          );
        }
      }
    } else if (!silent) {
      const resource = vscode.Uri.file(ctx.workspaceRoot);
      const showNotification = vscode.workspace
        .getConfiguration(CONFIG.SECTION, resource)
        .get<boolean>(CONFIG.SHOW_UP_TO_DATE_NOTIFICATION, true);
      if (showNotification) {
        vscode.window.showInformationMessage('VapourSynth stubs are up to date.');
      }
    }
  }

  /**
   * Update VapourSynth stubs signatures against existing stub files.
   */
  public async updatePlugins(): Promise<void> {
    const ctx = await this.getWorkspaceContext(true);
    if (!ctx) return;
    await this.runPluginSubcommand(ctx, 'update');
  }

  private async runPluginSubcommand(
    ctx: WorkspaceContext,
    subcommand: SubCommand,
    args: string[] = [],
    options: Partial<VSStubsCommandOptions> = {},
  ): Promise<{ stdout: string; stderr: string } | undefined> {
    if (!(await existsAsync(ctx.stubFile))) {
      if (!options.silent) {
        vscode.window.showErrorMessage(`Can't ${subcommand} because there is no stubs file.`);
      }
      return undefined;
    }

    const { completion, pending } = COMMAND_TEXT_MAP[subcommand];
    const isCheck = subcommand === 'check';
    const title = `${pending} stubs...`;
    const successMessage = isCheck ? undefined : `VapourSynth stubs ${completion}.`;
    const errorMessage = `Stub ${subcommand} failed.`;

    return this.runVsstubsCommand(ctx, {
      args: [...this.buildArgs(ctx, ctx.stubFile), subcommand, ...args],
      title,
      successMessage,
      errorMessage,
      ...options,
    });
  }

  private async queryPluginsJson(
    ctx: WorkspaceContext,
    extraDirs?: string[],
  ): Promise<PluginInfo[] | undefined> {
    const hasExtraDirs = Boolean(extraDirs && extraDirs.length > 0);
    if (!hasExtraDirs && !(await existsAsync(ctx.stubFile))) return [];

    const args = [
      ...(hasExtraDirs
        ? extraDirs!.flatMap((dir) => ['--load', resolvePathVariables(dir, ctx.workspaceRoot)])
        : ['-i', ctx.stubFile]),
      'plugins',
      '--json',
    ];

    const res = await this.runVsstubsCommand(ctx, { args, silent: true });
    if (!res) return undefined;
    try {
      return JSON.parse(res.stdout);
    } catch (error) {
      logger.error(
        `Plugins query parse error: ${error instanceof Error ? error.message : String(error)}`,
      );
      void this.showErrorWithOutput('Plugins query parse error. See output channel for details.');
      return undefined;
    }
  }

  private async runVsstubsCommand(
    ctx: WorkspaceContext,
    options: VSStubsCommandOptions,
  ): Promise<{ stdout: string; stderr: string } | undefined> {
    if (!options.skipCheck) {
      const available = await this.ensureAvailable(ctx, options.silent);
      if (!available) return undefined;
    }

    const args = ['-m', 'vsstubs', '--quiet', ...options.args];
    logger.info(`Running: ${ctx.pythonPath} ${args.join(' ')}`);

    const progressOptions: vscode.ProgressOptions = {
      location: options.silent
        ? vscode.ProgressLocation.Window
        : vscode.ProgressLocation.Notification,
      cancellable: true,
      ...(options.title && { title: options.title }),
    };

    try {
      return await vscode.window.withProgress(progressOptions, async (_progress, token) => {
        const abortController = new AbortController();
        const registration = token.onCancellationRequested(() => {
          abortController.abort();
          logger.info('Command execution cancelled by user.');
        });

        let optSub: vscode.Disposable | undefined;
        if (options.cancellationToken) {
          optSub = options.cancellationToken.onCancellationRequested(() => {
            abortController.abort();
          });
        }

        try {
          const result = await execFile(ctx.pythonPath, args, {
            cwd: ctx.workspaceRoot,
            signal: abortController.signal,
          });

          if (result.stdout) logger.info('Stdout\n' + result.stdout);
          if (result.stderr) logger.info('Stderr\n' + result.stderr);

          if (options.successMessage && !options.silent) {
            vscode.window.showInformationMessage(options.successMessage);
          }
          return result;
        } finally {
          registration.dispose();
          optSub?.dispose();
        }
      });
    } catch (error) {
      const isAbort =
        error instanceof Error && (error.name === 'AbortError' || error.message.includes('abort'));
      if (isAbort) {
        logger.info('Command execution aborted.');
        return undefined;
      }

      const msg = options.errorMessage ?? 'Command failed. See output channel for details.';
      logger.error(`${msg}: ${error instanceof Error ? error.message : String(error)}`);
      if (!options.silent) {
        void this.showErrorWithOutput(msg);
      }
      return undefined;
    }
  }

  /**
   * Build CLI arguments for `python -m vsstubs`.
   */
  private buildArgs(ctx: WorkspaceContext, inputStubFile?: string): string[] {
    const args = ['-o', ctx.stubFile];
    if (inputStubFile) args.push('-i', inputStubFile);

    const resource = vscode.Uri.file(ctx.workspaceRoot);
    const config = vscode.workspace.getConfiguration(CONFIG.SECTION, resource);
    const extraDirs = config.get<string[]>(CONFIG.EXTRA_PLUGIN_DIRS, []);

    for (const dir of extraDirs) {
      args.push('--load', resolvePathVariables(dir, ctx.workspaceRoot));
    }

    if (config.get<boolean>(CONFIG.ENABLE_COMPAT_API3)) args.push('--compat');

    return args;
  }

  /**
   * Ensure `vsstubs` package is available in the current Python environment.
   */
  private async ensureAvailable(ctx: WorkspaceContext, silent = false): Promise<boolean> {
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

    const res = await this.runVsstubsCommand(ctx, {
      args: ['--version'],
      silent: true,
      skipCheck: true,
    });

    const output = (res?.stdout || res?.stderr || '').trim();
    const version = semver.coerce(output);

    if (res && version && semver.gte(version, MINIMUM_VSSTUBS_VERSION)) {
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

    const installCommand = await this.detectInstallCommand(ctx);
    const choice = await vscode.window.showErrorMessage(
      `"vsstubs" module (v${MINIMUM_VSSTUBS_VERSION}+) not found for interpreter "${ctx.pythonPath}". ` +
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
   * Helper to prompt plugin selection via QuickPick.
   */
  private async promptPluginSelection(options: {
    title: string;
    placeholder: string;
    items: PluginPickItem[];
  }): Promise<string[] | undefined> {
    if (options.items.length === 0) return undefined;

    const selected = await vscode.window.showQuickPick(options.items, {
      canPickMany: true,
      title: options.title,
      placeHolder: options.placeholder,
    });

    return selected ? selected.map((item) => item.namespace) : undefined;
  }

  /**
   * Package manager detection for installation prompts.
   */
  private async detectInstallCommand(ctx: WorkspaceContext): Promise<string> {
    const hasUvLock = await existsAsync(join(ctx.workspaceRoot, FILENAMES.UV_LOCK));
    const hasPyproject = await existsAsync(join(ctx.workspaceRoot, FILENAMES.PYPROJECT));
    if (hasUvLock && (await isOnPath('uv'))) {
      return hasPyproject ? 'uv add --dev vsstubs' : 'uv pip install vsstubs';
    }

    const hasPipfile =
      (await existsAsync(join(ctx.workspaceRoot, FILENAMES.PIPFILE))) ||
      (await existsAsync(join(ctx.workspaceRoot, FILENAMES.PIPFILE_LOCK)));
    if (hasPipfile) {
      return 'pipenv install --dev vsstubs';
    }

    return 'pip install vsstubs';
  }

  private async showErrorWithOutput(msg: string): Promise<void> {
    const choice = await vscode.window.showErrorMessage(msg, 'Open Output');
    if (choice === 'Open Output') {
      logger.show();
    }
  }
}
