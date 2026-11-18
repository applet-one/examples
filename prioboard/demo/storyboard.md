# Prioboard: from evidence to a product decision

Approved in conversation before implementation. Source revision: `6da6932`.
Audience: PMs who built Prioboard and now want to use it to manage their products.

Desktop Chromium, 1440×900. English fading dark-screen explanations before actions, no audio. Approximately 65–80 seconds. Matching MP4 and GIF, with the MP4 preferred for full-resolution viewing.

Opening: **Prioboard** / **Turn customer evidence into product priorities.**
Persistent disclosure: **Local demo · sample product · fictional feedback**.

1. **See your strongest product opportunities in one shared board.** Reveal six populated opportunity cards with scores, evidence counts, teammate avatars, and comments. Assert calculated order.
2. **Go beyond the score. Trace every opportunity back to the evidence.** Expand Guided onboarding, reveal the scorecard, open a supporting quote in the source dialog. Assert exact source and highlighted quote.
3. **Keep the discussion beside the decision—with updates arriving live.** A fictional teammate posts from a second browser session; the recorded page receives it without reloading. Post a short reply; assert both authors and stored comments.
4. **When strategy changes, change the priority—and keep the reason.** Override Customer reporting to #1. Reason: **Prioritize reporting this cycle to unblock three pilot teams.** Assert board order, saved reason, and unchanged calculated score.
5. **Come back to the same priorities, evidence, and conversation.** Reload and assert the pinned priority, reason, and comments remain. Finish with the top opportunity selected.

Closing: **Deploy your own app today at applet.one** (text only, no navigation or deployment).

## Approved setup and mutations

Target: `http://127.0.0.1:8796/`; refuse an occupied port and target overrides. Start through the recording config: `node demo/serve.mjs`, which builds and serves an isolated source copy via the normal local dev script. Do not run against existing app state.

Prepare a fictional English SaaS dataset with six opportunities and short evidence. Seed sample comments and fictional teammate identities off camera. The recorded session selects the built-in Markus Andrezak admin identity off camera. No account switching onscreen. A second browser context posts the live update through the real UI; no fake notifications or injected application state. Off-camera setup uploads one dataset; on-camera actions create two comments and one priority override in disposable local state only.

No app redesign, hosted accounts, deployment, dataset replacement during capture, deletion, or modification of ordinary `.applet` state. Names are the app's trusted-demo identity selector, not verified authentication. Fictional teammate names do not represent real users. This shows browser reload persistence, not server restart or backup recovery.
