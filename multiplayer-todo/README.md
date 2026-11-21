# Multiplayer Todo · Together

A styled, responsive shared todo workspace on Applet storage. One list, one admin, and personal URL-token invitations. No external database, identity provider, fonts, or frontend CDN.

## Features

- **First-person setup:** enter your name to claim the workspace and receive a private admin link. Concurrent setup requests can only create one admin.
- **Named collaborators:** the admin sees people and their personal links at the top of the People & invites dialog, with the invite form below. Links remain available after reload. Collaborators see only their own link and cannot manage invitations or revoke access.
- **Shared tasks:** everyone can create, rename, complete, reopen, assign, and delete any task. Tasks support multiple assignees.
- **Comments:** timestamped conversations attributed to the authenticated person, not a name supplied by the client. Comments retain their author's name after access is revoked.
- **Live together:** hibernatable WebSockets push updates to all active browsers. Reconnection reloads the current state; revocation disconnects that person and rejects further reads and writes.
- **Focused views:** all tasks, assigned to me, completed, status filters, and search. A quiet, task-first desktop/mobile layout with short functional copy and local comment-draft preservation during live updates.

## Run locally

Use Node.js 20+ and Applet CLI **0.4.6 or newer**:

```sh
npm install -g @applet-one/cli
cd multiplayer-todo
npm install
npm run dev
```

Open the URL printed by the CLI (normally `http://127.0.0.1:8787`). The first visitor sees name-based onboarding. **Save the private admin link** shown after setup. Click your profile/avatar to open **People & invites** and create named collaborator links, such as:

```text
https://your-applet.example/?token=<personal-token>
```

Opening the bare URL after setup shows an invite-required screen; it never grants a new admin role. Local state persists under `.applet/dev/`. The build embeds the HTML, CSS, and JavaScript into Worker assets; run `npm run build` and restart local dev after editing the UI.

## Deploy

```sh
npm run deploy
```

`wrangler.jsonc` configures a SQLite-backed `AppletState` Durable Object. `applet.jsonc` keeps the shell publicly reachable so invitation recipients can open it; **all workspace data and mutations require an active personal token**. Applet backup targets `APPLET_STATE`, object `default`.

Deployments retain workspace data when the app name, Durable Object binding, class, migration history, and object name stay unchanged. No setup users or demo tasks are seeded.

## Link security and recovery

- A personal link is a **bearer credential**, not proof of a person's identity. Anyone holding it can act under its associated name. The admin link grants full administration.
- Store the admin link in a password manager. There is no email/password recovery or second admin. Losing it requires operator-level recovery or deliberately starting a new workspace.
- Invite links are generated with cryptographic randomness and authenticated using SHA-256 hashes. Collaborator tokens are also retained in workspace storage so the admin can view/copy their links later; they are returned only in authenticated admin snapshots, never in collaborator HTTP responses or live updates. Protect workspace backups as credentials. The admin token itself is not persisted in recoverable form.
- Tokens stay in the address bar as requested, so browser history, copied URLs, screenshots, and infrastructure request logs may contain them. Do not share the admin URL, embed third-party content, or enable URL-logging analytics. The app sends `Referrer-Policy: no-referrer` and `Cache-Control: no-store`.
- Revoking a collaborator disables their link, closes their live sockets, and removes their task assignments. Their historical comments remain. The admin can use **Generate invite** on a revoked person's row to restore access with a new link, preserving their identity and comments without reactivating old links or restoring removed assignments. Revocation cannot retract data someone already viewed or copied.
- The first successful setup request wins. Claim a new deployment promptly, before distributing its URL.
- The app validates body sizes and fields, attributes comments on the server, escapes displayed text, rejects cross-origin mutations, and never sends token hashes in snapshots. This example does not include abuse rate limiting, token expiry, or admin-token rotation.

## Verification

```sh
npm install
npx playwright install chromium
npm run verify
```

The verification script builds the assets and starts disposable local Workers with isolated temporary storage. It runs:

1. Model tests for permissions, attribution, revocation, assignees, and validation.
2. Real Worker API tests for concurrent first-user setup, authentication, invitation permissions, WebSocket updates and disconnection, cross-origin rejection, and malformed JSON.
3. Two-browser Playwright coverage for onboarding, invitation links, shared assignments/comments, live completion, preserved comment drafts, revocation, admin reload, and a 390px mobile layout with no horizontal overflow.

Desktop/mobile screenshots and failure traces are written under `test-results/`. Verification does not claim or erase your development workspace. Port `8792` must be free; set `TEST_PORT` to use another port.

`npm test` alone runs model tests (the API test skips unless `TEST_URL` is set). `TEST_URL=http://127.0.0.1:8791 npm run test:browser` can target a manually started **fresh disposable** development workspace. Both integration suites claim the workspace and write test data, so do not point them at a real deployment.

## Implementation

- `client/` — dependency-free browser UI, styling, and token onboarding.
- `src/index.js` — static assets, HTTP API, hashed-token authentication, SQLite persistence, and hibernatable WebSockets.
- `src/model.js` — task/member validation and permission rules.
- `scripts/build.mjs` — embeds browser files in `generated/assets.js`.

One SQLite row stores the workspace document. Writes are synchronous and atomic within the Durable Object; asynchronous token hashing happens before state is reloaded and modified. A monotonically increasing version prevents an older HTTP response from replacing a newer live update. This intentionally simple full-snapshot design is for small teams, not large project-management datasets. The example caps active people at 100, tasks at 1,000, and comments per task at 300.
