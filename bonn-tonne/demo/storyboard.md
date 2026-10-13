# Bonn Tonne — Your street. Your collection plan.

Status: approved by the user before implementation/capture, including the deployed target and disposable feed creation/revocation. Repository source revision: `5c9182d4eea4fec66f4548199beb8fbed97b8fbc`. Bonn Tonne was untracked at that revision; the deployed UI is the capture authority, not a claim that this commit contains the deployed source.

Audience: people exploring Bonn's waste collection planner. Desktop Chromium, 1280×900, English explanations over the German UI. Large fading dark-screen captions, no audio. Estimated runtime: 80–100 seconds.

Opening title: **Bonn Tonne — Your street. Your collection plan.**

Disclosure: **Hosted demo · sample household · official Bonn 2026 dates**

| Scene | Exact caption | Visible action and assertion |
| --- | --- | --- |
| 1 | Find the official collection plans for your address. | Click “Meinen Plan erstellen”, enter `Heerstr.` / `12`, and find plans. Verify matching waste types and collection-frequency choices. |
| 2 | Choose the bins and collection frequency for your household. | Explicitly select 240-litre residual waste every two weeks, plus bio, paper and yellow bin; save. Verify sample address, active bins and upcoming collections. |
| 3 | See what’s next, then explore your monthly calendar. | Show next collection/list, switch to “Monat”, select a collection day and verify date and waste types in day details. |
| 4 | Create a private calendar feed for Apple, Google or Outlook. | Create a disposable subscription and show all three providers' instructions. Verify the feed returns an all-day calendar. Do not open external apps or claim an actual third-party subscription. |
| 5 | Revoke your calendar link whenever you choose. | Open privacy controls, revoke this disposable feed and confirm. Verify 404 for the revoked feed and that the local plan remains available. Close the dialog and finish on the plan. |

Final card, exact text: **Deploy your own app today at applet.one**. Text only, no deployment or external navigation.

Target: **https://bonn-tonne.applet.works/**, explicitly selected by the user instead of localhost. No local webServer. Fresh browser context with no imported authentication or preferences. Current date is used when within the published 2026 schedule; if coverage no longer supports the story, stop for revised approval rather than silently simulate time. The current capture date is recorded in ignored preparation metadata.

`Heerstr. 12` is a sample household selection, not a claim about an actual resident. The only hosted writes are creation and revocation of the run's disposable calendar feed. The management secret never appears onscreen. A visible token URL belongs only to that run's feed and is revoked before publication. Failure cleanup also revokes the run's own feed; no other subscriptions are touched. No account switching, external calendar login, deployment or existing local-state changes.

Completed deliverables: matching reviewed GIF/MP4 in `bonn-tonne/demo/`; preferred GIF embedded in the app README. After capture and review, the user requested removal of the creation artifacts. Recording scripts, configs, dependencies, raw recordings, checks and temporary credentials were removed; this approved storyboard and the published media remain.
