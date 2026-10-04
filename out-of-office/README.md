# OOOh! · Out of Office

**Out of Office. In good hands.**

A small, team-built absence planner that demonstrates Applet in a corporate setting: someone spots everyday friction, vibe-codes a focused tool, and gives their teammates a real, persistent application.

The fictional **Northstar** team can publish time off without approvals, see shared availability, assign cover, and leave handover notes. There are no calendar, HR, or chat integrations; the Applet story panel labels these as future ideas only.

## What works

- Team overview with today's availability and upcoming absences.
- Two-week planner with week navigation, department filters, and teammate search.
- Vacation, personal days, and sick leave; inclusive dates, weekdays counted, weekends excluded.
- Create, edit, and remove absences, with confirmation before removal.
- Cover assignments, handover notes, readiness, and “covering for others” views.
- Server-side validation for overlapping absences, unavailable cover, and existing cover commitments.
- Fictional profile switching to explore different perspectives.
- Shared persistence in an Applet-managed SQLite Durable Object, surviving refreshes and deploys.
- Optimistic version checks to prevent stale edits and deletions; background refresh every 30 seconds while no dialog is open.
- Responsive layouts, keyboard-accessible native dialogs, empty/error states, and reduced-motion support.

## Public-demo boundaries

This is an **intentionally public, editable demo**, not a production HR system. All eight teammates and the seeded absences are fictional. “Viewing as” is a demo selector, not authentication: visitors can edit all fictional absences. Changes are shared with everyone visiting the deployment.

**Do not enter real personal, health, or company information.** For a real corporate rollout, add authenticated identities, authorization, organization isolation, audit trails, retention policies, and appropriate privacy controls. Applet's private-access option alone does not implement team roles inside the application.

The demo counts Monday–Friday working days in UTC, not public holidays or regional work schedules. Absences are full-day only. A range can cover up to 91 calendar days, within the past year or next two years. Initial sample dates are relative to the first launch and are seeded only once; existing data is never automatically reset. The shared demo is limited to 250 absences.

## Run locally

With Applet CLI 0.2.3 or newer installed (see the shared [configuration guide](../README.md#configuration-and-cli)):

```sh
pnpm dev
# Or choose an explicit port:
applet dev --port 8791
```

The application has no external runtime dependencies, framework, or third-party asset requests. The display name is **OOOh!**; the Applet project remains `out-of-office` so redeploys keep the existing URL and shared data. Applet uses Miniflare/workerd locally. Restart the dev command after source changes.

## Validate and test

```sh
pnpm build  # applet build --dry-run
pnpm test   # node --test
```

Tests require Node.js 22.13+ with `node:sqlite`. They exercise the actual Durable Object handler against in-memory SQLite: initialization, persistence, CRUD, stale writes, validation, request security, and static response headers.

## Deploy with Applet

```sh
applet deploy
```

`wrangler.jsonc` declares the Worker and SQLite Durable Object binding/migration. `applet.jsonc` holds top-level `access` and `backup` settings. No Wrangler installation or separate Cloudflare setup is needed for Applet deployment.

**Live demo:** https://gentlesleepy-meerkat.applet.works

Deployed successfully with Applet. No existing applications were deleted or replaced.

**CLI 0.2.2 note:** at the account's app limit, `applet deploy` can incorrectly reject an existing-app redeploy because it attempts app creation first. The rebrand was deployed with a temporary existing-app-only copy of the CLI; the installed CLI was not changed. Updating this app does not require a new app slot or deleting the deployment.

## Back up / restrict access

```sh
applet backup          # Download the shared "default" object's state
applet access private # Restrict the deployment to the signed-in Applet account
```

`applet access` updates the project's access setting; subsequent deploys reapply it. To reopen this fictional demo, run `applet access public --yes`.

## Source

- `src/index.js` — Worker assets, API routing, security headers, persistent SQLite state.
- `src/model.js` — fictional team, date helpers, validation, and initial sample absences.
- `src/page.js` — HTML entry document.
- `src/client.js` — interactive planner and dialogs, served as `/app.js`.
- `src/style.js` — responsive styles and local SVG illustration presentation.
- `test/app.test.js` — dependency-free model, API, and storage tests.
