import { defineConfig } from '@playwright/test';

export default defineConfig({
  actionTimeout: 60000,
  timeout: 60000,

  // 👇 Stop entire run after first failure
  maxFailures: 1,

  // 👇 Disable retries
  retries: 0,
  workers: 1,

  reporter: [
    ['list'],
    ['html', { open: 'never' }]
  ],

  use: {
    viewport: { width: 1366, height: 768 },
    browserName: 'chromium',
    //channel: 'chrome',
    headless: false,
    launchOptions: {
      slowMo: 0,
      args: ['--disable-blink-features=AutomationControlled']
    },

  trace: 'retain-on-failure',
  screenshot: 'only-on-failure'
  }
});