import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: 'http://127.0.0.1:8080',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    headless: true,
    launchOptions: {
      args: ['--no-sandbox'],
    },
  },
  webServer: {
    command: 'npm run dev -- --port 8080',
    url: 'http://127.0.0.1:8080',
    reuseExistingServer: true,
    timeout: 240_000,
  },
});
