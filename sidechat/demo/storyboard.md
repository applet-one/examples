# Sidechat — From team updates to done

Approved by the user before implementation and capture. Source revision: `8fdf6b42b0597412b82af1d49e154a83c6369474`.

Audience: small teams coordinating updates and next steps. Desktop browser, 1280×800; proposed runtime 65–85 seconds; reviewed take: 66.2 seconds. GIF: 720×450 at 5 fps (6.8 MiB); matching MP4: 1280×800 at 30 fps (2.8 MiB). Large English dark-screen explanations fade out before actions; no audio. Opening title: **Sidechat — From team updates to done**. Persistent disclosure: **Local demo · fictional team · sample data**.

| Scene | Exact approved caption | Interaction and asserted result |
| --- | --- | --- |
| 1 | Keep each conversation in its own channel. | Browse #general and #launch; verify their different seeded messages. |
| 2 | Post a team update right where it belongs. | Send “Launch preview is ready. Please review the checklist.” in #launch; verify its author, channel and persisted message. |
| 3 | Pin the details your team needs to remember. | Save “Preview Friday. Review the checklist and share feedback in #launch.” as the channel note; verify it is saved. |
| 4 | Keep shared tasks beside the conversation. | Add “Review the launch preview”, then check it off; verify completion. Tasks are workspace-wide, not channel-specific. |
| 5 | Your messages, notes, and completed tasks survive a reload. | Reload, reopen #launch and verify that the message, pinned note and completed task remain, including equality of persisted state. |

Closing card (exact): **Deploy your own app today at applet.one**. Text only; no navigation or deployment. Final feature frame shows the resumed launch conversation alongside its note and shared tasks.

Local target: `http://127.0.0.1:8794/`. Copy source/build inputs into disposable ignored `demo/output/applet-*`, build the HTML module there, then start Applet dev there. Use the local seeded `demo@demo.de` account, authenticated off camera. Seeded Alex/Sam messages and all posted content are fictional. Only local sessions, one message, one channel note and one shared task/completion are changed. No admin account, signup, account switching, reset endpoint, deployment, real accounts or changes to existing local/hosted state. Application source stays unchanged.

Publish reviewed matching assets as `demo/demo.gif` and `demo/demo.mp4`; main README embeds only the GIF. Keep reproduction details in `demo/README.md` and raw video, check frames, browser storage and drafts in ignored output.
