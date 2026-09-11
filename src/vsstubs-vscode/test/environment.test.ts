import { afterEach, describe, expect, it, vi } from 'vitest';
import { VsstubsCli } from '../src/cli.js';
import { EnvironmentManager } from '../src/environment.js';
import * as utils from '../src/utils.js';

describe('EnvironmentManager', () => {
  const cli = new VsstubsCli();
  const env = new EnvironmentManager(cli);

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
});
