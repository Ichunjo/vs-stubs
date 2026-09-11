import { describe, expect, it, vi } from 'vitest';
import { VsstubsCli } from '../src/cli.js';

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
      expect(plugins[0].namespace).toBe('fmtconv');
      expect(plugins[1].namespace).toBe('mv');
    });

    it('throws when output is invalid JSON', async () => {
      const mockCli = new VsstubsCli();
      vi.spyOn(mockCli, 'execute').mockResolvedValue({
        stdout: 'invalid json output',
        stderr: '',
      });

      await expect(mockCli.queryPlugins('python', {})).rejects.toThrow(
        /Failed to parse plugins JSON/,
      );
    });
  });
});
