import * as vscode from 'vscode';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { VsstubsCli } from '../cli.js';
import { EnvironmentManager } from '../environment.js';
import type { WorkspaceContext } from '../types.js';
import * as utils from '../utils.js';
import { resetVSCodeMock } from './vscode.mock.js';

describe('EnvironmentManager', () => {
  let cli: VsstubsCli;
  let env: EnvironmentManager;

  const fakeCtx: WorkspaceContext = {
    workspaceRoot: '/fake/root',
    stubFile: '/fake/root/typings/vapoursynth/__init__.pyi',
    pythonPath: '/usr/bin/python3',
  };

  beforeEach(() => {
    resetVSCodeMock();
    cli = new VsstubsCli();
    env = new EnvironmentManager(cli);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('detectInstallCommand', () => {
    it('returns "uv add --dev vsstubs" when uv.lock and pyproject.toml exist and uv is on PATH', async () => {
      vi.spyOn(utils, 'existsAsync').mockImplementation(async (filePath) => {
        return filePath.includes('uv.lock') || filePath.includes('pyproject.toml');
      });
      vi.spyOn(utils, 'isOnPath').mockResolvedValue(true);

      const cmd = await env.detectInstallCommand('/fake/root');
      expect(cmd).toBe('uv add --dev vsstubs');
    });

    it('returns "uv pip install vsstubs" when uv.lock exists without pyproject.toml', async () => {
      vi.spyOn(utils, 'existsAsync').mockImplementation(async (filePath) => {
        return filePath.includes('uv.lock');
      });
      vi.spyOn(utils, 'isOnPath').mockResolvedValue(true);

      const cmd = await env.detectInstallCommand('/fake/root');
      expect(cmd).toBe('uv pip install vsstubs');
    });

    it('returns "pipenv install --dev vsstubs" when Pipfile exists', async () => {
      vi.spyOn(utils, 'existsAsync').mockImplementation(async (filePath) => {
        return filePath.includes('Pipfile');
      });
      vi.spyOn(utils, 'isOnPath').mockResolvedValue(false);

      const cmd = await env.detectInstallCommand('/fake/root');
      expect(cmd).toBe('pipenv install --dev vsstubs');
    });

    it('falls back to "pip install vsstubs" in standard environment', async () => {
      vi.spyOn(utils, 'existsAsync').mockResolvedValue(false);
      vi.spyOn(utils, 'isOnPath').mockResolvedValue(false);

      const cmd = await env.detectInstallCommand('/fake/root');
      expect(cmd).toBe('pip install vsstubs');
    });
  });

  describe('ensureAvailable', () => {
    it('returns false and shows error when VapourSynth is not installed', async () => {
      vi.spyOn(utils, 'isVapoursynthAvailable').mockResolvedValue(false);

      const available = await env.ensureAvailable(fakeCtx, false);

      expect(available).toBe(false);
      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining('VapourSynth module is not installed'),
      );
    });

    it('returns false without showing error when silent is true', async () => {
      vi.spyOn(utils, 'isVapoursynthAvailable').mockResolvedValue(false);

      const available = await env.ensureAvailable(fakeCtx, true);

      expect(available).toBe(false);
      expect(vscode.window.showErrorMessage).not.toHaveBeenCalled();
    });

    it('returns true and caches interpreter when VapourSynth and vsstubs >= 2.3.0 exist', async () => {
      const vsSpy = vi.spyOn(utils, 'isVapoursynthAvailable').mockResolvedValue(true);
      const verSpy = vi.spyOn(cli, 'getVersion').mockResolvedValue('2.3.1');

      const availableFirst = await env.ensureAvailable(fakeCtx);
      expect(availableFirst).toBe(true);
      expect(vsSpy).toHaveBeenCalledTimes(1);
      expect(verSpy).toHaveBeenCalledTimes(1);

      // Second call should return immediately from cache
      const availableSecond = await env.ensureAvailable(fakeCtx);
      expect(availableSecond).toBe(true);
      expect(vsSpy).toHaveBeenCalledTimes(1);
      expect(verSpy).toHaveBeenCalledTimes(1);
    });

    it('re-checks interpreter availability after invalidateCache()', async () => {
      const vsSpy = vi.spyOn(utils, 'isVapoursynthAvailable').mockResolvedValue(true);
      vi.spyOn(cli, 'getVersion').mockResolvedValue('2.3.1');

      await env.ensureAvailable(fakeCtx);
      expect(vsSpy).toHaveBeenCalledTimes(1);

      env.invalidateCache();

      await env.ensureAvailable(fakeCtx);
      expect(vsSpy).toHaveBeenCalledTimes(2);
    });

    it('prompts install when vsstubs version is below requirement', async () => {
      vi.spyOn(utils, 'isVapoursynthAvailable').mockResolvedValue(true);
      vi.spyOn(cli, 'getVersion').mockResolvedValue('2.0.0');
      const promptSpy = vi.spyOn(env, 'promptInstall').mockResolvedValue();

      const available = await env.ensureAvailable(fakeCtx, false);

      expect(available).toBe(false);
      expect(promptSpy).toHaveBeenCalledWith('/usr/bin/python3', expect.any(String));
    });
  });

  describe('promptInstall', () => {
    it('creates terminal and sends install command when user chooses "Install now"', async () => {
      const showErrMock = vi.mocked(vscode.window.showErrorMessage);
      showErrMock.mockResolvedValue('Install now' as unknown as undefined);

      await env.promptInstall('/usr/bin/python3', 'pip install vsstubs');

      expect(vscode.window.createTerminal).toHaveBeenCalledWith('VSStubs install');
      const terminalInstance = vi.mocked(vscode.window.createTerminal).mock.results[0]?.value;
      expect(terminalInstance.show).toHaveBeenCalled();
      expect(terminalInstance.sendText).toHaveBeenCalledWith('pip install vsstubs');
    });

    it('copies install command to clipboard when user chooses "Copy install command"', async () => {
      const showErrMock = vi.mocked(vscode.window.showErrorMessage);
      showErrMock.mockResolvedValue('Copy install command' as unknown as undefined);
      const writeSpy = vi.spyOn(vscode.env.clipboard, 'writeText');

      await env.promptInstall('/usr/bin/python3', 'pip install vsstubs');

      expect(writeSpy).toHaveBeenCalledWith('pip install vsstubs');
      expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
        'Copied: pip install vsstubs',
      );
    });

    it('opens terminal without auto-execution when user chooses "Open terminal"', async () => {
      const showErrMock = vi.mocked(vscode.window.showErrorMessage);
      showErrMock.mockResolvedValue('Open terminal' as unknown as undefined);

      await env.promptInstall('/usr/bin/python3', 'pip install vsstubs');

      expect(vscode.window.createTerminal).toHaveBeenCalledWith('VSStubs install');
      const terminalInstance = vi.mocked(vscode.window.createTerminal).mock.results[0]?.value;
      expect(terminalInstance.show).toHaveBeenCalled();
      expect(terminalInstance.sendText).toHaveBeenCalledWith('pip install vsstubs', false);
    });
  });
});
