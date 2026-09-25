# Clanker Station — implementation plan

## Goal and scope

Build a read-only, remote dashboard for Pi sessions. A small daemon on each machine observes Pi's persisted session files and sends updates to a hosted web dashboard. The dashboard backend issues per-daemon credentials; the daemon receives a WebSocket URL and token and connects outbound. No Pi extension or changes to Pi are required.

**MVP:** list connected machines, projects and sessions; show recent persisted conversation entries, tool calls/results, model, token usage and costs where present; follow new entries as they are saved; inspect previous sessions. Make clear that “connected” means the daemon is connected, **not** that a Pi agent is running or thinking. No remote prompting, command execution, or access to the machine from the dashboard.

**Non-goals for MVP:** token-by-token streaming, reliable process liveness, remote control, synchronized Pi branch selection, full-text search, attachments, and a complete replay of Pi's rendered TUI.

## Architecture

```text
Pi sessions on machine A (~/.pi/agent/sessions/**/*.jsonl)
                 │ read-only file watcher + periodic scan
                 ▼
         clanker-station daemon ── outbound WSS ──┐
                                                  │
Pi sessions on machine B ── daemon ── outbound WSS ┤
                                                  ▼
                                        dashboard backend
                                     auth, ingest, storage, fanout
                                                  │ authenticated HTTPS/WSS
                                                  ▼
                                          browser dashboard
```

The backend, not browser JavaScript, creates daemon tokens. Each daemon has a stable server-assigned ID. The backend accepts only **publish** messages on daemon connections; browsers can subscribe to authorized data but cannot send commands to daemons. Prefer separate WebSocket endpoints for daemon ingest and browser updates so privileges cannot be confused.

This repo contains Applet.one examples. The dashboard can be built as an Applet **if its runtime supports authenticated WebSocket upgrade, long-lived ingest connections, fanout, and sufficient durable storage**. Validate those capabilities before committing to its backend design. If any are unavailable, keep the same web UI and run the ingest/fanout backend on a WebSocket-capable service, with an HTTPS API for the UI. Do not make the daemon depend on Applet-specific APIs.

## Phase 0 — validate constraints and define the MVP

1. Confirm target host for the dashboard, runtime limits (WebSocket upgrade/duration, storage, fanout, auth), expected number of machines/sessions, and retention period. Prototype one daemon→backend connection and one browser subscription, including reconnect.
2. Confirm which session root(s) to watch. Pi defaults to `~/.pi/agent/sessions/--<project-path>--/<timestamp>_<session-id>.jsonl`; allow an explicit list of roots because `PI_CODING_AGENT_DIR`, SDK options, and `sessionDir` may change the location. Do not watch all of `~/.pi/agent`: it can contain `auth.json` and other credentials.
3. Decide data policy before ingest: full session content versus redacted metadata/preview only. MVP proposal: metadata plus text/tool activity with per-daemon configurable content modes (`full`, `redacted`, `metadata-only`), defaulting to **redacted**. Publish the chosen mode in the UI. Set limits on event size, retention, and total stored data.
4. Choose backend storage after the host spike: durable records for users, daemons, sessions, entries and ingest cursors; transient connection state for live fanout. Define a migration/versioning path.

**Exit criterion:** documented hosting decision, connection proof of concept, content policy, and schema limits.

## Phase 1 — daemon: discover, parse, and tail

Suggested layout: `clanker-station/daemon/` (small Node.js/TypeScript process), `clanker-station/web/` (dashboard), `clanker-station/protocol/` (shared versioned schemas and test fixtures). Use a process manager (launchd/systemd) rather than spawning Pi.

