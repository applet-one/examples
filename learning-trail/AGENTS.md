# Agent and contributor guide

## Project basics

- This is an Applet.one project. Use the `applet` CLI for Applet development and deployment; do not switch hosting platforms or rewrite the hosting configuration without a clear requirement.
- Install dependencies with `pnpm install`. Start local development with `pnpm dev`.
- Main application code is in `src/index.js`; Applet/Worker configuration is in `applet.jsonc`.
- The app uses a SQLite-backed Durable Object (`APPLET_STATE`) for saved content, published snapshots, and learner progress. The Excel template and import route are generated/handled by the Worker using the `xlsx` package.
- Before committing changes, run `node --check src/index.js`. For workbook changes, test downloading the template and uploading it to `/api/import`; the starter workbook should validate successfully.

## Deploy to Applet.one

Deployment requires Node.js 20+, pnpm, installed dependencies, an Applet.one account with access, and an authenticated Applet CLI.

1. From the project root, install dependencies:
   ```sh
   pnpm install
   ```
2. Confirm the target app and authentication before deployment:
   ```sh
   applet status --json
   ```
   Check that the intended app is `learning-trail`. If the CLI reports missing/expired login, run `applet login` and complete authorization in the browser. Never ask for, print, or store the user's credentials. Applet.one access may require signing up and joining the waiting list at https://applet.one before login/deployment is available.
3. Inspect `applet.jsonc` before deploying. Preserve its app name, `src/index.js` entry point, compatibility date, Durable Object binding and SQLite migration, and backup configuration unless a deliberate configuration change is needed.
4. Deploy from this directory:
   ```sh
   applet deploy
   ```
5. Wait for the command to report that deployment is live, then share the URL it prints. If deployment is only queued/processing, report that accurately and check `applet status --json` rather than claiming it is live.

Deployment updates the hosted application and is appropriate only when requested or clearly authorized. Do not run `applet delete` as routine cleanup: it permanently deletes the hosted app and requires explicit confirmation from the user first.

## Safety and data

- Never put secrets, credentials, local browser state, or exported learner data in source control.
- Applet backups may contain application state and learner progress. Treat backup files as sensitive and tell the user where one is saved; do not print its contents unless requested.
- Do not alter or discard Durable Object state/configuration casually; deployment migrations and hosted learner progress must be preserved.
