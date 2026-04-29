import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    viewport: { width: 1366, height: 768 },
    launchOptions: {
      slowMo: 0, // 👈 1000ms = 1 second delay between actions
    },
    timeout: 240000,
    browserName: 'chromium',
    channel: 'chrome', // 👈 uses installed Chrome
    headless: false,
  },
});