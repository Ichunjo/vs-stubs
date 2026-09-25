/**
 * High-level orchestration and UI controller for VapourSynth Stubs.
 */

import * as vscode from 'vscode';
import { type CliQueryOptions, VsstubsCli } from './cli.js';
import { CONFIG } from './constants.js';
import { EnvironmentManager } from './environment.js';
import {
  existsAsync,
  getPythonInterpreter,
  getStubFile,
  getWorkspaceRoot,
  pickWorkspaceFolder,
} from './helpers.js';
import { logger } from './logging.js';
import { VsstubsStatusBar } from './statusBar.js';
import type {
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

export class VSStubs implements vscode.Disposable {
  public readonly cli = new VsstubsCli(logger);
  public readonly env = new EnvironmentManager(this.cli);
  public readonly statusBar = new VsstubsStatusBar();

  private isGenerationInProgress = false;
  private needsRegeneration = false;

  public dispose(): void {
    this.statusBar.dispose();
  }

  public [Symbol.dispose](): void {
    this.dispose();
  }

  /**
   * Generate VapourSynth stubs.
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

    if (trigger === 'activation' && (await existsAsync(ctx.stubFile))) {
      return;
    }

    const resource = vscode.Uri.file(ctx.workspaceRoot);
    const config = vscode.workspace.getConfiguration(CONFIG.SECTION, resource);
    const extraPluginDirs = config.get<string[]>(CONFIG.EXTRA_PLUGIN_DIRS, []);

    this.isGenerationInProgress = true;
    this.statusBar.showGenerating();

    try {
      await this.runWithProgress(
        ctx,
        {
          args: [],
          title: 'Generating VapourSynth stubs...',
          successMessage: 'VapourSynth stubs generated.',
          errorMessage: 'Stub generation failed.',
          silent: isSilent,
        },
        async (signal) => {
          return this.cli.generate(ctx.pythonPath, {
            stubFile: ctx.stubFile,
            extraPluginDirs,
            cwd: ctx.workspaceRoot,
            workspaceRoot: ctx.workspaceRoot,
            signal,
          });
        },
      );
      this.statusBar.showReady();
    } catch {
      this.statusBar.showError();
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
    const extraPluginDirs = config.get<string[]>(CONFIG.EXTRA_PLUGIN_DIRS, []);

    const hasStub = await existsAsync(ctx.stubFile);
    const [availablePlugins, existingPlugins] = await Promise.all([
      this.queryPluginsSafe(ctx, {
        extraPluginDirs,
        workspaceRoot: ctx.workspaceRoot,
      }),
      hasStub
        ? this.queryPluginsSafe(ctx, { stubFile: ctx.stubFile })
        : Promise.resolve([] as PluginInfo[]),
    ]);
    if (!availablePlugins || !existingPlugins) return;

    const existingSet = new Set(existingPlugins.map((ns) => ns.namespace));
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

    const plugins = await this.queryPluginsSafe(ctx, { stubFile: ctx.stubFile });
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
   */
  public async checkPlugins(silent = false): Promise<void> {
    const ctx = await this.getWorkspaceContext(!silent);
    if (!ctx) return;

    if (!(await existsAsync(ctx.stubFile))) {
      if (!silent) vscode.window.showWarningMessage('No stubs file found. Generate stubs first.');
      return;
    }

    this.statusBar.showChecking();
    let report: CheckJSONResponse;

    try {
      const resource = vscode.Uri.file(ctx.workspaceRoot);
      const config = vscode.workspace.getConfiguration(CONFIG.SECTION, resource);
      const extraPluginDirs = config.get<string[]>(CONFIG.EXTRA_PLUGIN_DIRS, []);

      report = await this.cli.check(ctx.pythonPath, {
        stubFile: ctx.stubFile,
        extraPluginDirs,
        cwd: ctx.workspaceRoot,
        workspaceRoot: ctx.workspaceRoot,
      });
    } catch (error) {
      this.statusBar.showError();
      if (!silent) {
        void this.showErrorWithOutput(`Stub check failed: ${String(error)}`);
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
    } else {
      this.statusBar.showReady();
      if (!silent) {
        const resource = vscode.Uri.file(ctx.workspaceRoot);
        const showNotification = vscode.workspace
          .getConfiguration(CONFIG.SECTION, resource)
          .get<boolean>(CONFIG.SHOW_UP_TO_DATE_NOTIFICATION, true);
        if (showNotification) {
          vscode.window.showInformationMessage('VapourSynth stubs are up to date.');
        }
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

  /**
   * Helper to query plugins with unified error reporting.
   */
  private async queryPluginsSafe(
    ctx: WorkspaceContext,
    options: CliQueryOptions,
  ): Promise<PluginInfo[] | null> {
    try {
      return await this.cli.queryPlugins(ctx.pythonPath, { cwd: ctx.workspaceRoot, ...options });
    } catch (error) {
      void this.showErrorWithOutput(`Failed to query plugins: ${String(error)}`);
      return null;
    }
  }

  private async runPluginSubcommand(
    ctx: WorkspaceContext,
    subcommand: SubCommand,
    namespaces: string[] = [],
  ): Promise<void> {
    if (!(await existsAsync(ctx.stubFile))) {
      vscode.window.showErrorMessage(`Can't ${subcommand} because there is no stubs file.`);
      return;
    }

    const { completion, pending } = COMMAND_TEXT_MAP[subcommand];
    const resource = vscode.Uri.file(ctx.workspaceRoot);
    const config = vscode.workspace.getConfiguration(CONFIG.SECTION, resource);
    const extraPluginDirs = config.get<string[]>(CONFIG.EXTRA_PLUGIN_DIRS, []);

    await this.runWithProgress(
      ctx,
      {
        args: [],
        title: `${pending} stubs...`,
        successMessage: `VapourSynth stubs ${completion}.`,
        errorMessage: `Stub ${subcommand} failed.`,
      },
      (signal) =>
        this.cli.runSubcommand(ctx.pythonPath, subcommand, {
          stubFile: ctx.stubFile,
          namespaces,
          extraPluginDirs,
          cwd: ctx.workspaceRoot,
          workspaceRoot: ctx.workspaceRoot,
          signal,
        }),
    );
  }

  private async runWithProgress(
    ctx: WorkspaceContext,
    options: VSStubsCommandOptions,
    action: (signal: AbortSignal) => Promise<{ stdout: string; stderr: string }>,
  ): Promise<{ stdout: string; stderr: string } | undefined> {
    if (!options.skipCheck) {
      const available = await this.env.ensureAvailable(ctx, options.silent);
      if (!available) return undefined;
    }

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
        const reg = token.onCancellationRequested(() => abortController.abort());

        let optSub: vscode.Disposable | undefined;
        if (options.cancellationToken) {
          optSub = options.cancellationToken.onCancellationRequested(() => abortController.abort());
        }

        try {
          const result = await action(abortController.signal);
          if (options.successMessage && !options.silent) {
            vscode.window.showInformationMessage(options.successMessage);
          }
          return result;
        } finally {
          reg.dispose();
          optSub?.dispose();
        }
      });
    } catch (error) {
      const isAbort =
        error instanceof Error && (error.name === 'AbortError' || error.message.includes('abort'));
      if (isAbort) {
        logger.info('Command execution cancelled.');
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

  private async showErrorWithOutput(msg: string): Promise<void> {
    const choice = await vscode.window.showErrorMessage(msg, 'Open Output');
    if (choice === 'Open Output') {
      logger.show();
    }
  }
  /**
   * Resolve workspace context.
   * If interactive is true, prompts user via folder pick if multiple roots exist without an active editor.
   */
  private async getWorkspaceContext(interactive = false): Promise<WorkspaceContext | undefined> {
    let workspaceRoot: string | undefined;

    if (interactive) {
      workspaceRoot = (await pickWorkspaceFolder())?.uri.fsPath;
    } else {
      workspaceRoot = getWorkspaceRoot();
    }

    if (!workspaceRoot) {
      if (interactive) {
        vscode.window.showWarningMessage('VapourSynth Stubs: No workspace folder is open.');
      }
      return undefined;
    }

    const stubFile = getStubFile(workspaceRoot);
    const pythonPath = await getPythonInterpreter(workspaceRoot);
    return { workspaceRoot, stubFile, pythonPath };
  }
}
