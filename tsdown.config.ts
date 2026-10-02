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
  inputOptions: {
    // Rolldown warns that bundling may drop "use client". This build is unbundled, every module keeps
    // its own directive, and scripts/check-use-client.ts verifies that, so the warning is noise.
    onLog(level, log, defaultHandler) {
      if (log.code === 'MODULE_LEVEL_DIRECTIVE') return;
      defaultHandler(level, log);
    },
  },
});
