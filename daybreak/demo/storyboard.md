# Daybreak — from free time to plans

Approved in conversation. Target: local Daybreak app, desktop web (1280 × 800). Proposed duration: 75–100 seconds; actual preferred Sunrise take: ~53 seconds, five feature scenes. Export: 800 × 500 GIF at 7 fps (~8.7 MiB) and 1280 × 800 MP4 at 30 fps (~2.4 MiB). Original source revision at approval: `5319292` (working tree also had the screen-recording vendor files).

Opening card: **Daybreak — from free time to plans**. Persistent note: **Local demo · fictional accounts**.

1. Alice adds a free evening. Caption: “Alice shares an evening she’s free.” Verify her slot on the selected day.
2. Alice selects Bob. Caption: “Bob’s free time appears alongside hers.” Verify his slot appears in her calendar/day panel.
3. Alice sees their overlapping time and requests a meeting. Caption: “Daybreak finds a time that works for both.” Verify outgoing invitation.
4. Alice logs out and Bob signs in; Bob accepts the invitation. Caption: “Bob accepts the invitation.” Verify the request disappears.
5. Bob opens Meetings and sees the accepted event. Caption: “The plan is booked, and that time is reserved.” Verify booked time in the day panel and upcoming meeting.

Off camera: create two fresh fictional accounts (Alice Morgan and Bob Chen), accept friendship, seed Bob's availability for a day ~10 days ahead, then start with Alice signed in. Alice adds 18:00–20:00 Berlin time; Bob is free 19:00–21:00; their shared window is 19:00–20:00. Use a disposable local Applet working directory, never a deployed app or existing Daybreak Durable Object state. Switch accounts on-camera; the password field is masked.

Keep the original WebM as an ignored working master, and publish matched GIF and MP4 files in `demo/`. Never commit generated account credentials, browser storage, or raw capture files.

## Sunrise refresh — approved in conversation

Source revision at approval: `691e9ae`, plus the working-tree Sunrise changes in `src/style.js`, `src/client.js`, and `src/page.js`. Audience: people discovering Daybreak. Target remains desktop web, 1280 × 800, at `http://127.0.0.1:8791`; proposed runtime 55–75 seconds. Start command: `applet dev --host 127.0.0.1 --port 8791` in a disposable source copy created by `demo/snapshot.mjs`. Never reuse an unrelated server or the app's regular local/hosted state.

Keep the exact five captions, actions, opening title and fictional-account disclosure above. Show the new horizontal navigation, editorial header, wide calendar and peach agenda. In scene 2 select Bob from the lower Friends section; verify his slot in the agenda. Scene 5 verifies the upcoming meeting and finishes on the Sunrise calendar with the booked 19:00–20:00 slot highlighted. Preparation creates disposable Alice/Bob accounts, accepts their friendship and seeds Bob's availability; the on-camera actions add Alice's slot, request a meeting and accept it as Bob. The approved account switch uses a masked password field.

Use centered explanations over a dimmed app, fading out before each interaction, with coral recorder accents. Publish the matching checked and reviewed GIF/MP4 at `demo/demo.gif` and `demo/demo.mp4`; retain the original alternate banner pair unchanged.

## Alternate presentation (requested after the first recording)

Keep all five captions and scenes. Instead of a small subtitle over the ongoing UI, pause **before** each step, dim the full frame, fade in large centered white text, hold it long enough to read, then fade out before the action. Preserve the original banner pair at `demo/demo-banner.gif` / `demo/demo-banner.mp4` for comparison; publish the preferred full-screen version at `demo/demo.gif` / `demo/demo.mp4` (paths from the app root).
