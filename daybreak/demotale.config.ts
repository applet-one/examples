import { defineConfig } from '@pesuto/demotale';

export default defineConfig({
  baseUrl: 'http://127.0.0.1:8791',
  scenarios: './demo',
  output: './demo/output/interstitial',
  viewport: { width: 1280, height: 800 },
  timeout: 180_000,
  webServer: {
    command: 'cd "$(node demo/snapshot.mjs)" && exec applet dev --host 127.0.0.1 --port 8791',
    url: 'http://127.0.0.1:8791',
    reuseExistingServer: false,
    timeout: 90_000,
  },
  video: { formats: ['mp4', 'gif'], gifWidth: 800, gifFps: 7 },
  captions: { vtt: true, transcript: true, display: 'dark-screen' },
  theme: { base: 'dark', accent: '#75a988' },
});
