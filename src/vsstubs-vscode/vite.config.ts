import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite-plus';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const watchMatcherPlugin = () => ({
  name: 'watch-matcher',
  buildStart() {
    console.log('[watch] build started');
  },
  writeBundle() {
    console.log('[watch] build finished');
  },
});

export default defineConfig({
  resolve: {
    alias: {
      vscode: path.resolve(__dirname, 'src/test/vscode.mock.ts'),
    },
  },
  pack: {
    entry: {
      extension: 'src/extension.ts',
    },
    format: 'cjs',
    platform: 'node',
    sourcemap: true,
    deps: {
      neverBundle: ['vscode'],
    },
    plugins: [watchMatcherPlugin()],
  },
  lint: {
    plugins: ['typescript'],
    categories: {
      correctness: 'error',
    },
    env: {
      builtin: true,
      browser: true,
    },
    rules: {
      'prefer-const': 'error',
      'no-var': 'error',
      'prefer-rest-params': 'error',
      'prefer-spread': 'error',
      'sort-imports': [
        'error',
        {
          ignoreDeclarationSort: true,
          ignoreMemberSort: false,
        },
      ],
      'vite-plus/prefer-vite-plus-imports': 'error',
    },
    options: {
      typeAware: true,
      typeCheck: true,
    },
    jsPlugins: [
      {
        name: 'vite-plus',
        specifier: 'vite-plus/oxlint-plugin',
      },
    ],
  },
  fmt: { singleQuote: true, semi: true, trailingComma: 'all', printWidth: 100, tabWidth: 2 },
  test: {
    include: ['src/test/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/out/**'],
    coverage: {
      provider: 'v8',
    },
  },
});
