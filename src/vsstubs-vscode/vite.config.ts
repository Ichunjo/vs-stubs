import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite-plus';

import type { OxfmtConfig } from 'oxfmt';
import type { OxlintConfig } from 'oxlint';
import fmt from './.oxfmtrc.json' with { type: 'json' };
import lint from './.oxlintrc.json' with { type: 'json' };

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      vscode: path.resolve(__dirname, 'src/test/vscode.mock.ts'),
    },
  },
  lint: lint as unknown as OxlintConfig,
  fmt: fmt as unknown as OxfmtConfig,
  test: {
    include: ['src/test/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/out/**'],
    coverage: {
      provider: 'v8',
    },
  },
});