1. On startup, recursively enumerate configured session roots; watch directories for new files/directories and periodically rescan to recover missed filesystem notifications. Only consider `.jsonl` session files. Never follow symlinks outside configured roots.
2. Track each file's identity, byte offset, partial UTF-8/line buffer, and most recent server-acknowledged position. Parse only complete newline-terminated JSON records. A trailing partial line waits for completion. Bound line size; reject malformed or oversized records without wedging the watcher.
3. Read the header (`type: "session"`) to obtain session ID, working directory, timestamp and optional parent-session reference. Use a per-installation machine identity and server-assigned daemon ID, not a local path, as the remote namespace. Avoid publishing full local file paths unless explicitly enabled.
4. Normalize the known Pi entry types (`message`, `model_change`, `thinking_level_change`, `usage`, `compaction`, `branch_summary`, `context_edit`, `custom`, `custom_message`, `label`, `session_info`). Preserve `id`, `parentId`, timestamp and ordering. Treat unknown entry types as opaque metadata, not fatal errors; never assume every entry is a conversation message.
5. Distinguish *raw append order* from the active conversation branch: Pi session files form trees using `id`/`parentId`. The MVP may display an activity timeline plus a navigable branch tree. Do **not** label the last appended entry as the active leaf without a reliable signal; filesystem history alone may not identify the current branch after navigation.
6. Handle file truncation, replacement, deletion and session migrations: detect changed file identity or size < offset, re-read from start and deduplicate by `(daemonId, sessionId, entryId)`; avoid carrying an old offset into a replaced file. Track progress per file, not per project directory.
7. Run a bounded backfill on first connection (configurable lookback and max bytes/sessions) before switching to live tailing. Provide a CLI flag for explicit full backfill; avoid unexpectedly uploading years of history.
8. Apply content filtering **before** sending: redact configured patterns, omit images/binary payloads and optionally omit system prompts and raw tool output. Make it clear regex filtering cannot guarantee removal of all secrets; `metadata-only` is the safe option for sensitive installations.

**Exit criterion:** daemon can tail multiple active files, survive partial writes and restarts, discover new projects, and emit normalized events without reading unrelated Pi configuration.

## Phase 2 — enrollment, authentication and transport

1. Authenticated user clicks **Add daemon** in the dashboard. Backend creates a random high-entropy, publish-only token scoped to that user's workspace and one daemon ID; display it **once** with the `wss://…/ingest` URL and setup command. Store only a salted/peppered verifier or token hash server-side. Include revoke and rotate actions.
2. Daemon saves the URL and token in a user-owned `0600` config/secret file (or OS secret store). Never put the token in a query parameter, command-line argument, log line, session file, or browser-accessible storage. Pass it using an `Authorization: Bearer …` header during the TLS-protected WebSocket handshake. Refuse plaintext `ws://` except explicit localhost development.
3. After authentication, server derives the daemon ID and workspace from the token. Client-supplied IDs cannot change tenant ownership. Rate-limit handshakes and messages; bound message size and connection count; validate every incoming record against a versioned schema.
4. Protocol sketch:
   - `hello`: `{v, installationId, capabilities, contentMode}`; server replies with its assigned daemon ID, protocol version and ingest limits.
   - `session`: normalized header/metadata and a stable session key (Pi session ID plus daemon namespace).
   - `entries`: bounded batch with per-record stable identity, file generation and byte-position metadata for local checkpointing.
   - `ack`: highest accepted contiguous batch sequence per daemon connection; include rejected-record diagnostics separately.
   - `heartbeat`: daemon timestamp and counters; server uses heartbeat expiry to mark **daemon offline**.
   - `error`: version mismatch, quota or validation failure with actionable code.
5. Use at-least-once delivery: durable local queue/cursor (small SQLite database or atomic checkpoint + spool); advance the acknowledged position only after backend acknowledgement. Retry with exponential backoff and jitter after disconnect. Backend deduplicates by stable record identity and persists before acknowledging. Do not silently drop events when offline or on quota failure; show backlog/error state locally and in the dashboard. Cap disk use and expose a visible `paused/quota exceeded` state when cap is reached.
6. On connection, resend unacknowledged batches and then continue tailing. On backend reconnect, browser requests an initial snapshot and subscribes with a server event cursor; missed notifications are filled from durable records rather than relying on WebSocket delivery alone.

**Exit criterion:** revoking a daemon token blocks reconnect, duplicates are harmless, and temporary network outages do not lose acknowledged or queued records.

## Phase 3 — backend data model and API

Proposed durable entities (names adaptable to the host):

