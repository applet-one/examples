import { defineConfig } from '@pesuto/demotale';

export default defineConfig({
  baseUrl: 'http://127.0.0.1:8794',
  scenarios: './demo',
  output: './demo/output/take',
  viewport: { width: 1280, height: 800 },
  timeout: 180_000,
  webServer: {
    command: 'dir="$(node demo/snapshot.mjs)" && cd "$dir" && pnpm build && exec applet dev --host 127.0.0.1 --port 8794',
    url: 'http://127.0.0.1:8794',
    reuseExistingServer: false,
    timeout: 90_000,
  },
  video: { formats: ['mp4', 'gif'], gifWidth: 720, gifFps: 5 },
  captions: { vtt: true, transcript: true, display: 'dark-screen' },
  theme: { base: 'dark', accent: '#8b9df7' },
});
