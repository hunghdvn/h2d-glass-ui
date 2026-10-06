import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const storybookProject = (theme: 'light' | 'dark') => ({
  extends: true,
  plugins: [storybookTest({ configDir: '.storybook', initialGlobals: { theme } })],
  test: {
    name: `storybook-${theme}`,
    // Overlay stories drive trusted input through Playwright (.storybook/real-input.ts), which only
    // reaches the right story when one test file runs at a time.
    fileParallelism: false,
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [
        { browser: 'chromium' as const },
        { browser: 'firefox' as const },
        { browser: 'webkit' as const },
      ],
    },
  },
});

export default defineConfig({
  test: {
    projects: [
      {
        extends: true,
        plugins: [react()],
        test: {
          name: 'unit',
          environment: 'jsdom',
          include: ['src/**/*.test.{ts,tsx}'],
          setupFiles: ['./vitest.setup.ts'],
          provide: { reactMajor: 19 },
          typecheck: {
            enabled: true,
            include: ['src/**/*.test-d.ts'],
            tsconfig: './tsconfig.json',
          },
        },
      },
      {
        // The bottom of the peer range: the same component tests against React 18.3.
        extends: true,
        plugins: [react()],
        resolve: {
          alias: [
            { find: /^react-dom(\/.*)?$/, replacement: 'react-dom-18$1' },
            { find: /^react(\/.*)?$/, replacement: 'react-18$1' },
            // Its ESM build, so the `react` imports inside go through the aliases above. The CJS
            // `main` would `require()` the root React 19 instead.
            {
              find: /^@testing-library\/react$/,
              replacement: '@testing-library/react/dist/@testing-library/react.esm.js',
            },
          ],
        },
        test: {
          name: 'unit-react18',
          environment: 'jsdom',
          include: ['src/internal/**/*.test.tsx', 'src/components/**/*.test.tsx'],
          setupFiles: ['./vitest.setup.ts'],
          provide: { reactMajor: 18 },
          // Processed by Vite rather than Node, which is what applies the aliases inside it.
          server: { deps: { inline: ['@testing-library/react'] } },
        },
      },
      {
        extends: true,
        test: { name: 'scripts', environment: 'node', include: ['scripts/**/*.test.ts'] },
      },
      storybookProject('light'),
      storybookProject('dark'),
    ],
  },
});
