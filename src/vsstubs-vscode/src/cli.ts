/**
 * Pure CLI service layer for vsstubs.
 * Zero VS Code UI dependencies.
 */

import semver from 'semver';
import { type Logger } from './logging.js';
import type { CheckJSONResponse, PluginInfo, SubCommand } from './types.js';
import { execFile, resolvePathVariables } from './utils.js';

/** Process execution layer (OS/child_process options). */
export interface CliExecOptions {
  cwd?: string | undefined;
  signal?: AbortSignal | undefined;
}
/** Shared CLI path and workspace resolution options. */
export interface CliCommonOptions {
  workspaceRoot?: string | undefined;
  extraPluginDirs?: string[] | undefined;
}
/** CLI flags targeting a specific stub file. */
export interface CliStubTargetOptions extends CliCommonOptions {
  stubFile: string;
  enableCompatApi3?: boolean | undefined;
}

// Command-Specific Options
/** Pure CLI argument construction options. */
export interface CliBuildOptions extends CliStubTargetOptions {
  inputStubFile?: string | undefined;
}
/** Full stub generation (build args + exec options). */
export type CliGenerateOptions = CliBuildOptions & CliExecOptions;
/** Check operation options. */
export type CliCheckOptions = CliStubTargetOptions & CliExecOptions;
/** Subcommand execution (add, remove, update). */
export interface CliSubCommandOptions extends CliStubTargetOptions, CliExecOptions {
  namespaces?: string[] | undefined;
}
/** Plugin inspection query (stubFile is optional when extraPluginDirs are provided). */
export interface CliQueryOptions extends CliCommonOptions, CliExecOptions {
  stubFile?: string | undefined;
}

const noopLogger: Logger = {
  info: () => {},
  warn: () => {},
  error: () => {},
  show: () => {},
};

export class VsstubsCli {
  constructor(private logger: Logger = noopLogger) {}

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
    this.logger.info(`Running: ${pythonPath} ${fullArgs.join(' ')}`);

    const result = await execFile(pythonPath, fullArgs, {
      cwd: options?.cwd,
      signal: options?.signal,
    });

    if (result.stdout) this.logger.info(`Stdout:\n${result.stdout}`);
    if (result.stderr) this.logger.info(`Stderr:\n${result.stderr}`);

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
  public async queryPlugins(pythonPath: string, options: CliQueryOptions): Promise<PluginInfo[]> {
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
      this.logger.error(
        `Plugins query JSON parse error: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new Error(`Failed to parse plugins JSON: ${String(error)}`);
    }
  }

  /**
   * Run `check --json` against an existing stub file.
   */
  public async check(pythonPath: string, options: CliCheckOptions): Promise<CheckJSONResponse> {
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
      this.logger.error(
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
    options: CliSubCommandOptions,
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
    options: CliGenerateOptions,
  ): Promise<{ stdout: string; stderr: string }> {
    return this.execute(pythonPath, this.buildArgs(options), options);
  }
}
