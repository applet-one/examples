import { defineConfig } from "@pesuto/demotale";
export default defineConfig({
  baseUrl: "http://127.0.0.1:8796",
  scenarios: "./demo",
  output: "./demo/output/take",
  viewport: { width: 1440, height: 900 },
  timeout: 180_000,
  webServer: {
    command: "node demo/serve.mjs",
    url: "http://127.0.0.1:8796",
    reuseExistingServer: false,
    timeout: 90_000,
  },
  video: { formats: ["mp4", "gif"], gifWidth: 800, gifFps: 4 },
  captions: { vtt: true, transcript: true, display: "dark-screen" },
  theme: { base: "dark", accent: "#7183ff" },
});
