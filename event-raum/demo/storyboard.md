# eventraum — From event to registration

Approved in conversation, including the exact English captions below. Source revision: `5319292` plus the working-tree local recorder and skill. Desktop web: 1280×800; local target: `http://127.0.0.1:8792`. Proposed duration: 70–100 seconds; actual reviewed take: ~68 seconds. Export: 720×450 GIF at 5 fps (9.6 MiB), matching 1280×800 MP4 at 30 fps (4.1 MiB). Large English explanations fade in/out over a dimmed full screen before each action. The application UI remains German; fictional event titles/descriptions are English.

Opening title: **eventraum — From event to registration**. Persistent disclosure: **Local pilot · Fictional data · No online payments**.

1. **“Find an event and see the details at a glance.”** Open the event listing and select Conversations that last; assert route, title, date/location metadata and booking controls.
2. **“Early-bird prices update instantly for members and companions.”** Select member, enter fictional membership number and add a companion. Assert two ticket lines (20 EUR + 30 EUR), Early Bird labels and 50 EUR total.
3. **“A discount code lowers the price before you request a place.”** Fill Alice Morgan/Bob Chen fictional details and billing, enter DEMO10, verify 5 EUR discount and 45 EUR total, accept required consents and submit. Assert pending/awaiting_payment and no payment, capture the issued disposable reference/access code.
4. **“Use your reference and access code to check your registration.”** Enter those credentials on Meine Anmeldung. Assert matching event, two people, 45 EUR and pending/no payment status.
5. **“The event team sees pending registrations in its protected dashboard.”** Authenticate fictional admin via an invisible API request, open organizer overview and Anmeldungen. Assert the one pending registration. End on the registration row; never mark payment as received or cancel.

Off camera: build the UI in a fresh source copy under ignored `demo/output/applet-*`, with a randomly generated setup key. Bootstrap one fictional admin and update the three seeded sample events with English fictional titles and date-relative future times. The first event uses controlled early-bird pricing and DEMO10 (10%). Each check/capture starts fresh. The recording creates one two-person registration; no deployment, emails, payments or existing app state. Only disposable reference/access credentials appear on screen. Admin password never appears; all generated credentials/raw WebM stay ignored.

Publish the reviewed take as the matching pair `docs/demo.gif` and `docs/demo.mp4`.
