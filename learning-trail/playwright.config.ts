import { definePlaywrightConfig } from '@pesuto/demotale';
import config from './demotale.config.js';

// A check must start fresh state too, never reuse a server on the demo port.
const playwright = definePlaywrightConfig(config);
playwright.webServer = config.webServer;
playwright.use = { ...playwright.use, actionTimeout: 15_000 };
export default playwright;
