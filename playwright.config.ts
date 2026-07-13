import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: {
    timeout: 20_000,
    toHaveScreenshot: { maxDiffPixelRatio: 0.02, threshold: 0.2 },
    toMatchSnapshot: { maxDiffPixelRatio: 0.02 },
  },
  fullyParallel: false,
  retries: 0,
  snapshotDir: './e2e/__snapshots__',
  use: {
    baseURL: "http://127.0.0.1:8080",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    headless: true,
    viewport: { width: 1280, height: 720 },
    launchOptions: {
      args: ["--no-sandbox", "--disable-gpu"],
    },
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: "npm run dev -- --port 8080",
    url: "http://127.0.0.1:8080",
    reuseExistingServer: true,
    timeout: 240_000,
  },
});
