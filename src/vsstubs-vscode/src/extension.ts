/**
 * VSCode Extension Entry Point
 */

import { PythonExtension } from '@vscode/python-extension';
import * as vscode from 'vscode';

import { COMMANDS, CONFIG } from './constants.js';
import { VSStubs } from './core.js';
import { initLogger, logger } from './logging.js';
import { PluginWatcher } from './watcher.js';

export function activate(context: vscode.ExtensionContext): void {
  initLogger(context);

  const vsstubs = new VSStubs();
  context.subscriptions.push(vsstubs);

  context.subscriptions.push(
    vscode.commands.registerCommand(COMMANDS.GENERATE, () => vsstubs.generateStubs('manual')),
    vscode.commands.registerCommand(COMMANDS.ADD_PLUGIN, () => vsstubs.addPlugins()),
    vscode.commands.registerCommand(COMMANDS.REMOVE_PLUGIN, () => vsstubs.removePlugins()),
    vscode.commands.registerCommand(COMMANDS.CHECK_PLUGIN, () => vsstubs.checkPlugins(false)),
    vscode.commands.registerCommand(COMMANDS.UPDATE_PLUGIN, () => vsstubs.updatePlugins()),
  );

  // Auto-generate on activation if enabled or run background check if stubs exist
  const config = vscode.workspace.getConfiguration(CONFIG.SECTION);
  const shouldAutoGenerate = config.get<boolean>(CONFIG.AUTO_GENERATE, true);
  const shouldCheckOnStartup = config.get<boolean>(CONFIG.CHECK_ON_STARTUP, true);
  void startupInit(vsstubs, shouldAutoGenerate, shouldCheckOnStartup);

  // Plugin directory watcher
  const watcher = new PluginWatcher(() => vsstubs.generateStubs('watcher'));
  context.subscriptions.push(watcher);

  const shouldWatch = config.get<boolean>(CONFIG.WATCH_PLUGINS, true);
  if (shouldWatch) {
    void watcher.start();
  }

  // Restart or toggle watcher when extraPluginDirs or watchPlugins settings change
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration(`${CONFIG.SECTION}.${CONFIG.EXTRA_PLUGIN_DIRS}`)) {
        void watcher.restart();
        logger.info('Extra plugin dirs changed. Restarting watcher...');
      }

      if (e.affectsConfiguration(`${CONFIG.SECTION}.${CONFIG.WATCH_PLUGINS}`)) {
        const updated = vscode.workspace.getConfiguration(CONFIG.SECTION);
        if (updated.get<boolean>(CONFIG.WATCH_PLUGINS, true)) {
          void watcher.restart();
          logger.info('Plugin watcher re-enabled by settings.');
        } else {
          watcher.stop();
          logger.info('Plugin watcher disabled by settings.');
        }
      }
    }),
  );

  // Subscribe to interpreter changes for background check and watcher restart
  PythonExtension.api()
    .then((api) => {
      context.subscriptions.push(
        api.environments.onDidChangeActiveEnvironmentPath(() =>
          onInterpreterChanged(vsstubs, watcher),
        ),
      );
    })
    .catch((err) => {
      logger.warn(
        `Could not subscribe to interpreter changes: ${err instanceof Error ? err.message : String(err)}`,
      );
    });
}

export function deactivate(): void {
  return;
}

async function startupInit(
  vsstubs: VSStubs,
  shouldAutoGenerate: boolean,
  shouldCheckOnStartup: boolean,
): Promise<void> {
  try {
    if (shouldAutoGenerate) await vsstubs.generateStubs('activation');
    if (shouldCheckOnStartup) await vsstubs.checkPlugins(true);
  } catch (err) {
    logger.error(
      `Startup initialization failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

async function onInterpreterChanged(vsstubs: VSStubs, watcher?: PluginWatcher): Promise<void> {
  logger.info('Python interpreter changed. Running background check...');
  vsstubs.env.invalidateCache();
  try {
    await vsstubs.checkPlugins(true);
    if (watcher) {
      logger.info('Restarting watcher...');
      await watcher.restart();
    }
  } catch (err) {
    logger.error(
      `Failed handling interpreter change: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}
