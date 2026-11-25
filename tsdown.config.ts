import { defineConfig } from 'tsdown';

export default defineConfig({
  // The DataGrid is not exported from src/index.ts until it is released, so nothing reaches it from the
  // first entry. The second makes the build emit it, and `check:use-client` and the size limit read the
  // result; the package carries those files, which `exports` does not expose. Plan G exports the grid
  // from src/index.ts and removes the second entry.
  // The third entry is temporary: nothing reaches engine/validate.ts until the editing core imports
  // `validateRow`, and `check:use-client` wants a build output for every library source. The task that
  // first imports it removes this entry.
  entry: [
    'src/index.ts',
    'src/components/data-grid/index.ts',
    'src/components/data-grid/engine/validate.ts',
  ],
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
