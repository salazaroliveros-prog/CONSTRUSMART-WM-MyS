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
    executablePath: 'C:\\Users\\wilso\\AppData\\Local\\ms-playwright\\chromium-1228\\chrome-win64\\chrome.exe',
  },
  webServer: {
    command: 'npm run dev -- --port 8080',
    port: 8080,
    reuseExistingServer: true,
  },
});
