# Reproduce the eventraum recording

The approved story and English wording are in `storyboard.md`. `registration.prepare.ts` bootstraps a fictional admin and controls the sample events, future dates, early-bird prices and discount off camera. `from-event-to-registration.demo.ts` records discovery → member + companion pricing → discounted registration → self-service lookup → organizer dashboard. Each scene has assertions. English explanations fade in/out over a dimmed screen **before** actions; the application's UI is still German. There is no spoken audio.

Published, reviewed pair: [GIF](demo.gif) (720×450, 5 fps, 67.8 s, 10,104,810 bytes / 9.6 MiB) and [MP4](demo.mp4) (1280×800, 30 fps, ~67.9 s, 4,326,147 bytes / 4.1 MiB). Both come from the same raw WebM. The app README embeds the GIF without recording details; both formats and reproduction instructions live here. Use the MP4 for website playback with a poster, controls and reduced-motion support.

## Setup and run

Prerequisites: Node.js ≥22.12, pnpm, `applet` on PATH, system `ffmpeg`, and a free local port **8792**. From the `examples/` repository root:

```sh
# Build the checked-in engine, not an upstream recorder dependency.
cd tools/screen-recording/vendor/demotale
npm ci --ignore-scripts
npm run build
cd ../../../../event-raum
pnpm install --force --ignore-scripts
./node_modules/.bin/playwright install chromium
pnpm test
./node_modules/.bin/demotale check
# Inspect demo/output/take/check/ before capturing.
./node_modules/.bin/demotale record
```

`pnpm install --force` refreshes the local `file:` recorder dependency after engine edits. The app directly depends on the same Playwright version resolved by the recorder (currently 1.62.1) so the fixtures and CLI share one runner.

Both `check` and `record` start `demo/snapshot.mjs`: it copies app source, UI build files and applet configuration to a fresh `demo/output/applet-*`, shares only `node_modules`, generates a random setup key and builds the UI **inside that copy** before `applet dev --host 127.0.0.1 --port 8792`. Unlike the engine's default check reuse behavior, this app's `playwright.config.ts` explicitly refuses an existing server even for a dry run. The prepare step also refuses an already-initialized admin/database. No deployment command is run; the app's regular `.applet`, `.wrangler`, setup key and database are untouched.

## Fixtures and behavior

Three automatically seeded events are updated with English fictional titles. The first, **Conversations that last**, is ~16 days ahead (dates vary on reruns). Its current early-bird prices are 20 EUR for a member and 30 EUR for a companion. DEMO10 discounts their 50 EUR subtotal by 5 EUR; the server verifies a 45 EUR registration. Alice Morgan and Bob Chen use `example.invalid` addresses and fictional billing/membership details. Required consents are accepted only for this disposable demonstration; optional photo consent is left unchecked.

One two-person registration is submitted on camera. It remains **pending** / **awaiting_payment** throughout: no charge, email, invoice, cancellation, CSV export or payment confirmation is performed. Reference/access-code strings visible on screen are valid only for the disposable local run. The randomly generated admin password is passed to an invisible API login, never entered onscreen. The final frame shows that same registration in the protected organizer list.

## Review and publish

Outputs are under `demo/output/take/`:

- `check/`: check report and scene/caption/result frames;
- `raw/`: raw WebM and timeline sidecar (local working master);
- `eventraum-from-event-to-registration.{gif,mp4,vtt,md}`: matched exports, captions and transcript.

Inspect both actual exports at multiple timestamps, verify English captions fade out before actions, confirm each promised result and the disclosure, and check for private data. To adjust GIF size without replaying:

```sh
# Tune video.gifWidth / video.gifFps in demotale.config.ts, then:
./node_modules/.bin/demotale render
```

The published take uses 720 px / 5 fps (the initial 800 px / 7 fps export was 14.8 MiB). After successful check, capture and visual review, publish **both** files together from `event-raum/`:

```sh
cp demo/output/take/eventraum-from-event-to-registration.gif demo/demo.gif
cp demo/output/take/eventraum-from-event-to-registration.mp4 demo/demo.mp4
```

The initial dry run caught a required-field marker in the access-code label; the fixed selector passed all five scenes, followed by a successful two-test prepare/capture run. Unit tests: 3 passed; `applet build --dry-run` validated the built disposable Worker artifact. On reruns, all checks must pass again; do not publish a failed or truncated recording.

`demo/output/snapshot.json` contains the generated setup key, `fixtures.json` contains the demo admin password, and each snapshot's generated Worker bundle embeds that local setup key. **The whole output directory is ignored: never commit or share it.** Only remove snapshots after their dev servers have stopped; do not delete the app's ordinary state directories. Keep the raw WebM for local re-rendering. The published pair and checked-in scripts/docs are safe to share; their visible participant data are fictional.
