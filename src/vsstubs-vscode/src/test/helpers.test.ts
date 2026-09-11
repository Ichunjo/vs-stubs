import path from 'node:path';
import { PythonExtension } from '@vscode/python-extension';
import * as vscode from 'vscode';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { FILENAMES, NAMESPACES } from '../constants.js';
import {
  getPythonInterpreter,
  getStubDir,
  getStubFile,
  getWorkspaceRoot,
  isVapoursynthAvailable,
  pickWorkspaceFolder,
  resolvePluginDir,
} from '../helpers.js';
import * as utils from '../utils.js';
import { resetVSCodeMock, setActiveTextEditor, setWorkspaceFolders } from './vscode.mock.js';

vi.mock('@vscode/python-extension', () => ({
  PythonExtension: {
    api: vi.fn(),
  },
  PVSC_EXTENSION_ID: 'ms-python.python',
}));

describe('helpers', () => {
  beforeEach(() => {
    resetVSCodeMock();
  });

  describe('getWorkspaceRoot', () => {
    it('returns undefined when no workspace folders exist', () => {
      setWorkspaceFolders([]);
      expect(getWorkspaceRoot()).toBeUndefined();
    });

    it('returns folder path for single-root workspace', () => {
      setWorkspaceFolders([
        {
          uri: vscode.Uri.file('/path/to/project'),
          name: 'project',
          index: 0,
        },
      ]);
      expect(getWorkspaceRoot()).toBe('/path/to/project');
    });

    it('prioritizes active editor workspace folder in multi-root setup', () => {
      setWorkspaceFolders([
        {
          uri: vscode.Uri.file('/path/to/projectA'),
          name: 'projectA',
          index: 0,
        },
        {
          uri: vscode.Uri.file('/path/to/projectB'),
          name: 'projectB',
          index: 1,
        },
      ]);

      setActiveTextEditor({
        document: {
          uri: vscode.Uri.file('/path/to/projectB/sub/file.py'),
        },
      });

      expect(getWorkspaceRoot()).toBe('/path/to/projectB');
    });

    it('falls back to first folder in multi-root setup without active editor', () => {
      setWorkspaceFolders([
        {
          uri: vscode.Uri.file('/path/to/projectA'),
          name: 'projectA',
          index: 0,
        },
        {
          uri: vscode.Uri.file('/path/to/projectB'),
          name: 'projectB',
          index: 1,
        },
      ]);
      setActiveTextEditor(undefined);

      expect(getWorkspaceRoot()).toBe('/path/to/projectA');
    });
  });

  describe('pickWorkspaceFolder', () => {
    it('returns undefined when workspace has no folders', async () => {
      setWorkspaceFolders([]);
      const picked = await pickWorkspaceFolder();
      expect(picked).toBeUndefined();
    });

    it('returns single folder immediately without prompting user', async () => {
      const singleFolder = {
        uri: vscode.Uri.file('/single/root'),
        name: 'single',
        index: 0,
      };
      setWorkspaceFolders([singleFolder]);

      const picked = await pickWorkspaceFolder();
      expect(picked).toEqual(singleFolder);
      expect(vscode.window.showWorkspaceFolderPick).not.toHaveBeenCalled();
    });

    it('prompts user via showWorkspaceFolderPick in multi-root without active editor', async () => {
      const folderA = {
        uri: vscode.Uri.file('/path/a'),
        name: 'a',
        index: 0,
      };
      const folderB = {
        uri: vscode.Uri.file('/path/b'),
        name: 'b',
        index: 1,
      };
      setWorkspaceFolders([folderA, folderB]);
      setActiveTextEditor(undefined);

      const pickMock = vi.mocked(vscode.window.showWorkspaceFolderPick);
      pickMock.mockResolvedValue(folderB as unknown as undefined);

      const picked = await pickWorkspaceFolder();
      expect(pickMock).toHaveBeenCalledWith(
        expect.objectContaining({
          placeHolder: 'Select the workspace folder for VapourSynth stubs',
        }),
      );
      expect(picked).toEqual(folderB);
    });
  });

  describe('getStubDir and getStubFile', () => {
    it('uses "typings" as default stub directory resolved against workspace root', () => {
      const workspaceRoot = path.resolve('/workspace/my-project');
      const stubDir = getStubDir(workspaceRoot);
      expect(stubDir).toBe(path.resolve(workspaceRoot, 'typings'));

      const stubFile = getStubFile(workspaceRoot);
      const expected = path.join(
        workspaceRoot,
        'typings',
        NAMESPACES.VAPOURSYNTH,
        FILENAMES.STUB_INIT,
      );
      expect(stubFile).toBe(expected);
    });

    it('returns "typings" without resolution when workspaceRoot is undefined', () => {
      setWorkspaceFolders([]);
      const stubDir = getStubDir(undefined);
      expect(stubDir).toBe('typings');
    });

    it('reads configured stubPath from python.analysis.stubPath setting', () => {
      vi.mocked(vscode.workspace.getConfiguration).mockReturnValue({
        get: vi.fn((key: string, defaultValue?: unknown) => {
          if (key === 'stubPath') return 'custom_stubs';
          return defaultValue;
        }),
        update: vi.fn(),
        has: vi.fn().mockReturnValue(true),
        inspect: vi.fn(),
      });

      const workspaceRoot = path.resolve('/workspace/my-project');
      const stubDir = getStubDir(workspaceRoot);
      expect(stubDir).toBe(path.resolve(workspaceRoot, 'custom_stubs'));

      const stubFile = getStubFile(workspaceRoot);
      const expected = path.join(
        workspaceRoot,
        'custom_stubs',
        NAMESPACES.VAPOURSYNTH,
        FILENAMES.STUB_INIT,
      );
      expect(stubFile).toBe(expected);
    });
  });

  describe('getPythonInterpreter', () => {
    it('resolves python interpreter via PythonExtension API when available', async () => {
      const mockApi = {
        environments: {
          getActiveEnvironmentPath: vi.fn().mockReturnValue({ id: 'env-id' }),
          resolveEnvironment: vi.fn().mockResolvedValue({
            executable: {
              uri: vscode.Uri.file('/resolved/python/bin/python'),
            },
          }),
        },
      };
      vi.mocked(PythonExtension.api).mockResolvedValue(mockApi as never);

      const interpreter = await getPythonInterpreter('/workspace/root');
      expect(interpreter).toBe('/resolved/python/bin/python');
    });

    it('reads python.defaultInterpreterPath fallback when python extension API is unavailable', async () => {
      vi.mocked(PythonExtension.api).mockRejectedValue(new Error('Extension not found'));
      vi.mocked(vscode.workspace.getConfiguration).mockReturnValue({
        get: vi.fn((key: string, defaultValue?: unknown) => {
          if (key === 'defaultInterpreterPath') return '/custom/python3';
          return defaultValue;
        }),
        update: vi.fn(),
        has: vi.fn().mockReturnValue(true),
        inspect: vi.fn(),
      });

      const interpreter = await getPythonInterpreter('/workspace/root');
      expect(interpreter).toBe('/custom/python3');
    });

    it('falls back to "python" when no setting is configured', async () => {
      vi.mocked(PythonExtension.api).mockRejectedValue(new Error('Extension not found'));
      vi.mocked(vscode.workspace.getConfiguration).mockReturnValue({
        get: vi.fn((_key: string, defaultValue?: unknown) => defaultValue),
        update: vi.fn(),
        has: vi.fn().mockReturnValue(true),
        inspect: vi.fn(),
      });

      const interpreter = await getPythonInterpreter('/workspace/root');
      expect(interpreter).toBe('python');
    });
  });

  describe('resolvePluginDir and isVapoursynthAvailable', () => {
    it('resolves plugin directory when python command succeeds', async () => {
      vi.spyOn(utils, 'execFile').mockResolvedValue({
        stdout: '/usr/lib/vapoursynth\n',
        stderr: '',
      });

      const dir = await resolvePluginDir('/usr/bin/python');
      expect(dir).toBe('/usr/lib/vapoursynth');
    });

    it('returns undefined when plugin directory resolution fails', async () => {
      vi.spyOn(utils, 'execFile').mockRejectedValue(new Error('command failed'));

      const dir = await resolvePluginDir('/usr/bin/python');
      expect(dir).toBeUndefined();
    });

    it('checks VapourSynth availability via python -c import vapoursynth', async () => {
      const execSpy = vi.spyOn(utils, 'execFile').mockResolvedValue({
        stdout: '',
        stderr: '',
      });

      const available = await isVapoursynthAvailable('/usr/bin/python');
      expect(available).toBe(true);
      expect(execSpy).toHaveBeenCalledWith('/usr/bin/python', ['-c', 'import vapoursynth']);

      execSpy.mockRejectedValue(new Error('ModuleNotFoundError'));
      const notAvailable = await isVapoursynthAvailable('/usr/bin/python');
      expect(notAvailable).toBe(false);
    });
  });
});
