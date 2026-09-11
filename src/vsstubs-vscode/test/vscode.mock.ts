export const window = {
  createTerminal: () => ({
    show: () => {},
    sendText: () => {},
    dispose: () => {},
  }),
  showInformationMessage: async () => undefined,
  showWarningMessage: async () => undefined,
  showErrorMessage: async () => undefined,
  showQuickPick: async () => undefined,
  createOutputChannel: () => ({
    info: () => {},
    warn: () => {},
    error: () => {},
    show: () => {},
    dispose: () => {},
  }),
  createStatusBarItem: () => ({
    text: '',
    tooltip: '',
    command: '',
    show: () => {},
    hide: () => {},
    dispose: () => {},
  }),
};

export const workspace = {
  getConfiguration: () => ({
    get: (_key: string, defaultValue?: unknown) => defaultValue,
    update: async () => {},
  }),
  workspaceFolders: [],
};

export const env = {
  clipboard: {
    writeText: async () => {},
  },
};

export const StatusBarAlignment = {
  Left: 1,
  Right: 2,
};

export const ProgressLocation = {
  Notification: 15,
  Window: 10,
};

export class Disposable {
  constructor(private callOnDispose: () => unknown) {}
  dispose(): unknown {
    return this.callOnDispose();
  }
}
