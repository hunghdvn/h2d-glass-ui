import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/visual',
  testMatch: '*.visual.ts',
  snapshotPathTemplate: '{testDir}/__screenshots__/{arg}{ext}',
  fullyParallel: true,
  reporter: [['list'], ['html', { open: 'never' }]],
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: 'disabled' } },
  use: { ...devices['Desktop Chrome'], baseURL: 'http://127.0.0.1:6007' },
  projects: [{ name: 'chromium' }],
  webServer: {
    command: 'node scripts/serve-static.mjs storybook-static 6007',
    url: 'http://127.0.0.1:6007/index.json',
    reuseExistingServer: !process.env.CI,
  },
});
