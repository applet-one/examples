# Reproduce the Learning Trail recording

The approved five-feature story, exact English captions and text-only closing card are in [storyboard.md](storyboard.md). [from-workbook-to-small-wins.demo.ts](from-workbook-to-small-wins.demo.ts) records workbook download/import → routing preview and snapshot publication → correct-answer advancement → alternate explanation and prerequisite return → saved progress after reload. It ends with **“Deploy your own app today at applet.one”**; that card does not navigate or deploy.

Reviewed matching pair:

- [GIF](demo.gif): 720×450, 5 fps, 77.4 s, 10,168,628 bytes / 9.7 MiB.
- [MP4](demo.mp4): 1280×800, 30 fps, ~77.4 s, 4,162,944 bytes / 4.0 MiB.

Both come from one raw WebM. Large full-screen English explanations fade out before actions; there is no spoken audio. Disclosure: **Local demo · sample content · fictional learner**. The main app README only embeds the GIF. Prefer MP4 for website playback with a poster, controls and reduced-motion support.

## Setup and run

Prerequisites: Node.js ≥22.12, pnpm, the Applet CLI on `PATH`, system `ffmpeg`, and a free local port **8793**. From the `examples/` repository root:

```sh
# Build the repository-vendored engine before installing the local file dependency.
cd tools/screen-recording/vendor/demotale
npm ci --ignore-scripts
npm run build
cd ../../../../learning-trail
pnpm install --force --ignore-scripts
./node_modules/.bin/playwright install chromium
node --check src/index.js
node --check demo/snapshot.mjs
./node_modules/.bin/demotale check
# Review demo/output/take/check/ before filming.
./node_modules/.bin/demotale record
```

`pnpm install --force` refreshes the copied local recorder dependency after engine edits. Direct `@playwright/test` is pinned to the engine's installed version (1.62.1), so the fixtures and CLI use the same test runner.

Both check and capture run [snapshot.mjs](snapshot.mjs), copying only `src`, `wrangler.jsonc`, `applet.jsonc` and `package.json` into fresh ignored `demo/output/applet-*` and symlinking `node_modules`. `applet dev --host 127.0.0.1 --port 8793` runs **inside that copy**, with its own Durable Object state. The regular app's `.wrangler`, `.applet`, configuration and hosted state are untouched. `playwright.config.ts` overrides the engine's check-time reuse behavior: an occupied port is refused, not reused. No deployment is performed.

## Data and assertions

[workbook.prepare.ts](workbook.prepare.ts) refuses nonempty app state and verifies that the downloaded starter workbook has Skills, Activities and Checks tabs and successfully round-trips through `/api/import`, without saving state. The on-camera download is then uploaded unchanged through the UI; no Excel editor, content modification or real educator/learner data is implied.

The capture saves four starter skills and one published content snapshot. It checks both the UI confirmation and the persisted snapshot/content equality. A fictional learner answers `1/3`, then enters `1` and `3` on step 2 to demonstrate the alternate explanation and prerequisite return, then answers `1/3` again. UI and stored progress are asserted after each route. Reload must restore step 2 and the same answer history.

Current app limitations (not changed for this recording): one shared progress record, no user accounts or individual published-version assignments, and a static routing preview rather than an interactive preview runner. The app also saves snapshots under `published` but loads the list from `versions`, so the studio's published list is not restored after reload; a later save can overwrite that list. This recording verifies the snapshot before reload and learner progress after reload; it does not claim version-assignment or published-list restoration.

## Review and publish

The final dry check passed all five scenes and the closing card in ~24 seconds. Preparation and capture both passed. Check-frame review caught disclosure overlap with two result messages; centering those messages fixed it before capture. Sampled actual GIF and MP4 frames verified the captions, feature results, resumed activity and final call to action. A disposable `applet build --dry-run` validated the Worker artifact.

Generated output is ignored:

- `demo/output/take/check/`: report and caption/result/spotlight frames.
- `demo/output/take/raw/`: raw WebM and timeline sidecar.
- `demo/output/take/learning-trail-from-workbook-to-small-wins.{gif,mp4,vtt,md}`: matching exports, subtitles and transcript.
- `demo/output/downloads/`, `review/`, `applet-*`: downloaded workbook, sampled export frames and isolated local state.

The initial 800 px / 7 fps GIF was 14.0 MiB. The published 720 px / 5 fps GIF was rendered from the **same raw WebM**, without replaying. To adjust size, change `video.gifWidth` / `video.gifFps` and run from `learning-trail/`:

```sh
./node_modules/.bin/demotale render
```

After passing checks, recording and visual review, replace **both** published files together from `learning-trail/`:

```sh
cp demo/output/take/learning-trail-from-workbook-to-small-wins.gif demo/demo.gif
cp demo/output/take/learning-trail-from-workbook-to-small-wins.mp4 demo/demo.mp4
```

Review the actual exports again after every rerun/render; never promote a failed or truncated take. Keep raw WebM for local re-rendering. Do not commit or share the output directory, including exported progress, workbooks or browser state. Only remove disposable snapshots after their dev servers have stopped; never clear the app's regular local or hosted state.
