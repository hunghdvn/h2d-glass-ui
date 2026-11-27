import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Three entries: the page of the components, `shell.html`, the frame of an application with the
// theme script in its HTML, and `grid.html`, a data grid alone. The first does not change when the
// others do.
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        shell: resolve(import.meta.dirname, 'shell.html'),
        grid: resolve(import.meta.dirname, 'grid.html'),
      },
    },
  },
});
