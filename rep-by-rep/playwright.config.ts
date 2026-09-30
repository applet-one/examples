import { devices } from '@playwright/test';
import { definePlaywrightConfig } from '@pesuto/demotale';
import config from './demotale.config.js';

const playwright = definePlaywrightConfig(config);
// Checks must refuse occupied ports and start disposable state too.
playwright.webServer = config.webServer;
playwright.use = { ...playwright.use, actionTimeout: 15_000 };
playwright.projects = playwright.projects?.map(project => ({
  ...project,
  use: {
    ...project.use,
    browserName: 'chromium',
    userAgent: devices['Pixel 5'].userAgent,
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
    timezoneId: 'Europe/Berlin',
  },
}));
export default playwright;
