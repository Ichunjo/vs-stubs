/**
 * Core logic for generating VapourSynth stubs.
 */

import { join } from 'path';
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
} from './helpers.js';
import { logger } from './logging.js';
import {
  CheckJSONResponse,
  PluginInfo,
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
  private isAvailable = false;
  private checkedPythonPath?: string;

  /**
   * Generate VapourSynth stubs.
   *
   * @param trigger How generation was triggered:
   *   - `'manual'`: user ran the command explicitly. No guards, shows progress notification.
   *   - `'activation'`: workspace open auto-generation. Skips if stubs already exist.
   *   - `'watcher'`: plugin directory changed. Always regenerates, silent (no popup).
   */
  @requiresWorkspaceContext
  public async generateStubs(
    trigger: 'manual' | 'activation' | 'watcher' = 'manual',
  ): Promise<void> {
    const isSilent = trigger !== 'manual';

    if (this.isGenerationInProgress) {
      if (!isSilent) vscode.window.showWarningMessage('Stub generation is already in progress.');
      return;
    }

    const ctx = await this.workspaceContext;

    // On activation, skip if stubs already exist (first-time generation only).
    // The watcher and manual triggers always proceed.
    if (trigger === 'activation' && (await existsAsync(ctx.stubFile))) return;

    this.isGenerationInProgress = true;
    try {
      await this.runVsstubsCommand({
        args: await this.buildArgs(),
        title: 'Generating VapourSynth stubs...',
        successMessage: 'VapourSynth stubs generated.',
        errorMessage: 'Stub generation failed.',
        silent: isSilent,
      });
    } finally {
      this.isGenerationInProgress = false;
    }
  }

  /**
   * Add VapourSynth plugin stubs.
   */
  @requiresWorkspaceContext
  public async addPlugins(): Promise<void> {
    const config = vscode.workspace.getConfiguration(CONFIG.SECTION);
    const extraDirs = config.get<string[]>(CONFIG.EXTRA_PLUGIN_DIRS, []);

    const [availablePlugins, existingNamespaces] = await Promise.all([
      this.queryPluginsJson(extraDirs),
      this.queryPluginsJson(),
    ]);

    if (!availablePlugins) return;

    const existingSet = new Set((existingNamespaces || []).map((ns) => ns.namespace));
    const items = availablePlugins
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
      subcommand: 'add',
      placeholder: 'Select plugin namespaces to include in stubs',
      items,
    });

    if (selected && selected.length > 0) {
      await this.runPluginSubcommand('add', selected);
    }
  }

  /**
   * Remove VapourSynth plugin stubs.
   */
  @requiresWorkspaceContext
  public async removePlugins(): Promise<void> {
    const ctx = await this.workspaceContext;
    if (!(await existsAsync(ctx.stubFile))) {
      vscode.window.showErrorMessage("Can't remove plugins because there is no stubs file.");
      return;
    }

    const plugins = await this.queryPluginsJson();
    if (!plugins) return;

    const items = plugins.map((plugin) => ({
      label: plugin.namespace,
      description: plugin.description,
      namespace: plugin.namespace,
    }));

    if (items.length === 0) {
      vscode.window.showInformationMessage('No VapourSynth plugin stubs found to remove.');
      return;
    }

    const selected = await this.promptPluginSelection({
      subcommand: 'remove',
      title: 'Select VapourSynth Plugin Stubs to Remove',
      placeholder: 'Select plugin namespaces to remove from stubs',
      items,
    });

    if (selected && selected.length > 0) {
      await this.runPluginSubcommand('remove', selected);
    }
  }

  /**
   * Check VapourSynth stubs for outdated or new plugins / signature updates.
   *
   * @param silent If true (background check), only notify if updates are detected.
   */
  @requiresWorkspaceContext
  public async checkPlugins(silent = false): Promise<void> {
    const ctx = await this.workspaceContext;

    if (!(await existsAsync(ctx.stubFile))) {
      if (!silent) vscode.window.showWarningMessage('No stubs file found. Generate stubs first.');
      return;
    }

    const result = await this.runPluginSubcommand('check', ['--json'], { silent: true });

    if (!result) {
      if (!silent)
        vscode.window.showErrorMessage('Stub check failed. See output channel for details.');
      return;
    }

    let report: CheckJSONResponse;
    try {
      report = JSON.parse(result.stdout);
    } catch (error) {
      logger.error(
        `Stub check parse error: ${error instanceof Error ? error.message : String(error)}`,
      );
      if (!silent)
        vscode.window.showErrorMessage('Stub check failed. See output channel for details.');
      return;
    }

    if (
      (report.new && report.new.length > 0) ||
      (report.old && report.old.length > 0) ||
      (report.modified && report.modified.length > 0)
    ) {
      const choice = await vscode.window.showInformationMessage(
        'New VapourSynth plugins detected.',
        'Regenerate Stubs',
      );
      if (choice === 'Regenerate Stubs') {
        await this.generateStubs('manual');
      }
    } else if (!silent) {
      vscode.window.showInformationMessage('VapourSynth stubs are up to date.');
    }
  }

  /**
   * Update VapourSynth stubs signatures against existing stub files.
   */
  @requiresWorkspaceContext
  public async updatePlugins(): Promise<void> {
    await this.runPluginSubcommand('update');
  }

  private async runPluginSubcommand(
    subcommand: SubCommand,
    namespaces: string[] = [],
    options: Partial<VSStubsCommandOptions> = {},
  ): Promise<{ stdout: string; stderr: string } | undefined> {
    const ctx = await this.getWorkspaceContext();
    if (!ctx) return undefined;

    const nsList = namespaces.join(', ');
    const nsSpace = nsList ? ` ${nsList} ` : ' ';

    if (!(await existsAsync(ctx.stubFile))) {
      if (!options.silent) {
        vscode.window.showErrorMessage(
          `Can't ${subcommand}${nsSpace}because there is no stubs file.`,
        );
      }
      return undefined;
    }

    const { completion, pending } = COMMAND_TEXT_MAP[subcommand];
    const nsMsg = nsList ? `: ${nsList}` : '';
    const errNs = nsList ? ` ${nsList}` : '';

    return this.runVsstubsCommand({
      args: [...(await this.buildArgs(ctx.stubFile)), subcommand, ...namespaces],
      title: `${pending} stubs...`,
      successMessage: `VapourSynth stubs ${completion}${nsMsg}`,
      errorMessage: `Stub ${subcommand}${errNs} failed`,
      ...options,
    });
  }

  @requiresWorkspaceContext
  private async queryPluginsJson(extraDirs?: string[]): Promise<PluginInfo[] | void> {
    const ctx = await this.workspaceContext;

    if (!extraDirs && !(await existsAsync(ctx.stubFile))) return [];

    const args = [
      ...(extraDirs ? extraDirs.flatMap((dir) => ['--load', dir]) : ['-i', ctx.stubFile]),
      'plugins',
      '--json',
    ];

    const res = await this.runVsstubsCommand({ args, silent: true });
    if (!res) return;
    try {
      return JSON.parse(res.stdout);
    } catch (error) {
      logger.error(
        `Plugins query parse error: ${error instanceof Error ? error.message : String(error)}`,
      );
      vscode.window.showErrorMessage('Plugins query parse error. See output channel for details.');
      return;
    }
  }

  private async runVsstubsCommand(
    options: VSStubsCommandOptions,
  ): Promise<{ stdout: string; stderr: string } | undefined> {
    const ctx = await this.getWorkspaceContext();
    if (!ctx) return undefined;

    if (!options.skipCheck) {
      const available = await this.ensureAvailable(options.silent);
      if (!available) return undefined;
    }

    const args = ['-m', 'vsstubs', '--quiet', ...options.args];
    logger.info(`Running: ${ctx.pythonPath} ${args.join(' ')}`);

    const progressOptions: vscode.ProgressOptions = {
      location: options.silent
        ? vscode.ProgressLocation.Window
        : vscode.ProgressLocation.Notification,
      ...(options.title && { title: options.title }),
    };

    try {
      return await vscode.window.withProgress(progressOptions, async () => {
        const result = await execFile(ctx.pythonPath, args, { cwd: ctx.workspaceRoot });
        if (result.stdout) logger.info('Stdout\n' + result.stdout);
        if (result.stderr) logger.info('Stderr\n' + result.stderr);

        if (options.successMessage && !options.silent) {
          vscode.window.showInformationMessage(options.successMessage);
        }
        return result;
      });
    } catch (error) {
      const msg = options.errorMessage ?? 'Command failed. See output channel for details.';
      if (!options.silent) vscode.window.showErrorMessage(msg);
      logger.error(`${msg}: ${error instanceof Error ? error.message : String(error)}`);
      return undefined;
    }
  }

  /**
   * Build CLI arguments for `python -m vsstubs`.
   */
  private async buildArgs(inputStubFile?: string): Promise<string[]> {
    const args = ['-o', (await this.workspaceContext).stubFile];
    if (inputStubFile) args.push('-i', inputStubFile);

    const config = vscode.workspace.getConfiguration(CONFIG.SECTION);
    const extraDirs = config.get<string[]>(CONFIG.EXTRA_PLUGIN_DIRS, []);

    for (const dir of extraDirs) {
      args.push('--load', dir);
    }

    if (config.get<boolean>(CONFIG.ENABLE_COMPAT_API3)) args.push('--compat');

    return args;
  }

  /**
   * Ensure `vsstubs` package is available in the current Python environment.
   */
  private async ensureAvailable(silent = false): Promise<boolean> {
    const ctx = await this.getWorkspaceContext();
    if (!ctx) return false;

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

    const res = await this.runVsstubsCommand({
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

    const installCommand = await this.detectInstallCommand();
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
   * Helper to prompt plugin selection via QuickPick, falling back to InputBox if items are empty.
   */
  private async promptPluginSelection(options: {
    title: string;
    subcommand: 'add' | 'remove';
    placeholder: string;
    items: (vscode.QuickPickItem & { namespace: string })[];
  }): Promise<string[] | undefined> {
    if (options.items.length === 0) return undefined;

    const selected = await vscode.window.showQuickPick(options.items, {
      canPickMany: true,
      title: options.title,
      placeHolder: options.placeholder,
    });

    return selected ? selected.map((item) => item.namespace) : undefined;
  }

  private async getWorkspaceContext(): Promise<WorkspaceContext | undefined> {
    const workspaceRoot = getWorkspaceRoot();
    if (!workspaceRoot) return undefined;

    const stubFile = getStubFile(workspaceRoot);
    const pythonPath = await getPythonInterpreter();
    return { workspaceRoot, stubFile, pythonPath };
  }

  private get workspaceContext(): Promise<WorkspaceContext> {
    return (async () => (await this.getWorkspaceContext())!)();
  }

  /**
   * Package manager detection for installation prompts.
   */
  private async detectInstallCommand(): Promise<string> {
    const root = (await this.workspaceContext).workspaceRoot;
    const isUvEnv = Promise.all([existsAsync(join(root, FILENAMES.UV_LOCK)), isOnPath('uv')]);
    if ((await isUvEnv).some((value) => value)) {
      if (await existsAsync(join(root, FILENAMES.PYPROJECT))) return 'uv add --dev vsstubs';
      return 'uv pip install vsstubs';
    }

    const isPipEnv = Promise.all([
      existsAsync(join(root, FILENAMES.PIPFILE)),
      existsAsync(join(root, FILENAMES.PIPFILE_LOCK)),
    ]);
    if ((await isPipEnv).some((value) => value)) {
      return 'pipenv install --dev vsstubs';
    }

    return 'pip install vsstubs';
  }
}

/**
 * Decorator that resolves getWorkspaceContext() and cancels execution if undefined.
 */
function requiresWorkspaceContext<
  TThis extends { getWorkspaceContext(): Promise<WorkspaceContext | undefined> },
  TArgs extends any[],
  TReturn,
>(func: (this: TThis, ...args: TArgs) => Promise<TReturn>) {
  return async function (this: TThis, ...args: TArgs): Promise<TReturn | void> {
    const ctx = await this.getWorkspaceContext();

    if (!ctx) return;
    return func.apply(this, args);
  };
}
