import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./scripts/automation",
  timeout: 300_000, // Timeout extendido para login manual
  expect: { timeout: 60_000 },
  fullyParallel: false,
  retries: 0,
  use: {
    headless: false, // NO headless para que el usuario pueda ver y hacer login manual
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    viewport: null, // Usar viewport completo
  },
  projects: [
    {
      name: 'chrome',
      use: { 
        browserName: 'chromium',
        channel: 'chrome', // Usar Chrome instalado del usuario
        launchOptions: {
          args: [
            "--no-sandbox",
            "--start-maximized"
          ]
        }
      },
    },
  ],
});
