/**
 * Pure CLI service layer for vsstubs.
 * Zero VS Code UI dependencies.
 */

import semver from 'semver';
import { logger } from './logging.js';
import { CheckJSONResponse, PluginInfo, SubCommand } from './types.js';
import { execFile, resolvePathVariables } from './utils.js';

export interface CliBuildOptions {
  stubFile: string;
  inputStubFile?: string | undefined;
  extraPluginDirs?: string[] | undefined;
  enableCompatApi3?: boolean | undefined;
  workspaceRoot?: string | undefined;
}

export interface CliExecOptions {
  cwd?: string | undefined;
  signal?: AbortSignal | undefined;
}

export class VsstubsCli {
  /**
   * Construct CLI arguments for `python -m vsstubs`.
   */
  public buildArgs(options: CliBuildOptions): string[] {
    const args = ['-o', options.stubFile];
    if (options.inputStubFile) {
      args.push('-i', options.inputStubFile);
    }

    if (options.extraPluginDirs && options.extraPluginDirs.length > 0) {
      for (const dir of options.extraPluginDirs) {
        const resolved = options.workspaceRoot
          ? resolvePathVariables(dir, options.workspaceRoot)
          : dir;
        args.push('--load', resolved);
      }
    }

    if (options.enableCompatApi3) {
      args.push('--compat');
    }

    return args;
  }

  /**
   * Execute `python -m vsstubs --quiet <args>`.
   */
  public async execute(
    pythonPath: string,
    args: string[],
    options?: CliExecOptions,
  ): Promise<{ stdout: string; stderr: string }> {
    const fullArgs = ['-m', 'vsstubs', '--quiet', ...args];
    logger.info(`Running: ${pythonPath} ${fullArgs.join(' ')}`);

    const result = await execFile(pythonPath, fullArgs, {
      cwd: options?.cwd,
      signal: options?.signal,
    });

    if (result.stdout) logger.info(`Stdout:\n${result.stdout}`);
    if (result.stderr) logger.info(`Stderr:\n${result.stderr}`);

    return result;
  }

  /**
   * Query the version of the `vsstubs` module in the environment.
   */
  public async getVersion(pythonPath: string, cwd?: string): Promise<string | undefined> {
    try {
      const { stdout, stderr } = await this.execute(pythonPath, ['--version'], { cwd });
      const output = (stdout || stderr || '').trim();
      const parsed = semver.coerce(output);
      return parsed ? parsed.version : undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Query available plugins as JSON from either existing stub file or extra load dirs.
   */
  public async queryPlugins(
    pythonPath: string,
    options: {
      stubFile?: string | undefined;
      extraPluginDirs?: string[] | undefined;
      cwd?: string | undefined;
      workspaceRoot?: string | undefined;
      signal?: AbortSignal | undefined;
    },
  ): Promise<PluginInfo[]> {
    const hasExtraDirs = Boolean(options.extraPluginDirs && options.extraPluginDirs.length > 0);
    const args: string[] = [];

    if (hasExtraDirs) {
      for (const dir of options.extraPluginDirs!) {
        const resolved = options.workspaceRoot
          ? resolvePathVariables(dir, options.workspaceRoot)
          : dir;
        args.push('--load', resolved);
      }
    } else if (options.stubFile) {
      args.push('-i', options.stubFile);
    }

    args.push('plugins', '--json');

    const { stdout } = await this.execute(pythonPath, args, {
      cwd: options.cwd,
      signal: options.signal,
    });

    try {
      return JSON.parse(stdout) as PluginInfo[];
    } catch (error) {
      logger.error(
        `Plugins query JSON parse error: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new Error(`Failed to parse plugins JSON: ${String(error)}`);
    }
  }

  /**
   * Run `check --json` against an existing stub file.
   */
  public async check(
    pythonPath: string,
    options: {
      stubFile: string;
      extraPluginDirs?: string[] | undefined;
      enableCompatApi3?: boolean | undefined;
      cwd?: string | undefined;
      workspaceRoot?: string | undefined;
      signal?: AbortSignal | undefined;
    },
  ): Promise<CheckJSONResponse> {
    const baseArgs = this.buildArgs({
      stubFile: options.stubFile,
      inputStubFile: options.stubFile,
      extraPluginDirs: options.extraPluginDirs,
      enableCompatApi3: options.enableCompatApi3,
      workspaceRoot: options.workspaceRoot,
    });

    const args = [...baseArgs, 'check', '--json'];

    const { stdout } = await this.execute(pythonPath, args, {
      cwd: options.cwd,
      signal: options.signal,
    });

    try {
      return JSON.parse(stdout) as CheckJSONResponse;
    } catch (error) {
      logger.error(
        `Stub check JSON parse error: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new Error(`Failed to parse stub check JSON: ${String(error)}`);
    }
  }

  /**
   * Run a subcommand (`add`, `remove`, `update`) against a stub file.
   */
  public async runSubcommand(
    pythonPath: string,
    subcommand: SubCommand,
    options: {
      stubFile: string;
      namespaces?: string[] | undefined;
      extraPluginDirs?: string[] | undefined;
      enableCompatApi3?: boolean | undefined;
      cwd?: string | undefined;
      workspaceRoot?: string | undefined;
      signal?: AbortSignal | undefined;
    },
  ): Promise<{ stdout: string; stderr: string }> {
    const baseArgs = this.buildArgs({
      stubFile: options.stubFile,
      inputStubFile: options.stubFile,
      extraPluginDirs: options.extraPluginDirs,
      enableCompatApi3: options.enableCompatApi3,
      workspaceRoot: options.workspaceRoot,
    });

    const args = [...baseArgs, subcommand, ...(options.namespaces ?? [])];

    return this.execute(pythonPath, args, {
      cwd: options.cwd,
      signal: options.signal,
    });
  }

  /**
   * Run full stub generation.
   */
  public async generate(
    pythonPath: string,
    options: CliBuildOptions & CliExecOptions,
  ): Promise<{ stdout: string; stderr: string }> {
    const args = this.buildArgs(options);
    return this.execute(pythonPath, args, options);
  }
}
