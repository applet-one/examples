import test from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { createReportReader, parseYaml } from "../shared/reports.js";
import { ranked } from "../shared/ranking.js";

const demo = new URL("../data/", import.meta.url);
async function fixtureFiles() {
  const files = new Map();
  async function walk(path) {
    for (const entry of await readdir(new URL(path, demo), {
      withFileTypes: true,
    })) {
      const child = `${path}${entry.name}`;
      if (entry.isDirectory()) await walk(`${child}/`);
      else if (entry.name.endsWith(".md"))
        files.set(child, await readFile(new URL(child, demo), "utf8"));
    }
  }
  for (const directory of ["context/", "input/", "output/"])
    await walk(directory);
  return files;
}
const clusterPath = "output/2026-11-14/discovery/feedback-clusters-v2.md";
const scorePath = "output/2026-11-14/strategy/opportunity-scorecard-v2.md";

test("existing demo reports retain six clusters, six scorecards, evidence and calculated ranking", async () => {
  const read = createReportReader(await fixtureFiles());
  const clusters = read(clusterPath, "feedback_clusters");
  const scores = read(scorePath, "opportunity_scorecard");
  assert.equal(clusters.error, undefined);
  assert.equal(scores.error, undefined);
  assert.equal(clusters.data.clusters.length, 6);
  assert.equal(scores.data.opportunities.length, 6);
  assert.equal(ranked(scores.data.opportunities).length, 6);
});

test("invalid evidence does not render as valid report data", async () => {
  const files = await fixtureFiles();
  files.set(
    "input/raw_feedback/emails.md",
    "Replaced source, no original evidence.",
  );
  const result = createReportReader(files)(clusterPath, "feedback_clusters");
  assert.match(result.error, /Quote not found/);
});

test("missing reports and missing context fail clearly", async () => {
  const files = await fixtureFiles();
  files.delete("context/strategy.md");
  const read = createReportReader(files);
  assert.match(
    read(scorePath, "opportunity_scorecard").error,
    /Missing source/,
  );
  assert.match(
    read("output/missing.md", "feedback_clusters").error,
    /Missing source/,
  );
});

test("YAML retains conventional multiline syntax and JSON scalar typing", () => {
  assert.deepEqual(
    parseYaml("date: 2026-11-14\nword: yes\nscore: 4\nquote: |-\n  a\n  b\n"),
    { date: "2026-11-14", word: "yes", score: 4, quote: "a\nb" },
  );
});

test("unsafe YAML constructs are rejected", () => {
  for (const yaml of ["a: 1\na: 2", "a: !!str value", "a: &x hello\nb: *x"])
    assert.throws(() => parseYaml(yaml));
  assert.throws(() => parseYaml("[".repeat(50) + "0" + "]".repeat(50)));
});

test("ranking keeps competition ranks and deterministic cluster ID tie order", () => {
  const opportunity = (cluster_id, score) => ({
    cluster_id,
    dimensions: { a: { score } },
  });
  const result = ranked([
    opportunity("z", 5),
    opportunity("a", 5),
    opportunity("b", 3),
  ]);
  assert.deepEqual(
    result.map(({ opportunity, rank }) => [opportunity.cluster_id, rank]),
    [
      ["a", 1],
      ["z", 1],
      ["b", 3],
    ],
  );
});
