import { definePlaywrightConfig } from "@pesuto/demotale";
import config from "./demotale.config.js";
const playwright = definePlaywrightConfig(config);
// Even checks must refuse unrelated servers and start with fresh state.
playwright.webServer = config.webServer;
playwright.use = { ...playwright.use, actionTimeout: 15_000 };
export default playwright;
