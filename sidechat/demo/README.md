# Reproduce the Sidechat recording

The approved five-scene story and exact English captions are in [storyboard.md](storyboard.md). [from-team-updates-to-done.demo.ts](from-team-updates-to-done.demo.ts) records channel browsing → team update → pinned note → shared task and completion → reload and restored content. It ends with **“Deploy your own app today at applet.one”**, a text-only card with no navigation or deployment.

Reviewed matching pair from one raw WebM:

- [GIF](demo.gif): 720×450, 5 fps, 66.2 seconds, 7,170,078 bytes / 6.8 MiB.
- [MP4](demo.mp4): H.264, 1280×800, 30 fps, 66.2 seconds, 2,913,337 bytes / 2.8 MiB.

Large full-screen English explanations fade out before actions; there is no audio. Disclosure: **Local demo · fictional team · sample data**. The main app README only embeds the GIF. Prefer MP4 for website playback with a poster, controls and reduced-motion support.

## Setup and run

Prerequisites: Node.js ≥22.12, pnpm, the Applet CLI on `PATH`, system `ffmpeg`, and free local port **8794**. From the `examples/` repository root:

```sh
# Build the repository-vendored engine before installing its local file dependency.
cd tools/screen-recording/vendor/demotale
npm ci --ignore-scripts
npm run build
cd ../../../../sidechat
pnpm install --force --ignore-scripts
./node_modules/.bin/playwright install chromium
node --check src/index.js
node --check demo/snapshot.mjs
./node_modules/.bin/demotale check
# Review demo/output/take/check/ before filming.
./node_modules/.bin/demotale record
```

The force install refreshes the copied local recorder after engine edits. Direct `@playwright/test` is pinned to 1.62.1, matching the engine's installed test runner.

[snapshot.mjs](snapshot.mjs) copies only `src`, `scripts`, `applet.jsonc` and `package.json` into fresh ignored `demo/output/applet-*` and symlinks `node_modules`. Each check/capture runs `pnpm build` there to regenerate `src/page.js` from `src/page.html`, then `applet dev --host 127.0.0.1 --port 8794` in that same copy. This leaves the normal generated module, `.wrangler`, `.applet`, Applet configuration and hosted state untouched. The Playwright configuration requires fresh state for checks too: an occupied port is refused rather than reused. Both preparation and recording reject target URL overrides before authentication or mutations. No deployment or reset is performed.

## Local account and data

[workspace.prepare.ts](workspace.prepare.ts) signs in off camera with the app's publicly documented seed account (`demo@demo.de`), verifies the three unchanged channels, two sample messages and two incomplete tasks, then logs out. It refuses edited state; it never calls `/api/reset`. The recording authenticates the same non-admin seed account off camera through the page's request context. No plaintext password, session token or admin dashboard appears in the video. These credentials are used only against the disposable local copy, never a hosted account.

Sidechat sets a `Secure` session cookie. Chromium accepts it on trusted loopback, but Playwright's API client does not automatically send it over HTTP. The scripts therefore use the returned cookie explicitly for **local API verification requests**; the browser keeps the cookie's original attributes. No server authentication or cookie policy is changed. Sessions remain in ephemeral contexts and ignored disposable state, not committed storage files.

All Alex/Sam seed messages and new content are fictional. On camera the demo posts one launch update, replaces the launch channel's pinned note, adds one shared task and completes it. Every mutation has UI and persisted-state assertions. Reload reopens #general by default; the demo explicitly returns to #launch and checks that the message, note and checked task remain, with unchanged persisted content.

Tasks are workspace-wide, not channel-specific. This is a single-account walkthrough, not a demonstration of live collaboration, signup or admin approval. The app's normal ten-second polling remains enabled. Inputs are filled in short bursts to avoid prolonged typing across a poll, which can rerender the form. No application source was modified.

## Checks and review

The latest dry check passed all five scenes and the closing card in 21.2 seconds. Its mixed-origin notice is expected: the opening card starts on `about:blank`, then all app actions stay on `http://127.0.0.1:8794/`, which is asserted at the end. Preparation and capture both passed. Check frames and sampled frames from the actual GIF and MP4 were reviewed for captions, unobstructed actions, results, disclosure and closing card. TypeScript and source/snapshot syntax checks passed; an isolated HTML-module build and `applet build --dry-run` validated the Worker artifact.

The initial check stopped in preparation because the API client omitted the Secure cookie. Explicit local verification headers fixed it before the successful check and capture. If setup fails, the recorder can misleadingly report “no scenario ran”; expose the underlying Playwright error with:

```sh
DEMOTALE_CHECK=1 ./node_modules/.bin/playwright test --config=playwright.config.ts
```

## Outputs and publication

All working files are ignored:

- `demo/output/take/check/`: check report and caption/result/spotlight frames.
- `demo/output/take/raw/`: raw WebM and timeline sidecar.
- `demo/output/take/sidechat-from-team-updates-to-done.{gif,mp4,vtt,md}`: paired exports, subtitles and transcript.
- `demo/output/review/` and `applet-*`: sampled exports and disposable local state.

Review the actual exports before replacing **both** published assets together, from `sidechat/`:

```sh
cp demo/output/take/sidechat-from-team-updates-to-done.gif demo/demo.gif
cp demo/output/take/sidechat-from-team-updates-to-done.mp4 demo/demo.mp4
```

For size changes, adjust `video.gifWidth` / `video.gifFps` in `demotale.config.ts`, then run `./node_modules/.bin/demotale render` to regenerate both formats from the **same raw WebM**, without replaying. Review again before promotion. Never publish a failed or truncated take.

Keep raw WebM for local re-rendering. Do not commit/share the output directory, local sessions, exported state or browser storage. Only remove disposable snapshots after their dev servers have stopped; never clear the app's regular local or hosted state.
