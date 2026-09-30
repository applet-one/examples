import { defineConfig } from '@pesuto/demotale';

export default defineConfig({
  baseUrl: 'http://127.0.0.1:8795',
  scenarios: './demo',
  output: './demo/output/take',
  viewport: { width: 390, height: 844 },
  timeout: 180_000,
  webServer: {
    command: 'dir="$(node demo/snapshot.mjs)" && cd "$dir" && exec applet dev --host 127.0.0.1 --port 8795',
    url: 'http://127.0.0.1:8795',
    reuseExistingServer: false,
    timeout: 90_000,
  },
  video: { formats: ['mp4', 'gif'], gifWidth: 390, gifFps: 4 },
  captions: { vtt: true, transcript: true, display: 'dark-screen' },
  theme: { base: 'dark', accent: '#e8be7f' },
});
