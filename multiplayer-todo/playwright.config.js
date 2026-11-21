import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './test/browser',
  workers: 1,
  retries: 0,
  timeout: 30000,
  use: { baseURL: process.env.TEST_URL || 'http://127.0.0.1:8791', trace: 'retain-on-failure' },
});
