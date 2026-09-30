# Rep by Rep — From plan to daily progress

Status: approved by the user before implementation/capture. Source revision: `dbad991105b9b21b9fd5c737ab8310481c0c095b`.

Audience: people exploring a single-user physio routine tracker. Mobile-web presentation: 390×844 phone-sized, touch-enabled Chromium (not a native app or a physical-device recording). Estimated runtime 80–100 seconds; reviewed take: ~74 seconds. Matching GIF: 390×844, 4 fps (10.3 MiB); MP4: 390×844, 30 fps (1.8 MiB). Large fading English full-screen captions (`dark-screen`), no audio.

Title: **Rep by Rep — From plan to daily progress**. Disclosure: **Local demo · fictional entries · not medical advice**.

| Scene | Exact caption | Visible action and verified result |
| --- | --- | --- |
| 1 | Start with an optional example plan. | Add Gentle movement; verify its two exercises and installed state. |
| 2 | Adjust targets and scheduled days to match your own plan. | Edit Shoulder rolls from 6 to 8 reps, add Tuesday, save; verify target and schedule. |
| 3 | Record your reps and how the exercise felt. | Choose a recent Monday; save 8 reps, fictional pain level 2 and “Sample entry: steady pace.” Verify the entry and 1/2 recorded. |
| 4 | Skip an exercise and keep your daily record up to date. | Skip Seated ankle circles; verify its badge, persisted skipped flag and 2/2 recorded. Skipped exercises count as recorded, not performed. |
| 5 | Review your history—even after reloading. | Verify both history entries, reload, reopen History; verify unchanged logs, exercises and installed plan. |

Final card, exact text: **Deploy your own app today at applet.one**. Text only: no external navigation or deployment.

Target: **http://127.0.0.1:8795**. Each check/capture starts `applet dev --host 127.0.0.1 --port 8795` inside a fresh source copy under ignored `demo/output/applet-*`. Existing `.wrangler`, `.applet`, configuration, passphrases and hosted state remain untouched. Passphrase setup/login happen off camera using random disposable credentials; no real health data, backup, archive or destructive reset. Monday is computed in Europe/Berlin so both example exercises are scheduled; no preseeded logs. Example targets and entries are fictional, not treatment recommendations. No application-source changes.

Deliverables: a reviewed matching `demo.gif` / `demo.mp4` pair in this folder, reproducible prepare/scenario/config files and `README.md`; the main app README embeds only the preferred GIF.
