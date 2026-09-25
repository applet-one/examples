# Roadmap

## Optional agent run-status reporting

The current file watcher reports **last saved activity**, not whether Pi is running. Daemon connectivity is a separate signal and must never be presented as agent liveness.

Add an opt-in, read-only Pi extension that reports run start/end and a periodic heartbeat to the local Clanker Station daemon. The daemon forwards only session identity, status, timestamps and heartbeat metadata—no prompts, responses, tool output or remote-control capability.

### Dashboard states

- **Working:** a run has started and its heartbeat is fresh.
- **Idle:** the extension reported that the run ended; Pi may still be open.
- **Unknown:** no extension is installed, a heartbeat expired, or state cannot be verified.

Show **daemon connected / offline** independently. After a crash or disconnect, expire stale “working” status to “unknown,” never assume the run finished. Label these states as run status, not token-level thinking or process liveness.

### Implementation steps

1. Validate Pi extension lifecycle hooks and session ID mapping; define a versioned, metadata-only local status protocol.
2. Send extension updates to the local daemon through a user-owned socket or private status file. Do not give the extension dashboard credentials.
3. Forward status updates over a separate, validated publish message; persist the latest state and heartbeat expiry, not a detailed run log.
4. Add opt-in setup instructions and accessible status indicators to the dashboard. Keep the file-based activity map useful without the extension.
5. Test normal start/end, multiple sessions, branch navigation, daemon reconnect, Pi crash, missed end event and heartbeat timeout.

**Acceptance criterion:** the dashboard distinguishes a fresh working run, a reported idle run and unknown status after missed heartbeats, while daemon connectivity and last saved activity remain independent and no session content is transmitted.
