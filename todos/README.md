# Todos

A browser-facing shared todo list with add, edit, complete/reopen, filter, and
delete actions. Todos live in a SQLite-backed Durable Object named `shared-list`;
the browser is not the source of truth. Reads do not mutate data.

This is a small example, **not a multi-tenant task service**: everyone authorized
to access the app sees and can edit the same list. There are no application
accounts, per-user authorization, or notifications. Configure authentication and
data backups through your hosting environment before storing sensitive data.

The root serves HTML; `/app.js` serves its browser code. No external fonts, CDNs,
or analytics are loaded. Todo text is rendered as text, not HTML. Titles are
limited to 240 characters, JSON request bodies to 4 KiB, and the list to 1,000 tasks.

## Setup

Use Node.js 22.13+ (with built-in `node:sqlite`) for tests:

```sh
# From the applet-one/examples repository root:
cd todos
npm ci
```

Worker configuration, Durable Object binding, and migration history are in
`wrangler.jsonc`. Use your hosting environment's Worker deployment workflow;
preserve the app identity, binding, and migration history when redeploying to
retain existing data.

## Automated tests

```sh
npm test                     # Real SQLite: CRUD, validation, limits, read-only GETs, reopen persistence
npx playwright install chromium
npm run test:browser          # Browser UI against a loopback-only test adapter
```

The browser test covers add/edit/complete/delete, filters, reload, mobile layout,
HTML-injection-safe rendering, and failed-save feedback. Its local adapter uses
Node SQLite, not a production Worker runtime. Run the same test against a deployed
app to verify runtime compatibility.

## Verify a deployed app

Set `TODO_BASE_URL` to an origin that the test runner is authorized to access:

```sh
export TODO_BASE_URL=http://127.0.0.1:18789 # Example: a private tunnel to your deployment
npm run test:browser                      # Real browser workflow against this origin
npm run verify                            # HTML + SQL read health + API CRUD/readback/cleanup
```

Use your hosting environment's supported authenticated access or a private tunnel;
do not make the app public just to run tests. These scripts do not configure
hosting authentication. A login redirect/page is not an application response.
If you test through a tunnel, also check the real public URL in an authorized
browser to verify external access.

Both tests mutate only their own uniquely identified verification tasks and
remove them after success. They never clear the shared list. A failed/interrupted
run may leave a task prefixed `verification:`; inspect it before removing it.

### Verify persistence across an app restart

```sh
npm run verify -- --keep
# Record RESTART_TEST_ID from the output.
# Restart ONLY this app using your hosting environment's operator workflow.
npm run verify -- --resume RESTART_TEST_ID
```

The first command creates, edits, and completes a unique task. The final command
verifies its ID/title/completed state survived the restart and then deletes only
that task. A graceful app restart is **not** proof of cold storage recovery,
backup restoration, or survival of losing the host. Do not delete caches or
storage on a shared host to simulate failure.

## HTTP API

All API responses use `Cache-Control: no-store`. There is no CORS opt-in.
JSON mutations require `Content-Type: application/json`; cross-site browser
mutations are rejected. Use hosting authentication, not these checks, as the
access-control boundary.

| Method | Path | Request / result |
| --- | --- | --- |
| GET | `/api/todos` | `{ "todos": [...] }`; each todo contains `id`, `title`, `completed`, and `created_at` |
| POST | `/api/todos` | `{ "title": "Buy milk" }` → HTTP 201, `{ "todo": ... }` |
| PATCH | `/api/todos/ID` | `{ "title": "Buy oat milk", "completed": true }`; either field may be omitted → `{ "todo": ... }` |
| DELETE | `/api/todos/ID` | `{ "deleted": "ID" }`; no body required |
| GET | `/api/health` | `{ "ok": true, "storage": "sqlite", "todo_count": 3 }` after a database read |

`created_at` is Unix time in milliseconds. Errors have `{ "error": "..." }` with
HTTP 400 for invalid input, 404 for unknown tasks/routes, 405 for unsupported
methods, and 409 if the task limit is reached. Database/runtime failures may
produce HTTP 5xx; do not interpret those as a healthy application.

## Read health versus functional verification

- `GET /api/health` is an app-owned, read-only SQLite check. It does not prove
  writes, persistence, or browser workflows.
- `npm run verify` and the browser tests are explicit, state-changing functional
  verification. They are not automatically scheduled probes.
- Hosting availability checks are separate from these application checks. A
  healthy process or proxy is not proof that this app's workflows function.
