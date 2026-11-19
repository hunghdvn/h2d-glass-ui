import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Two entries: the page of the components, and `shell.html`, the frame of an application with the
// theme script in its HTML. The first does not change when the second does.
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        shell: resolve(import.meta.dirname, 'shell.html'),
      },
    },
  },
});
