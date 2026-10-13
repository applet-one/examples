# bonn-tonne

A mobile-first, German-language waste collection planner built as an Applet-hosted Cloudflare Worker with a SQLite Durable Object. No runtime npm dependencies or user accounts.

![Bonn Tonne walkthrough](demo/demo.gif)

## Included

- Real Bonn 2026 data: 2,232 streets, address ranges/parity and explicit house-number exclusions.
- Address setup with a separate choice of bin size/collection frequency for each waste type. Only records with published dates are offered; conflicting plans are not combined.
- Next collection, upcoming list, monthly calendar, historical dates and printable year plan.
- Preferences stored locally; cached schedules and an installable offline app shell.
- Private, persistent calendar subscription feeds, with Apple, Google and Outlook setup instructions. No OAuth and no one-time-import requirement.
- Updating your preferences updates the existing feed; sharing and revocation are supported.
- Source attribution, successful-fetch date, coverage year and privacy information.

## Local development and checks

```sh
pnpm dev                  # Applet/Miniflare development server
pnpm test                 # Node tests; no dependencies required
applet build --dry-run    # Validate deployment artifact
applet deploy             # Deploy through your signed-in Applet account
```

## Source data

Dataset: [Abfallplaner Müllabfuhrtermine 2026](https://opendata.bonn.de/dataset/abfallplaner-m%C3%BCllabfuhrtermine-2026), published by **bonnorange AöR**, via Bonn Open Data, licensed **[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)**.

The source has been filtered, normalized and grouped for personal schedules; dates are not calculated or shifted. Attribution is included in both the UI and calendar feeds. Communal paper containers and underground-container plans are outside this household planner's current scope.

`src/bonn.json` is the bundled last-known-good snapshot. Refresh it before deployment with:

```sh
pnpm data:refresh
# Or import a downloaded file:
node scripts/import-data.js /path/to/ABFUHRTERMINE2026OpenData.csv
```

The deployed Durable Object attempts a source refresh in the background when a data/calendar request arrives and its last successful fetch is more than 24 hours old. Failed refreshes keep the last successful dataset and retry no more than hourly. There is no cron polling without traffic. Successful updates are persisted in SQLite chunks. A streaming-row CSV parser avoids holding the entire parsed source in memory.

## Calendar feeds and privacy

Each subscription gets an unguessable 256-bit URL token and a separate management secret. No login is needed to fetch the ICS feed. Anyone with its URL can access it, so treat it as a secret. Events omit the user's full address. Address and selected source-plan IDs are persisted server-side only when a subscription is created. Revocation deletes that configuration but cannot delete calendars/events already cached by another client.

Events have stable UIDs, UTF-8-safe line folding and all-day dates; no pickup time is invented. Calendar clients control refresh timing, so updates are not guaranteed immediately. Calendar reminder support varies; the app intentionally does not advertise unreliable feed alarms as working notifications.

## Not yet included

- Web Push or email reminders.
- Direct Google/Microsoft OAuth integrations or a native Apple app.
- Multiple-address profiles, English localization or automatic 2027 rollover.

Only 2026 dates are available. The UI communicates this explicitly.

## Main files

- `src/index.js`: Worker routes, persistent feeds and data refresh.
- `src/data.js`: CSV normalization, address matching and schedule generation.
- `src/calendar.js`: RFC 5545 calendar generation.
- `src/ui.js`: Responsive interface and client-side flows.
- `src/pwa.js`: Manifest, icon and offline app shell.
- `tests/planner.test.js`: Data matching and calendar-format tests.

The deployment is public, which is necessary for third-party calendar clients to fetch private-token feeds. Do not switch the whole app to Applet private access if you want calendar subscriptions to remain accessible.
