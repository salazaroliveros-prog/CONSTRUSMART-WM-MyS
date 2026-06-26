import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: 'http://localhost:8080',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    headless: true,
    chromiumSandbox: false,
  },
  webServer: {
    command: 'npm run dev -- --port 8080',
    port: 8080,
    reuseExistingServer: true,
  },
});
