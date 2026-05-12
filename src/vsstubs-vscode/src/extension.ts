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
  initLogger();

  const vsstubs = new VSStubs();

  context.subscriptions.push(
    vscode.commands.registerCommand(COMMANDS.GENERATE, () => vsstubs.generateStubs('manual')),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(COMMANDS.ADD_PLUGIN, vsstubs.addPlugins),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(COMMANDS.REMOVE_PLUGIN, vsstubs.removePlugins),
  );

  // Auto-generate on activation if enabled
  const config = vscode.workspace.getConfiguration(CONFIG.SECTION);
  const shouldAutoGenerate = config.get<boolean>(CONFIG.AUTO_GENERATE, true);

  if (shouldAutoGenerate) {
    vsstubs.generateStubs('activation');
  }

  // Plugin directory watcher
  const shouldWatch = config.get<boolean>(CONFIG.WATCH_PLUGINS, true);

  if (shouldWatch) {
    const watcher = new PluginWatcher(() => {
      vsstubs.generateStubs('watcher');
    });

    context.subscriptions.push(watcher);
    watcher.start();

    // Restart watcher when extraPluginDirs or watchPlugins settings change
    context.subscriptions.push(
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration(`${CONFIG.SECTION}.${CONFIG.EXTRA_PLUGIN_DIRS}`)) {
          watcher.restart();
          logger.info('Extra plugin dirs changed. Restarting watcher...');
        }

        if (e.affectsConfiguration(`${CONFIG.SECTION}.${CONFIG.WATCH_PLUGINS}`)) {
          const updated = vscode.workspace.getConfiguration(CONFIG.SECTION);
          if (updated.get<boolean>(CONFIG.WATCH_PLUGINS, true)) {
            watcher.restart();
            logger.info('Plugin watcher re-enabled by settings.');
          } else {
            watcher.stop();
            logger.info('Plugin watcher disabled by settings.');
          }
        }
      }),
    );

    // Restart watcher when the Python interpreter changes
    PythonExtension.api()
      .then((api) => {
        context.subscriptions.push(
          api.environments.onDidChangeActiveEnvironmentPath(() => {
            logger.info('Python interpreter changed, restarting watcher...');
            watcher.restart();
          }),
        );
      })
      .catch((err) => {
        logger.warn(
          `Could not subscribe to interpreter changes: ${err instanceof Error ? err.message : String(err)}`,
        );
      });
  }
}

export function deactivate(): void {
  return;
}
