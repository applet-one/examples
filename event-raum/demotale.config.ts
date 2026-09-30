import { defineConfig } from '@pesuto/demotale';

export default defineConfig({
  baseUrl: 'http://127.0.0.1:8792',
  scenarios: './demo',
  output: './demo/output/take',
  viewport: { width: 1280, height: 800 },
  timeout: 180_000,
  webServer: {
    command: 'cd "$(node demo/snapshot.mjs)" && exec applet dev --host 127.0.0.1 --port 8792',
    url: 'http://127.0.0.1:8792',
    reuseExistingServer: false,
    timeout: 120_000,
  },
  video: { formats: ['mp4', 'gif'], gifWidth: 720, gifFps: 5 },
  captions: { vtt: true, transcript: true, display: 'dark-screen' },
  theme: { base: 'dark', accent: '#e9aa86' },
});
