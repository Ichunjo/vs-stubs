import * as vscode from 'vscode';

import { OUTPUT_CHANNEL_NAME } from './constants.js';

let channel: vscode.LogOutputChannel;

export function initLogger() {
  channel = vscode.window.createOutputChannel(OUTPUT_CHANNEL_NAME, { log: true });
}

export const logger = {
  info: (msg: string) => channel?.info(msg),
  warn: (msg: string) => channel?.warn(msg),
  error: (msg: string) => channel?.error(msg),
};
