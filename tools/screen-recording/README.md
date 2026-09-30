# Screen recording: where to start

**Pi tool:** `../../.pi/skills/screen-recording/SKILL.md` (the project-local `screen-recording` skill). From this repository's `examples/` root, run Pi, grant project trust if prompted, and enter:

```text
/skill:screen-recording <example-name>
```

For example, `/skill:screen-recording rep-by-rep` **first proposes a storyboard and stops for your approval**. It does not deploy or automatically record on invocation. After modifying the skill in an already-open Pi session, use `/reload`; if project trust is declined, the skill will not load. Start Pi from `examples/`, not an individual example directory. If automatic discovery is unavailable, use `pi --skill .pi/skills/screen-recording` when starting Pi from `examples/`.

**Executable engine:** `vendor/demotale/` is the copied, editable Playwright recorder. The skill uses its checked-in CLI via each app's local `file:` dependency (`<example>/node_modules/.bin/demotale`), never an upstream recorder package. `vendor/pagecast/` is optional source for future zoom effects, not in the current capture path. The skill is orchestration, not a new binary.

**Tested example:** `../../daybreak/demo/README.md` contains actual build/install/check/record commands, isolated data setup, and steps to promote GIF + MP4 to `daybreak/demo/`. `../../daybreak/demo/storyboard.md` and `../../daybreak/demo/*.demo.ts` are the approved human and executable stories. For an existing Daybreak setup, run `cd daybreak && ./node_modules/.bin/demotale check` or `record`; for a new checkout, follow its setup instructions first.

The workflow and future-work status are in `PLAN.md`; copied-code provenance and licenses are in `SOURCES.md`. The skill has been exercised end-to-end on **eventraum**, with an [approved English-captioned story](../../event-raum/demo/storyboard.md), [isolated preparation and rerun instructions](../../event-raum/demo/README.md), and a matching [GIF](../../event-raum/demo/demo.gif) / [MP4](../../event-raum/demo/demo.mp4). Its check passed all five scenes, followed by a successful capture and visual review.

A third completed desktop example is **Learning Trail**: [approved storyboard](../../learning-trail/demo/storyboard.md), [isolated preparation and reproduction instructions](../../learning-trail/demo/README.md), and matching [GIF](../../learning-trail/demo/demo.gif) / [MP4](../../learning-trail/demo/demo.mp4). Its five scenes cover workbook import, snapshot publishing, advancement, adaptive support and saved progress, followed by the approved applet.one closing card. Checks, capture and sampled export-frame review passed.

The fourth completed desktop example is **Sidechat**: [approved storyboard](../../sidechat/demo/storyboard.md), [isolated build/account setup and reproduction instructions](../../sidechat/demo/README.md), and matching [GIF](../../sidechat/demo/demo.gif) / [MP4](../../sidechat/demo/demo.mp4). Its five scenes cover channels, messages, pinned notes, shared tasks and persistence after reload, followed by the approved applet.one closing card. Checks, capture and sampled export-frame review passed.

App-specific isolated fixtures, storyboard and scenario must still be authored before recording another app; mobile-web remains unpiloted.
