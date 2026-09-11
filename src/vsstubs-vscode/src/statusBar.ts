/**
 * Status bar item controller for VapourSynth Stubs.
 */

import * as vscode from 'vscode';
import { COMMANDS } from './constants.js';

export class VsstubsStatusBar implements vscode.Disposable {
  private item: vscode.StatusBarItem;

  constructor() {
    this.item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    this.item.command = COMMANDS.CHECK_PLUGIN;
    this.showReady();
    this.item.show();
  }

  public showReady(pluginCount?: number): void {
    this.item.text = '$(symbol-namespace) VapourSynth';
    this.item.tooltip =
      pluginCount !== undefined
        ? `VapourSynth Stubs: ${pluginCount} plugins loaded. Click to check for updates.`
        : 'VapourSynth Stubs: Ready. Click to check for updates.';
  }

  public showGenerating(): void {
    this.item.text = '$(sync~spin) VapourSynth';
    this.item.tooltip = 'VapourSynth Stubs: Generating stubs...';
  }

  public showChecking(): void {
    this.item.text = '$(sync~spin) VapourSynth';
    this.item.tooltip = 'VapourSynth Stubs: Checking plugins...';
  }

  public showError(message?: string): void {
    this.item.text = '$(error) VapourSynth';
    this.item.tooltip = message ?? 'VapourSynth Stubs: Error detected. Click to check.';
  }

  public dispose(): void {
    this.item.dispose();
  }

  public [Symbol.dispose](): void {
    this.dispose();
  }
}
