import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],
  format: 'esm',
  platform: 'neutral',
  unbundle: true,
  root: 'src',
  outDir: 'dist',
  dts: true,
  clean: true,
});