- `users/workspaces/memberships`: existing dashboard login and authorization.
- `daemons`: ID, owner workspace, display name, token verifier, scopes, created/revoked timestamps, last heartbeat, content mode and reported version.
- `sessions`: `(daemonId, piSessionId)` unique key; project label/cwd policy, created time, name, metadata, last ingested timestamp and entry count.
- `entries`: `(daemonId, piSessionId, entryId)` unique key; type, parent ID, timestamp, source order, sanitized payload and size. Support a separate synthetic key for legacy entries lacking an ID if encountered.
- `ingest_batches/cursors`: deduplication and acknowledgement state. Backfill and reconnect must be idempotent.
- `audit`: enrollment, token rotation/revocation, content-mode changes and denied access (no raw tokens/content).

APIs: enroll/list/rename/revoke daemon; list/filter sessions; fetch paginated entries/tree; get snapshot and server cursor; subscribe to updates. All HTTP and browser WebSocket requests use the dashboard's normal authenticated user session, validate WebSocket `Origin` and enforce workspace authorization on **each** subscription and resource lookup. Implement retention (for example 30 days by default) and deletion of a daemon's stored data. Keep ingestion and browser read authorization separate. Do not expose full unredacted payloads in logs, analytics, or error reports.

For browser fanout, persist first and then notify subscribers. Notifications carry server sequence/cursor plus IDs; browser fetches missing pages after reconnect. Apply per-client backpressure and disconnect slow subscribers instead of buffering unlimited content.

## Phase 4 — dashboard UI

1. **Enrollment:** create daemon, one-time token/setup instructions, connection test, rotate/revoke, show ingestion errors and local backlog reported by daemon. Warn that previously ingested content remains until deleted separately.
2. **Overview:** machines with `connected / disconnected / stalled` (heartbeat-based); projects, recent sessions, last saved entry, ingestion delay and content mode. Do not conflate connection status with agent execution state.
3. **Session view:** chronological activity stream for saved user/assistant/tool events, model/usage/cost where present, expandable sanitized tool output, timestamps, branch indicators/tree and pagination. Highlight that updates appear when Pi writes session entries, not per token.
4. **Usability:** filters for machine/project/date; search session names/metadata initially; responsive layout, empty/loading/offline states, accessibility and explicit redaction indicators. Full-content search only after reviewing privacy and indexing costs.

## Phase 5 — tests and operational readiness

- Unit tests: JSONL chunk boundaries (including multibyte UTF-8), incomplete/invalid lines, unknown types, branching, compaction, context edits, redaction, path handling, cursor resume, duplicate batches and truncation/replacement.
- Integration tests: two simultaneous Pi session files; directory created after daemon start; daemon restart; backend outage and reconnect; replay from last acknowledgement; revoked token; cross-workspace access denial; browser reconnect with missed events.
- End-to-end: run a real Pi session, confirm saved messages/tool activity appear in the UI; check that no `~/.pi/agent/auth.json` data or raw daemon token leaves the host. Test with metadata-only mode and retention deletion.
- Operations: daemon structured logs without content/tokens; health command with watcher count, queue bytes, last ACK and last error; backend metrics for connected daemons, ingest lag, rejected records, quota, storage and WebSocket failures. Document OS service installation, upgrades, backup/retention, and rollback.

## Suggested delivery sequence

1. Hosting/WebSocket feasibility spike and shared protocol draft.
2. Local file tailer + fixture-based tests (no network).
3. Authenticated ingest endpoint, durable dedup/ACK, offline queue.
4. Browser snapshot API, authenticated live subscription, basic dashboard.
5. Security/retention controls, real-Pi end-to-end tests, daemon packaging and operator docs.

**MVP acceptance test:** enroll a daemon, start it with a URL+token, observe new and existing bounded-history Pi sessions in a remote browser, disconnect/reconnect both daemon and browser without missing or duplicating entries, revoke the daemon token, and verify that a different user cannot view its sessions.

## Known limitations / follow-ups

File tailing only observes **persisted** session entries. It cannot reliably report token deltas, current run state, which branch Pi has selected, or remotely control Pi. If those become required, add an optional Pi extension or RPC integration as a separate capability with distinct credentials and explicit permissions. Keep the file-based, read-only path useful on its own.
