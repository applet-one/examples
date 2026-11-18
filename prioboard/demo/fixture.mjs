// Entirely synthetic English product evidence, not a translation of customer data.
import { createReportReader } from "../shared/reports.js";
import { validateDataset } from "../shared/paths.js";
export const run = "2026-11-18";
export const opportunities = [
  {
    id: "guided-onboarding",
    title: "Guided onboarding",
    scores: [5, 5, 4],
    summary:
      "Help new teams reach their first shared workflow without a setup call.",
    quotes: [
      "We need a clear first-run checklist so every team can get started without us.",
      "Our first project took two calls. A guided setup would make rollout much easier.",
    ],
    rationale: [
      "First value should happen in minutes, not in a training session.",
      "The same activation barrier appears across independent pilot teams.",
      "Existing templates and setup events provide a practical starting point.",
    ],
  },
  {
    id: "workflow-templates",
    title: "Reusable workflow templates",
    scores: [5, 4, 4],
    summary: "Turn proven team processes into repeatable starting points.",
    quotes: [
      "We rebuild the same launch checklist every time a new team joins.",
      "Let us save a good workflow and share it with the next project.",
    ],
    rationale: [
      "Reusable workflows help teams build repeatable habits.",
      "The need repeats across launches, reviews, and team onboarding.",
      "The workflow model already supports copying steps and owners.",
    ],
  },
  {
    id: "customer-reporting",
    title: "Customer reporting",
    scores: [4, 4, 4],
    summary:
      "Give pilot teams a clear weekly view of outcomes, progress, and next steps.",
    quotes: [
      "Three pilot teams are waiting for a weekly customer-ready progress report.",
      "I spend Friday turning project updates into a report our customers can read.",
    ],
    rationale: [
      "Outcome visibility supports the product promise of confident teamwork.",
      "Three pilot teams describe the same weekly reporting workflow.",
      "Existing project events can power a focused first version.",
    ],
  },
  {
    id: "approval-workflows",
    title: "Lightweight approvals",
    scores: [4, 4, 3],
    summary: "Keep sign-off decisions visible instead of buried in chat.",
    quotes: [
      "I cannot tell whether the launch plan is approved or just discussed.",
      "A named approver and a clear decision would save another status meeting.",
    ],
    rationale: [
      "Explicit decisions reduce coordination overhead for growing teams.",
      "Approval confusion appears in both launches and customer reviews.",
      "Notifications and decision history need careful interaction design.",
    ],
  },
  {
    id: "smart-notifications",
    title: "Smarter notifications",
    scores: [4, 3, 3],
    summary:
      "Surface the updates that need attention, with less background noise.",
    quotes: [
      "Tell me when I am blocking someone, not whenever a task changes.",
      "A daily digest would help me catch up without reading every channel.",
    ],
    rationale: [
      "Focused attention helps teams sustain their shared workflow.",
      "Two teams want less noise, but their preferred timing differs.",
      "Digest delivery needs new scheduling and notification preferences.",
    ],
  },
  {
    id: "portfolio-overview",
    title: "Portfolio overview",
    scores: [3, 3, 3],
    summary: "See risks and ownership across multiple active projects.",
    quotes: [
      "I need a single place to see which projects have no clear owner.",
      "Show me the projects at risk before our monthly portfolio review.",
    ],
    rationale: [
      "Portfolio visibility is useful after core team adoption is established.",
      "The request comes from larger teams rather than the full pilot group.",
      "Cross-project permissions and consistent risk signals need discovery.",
    ],
  },
];
export const onboardingQuote = opportunities[0].quotes[0];
export const liveComment =
  "The pilot review confirms it: three teams need customer reporting before the next rollout.";
export const reply =
  "Agreed. Let’s prioritize reporting this cycle and keep onboarding next.";
export const reason =
  "Prioritize reporting this cycle to unblock three pilot teams.";
export function makeDataset() {
  const sources = [
    "input/raw_feedback/customer_interviews.md",
    "input/raw_feedback/internal_docs.md",
  ];
  const company =
    "# Relay\n\nFictional SaaS product for teams that plan and deliver customer work together.\n\nBuild on existing project events and reusable workflow components.\n";
  const strategy =
    "# Product strategy\n\nHelp teams reach value quickly and make confident decisions together.\n\nPrioritize repeatable needs across independent pilot teams.\n";
  const files = [
    { path: "context/company.md", content: company },
    { path: "context/strategy.md", content: strategy },
    ...sources.map((path, i) => ({
      path,
      content:
        `# ${i ? "Pilot review" : "Customer interviews"} — fictional research\n\nAll people, organizations, and quotes in this file are synthetic.\n\n` +
        opportunities
          .map(
            (o) =>
              `## ${o.title}\n\n${i ? "Jordan Lee · Cedar team" : "Maya Chen · Northstar team"}\n\n${o.quotes[i]}\n`,
          )
          .join("\n"),
    })),
  ];
  const clusters = {
    schema_version: 2,
    kind: "feedback_clusters",
    run_id: run,
    sources,
    clusters: opportunities.map((o) => ({
      id: o.id,
      title: o.title,
      summary: o.summary,
      mentions: [
        { id: "northstar", label: "Northstar pilot" },
        { id: "cedar", label: "Cedar pilot" },
      ],
      evidence: sources.map((source, i) => ({
        mention_id: i ? "cedar" : "northstar",
        source,
        locator: o.title,
        speaker: i ? "Jordan Lee · Cedar" : "Maya Chen · Northstar",
        quote: o.quotes[i],
      })),
      contradictions: [],
    })),
    outliers: [],
  };
  const scorecard = {
    schema_version: 2,
    kind: "opportunity_scorecard",
    run_id: run,
    clusters_file: `output/${run}/discovery/feedback-clusters-v2.md`,
    context_files: ["context/company.md", "context/strategy.md"],
    opportunities: opportunities.map((o) => ({
      cluster_id: o.id,
      dimensions: Object.fromEntries(
        ["vision_fit", "repeatability", "buildability"].map((key, i) => [
          key,
          {
            score: o.scores[i],
            rationale: o.rationale[i],
            references: [
              {
                source: i === 2 ? "context/company.md" : "context/strategy.md",
                quote:
                  i === 2
                    ? "Build on existing project events and reusable workflow components."
                    : i === 1
                      ? "Prioritize repeatable needs across independent pilot teams."
                      : "Help teams reach value quickly and make confident decisions together.",
              },
            ],
          },
        ]),
      ),
      conclusion:
        o.summary +
        " Validate the smallest useful version with the pilot teams.",
    })),
  };
  for (const [path, report] of [
    [scorecard.clusters_file, clusters],
    [`output/${run}/strategy/opportunity-scorecard-v2.md`, scorecard],
  ]) {
    files.push({
      path,
      content: `---\n${JSON.stringify(report, null, 2)}\n---\n\n# Relay product discovery\n\nSynthetic product research for this local walkthrough.\n`,
    });
  }
  const dataset = validateDataset({ name: "Relay · Product discovery", files });
  const read = createReportReader(
    new Map(files.map((f) => [f.path, f.content])),
  );
  for (const [path, kind] of [
    [scorecard.clusters_file, "feedback_clusters"],
    [
      `output/${run}/strategy/opportunity-scorecard-v2.md`,
      "opportunity_scorecard",
    ],
  ]) {
    const result = read(path, kind);
    if (!result.data) throw new Error(result.error);
  }
  return dataset;
}
