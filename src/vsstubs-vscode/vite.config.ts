import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { type Plugin, defineConfig } from 'vite-plus';

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

function fixVitestVscodeDeprecation(): Plugin {
  return {
    name: 'fix-vitest-vscode-deprecation',
    configResolved(config) {
      const plugin = config.plugins.find((p) => p.name === 'vitest:vscode-extension');
      const vitestApi = plugin?.api?.vitest;
      if (vitestApi?.experimental?.ignoreFsModuleCache !== undefined) {
        vitestApi.ignoreFsModuleCache = vitestApi.experimental.ignoreFsModuleCache;
        delete vitestApi.experimental.ignoreFsModuleCache;
      }
    },
  };
}

export default defineConfig({
  resolve: {
    alias: {
      vscode: path.resolve(__dirname, 'src/test/vscode.mock.ts'),
    },
  },
  plugins: [fixVitestVscodeDeprecation()],
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
