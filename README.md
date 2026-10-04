# Applet.one examples

- [Clanker Station](clanker-station/README.md) — a read-only map of saved Pi session activity, with a synthetic showcase.
- [Daybreak](daybreak/README.md) — share free time with friends and book a time that works for both of you.
- [Eventraum](event-raum/README.md) — a responsive event registration pilot with member and guest pricing, companion bookings, and an admin dashboard.
- [Learning Trail](learning-trail/README.md) — an educator-curated learning path with workbook import and saved learner progress.
- [OOOh!](out-of-office/README.md) — a fictional workplace absence planner with self-service time off, shared availability, and handovers.
- [Rep by Rep](rep-by-rep/README.md) — a physio applet for scheduling exercises and tracking reps, time, and how they felt.
- [Sidechat](sidechat/README.md) — team messages, notes, and tasks.

## Configuration and CLI

Use Node.js 20+ and Applet CLI **0.2.3 or newer** (`npm install -g @applet-one/cli`). Run commands from the example's directory.

Each example uses two configuration files:

- `wrangler.jsonc` — Worker name, entry point, compatibility date, Durable Object binding, and migrations.
- `applet.jsonc` — Applet-only hosting settings: `access` (public by default) and `backup`.

Keep existing app names, bindings, and migration history when redeploying to preserve hosted identity and state. `applet deploy` reapplies the local access setting, even after dashboard changes. The configuration split does not move or reset state.

Wrangler is optional. To deploy to your own Cloudflare account, install it separately and run `wrangler deploy` after any example-specific UI build/setup steps. Direct Wrangler deployment does not enforce Applet private access or provide Applet-managed backups; existing Applet state is not transferred.

## Screen recording

Use the [project-local Pi screen-recording skill](tools/screen-recording/README.md) (`/skill:screen-recording <example-name>`) to propose a storyboard for approval, then generate a reproducible local GIF and MP4. Daybreak has a [complete reference recording](daybreak/demo/README.md).
