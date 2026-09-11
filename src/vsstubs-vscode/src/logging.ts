import * as vscode from 'vscode';

import { OUTPUT_CHANNEL_NAME } from './constants.js';

let channel: vscode.LogOutputChannel;

export interface Logger {
  info: (msg: string) => void;
  warn: (msg: string) => void;
  error: (msg: string) => void;
  show: (preserveFocus?: boolean) => void;
}

export function initLogger(context: vscode.ExtensionContext) {
  channel = vscode.window.createOutputChannel(OUTPUT_CHANNEL_NAME, { log: true });
  context.subscriptions.push(channel);
}

export const logger: Logger = {
  info: (msg: string) => channel?.info(msg),
  warn: (msg: string) => channel?.warn(msg),
  error: (msg: string) => channel?.error(msg),
  show: (preserveFocus?: boolean) => channel?.show(preserveFocus),
};
