import { describe, expect, it, vi } from 'vite-plus/test';
import { VsstubsCli } from '../cli.js';
import type { Logger } from '../logging.js';
import * as utils from '../utils.js';

describe('VsstubsCli', () => {
  const cli = new VsstubsCli();

  describe('buildArgs', () => {
    it('constructs basic args with output stub file', () => {
      const args = cli.buildArgs({ stubFile: '/path/to/stub.pyi' });
      expect(args).toEqual(['-o', '/path/to/stub.pyi']);
    });

    it('includes input stub file if provided', () => {
      const args = cli.buildArgs({
        stubFile: '/path/to/stub.pyi',
        inputStubFile: '/path/to/input.pyi',
      });
      expect(args).toEqual(['-o', '/path/to/stub.pyi', '-i', '/path/to/input.pyi']);
    });

    it('includes extra plugin directories with --load', () => {
      const args = cli.buildArgs({
        stubFile: '/path/to/stub.pyi',
        extraPluginDirs: ['/plugins/a', '/plugins/b'],
      });
      expect(args).toEqual([
        '-o',
        '/path/to/stub.pyi',
        '--load',
        '/plugins/a',
        '--load',
        '/plugins/b',
      ]);
    });

    it('resolves ${workspaceFolder} in extra plugin directories', () => {
      const args = cli.buildArgs({
        stubFile: '/workspace/typings/vapoursynth/__init__.pyi',
        extraPluginDirs: ['${workspaceFolder}/plugins'],
        workspaceRoot: '/workspace',
      });
      expect(args).toContain('--load');
      expect(args.some((arg) => arg.includes('/workspace/plugins'))).toBe(true);
    });

    it('appends --compat when enableCompatApi3 is true', () => {
      const args = cli.buildArgs({
        stubFile: '/path/to/stub.pyi',
        enableCompatApi3: true,
      });
      expect(args).toEqual(['-o', '/path/to/stub.pyi', '--compat']);
    });
  });

  describe('logger injection', () => {
    it('logs command execution, stdout, and stderr to injected logger', async () => {
      const mockLogger: Logger = {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        show: vi.fn(),
      };
      const loggingCli = new VsstubsCli(mockLogger);

      vi.spyOn(utils, 'execFile').mockResolvedValue({
        stdout: 'Generated stubs successfully\n',
        stderr: 'Warning: unused plugin\n',
      });

      await loggingCli.execute('python', ['-o', 'out.pyi']);

      expect(mockLogger.info).toHaveBeenCalledWith('Running: python -m vsstubs --quiet -o out.pyi');
      expect(mockLogger.info).toHaveBeenCalledWith('Stdout:\nGenerated stubs successfully\n');
      expect(mockLogger.info).toHaveBeenCalledWith('Stderr:\nWarning: unused plugin\n');
    });
  });

  describe('getVersion', () => {
    it('parses semver version string correctly', async () => {
      const mockCli = new VsstubsCli();
      vi.spyOn(mockCli, 'execute').mockResolvedValue({
        stdout: 'vsstubs 2.3.1\n',
        stderr: '',
      });

      const version = await mockCli.getVersion('python');
      expect(version).toBe('2.3.1');
    });

    it('returns undefined when CLI execution fails', async () => {
      const mockCli = new VsstubsCli();
      vi.spyOn(mockCli, 'execute').mockRejectedValue(new Error('CLI error'));

      const version = await mockCli.getVersion('python');
      expect(version).toBeUndefined();
    });
  });

  describe('queryPlugins JSON parsing', () => {
    it('parses valid plugin JSON', async () => {
      const mockCli = new VsstubsCli();
      vi.spyOn(mockCli, 'execute').mockResolvedValue({
        stdout: JSON.stringify([
          { namespace: 'fmtconv', description: 'Format conversion' },
          { namespace: 'mv', description: 'Motion vectors' },
        ]),
        stderr: '',
      });

      const plugins = await mockCli.queryPlugins('python', {});
      expect(plugins).toHaveLength(2);
      expect(plugins[0]?.namespace).toBe('fmtconv');
      expect(plugins[1]?.namespace).toBe('mv');
    });

    it('throws and logs when output is invalid JSON', async () => {
      const mockLogger: Logger = {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        show: vi.fn(),
      };
      const mockCli = new VsstubsCli(mockLogger);
      vi.spyOn(mockCli, 'execute').mockResolvedValue({
        stdout: 'invalid json output',
        stderr: '',
      });

      await expect(mockCli.queryPlugins('python', {})).rejects.toThrow(
        /Failed to parse plugins JSON/,
      );
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('check JSON parsing', () => {
    it('parses valid check JSON response', async () => {
      const mockCli = new VsstubsCli();
      vi.spyOn(mockCli, 'execute').mockResolvedValue({
        stdout: JSON.stringify({
          old: ['deprec'],
          new: ['fmtconv'],
          modified: ['mv'],
        }),
        stderr: '',
      });

      const result = await mockCli.check('python', {
        stubFile: '/path/to/stub.pyi',
      });

      expect(result.old).toEqual(['deprec']);
      expect(result.new).toEqual(['fmtconv']);
      expect(result.modified).toEqual(['mv']);
    });

    it('throws and logs error when check JSON is malformed', async () => {
      const mockLogger: Logger = {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        show: vi.fn(),
      };
      const mockCli = new VsstubsCli(mockLogger);
      vi.spyOn(mockCli, 'execute').mockResolvedValue({
        stdout: 'not-json',
        stderr: '',
      });

      await expect(mockCli.check('python', { stubFile: '/path/to/stub.pyi' })).rejects.toThrow(
        /Failed to parse stub check JSON/,
      );
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('generate and runSubcommand', () => {
    it('generates stubs with correct flags', async () => {
      const mockCli = new VsstubsCli();
      const execSpy = vi.spyOn(mockCli, 'execute').mockResolvedValue({
        stdout: '',
        stderr: '',
      });

      await mockCli.generate('python', {
        stubFile: '/path/stub.pyi',
        enableCompatApi3: true,
      });

      expect(execSpy).toHaveBeenCalledWith(
        'python',
        ['-o', '/path/stub.pyi', '--compat'],
        expect.objectContaining({ stubFile: '/path/stub.pyi' }),
      );
    });

    it('runs subcommand with namespaces', async () => {
      const mockCli = new VsstubsCli();
      const execSpy = vi.spyOn(mockCli, 'execute').mockResolvedValue({
        stdout: '',
        stderr: '',
      });

      await mockCli.runSubcommand('python', 'add', {
        stubFile: '/path/stub.pyi',
        namespaces: ['fmtconv', 'mv'],
      });

      expect(execSpy).toHaveBeenCalledWith(
        'python',
        ['-o', '/path/stub.pyi', '-i', '/path/stub.pyi', 'add', 'fmtconv', 'mv'],
        expect.any(Object),
      );
    });
  });
});
