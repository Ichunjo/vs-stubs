import { defineConfig } from 'rolldown';

const watchMatcherPlugin = () => ({
  name: 'watch-matcher',
  buildStart() {
    console.log('[watch] build started');
  },
  writeBundle() {
    console.log('[watch] build finished');
  },
});

export default defineConfig((options) => {
  return {
    input: 'src/extension.ts',
    output: {
      file: 'dist/extension.cjs',
      format: 'cjs',
      sourcemap: !options.minify,
    },
    platform: 'node',
    external: ['vscode'],
    plugins: [watchMatcherPlugin()],
  };
});
