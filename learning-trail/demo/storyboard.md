# Learning Trail — From workbook to small wins

Approved in conversation, including all exact captions and the added closing card. Source revision: `e32d57f49ed2784ace0327f6d34d03b3c62853af`. Audience: educators and families. Desktop web: 1280×800. Proposed duration: 75–95 seconds; reviewed take: ~77.4 seconds. Exports: 720×450 GIF at 5 fps (9.7 MiB), matching 1280×800 MP4 at 30 fps (4.0 MiB). Local target: `http://127.0.0.1:8793`, served by `applet dev --host 127.0.0.1 --port 8793` from a fresh disposable source copy. Large English explanations fade in/out over a dimmed screen before each action. No spoken audio.

Opening card: **Learning Trail — From workbook to small wins**. Persistent disclosure: **Local demo · sample content · fictional learner**.

1. **“Turn an Excel workbook into a ready-to-learn trail.”** Open Educator studio, download the starter workbook, upload that same workbook, and assert successful validation and four saved skills. No Excel editor or offscreen content edits are implied.
2. **“Review the learning routes, then publish a fixed snapshot.”** Show the static routing preview for step 2 (pass → next skill, stuck → alternate, stuck again → prerequisite), publish, and assert snapshot confirmation and a persisted copy of the content.
3. **“Each correct answer opens the next small step.”** Switch to For learners, enter `1/3`, assert positive feedback, then advancement and saved progress at step 2.
4. **“A wrong answer offers another explanation; getting stuck again revisits the basics.”** Enter `1` on step 2; assert alternate explanation and one saved attempt. Enter `3`; assert return to prerequisite step 1 and reset attempt count.
5. **“Pick up where you left off—progress is saved.”** Answer step 1 correctly again, verify step 2 is saved, reload, and assert the same activity and answer history. End the app walkthrough on the resumed step 2.

Closing card (exact text): **Deploy your own app today at applet.one**. Text only: do not navigate to the website or deploy the app.

Off camera: refuse nonempty local app state and validate a template/import round trip. The capture imports starter content, publishes one demo snapshot and saves a fictional learner's answers, all on isolated disposable Durable Object state. No real accounts, learner data, hosted state or existing `.wrangler` / `.applet` directories are used or changed. This app has one shared progress record, not individual learner accounts or selectable published-version assignments.

Publish the reviewed matching pair at `demo/demo.gif` and `demo/demo.mp4` (paths from the app root). Keep raw WebM, downloaded workbooks, local state and review frames in ignored `demo/output/`. The main README embeds only the preferred GIF; reproduction details live in `demo/README.md`.
