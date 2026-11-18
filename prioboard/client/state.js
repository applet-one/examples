import { createReportReader } from "../shared/reports.js";
export const state = {
  user: null,
  files: new Map(),
  root: "",
  view: "opportunities",
  run: "",
  runs: [],
  reports: new Map(),
  folder: { input: "input", context: "context", output: "output" },
  selected: {},
  filter: "",
  loadWarnings: [],
  loading: false,
  overrides: [],
  comments: [],
  selectedOpportunity: {},
  commentDrafts: new Map(),
  overrideRevision: 0,
};
export const names = {
  opportunities: "Opportunities",
  clusters: "Feedback clusters",
  input: "Inputs",
  context: "Strategy context",
  output: "Reports",
};
export const dimensions = {
  vision_fit: "Vision fit",
  repeatability: "Repeatability",
  buildability: "Buildability",
};

export function getReport(path, kind) {
  return createReportReader(state.files, state.reports)(path, kind);
}

export function runPaths() {
  return {
    clusters: `output/${state.run}/discovery/feedback-clusters-v2.md`,
    opportunities: `output/${state.run}/strategy/opportunity-scorecard-v2.md`,
  };
}
