import * as vscode from 'vscode';

export type SubCommand = 'add' | 'remove' | 'check' | 'update';

export interface CheckJSONResponse {
  old?: string[];
  new?: string[];
  modified?: string[];
}

export interface WorkspaceContext {
  workspaceRoot: string;
  stubFile: string;
  pythonPath: string;
}

export interface PluginInfo {
  namespace: string;
  description: string;
}

export interface PluginPickItem extends vscode.QuickPickItem {
  namespace: string;
}

export interface VSStubsCommandOptions {
  args: string[];
  title?: string | undefined;
  successMessage?: string | undefined;
  errorMessage?: string | undefined;
  silent?: boolean | undefined;
  skipCheck?: boolean | undefined;
  cancellationToken?: vscode.CancellationToken | undefined;
}
