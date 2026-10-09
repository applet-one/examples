# Offbeat — Places less ordinary

A map-first directory of unusual places in Germany. One shared interface serves
standalone browsing, a deterministic in-app demo guide, and a standards-based
MCP App inside a compatible assistant host.

## Run and deploy

Node 20+ is required (Node 24 used for this project).

```sh
npm ci
npm run build
npm test
applet dev --host 0.0.0.0 --port 8000
# After testing, when deployment is authorised:
applet build --dry-run
applet deploy
```

`npm run build` inlines Leaflet and the official MCP Apps SDK bridge into the
shared HTML. The Applet builder bundles the Worker; no Wrangler installation or
Cloudflare credentials are needed. Rebuild assets after editing the UI/bridge.

The VM preview runs as `unusual-places.service`. Restart after source changes:
`sudo systemctl restart unusual-places`.

## Features

- Interactive OpenStreetMap/Leaflet map and synchronized photo cards.
- City, straight-line radius, category, outdoors, and text filters.
- Place details, source links, Wikimedia image attribution and licensing.
- Bookmark shortlist and reorderable itinerary; private browser capability ID.
- Deterministic in-app natural-language guide: e.g. “Outdoor places within 100 km
  of Bonn”, “Museums near Cologne”, and “Plan a day trip with lunch”. It is clearly
  labeled, **not an LLM**. Unsupported requests receive an honest explanation.
- MCP Streamable HTTP endpoint `/mcp`, official SDK and MCP Apps UI resource.
- Shared Durable Object SQLite destination database and persistent visitor state.

## Connect the MCP App

Use the deployed site's `/mcp` endpoint in a ChatGPT account that supports custom
apps/developer mode, or another MCP Apps-compatible host. The endpoint is public,
without OAuth; private list state is scoped to an unguessable visitor capability.
Account availability and UI-resource support vary by host. The actual embedded
ChatGPT flow must be verified in the user's account; HTTP protocol tests alone do
not certify host rendering.

Tools:

| Tool | Purpose |
|---|---|
| `search_places` | Search and open the map (`Bonn`, 100 km by default) |
| `get_place` | Source-backed details for one ID |
| `get_shortlist` | Read one private visitor's saved places |
| `update_shortlist` | Replace that visitor's selection |
| `plan_trip` | Calculate a selected-stop itinerary |

UI resource: `ui://offbeat/explore-v1.html`, MIME
`text/html;profile=mcp-app`. Includes standard `_meta.ui.resourceUri` and ChatGPT
compatibility metadata. The browser bridge prefers the official `App` SDK, with
`window.openai` fallback. The selection handoff updates model context and sends a
follow-up message, only reporting success after host acknowledgments.

### Talk/demo flow

1. Standalone: explore Bonn within 100 km. Switch on Outdoors.
2. Bookmark three stops. Open My shortlist and Day trip; reorder the stops.
3. In-app guide: “Show museums within 100 km of Cologne.” The same map updates.
4. Connected ChatGPT: “Find unusual outdoor places within 100 km of Bonn.”
5. In the embedded map, select stops and click **Plan with ChatGPT**.
6. Ask for a day trip with lunch. ChatGPT receives the selected IDs and details.

**“Don’t replace the app with a chat. Bring the app into the conversation.”**

## Data and attribution

`src/data.js` is the curated, checked-in import, seeded/upserted into SQLite.
The app does not rely on live Wikipedia/Wikidata search. Every entry carries
source links, coordinates, Wikimedia file attribution/license, and import
provenance. Editorial descriptions and visit durations are curated estimates,
not copied Wikipedia articles. OpenStreetMap tiles provide geographic context;
there is no bulk OSM POI import in this demo.

To refresh the Wikimedia enrichment:

```sh
node scripts/import-wikimedia.mjs --dry-run
node scripts/import-wikimedia.mjs
# Optional official-site reachability checks:
node scripts/import-wikimedia.mjs --verify-websites --dry-run
npm run build
# Review changes and deploy only with authorization.
```

The importer preserves editorial curation and fails rather than publishing
missing/unverified image metadata. Image credits and original file pages are
shown in the interface. Individual media licences apply; map data is attributed
to OpenStreetMap contributors.

## Privacy and limitations

- A random browser visitor UUID grants access to that visitor's list; no account,
  analytics, or cross-user state enumeration. Keep this capability private. It is
  not a substitute for account-based authentication for sensitive data.
- Public read-only catalogue; shortlist/trip writes require the private ID.
- Map tiles, photos, and fonts are loaded from third-party providers and subject
  to their policies. Source and directions links leave the app.
- Distances are straight-line, **not driving routes**. Durations are approximate.
  No live opening-hours, weather, accessibility, restaurant, or transit checks.
- Itinerary preserves the selected order, not an optimized route. Lunch advice
  identifies an area to search, not a fabricated restaurant recommendation.
- No LLM API credentials, paid API services, or remote code execution.
- Backups are enabled in `applet.jsonc`; `applet backup` may contain visitor state.
  Treat backups as private. `applet delete` is destructive and requires explicit
  confirmation; do not use it to reset local development.

## Project layout

```
src/index.js       Worker router + Durable Object SQLite storage
src/domain.js      Search, haversine distance, itinerary, demo-guide interpreter
src/data.js        Curated destination import and provenance
src/ui.html        Shared responsive standalone/embedded interface
src/bridge.js      Official MCP Apps browser bridge
src/mcp.js         Official MCP server and tools/resource
scripts/build.mjs Inline frontend assets for Applet deployment
scripts/import-wikimedia.mjs Reproducible metadata enrichment
```
