const esbuild = require('esbuild');

const watch = process.argv.includes('--watch');

const ctx = {
  entryPoints: ['src/extension.ts'],
  bundle: true,
  outfile: 'out/extension.js',
  external: ['vscode'],
  format: 'cjs',
  platform: 'node',
  minify: !watch,
  sourcemap: true,
};

if (watch) {
  esbuild.context(ctx).then(ctx => ctx.watch());
} else {
  esbuild.build(ctx).catch(() => process.exit(1));
}