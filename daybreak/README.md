# Daybreak — make time for your people

![Daybreak demo](demo/demo.gif)

An Applet.one Worker app for finding time with friends. Users create accounts, send friend requests by registered email, add one-off availability, view friends’ full free schedules, and request meetings in shared free windows. Acceptance reserves the time for both people. Times use `Europe/Berlin` (CET/CEST).

Worker configuration lives in `wrangler.jsonc`; Applet-only access/backup settings live in `applet.jsonc`. Use Applet CLI **0.4.0 or newer** (`npm install -g @applet-one/cli@latest`); see the shared [configuration guide](../README.md#configuration-and-cli).

## Run locally

```sh
pnpm install
pnpm dev
```

## Deploy

```sh
pnpm run deploy
```

This deploys the existing Daybreak Applet through Applet’s installed builder and workspace-scoped deployment API, without attempting to create another app or synchronize editable app source. It retains the existing app identity, URL, and stored data. The live app is at https://cobaltsparkling-puma.applet.works.

Deployment defaults to the workspace where you are the **personal owner**, regardless of membership order. To target a team, add `"workspace": "your-team-slug"` alongside `access` and `backup` in `applet.jsonc`. The script selects that workspace explicitly and fails if access is missing or removed; it never falls back to another workspace. The app must already exist in the selected workspace. Old `namespace` settings are not supported.

## Manual password reset

There is intentionally **no public or self-service password reset** (the app sends no email). An operator with access to this project and the Applet deployment can reset an existing account:

```sh
pnpm run reset-password user@example.com
pnpm run deploy
```

Enter the new password in the interactive prompt. The command writes a salted password hash and unique one-time reset ID into `src/password-reset.js`; it does not store the plaintext password. **Do not commit that generated file.** Visit the deployed app once after deployment to apply the reset and invalidate all of that user’s sessions. Then restore `src/password-reset.js` to `export const passwordReset = null;` and deploy again. The reset ID prevents repeat application if the Worker runs again before it is removed. Back up state with `applet backup` if needed.

## Verify

Run the local characterization tests with Node.js 22.13+ (for built-in `node:sqlite`):

```sh
pnpm test
```

These tests call `AppletState` directly with an isolated in-memory SQLite database per test. No running server, deployment, or additional test dependencies are required. They cover assets, request validation, authentication, rate limiting, meeting reservation side effects, and deployment workspace selection. This is not a substitute for testing in the Worker runtime.

For an end-to-end smoke test against a running app:

```sh
node scripts/smoke.mjs
BASE_URL=https://cobaltsparkling-puma.applet.works node scripts/smoke.mjs
```

The smoke test creates two temporary accounts and checks friendship permissions, availability overlap, meeting acceptance and reservation, login and logout. Screenshots of the live browser verification are in `screenshots/`.
