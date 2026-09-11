import * as vscode from 'vscode';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { COMMANDS } from '../constants.js';
import { VsstubsStatusBar } from '../statusBar.js';
import { resetVSCodeMock } from './vscode.mock.js';

describe('VsstubsStatusBar', () => {
  beforeEach(() => {
    resetVSCodeMock();
  });

  it('initializes status bar item with alignment, command, and ready state', () => {
    const statusBar = new VsstubsStatusBar();

    expect(vscode.window.createStatusBarItem).toHaveBeenCalledWith(
      vscode.StatusBarAlignment.Right,
      100,
    );

    const item = vi.mocked(vscode.window.createStatusBarItem).mock.results[0]?.value;
    expect(item.command).toBe(COMMANDS.CHECK_PLUGIN);
    expect(item.show).toHaveBeenCalled();
    expect(item.text).toBe('$(symbol-namespace) VapourSynth');
    expect(item.tooltip).toBe('VapourSynth Stubs: Ready. Click to check for updates.');

    statusBar.dispose();
  });

  it('updates tooltip with plugin count on showReady()', () => {
    const statusBar = new VsstubsStatusBar();
    const item = vi.mocked(vscode.window.createStatusBarItem).mock.results[0]?.value;

    statusBar.showReady(15);
    expect(item.text).toBe('$(symbol-namespace) VapourSynth');
    expect(item.tooltip).toBe(
      'VapourSynth Stubs: 15 plugins loaded. Click to check for updates.',
    );

    statusBar.dispose();
  });

  it('sets spinning icon and tooltip on showGenerating()', () => {
    const statusBar = new VsstubsStatusBar();
    const item = vi.mocked(vscode.window.createStatusBarItem).mock.results[0]?.value;

    statusBar.showGenerating();
    expect(item.text).toBe('$(sync~spin) VapourSynth');
    expect(item.tooltip).toBe('VapourSynth Stubs: Generating stubs...');

    statusBar.dispose();
  });

  it('sets spinning icon and tooltip on showChecking()', () => {
    const statusBar = new VsstubsStatusBar();
    const item = vi.mocked(vscode.window.createStatusBarItem).mock.results[0]?.value;

    statusBar.showChecking();
    expect(item.text).toBe('$(sync~spin) VapourSynth');
    expect(item.tooltip).toBe('VapourSynth Stubs: Checking plugins...');

    statusBar.dispose();
  });

  it('sets error icon and default tooltip on showError()', () => {
    const statusBar = new VsstubsStatusBar();
    const item = vi.mocked(vscode.window.createStatusBarItem).mock.results[0]?.value;

    statusBar.showError();
    expect(item.text).toBe('$(error) VapourSynth');
    expect(item.tooltip).toBe('VapourSynth Stubs: Error detected. Click to check.');

    statusBar.dispose();
  });

  it('sets custom tooltip on showError(message)', () => {
    const statusBar = new VsstubsStatusBar();
    const item = vi.mocked(vscode.window.createStatusBarItem).mock.results[0]?.value;

    statusBar.showError('Python environment missing');
    expect(item.text).toBe('$(error) VapourSynth');
    expect(item.tooltip).toBe('Python environment missing');

    statusBar.dispose();
  });

  it('disposes status bar item on dispose() and Symbol.dispose', () => {
    const statusBar = new VsstubsStatusBar();
    const item = vi.mocked(vscode.window.createStatusBarItem).mock.results[0]?.value;

    statusBar.dispose();
    expect(item.dispose).toHaveBeenCalledTimes(1);

    statusBar[Symbol.dispose]();
    expect(item.dispose).toHaveBeenCalledTimes(2);
  });
});
