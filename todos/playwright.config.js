import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './test/browser',
  workers: 1,
  use: { baseURL: process.env.TODO_BASE_URL || 'http://127.0.0.1:8789', browserName: 'chromium' },
  webServer: process.env.TODO_BASE_URL ? undefined : {
    command: 'node test/server.mjs', url: 'http://127.0.0.1:8789', reuseExistingServer: false,
  },
});
