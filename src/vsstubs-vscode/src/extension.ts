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

  if (shouldAutoGenerate) vsstubs.generateStubs('activation');
  vsstubs.checkPlugins(true);

  // Plugin directory watcher
  const shouldWatch = config.get<boolean>(CONFIG.WATCH_PLUGINS, true);
  let watcher: PluginWatcher | undefined;

  if (shouldWatch) {
    watcher = new PluginWatcher(() => vsstubs.generateStubs('watcher'));

    context.subscriptions.push(watcher);
    watcher.start();

    // Restart watcher when extraPluginDirs or watchPlugins settings change
    context.subscriptions.push(
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration(`${CONFIG.SECTION}.${CONFIG.EXTRA_PLUGIN_DIRS}`)) {
          watcher?.restart();
          logger.info('Extra plugin dirs changed. Restarting watcher...');
        }

        if (e.affectsConfiguration(`${CONFIG.SECTION}.${CONFIG.WATCH_PLUGINS}`)) {
          const updated = vscode.workspace.getConfiguration(CONFIG.SECTION);
          if (updated.get<boolean>(CONFIG.WATCH_PLUGINS, true)) {
            watcher?.restart();
            logger.info('Plugin watcher re-enabled by settings.');
          } else {
            watcher?.stop();
            logger.info('Plugin watcher disabled by settings.');
          }
        }
      }),
    );
  }

  // Subscribe to interpreter changes for background check and watcher restart
  PythonExtension.api()
    .then((api) => {
      context.subscriptions.push(
        api.environments.onDidChangeActiveEnvironmentPath(() => {
          logger.info('Python interpreter changed. Running background check...');
          vsstubs.checkPlugins(true);
          if (watcher) {
            logger.info('Restarting watcher...');
            watcher.restart();
          }
        }),
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
