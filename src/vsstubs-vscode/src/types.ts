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

export interface VSStubsCommandOptions {
  args: string[];
  title?: string;
  successMessage?: string;
  errorMessage?: string;
  silent?: boolean;
  skipCheck?: boolean;
}
