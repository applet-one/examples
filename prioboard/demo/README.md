# Reproduce the Prioboard recording

[MP4](demo.mp4) · [GIF](demo.gif) · [Approved storyboard](storyboard.md)

A desktop walkthrough for PMs who built Prioboard and now want to manage their product priorities: populated opportunity board → scorecard and highlighted customer evidence → genuine live teammate comment and reply → reasoned priority override → restored board and discussion after reload. The closing card is **“Deploy your own app today at applet.one”**; it does not navigate or deploy.

The exact five approved English explanations fade over a dimmed app, then disappear before the actions. There is no audio. Disclosure: **Local demo · sample product · fictional feedback**. All Relay product research, quotes, organizations, and teammates are synthetic. The selected Markus Andrezak identity is the app's built-in demo admin, not a verified login or security demonstration.

## Published pair

Both exports come from the same final raw WebM, captured from source revision `6da6932` plus the recording-only changes in this directory and the app's recording configs/dependencies. No application UI or server logic was changed.

| File       | Duration | Dimensions / frame rate | Bytes      |
| ---------- | -------- | ----------------------- | ---------- |
| `demo.mp4` | 73.20 s  | 1440×900 / 30 fps       | 7,032,814  |
| `demo.gif` | 73.25 s  | 800×500 / 4 fps         | 14,996,840 |

Prefer the MP4 for reading small scorecard/source text and for website playback, with controls, a poster, and reduced-motion support. The main app README embeds the GIF; its ~14.3 MiB transfer is substantially larger than the MP4's ~6.7 MiB. This is desktop Chromium, not a mobile or physical-device recording.

## Prerequisites and commands

Node.js ≥22.13, npm, Applet CLI on `PATH`, system `ffmpeg`, and a free **127.0.0.1:8796**. `pnpm` is used by some sibling examples but Prioboard uses npm and its existing lockfile.

From the examples repository root:

```sh
cd tools/screen-recording/vendor/demotale
npm ci --ignore-scripts
npm run build
cd ../../../../prioboard
npm ci --ignore-scripts
./node_modules/.bin/playwright install chromium
npm test
./node_modules/.bin/demotale check
# Inspect demo/output/take/check/ before filming.
./node_modules/.bin/demotale record
# Inspect both actual exports before publishing.
```

The recorder is a checked-in local `file:` dependency, never fetched from the registry. `.npmrc` sets `install-links=true`: npm must copy this dependency rather than symlink it to the vendor directory, or two physical Playwright runners can be loaded. Both direct Playwright dependencies are pinned to **1.62.1**, matching the recorder's runner. After changing/building the local recorder, run `npm ci --ignore-scripts` again to refresh its installed copy. Do not independently upgrade only one Playwright dependency.

## Isolated setup

`demo/serve.mjs` creates `demo/output/applet-*/prioboard/`, copies only app source/build scripts/configuration, links `node_modules`, and runs the ordinary `npm run dev -- --host 127.0.0.1 --port 8796` inside that copy. The inner directory has a lowercase name because Applet derives its local app name from the directory. Explicit `APPLET_INIT_CWD`, `INIT_CWD`, and `PWD` prevent npm wrappers from selecting the original project. The browser assets are built inside the copy.

`playwright.config.ts` refuses an occupied port even for dry checks. Both preparation and the filmed scenario assert the exact local target before authentication or mutations. The user's ordinary `.applet`, hosted state, selected identity, and bundled `data/` are untouched. No deployment is run.

`fixture.mjs` generates a six-file English dataset and validates it with the app's real dataset/report readers before upload. Its six opportunities score 14, 13, 12, 11, 10, and 9 out of 15. The report run is a fixed fictional snapshot, **2026-11-18**, not an assertion about the current date or live research. File sources use the app's supported interview/document filenames so toolbar counts remain accurate. Report frontmatter is JSON, which is valid YAML accepted by the app's actual parser.

`board.prepare.ts` refuses an already populated database, selects the built-in admin off camera, uploads the fixture, and seeds Ava Morgan, Leo Park, and two comments through normal APIs. It does not weaken authentication or permission checks. No session cookies or credential files are saved for reuse.

The scenario opens a second browser context as Ava, with a real page selecting Customer reporting. During scene 3, this page posts through the normal comment composer; the recorded admin page receives the update through ordinary polling. An assertion confirms the filmed page did not navigate. The filmed admin replies. This is a real cross-session update, not an injected notification or edited video.

Scene 4 pins Customer reporting to #1 with the approved reason. Assertions verify the stored override, the unchanged 12/15 score, and byte-identical dataset files. Scene 5 reloads and verifies the same priority, reason, and both new comments. This proves browser reload persistence, not backup recovery or server-restart persistence. Only the recorded context is exported; the teammate context stays off camera.

## Checks and review

- Final `demotale check`: all five scenes and closing card passed in approximately 21 seconds overall.
- Final `demotale record`: preparation and scripted capture both passed.
- Reviewed dry-check frames and 24 sampled timestamps from **each actual export**, covering title, all explanations, scorecard, highlighted quote, live update, reply, override dialog, reordered board, reload, disclosure, and closing card. Additional full-size frames were inspected for legibility. Explanations clear before interaction; key content is not clipped.
- FFprobe verified duration/dimensions; both entire exports decoded with FFmpeg without errors.
- `npm test`: **17 passed**, zero failed.
- `npm run test:browser`: passed the existing isolated browser integration suite, including collaboration, permissions, priorities, reload/restart persistence, ZIP round-trip, validation, CSP/injection, and mobile layout.
- App dependency audit: zero vulnerabilities reported, including production-only audit. The vendored recorder's separate development-tool audit reported 8 findings (1 moderate, 5 high, 2 critical) in its existing Vitest/Vite tooling chain. These are not application runtime dependencies; updating shared recorder test tooling is outside this demo change.

Initial setup checks stopped before scenarios because of an uppercase temporary app directory suffix, then duplicate Playwright instances caused by npm's default symlink behavior. The lowercase inner project and copied local dependency fixed these issues. The CLI's “no scenario ran” message hides these errors; expose the underlying failure with:

```sh
DEMOTALE_CHECK=1 ./node_modules/.bin/playwright test --config=playwright.config.ts
```

An initial 960px/5fps GIF was ~23.5 MiB. Rendering that raw take at 800px/4fps reduced it; the final capture uses those settings directly. A subsequent fixture-only correction used the app's recognized source filenames without changing the approved story. Only the final matched exports are published.

## Outputs and promotion

All temporary state and media are ignored under `demo/output/`:

- `applet-*/prioboard/`: disposable source/build/runtime state.
- `take/check/`: assertion report and check frames.
- `take/raw/`: final raw WebM and timeline sidecar.
- `take/prioboard-from-evidence-to-a-product-decision.{mp4,gif,vtt,md}`: exports, subtitles, transcript.
- `review-final/`: samples of the final actual exports; earlier review folders are not publication sources.

After successful check, capture, and actual-export review, run from `prioboard/`:

```sh
cp demo/output/take/prioboard-from-evidence-to-a-product-decision.mp4 demo/demo.mp4
cp demo/output/take/prioboard-from-evidence-to-a-product-decision.gif demo/demo.gif
```

To adjust GIF size without repeating the browser walkthrough, change `video.gifWidth` / `video.gifFps` in `demotale.config.ts`, then run `./node_modules/.bin/demotale render`. Review again and promote both formats together. Keep the raw WebM locally for rendering, not in git. Do not share sessions, runtime databases, or the output directory. Remove disposable copies only after their dev servers stop; never clear normal app state.
