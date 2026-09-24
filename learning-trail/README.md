# Learning Trail

A small learning app that turns educator-curated content into a child-friendly, step-by-step trail. The starter trail teaches equivalent fractions. Educators can download an Excel workbook, edit it, upload it for validation, preview its routing, and publish a fixed content snapshot. Learner progress is saved in the app's storage.

## Use the app

### Learners

Open **For learners** to work through one activity and check at a time. A correct answer advances to the next skill. A first incorrect answer offers the alternate activity; a second incorrect answer routes back to the prerequisite. Progress is saved so the learner can resume.

### Educators

1. Open **Educator studio** and download the default Excel learning path (`.xlsx`). It contains three tabs: **Skills**, **Activities**, and **Checks**.
2. Edit the rows in Excel. Keep the tab names, column headers, and stable IDs/references intact.
3. Upload the workbook. The app reports validation problems with the tab and row where possible.
4. Preview the trail's routing, then choose **Publish version** to save an immutable content snapshot.

### Workbook contract

| Tab | Required columns | Notes |
| --- | --- | --- |
| **Skills** | `skill_id`, `title`, `prerequisite_skill_id` | `skill_id` must be unique. Leave the prerequisite blank for the first skill; otherwise reference another skill ID. |
| **Activities** | `activity_id`, `skill_id`, `kind`, `content` | IDs must be unique and `skill_id` must reference Skills. Each skill needs one `primary` and one `alternate` activity. `kind` is `primary` or `alternate`. |
| **Checks** | `check_id`, `skill_id`, `prompt`, `answer`, `pass_route`, `stuck_route`, `stuck_again_route` | IDs must be unique; each skill needs a check. Routing values are fixed: `next_skill`, `alternate_activity`, `prerequisite`. |

The routing rules are fixed for this MVP: **pass → next skill**, **stuck → alternate activity**, **stuck again → prerequisite**. The validator checks required content, duplicate IDs, broken references, prerequisite cycles, and route values. Save the edited workbook as `.xlsx` before uploading.

## Develop locally

Requirements: Node.js 20+, pnpm, and the Applet CLI.

```sh
pnpm install
pnpm dev
```

The app is a Worker with a SQLite-backed Durable Object. `applet.jsonc` configures the Worker entry point, Durable Object binding/migration, and Applet backup support. `src/index.js` contains the UI, workbook template generation/import/validation, and persisted app state.

## Deploy

This is an Applet.one app. Follow the first-time setup in [AGENTS.md](AGENTS.md), then deploy from the project directory:

```sh
pnpm install
applet deploy
```

Applet prints the deployed URL when the deployment is live. See [AGENTS.md](AGENTS.md) for account access and deployment guidance. Avoid `applet delete` unless you intend to permanently remove the hosted app.

## Current MVP scope

The sample topic is equivalent fractions. Routing is intentionally fixed; there is no general authoring dashboard, workbook formula support, user account system, or multi-learner management yet. Published snapshots are retained in app state; learners already in progress currently use saved app content/progress rather than an individual, selectable published-version assignment.
