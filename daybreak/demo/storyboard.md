# Daybreak — from free time to plans

Approved in conversation. Target: local Daybreak app, desktop web (1280 × 800). Proposed duration: 75–100 seconds; actual preferred take: ~53 seconds, five feature scenes. Export: 800 × 500 GIF at 7 fps (~7.8 MiB) and 1280 × 800 MP4 at 30 fps (~2.1 MB). Source revision at approval: `5319292` (working tree also had the screen-recording vendor files).

Opening card: **Daybreak — from free time to plans**. Persistent note: **Local demo · fictional accounts**.

1. Alice adds a free evening. Caption: “Alice shares an evening she’s free.” Verify her slot on the selected day.
2. Alice selects Bob. Caption: “Bob’s free time appears alongside hers.” Verify his slot appears in her calendar/day panel.
3. Alice sees their overlapping time and requests a meeting. Caption: “Daybreak finds a time that works for both.” Verify outgoing invitation.
4. Alice logs out and Bob signs in; Bob accepts the invitation. Caption: “Bob accepts the invitation.” Verify the request disappears.
5. Bob opens Meetings and sees the accepted event. Caption: “The plan is booked, and that time is reserved.” Verify booked time in the day panel and upcoming meeting.

Off camera: create two fresh fictional accounts (Alice Morgan and Bob Chen), accept friendship, seed Bob's availability for a day ~10 days ahead, then start with Alice signed in. Alice adds 18:00–20:00 Berlin time; Bob is free 19:00–21:00; their shared window is 19:00–20:00. Use a disposable local Applet working directory, never a deployed app or existing Daybreak Durable Object state. Switch accounts on-camera; the password field is masked.

Keep the original WebM as an ignored working master, and publish matched GIF and MP4 files in docs. Never commit generated account credentials, browser storage, or raw capture files.

## Alternate presentation (requested after the first recording)

Keep all five captions and scenes. Instead of a small subtitle over the ongoing UI, pause **before** each step, dim the full frame, fade in large centered white text, hold it long enough to read, then fade out before the action. Preserve the original banner pair at `docs/demo-banner.gif` / `docs/demo-banner.mp4` for comparison; publish the preferred full-screen version at `docs/demo.gif` / `docs/demo.mp4`.
