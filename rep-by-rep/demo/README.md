# Reproduce the Rep by Rep recording

The [approved storyboard](storyboard.md) and exact English captions are implemented in [from-plan-to-daily-progress.demo.ts](from-plan-to-daily-progress.demo.ts): optional starter plan → edit target/schedule → record reps, fictional pain and note → skip and daily progress → history restored after reload. The text-only closing card is **“Deploy your own app today at applet.one”**; it does not navigate or deploy.

Reviewed matching pair from one raw WebM:

- [GIF](demo.gif): 390×844, 4 fps, 74.0 seconds, **10,750,091 bytes / 10.3 MiB**.
- [MP4](demo.mp4): H.264, 390×844, 30 fps, approximately 74.03 seconds, **1,927,117 bytes / 1.8 MiB**.

Large full-screen English explanations fade out before actions; no audio. Disclosure: **Local demo · fictional entries · not medical advice**. The app README only embeds the preferred GIF. For website playback, prefer MP4 with a poster, controls and reduced-motion support rather than auto-loading the GIF.

## Setup and run

Prerequisites: Node.js ≥22.12, pnpm, Applet CLI on `PATH`, system `ffmpeg`, Chromium and free local port **8795**. From the `examples/` repository root:

```sh
cd tools/screen-recording/vendor/demotale
npm ci --ignore-scripts
npm run build
cd ../../../../rep-by-rep
pnpm install --force --ignore-scripts
./node_modules/.bin/playwright install chromium
node --check src/index.js
node --check demo/snapshot.mjs
./node_modules/.bin/demotale check
# Review demo/output/take/check/ before filming.
./node_modules/.bin/demotale record
```

Force installation refreshes the copied local engine after engine changes. The direct `@playwright/test` dependency is pinned to 1.62.1 to match the vendored engine's installed runner. Do not substitute an upstream recorder package.

[snapshot.mjs](snapshot.mjs) copies only `src`, `applet.jsonc` and `package.json` to fresh ignored `demo/output/applet-*`, links `node_modules`, and starts `applet dev --host 127.0.0.1 --port 8795` in that copy. There is no separate UI build step. Both checks and captures refuse an occupied port rather than reusing a server. Both preparation and scenario assert the approved local URL before authentication or mutations. The normal `.wrangler`, `.applet`, configuration, passphrase and hosted state are untouched. Do not use ordinary `pnpm dev` for recording against existing state; use the recording configurations above.

## Fictional setup and assertions

[space.prepare.ts](space.prepare.ts) refuses a space whose `/api/status` says it is already set up. It creates a random four-character passphrase off camera, verifies empty exercises/logs and three uninstalled example plans, then logs out. It writes only ignored `demo/output/fixtures.json` with disposable credentials and the sample date. The recorded page signs in off camera via its request context, sharing the session cookie with the browser. API mutations include the required local `Origin` header; no authentication policy is weakened. No plaintext passphrase or session token is visible or committed. Four characters remain weak protection: this is not a security claim and no sensitive health data is used.

The sample date is the most recent Monday in **Europe/Berlin**, matching the emulated browser timezone, so both Gentle movement exercises are due. Date strings change on reruns. There are no preseeded history entries. On camera, Shoulder rolls changes from 6 to 8 reps, Tuesday is added to its Monday/Wednesday/Friday schedule, and the sample Monday gets 8 reps, pain 2 and **“Sample entry: steady pace.”** Seated ankle circles is skipped.

Every mutation has UI and stored-state assertions. Daily progress moves from 0/2 to 1/2 to 2/2 **recorded**: a skipped exercise counts as recorded, not performed. History shows one recorded entry and one skipped entry. After reload the UI resets to Today/current date; the scenario explicitly returns to History and verifies unchanged exercises, installed plan and both logs. This is browser reload persistence, not a server-restart or backup/restore demonstration.

The optional exercise plans and all edited targets/entries are examples, not treatment advice. The video does not demonstrate a timer, recording seconds, archiving, passphrase recovery, multiple users or a clinician workflow. No real health notes, external demonstration links, backups, destructive resets or deployments are used. Application source files are unchanged.

## Mobile presentation and review

This is the first phone-sized browser pilot: **390×844**, `isMobile: true`, `hasTouch: true`, Chromium with a mobile user agent and 1× device scale. It is browser emulation, not native iOS/Android, physical-device testing, Safari or a native-keyboard recording. Interactions are scripted browser clicks/typing. [support.ts](support.ts) centers controls/results between the disclosure and fixed bottom navigation, and applies only recorder-overlay CSS to fit the title and a compact disclosure above the tabs. It does not restyle the application. The browser viewport and lack of horizontal overflow are asserted.

The opening title is drawn **after loading the approved local page**, so the app's viewport metadata is already active. On mobile `about:blank`, Chromium initially used a 980px layout viewport and shrank the title in the first take; adding viewport metadata made the check image correct but the second video's title was omitted. Neither draft was published. Loading the local UI before the title fixed the final capture. This is why check screenshots alone are not enough: review the actual opening and closing in both exports.

The latest dry check passed five scenes and the closing card in 24.4 seconds, with frames only from the local origin. Preparation and final capture both passed. GIF/MP4 samples were reviewed across the title, all captions/actions/results, restored history, disclosure and final card; both exports decoded without errors. The first check stopped at an overly exact pain-field label; a semantic combobox prefix selector fixed it without changing the approved action. That failed check and both rejected drafts remain ignored.

All app module and snapshot syntax checks, embedded client syntax, scenario/config TypeScript checks, and isolated `applet build --dry-run` passed. The unchanged vendored engine built, typechecked and passed **233 tests**. Its dependency audit reported two moderate findings in existing Vitest test tooling (`vitest` and `@vitest/mocker`), no high/critical findings; no production app dependencies were added. Updating that tooling is outside this recording change.

## Outputs and publication

Ignored working files:

- `demo/output/fixtures.json`: disposable passphrase and sample date; never share it.
- `demo/output/applet-*`: disposable source copies and local Durable Object/session state.
- `demo/output/take/check/`: report and check frames.
- `demo/output/take/raw/`: final raw WebM and timeline sidecar.
- `demo/output/take/rep-by-rep-from-plan-to-daily-progress.{gif,mp4,vtt,md}`: matching exports, subtitles and transcript.
- `demo/output/review-final/`: samples extracted from the final exports. Other review/draft folders are not publication sources.

GIF experiments used 7, 5 then 4 fps without shrinking the 390px width; re-rendering used the same raw master, not a replay. The final corrected capture directly uses 4 fps. Keep full phone width for legibility; prefer MP4 for smooth motion and smaller transfers.

After successful checks, capture **and actual export review**, replace both published files together, from `rep-by-rep/`:

```sh
cp demo/output/take/rep-by-rep-from-plan-to-daily-progress.gif demo/demo.gif
cp demo/output/take/rep-by-rep-from-plan-to-daily-progress.mp4 demo/demo.mp4
```

Adjust `video.gifWidth` / `video.gifFps` in `demotale.config.ts` and run `./node_modules/.bin/demotale render` to regenerate both formats from the **same raw WebM** without replaying. Review again before promotion; never publish a failed, clipped or truncated take. Keep raw WebM locally for re-rendering, not in git. Keep all credentials, sessions, browser storage, draft videos and generated state ignored. Remove disposable snapshots only after their dev servers have stopped; never clear the user's normal local or hosted state.
