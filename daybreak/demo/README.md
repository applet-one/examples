# Reproduce the Daybreak recording

The preferred assets now show the **Sunrise** redesign: horizontal navigation, warm ivory/coral styling, the peach day agenda, and Friends/Coming up below the calendar. The walkthrough and all five captions are unchanged. Recorder accents use coral, and the opening card is displayed after loading the local app.

The approved five-scene story and exact captions are in `storyboard.md`; `friends.prepare.ts` creates fictional accounts, friendship, and Bob's free slot off camera; `from-free-time-to-plans.demo.ts` films Alice adding time, seeing Bob's slot, requesting a meeting, Bob accepting it, and the resulting booking. `demotale.config.ts` selects a **dark full-screen explanation**: the background dims, large white text fades in, holds for reading, fades out, and only then the browser acts. Published media are kept alongside this README: [GIF](demo.gif) · [MP4](demo.mp4). The original top-banner pair remains at [GIF](demo-banner.gif) · [MP4](demo-banner.mp4) for comparison. The local recorder's code is in `../../tools/screen-recording/vendor/demotale` (not an upstream runtime dependency).

Prerequisites: Node.js ≥22.12, pnpm, the Applet CLI on `PATH`, and system `ffmpeg`. Run from the repository's `examples` directory:

```sh
# First build the checked-in recorder before installing its local file dependency.
cd tools/screen-recording/vendor/demotale
npm ci --ignore-scripts
npm run build
cd ../../../../daybreak
pnpm install --force --ignore-scripts # refresh the local file: copy after recorder edits
./node_modules/.bin/playwright install chromium
# Install system ffmpeg if not already available (e.g. brew install ffmpeg).
./node_modules/.bin/demotale check
./node_modules/.bin/demotale record
```

`demo/snapshot.mjs` copies Daybreak source, `wrangler.jsonc`, `applet.jsonc` and `package.json` into a new disposable directory under `demo/output/`. The Playwright webServer starts `applet dev` there on **127.0.0.1:8791**; this does not use Daybreak's existing `.wrangler` or any hosted state. Ensure nothing else is using that port before running. The date is calculated ~10 days into the future in Berlin time, so the calendar's month/day will change on reruns.

## Outputs and publishing

The check report and frames are under `demo/output/interstitial/check/`. The recording writes a GIF, MP4, VTT, transcript, and raw WebM to `demo/output/interstitial/` (ignored by git). Inspect the check frames **and** final GIF/MP4, verify the five promised results and disclosure, and check that no private data appears. Only then publish the matched pair:

```sh
# Run from daybreak/ after a successful check + record and visual review.
cp demo/output/interstitial/daybreak-from-free-time-to-plans.gif demo/demo.gif
cp demo/output/interstitial/daybreak-from-free-time-to-plans.mp4 demo/demo.mp4
```

The app README embeds `demo/demo.gif` without recording details. For a website use `demo/demo.mp4` with a poster, playback controls and reduced-motion support rather than auto-loading the ~8.7 MiB GIF. The earlier banner pair remains at `demo/demo-banner.gif` and `demo/demo-banner.mp4` (paths from the app root); never overwrite it while experimenting. To try a pale background and black text, set `captions.display` to `light-screen`. To re-record the banner version, select `banner`, choose another `output` directory and promote it to `demo/demo-banner.*` only after review. If the GIF becomes too large, adjust `video.gifFps`/`video.gifWidth` and run `./node_modules/.bin/demotale render` to convert the **same raw recording** again; review the result before replacing either published asset.

## Latest Sunrise capture

Regenerated from source revision `691e9ae` plus the working-tree Sunrise UI changes. `demotale check` passed all five scenes; `demotale record` passed preparation and the scripted walkthrough. Actual GIF and MP4 frames were reviewed across the opening, all captions and feature scenes, both dialogs, the masked account switch, and the final booked slot. Explanations fade before actions; the persistent note discloses **Local demo · fictional accounts**. No real accounts or deployed app were used.

| Published file | Duration | Dimensions / frame rate | Bytes |
| --- | --- | --- | --- |
| `demo.gif` | 52.85 s | 800 × 500 / 7 fps | 9,139,796 |
| `demo.mp4` | 52.93 s | 1280 × 800 / 30 fps | 2,510,021 |

This is a desktop browser recording, not a mobile demo. The smaller GIF is intended for the README; use the MP4 for sharper UI detail. The fixture date is relative to the recording date, so calendar dates vary on reruns. The raw WebM, VTT, transcript, check frames, and sampled export review frames remain under ignored `demo/output/`.

To rerender the same raw take after tuning GIF settings:

```sh
# Run from daybreak/; does not repeat the browser walkthrough.
./node_modules/.bin/demotale render
```

Review the new exports and repeat the promotion commands above before publishing them.

`demo/output/fixtures.json` holds disposable demo login credentials: never commit or share this directory. Old snapshots under `demo/output/applet-*` may be removed **only after their dev servers have stopped**; do not clear Daybreak's regular `.wrangler` data. The raw WebM is a local working master, not a committed doc asset. This recorder cannot merge captures from two browser contexts, so the account switch is filmed as an ordinary logout/sign-in in one page. Password text is masked in the UI.
