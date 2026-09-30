import { definePlaywrightConfig } from '@pesuto/demotale';
import config from './demotale.config.js';

// Even the dry run must refuse an occupied port and start isolated state.
const playwright = definePlaywrightConfig(config);
playwright.webServer = config.webServer;
playwright.use = { ...playwright.use, actionTimeout: 15_000 };
export default playwright;
