/**
 * Watches VapourSynth plugin directories for changes and triggers stub regeneration.
 */

import * as vscode from 'vscode';

import { CONFIG, PLUGIN_GLOB } from './constants.js';
import {
  existsAsync,
  getWorkspaceRoot,
  resolvePathVariables,
  resolvePluginDir,
} from './helpers.js';
import { logger } from './logging.js';

export class PluginWatcher implements vscode.Disposable {
  private onPluginsChanged: () => void;
  private vsWatchers: vscode.FileSystemWatcher[] = [];
  private debounceTimer: ReturnType<typeof setTimeout> | undefined;
  private pluginDir: string | undefined;
  private activeSession = 0;

  constructor(onPluginsChanged: () => void) {
    this.onPluginsChanged = onPluginsChanged;
  }

  public dispose(): void {
    this.stop();
  }

  public [Symbol.dispose](): void {
    this.dispose();
  }

  public async start(): Promise<void> {
    this.stop();
    const currentSession = ++this.activeSession;
    const dir = await resolvePluginDir();

    if (currentSession !== this.activeSession) return;
    this.pluginDir = dir;

    if (this.pluginDir && (await existsAsync(this.pluginDir))) {
      this.watchDir(this.pluginDir, 'default plugin dir');
    }
    await this.watchExtraPluginDirs();
    logger.info('Plugin watcher started.');
  }

  public stop(): void {
    this.activeSession++;
    this.clearDebounce();

    for (const w of this.vsWatchers) {
      w.dispose();
    }
    this.vsWatchers = [];
    this.pluginDir = undefined;
  }

  public async restart(): Promise<void> {
    logger.info('Restarting plugin watcher...');
    await this.start();
  }

  private watchDir(dirPath: string, label: string): void {
    try {
      const pattern = new vscode.RelativePattern(vscode.Uri.file(dirPath), PLUGIN_GLOB);
      const watcher = vscode.workspace.createFileSystemWatcher(pattern);

      watcher.onDidCreate(() => this.scheduleRegeneration(`created (${label})`));
      watcher.onDidChange(() => this.scheduleRegeneration(`changed (${label})`));
      watcher.onDidDelete(() => this.scheduleRegeneration(`deleted (${label})`));

      this.vsWatchers.push(watcher);
      logger.info(`Watching ${label}: ${dirPath}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.warn(`Failed to watch ${label} "${dirPath}": ${message}`);
    }
  }

  private async watchExtraPluginDirs(): Promise<void> {
    const workspaceRoot = getWorkspaceRoot();
    const resource = workspaceRoot ? vscode.Uri.file(workspaceRoot) : undefined;
    const config = vscode.workspace.getConfiguration(CONFIG.SECTION, resource);
    const extraDirs = config.get<string[]>(CONFIG.EXTRA_PLUGIN_DIRS, []);

    for (const rawDir of extraDirs) {
      const targetDir = resolvePathVariables(rawDir, workspaceRoot);
      if (await existsAsync(targetDir)) {
        this.watchDir(targetDir, `extra plugin dir "${rawDir}"`);
      } else {
        logger.warn(`Extra plugin dir does not exist: ${targetDir}`);
      }
    }
  }

  private scheduleRegeneration(reason: string): void {
    logger.info(`Plugin file ${reason}, scheduling regeneration...`);
    this.clearDebounce();

    const workspaceRoot = getWorkspaceRoot();
    const resource = workspaceRoot ? vscode.Uri.file(workspaceRoot) : undefined;
    const config = vscode.workspace.getConfiguration(CONFIG.SECTION, resource);
    const configuredDebounce = config.get<number>(CONFIG.WATCH_DEBOUNCE_TIME, 3000);
    const debounceTime = Math.max(500, configuredDebounce || 3000);

    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = undefined;
      logger.info('Debounce expired, triggering stub regeneration.');
      this.onPluginsChanged();
    }, debounceTime);
  }

  private clearDebounce(): void {
    if (this.debounceTimer !== undefined) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = undefined;
    }
  }
}
