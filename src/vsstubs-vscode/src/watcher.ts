/**
 * Watches VapourSynth plugin directories for changes and triggers stub regeneration.
 */

import * as fs from 'node:fs';
import path from 'node:path';
import * as vscode from 'vscode';

import { CONFIG, PLUGIN_GLOB } from './constants.js';
import { getWorkspaceRoot, isPluginFile, resolvePluginDir } from './helpers.js';
import { logger } from './logging.js';

export class PluginWatcher implements vscode.Disposable {
  private onPluginsChanged: () => void;
  private vsWatcher: vscode.FileSystemWatcher | undefined;
  private fsWatchers: fs.FSWatcher[] = [];
  private debounceTimer: ReturnType<typeof setTimeout> | undefined;
  private pluginDir: string | undefined;
  private activeSession = 0;

  constructor(onPluginsChanged: () => void) {
    this.onPluginsChanged = onPluginsChanged;
  }

  // This method should be implemented (vscode.Disposable)
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

    if (this.pluginDir) {
      this.watchDefaultPluginDir();
    }
    this.watchExtraPluginDirs();
    logger.info('Plugin watcher started.');
  }

  public stop(): void {
    this.activeSession++;
    this.clearDebounce();
    this.vsWatcher?.dispose();
    this.vsWatcher = undefined;

    for (const w of this.fsWatchers) {
      w.close();
    }

    this.fsWatchers = [];
    this.pluginDir = undefined;
  }

  public async restart(): Promise<void> {
    logger.info('Restarting plugin watcher...');
    await this.start();
  }

  private watchDefaultPluginDir(): void {
    const pattern = new vscode.RelativePattern(vscode.Uri.file(this.pluginDir!), PLUGIN_GLOB);
    const watcher = vscode.workspace.createFileSystemWatcher(pattern);

    watcher.onDidCreate(() => this.scheduleRegeneration('created'));
    watcher.onDidChange(() => this.scheduleRegeneration('changed'));
    watcher.onDidDelete(() => this.scheduleRegeneration('deleted'));

    this.vsWatcher = watcher;

    logger.info(`Watching default plugin dir: ${this.pluginDir!}`);
  }

  private watchExtraPluginDirs(): void {
    const config = vscode.workspace.getConfiguration(CONFIG.SECTION);
    const extraDirs = config.get<string[]>(CONFIG.EXTRA_PLUGIN_DIRS, []);
    const workspaceRoot = getWorkspaceRoot();

    for (const dir of extraDirs) {
      const targetDir =
        workspaceRoot && !path.isAbsolute(dir) ? path.resolve(workspaceRoot, dir) : dir;
      try {
        const fsw = fs.watch(targetDir, { recursive: true }, (_eventType, filename) => {
          if (filename && isPluginFile(filename)) {
            this.scheduleRegeneration('changed (extra dir)');
          }
        });

        fsw.on('error', (err) => {
          logger.warn(`fs.watch error for "${targetDir}": ${err.message}`);
        });

        this.fsWatchers.push(fsw);
        logger.info(`Watching extra plugin dir: ${targetDir}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        logger.warn(`Failed to watch extra dir "${targetDir}": ${message}`);
      }
    }
  }

  private scheduleRegeneration(reason: string): void {
    logger.info(`Plugin file ${reason}, scheduling regeneration...`);
    this.clearDebounce();

    const config = vscode.workspace.getConfiguration(CONFIG.SECTION);
    const debounceTime = config.get<number>(CONFIG.WATCH_DEBOUNCE_TIME, 3000);

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
