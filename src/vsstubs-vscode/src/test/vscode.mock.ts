import { vi } from 'vite-plus/test';

export interface MockUri {
  fsPath: string;
  path: string;
  scheme: string;
  toString: () => string;
}

export const Uri = {
  file: (fsPath: string): MockUri => ({
    fsPath,
    path: fsPath,
    scheme: 'file',
    toString: () => fsPath,
  }),
  parse: (value: string): MockUri => ({
    fsPath: value,
    path: value,
    scheme: 'file',
    toString: () => value,
  }),
};

export class RelativePattern {
  constructor(
    public base: unknown,
    public pattern: string,
  ) {}
}

export class ThemeIcon {
  constructor(public id: string) {}
}

export const window = {
  activeTextEditor: undefined as
    | {
        document: {
          uri: MockUri;
        };
      }
    | undefined,
  createTerminal: vi.fn((name?: string) => ({
    name,
    show: vi.fn(),
    sendText: vi.fn(),
    dispose: vi.fn(),
  })),
  showInformationMessage: vi.fn().mockResolvedValue(undefined),
  showWarningMessage: vi.fn().mockResolvedValue(undefined),
  showErrorMessage: vi.fn().mockResolvedValue(undefined),
  showQuickPick: vi.fn().mockResolvedValue(undefined),
  showWorkspaceFolderPick: vi.fn().mockResolvedValue(undefined),
  withProgress: vi.fn(
    async (_options: unknown, task: (progress: unknown, token: unknown) => unknown) =>
      task(
        { report: vi.fn() },
        { isCancellationRequested: false, onCancellationRequested: vi.fn() },
      ),
  ),
  createOutputChannel: vi.fn((name?: string, _options?: unknown) => ({
    name,
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    show: vi.fn(),
    dispose: vi.fn(),
  })),
  createStatusBarItem: vi.fn((_alignment?: number, _priority?: number) => ({
    text: '',
    tooltip: '',
    command: '',
    show: vi.fn(),
    hide: vi.fn(),
    dispose: vi.fn(),
  })),
};

export interface MockWorkspaceFolder {
  uri: MockUri;
  name: string;
  index: number;
}

export const workspace = {
  workspaceFolders: [] as MockWorkspaceFolder[] | undefined,
  getConfiguration: vi.fn((_section?: string, _scope?: unknown) => ({
    get: vi.fn((_key: string, defaultValue?: unknown) => defaultValue),
    update: vi.fn().mockResolvedValue(undefined),
    has: vi.fn().mockReturnValue(true),
    inspect: vi.fn(),
  })),
  getWorkspaceFolder: vi.fn((uri: { fsPath: string }) => {
    return workspace.workspaceFolders?.find((folder) => uri.fsPath.startsWith(folder.uri.fsPath));
  }),
  createFileSystemWatcher: vi.fn((_pattern?: unknown) => ({
    onDidCreate: vi.fn(),
    onDidChange: vi.fn(),
    onDidDelete: vi.fn(),
    dispose: vi.fn(),
  })),
  onDidChangeConfiguration: vi.fn(),
};

export const commands = {
  registerCommand: vi.fn((_command: string, _callback: (...args: unknown[]) => unknown) => ({
    dispose: vi.fn(),
  })),
  executeCommand: vi.fn().mockResolvedValue(undefined),
};

export const env = {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
    readText: vi.fn().mockResolvedValue(''),
  },
};

export const StatusBarAlignment = {
  Left: 1,
  Right: 2,
};

export const ProgressLocation = {
  Notification: 15,
  Window: 10,
  SourceControl: 1,
};

export const ConfigurationTarget = {
  Global: 1,
  Workspace: 2,
  WorkspaceFolder: 3,
};

export class Disposable {
  constructor(private callOnDispose: () => unknown) {}
  dispose(): unknown {
    return this.callOnDispose();
  }
  static from(...disposables: { dispose(): unknown }[]): Disposable {
    return new Disposable(() => {
      for (const d of disposables) {
        d.dispose();
      }
    });
  }
}

export function setWorkspaceFolders(folders: MockWorkspaceFolder[] | undefined) {
  (workspace as { workspaceFolders: MockWorkspaceFolder[] | undefined }).workspaceFolders = folders;
}

export function setActiveTextEditor(editor: unknown) {
  (window as { activeTextEditor: unknown }).activeTextEditor =
    editor as typeof window.activeTextEditor;
}

export function resetVSCodeMock() {
  vi.clearAllMocks();
  setWorkspaceFolders([]);
  setActiveTextEditor(undefined);
}
