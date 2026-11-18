import * as jsyaml from "js-yaml";
import { safePath } from "./paths.js";
function need(ok, message) {
  if (!ok) throw Error(message);
}
function text(value, label) {
  need(
    typeof value === "string" && value.trim(),
    `${label}: expected nonempty text`,
  );
}
export function parseYaml(raw) {
  const events = jsyaml.parseEvents(raw, { maxDepth: 40 });
  need(
    events.every((e) => !(e.tagStart >= 0)),
    "Explicit YAML tags are not supported",
  );
  const docs = jsyaml.constructFromEvents(events, {
    source: raw,
    schema: jsyaml.JSON_SCHEMA,
    maxAliases: 0,
  });
  need(docs.length === 1, "Expected one YAML document");
  return docs[0];
}
export function parseReport(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/);
  need(match, "Missing YAML frontmatter between --- lines");
  let d;
  try {
    d = parseYaml(match[1]);
  } catch (e) {
    throw Error(`Invalid YAML frontmatter: ${e.message}`);
  }
  text(match[2], "Markdown body");
  need(d && d.schema_version === 2, "Expected schema_version 2");
  return d;
}

// Resolve all report references against the currently saved file snapshot.
export function createReportReader(files, reports = new Map()) {
  function arr(value, label, min = 0) {
    need(
      Array.isArray(value) && value.length >= min,
      `${label}: expected array (${min}+ items)`,
    );
  }
  function object(value, keys, label) {
    need(
      value && typeof value === "object" && !Array.isArray(value),
      `${label}: expected object`,
    );
    need(
      Object.keys(value).sort().join("|") === keys.split(" ").sort().join("|"),
      `${label}: unexpected or missing fields`,
    );
  }
  function unique(items, label) {
    need(
      new Set(items).size === items.length,
      `${label}: duplicate IDs or paths`,
    );
  }
  function existing(p) {
    safePath(p);
    need(files.has(p), `Missing source: ${p}`);
    return files.get(p);
  }
  function paths(values, label, min = 1) {
    arr(values, label, min);
    values.forEach(existing);
    unique(values, label);
  }
  function exact(p, q) {
    text(q, "quote");
    need(existing(p).includes(q), `Quote not found in ${p}: ${q.slice(0, 60)}`);
  }
  function validateReport(d, p, kind) {
    need(d.kind === kind, `Expected ${kind}`);
    text(d.run_id, "run_id");
    need(
      /^\d{4}-\d{2}-\d{2}$/.test(d.run_id) &&
        new Date(d.run_id).toISOString().slice(0, 10) === d.run_id,
      "Invalid run date",
    );
    const target =
      kind === "feedback_clusters"
        ? "discovery/feedback-clusters-v2.md"
        : "strategy/opportunity-scorecard-v2.md";
    need(
      p === `output/${d.run_id}/${target}`,
      "Run date does not match report path",
    );
    if (kind === "feedback_clusters") {
      object(
        d,
        "schema_version kind run_id sources clusters outliers",
        "feedback",
      );
      paths(d.sources, "sources");
      const expected = [...files.keys()]
        .filter((x) => /^input\/raw_feedback\/[^/]+\.md$/.test(x))
        .sort();
      need(
        JSON.stringify([...d.sources].sort()) === JSON.stringify(expected),
        "sources must list all input/raw_feedback Markdown files",
      );
      arr(d.clusters, "clusters", 3);
      need(d.clusters.length <= 6, "At most six clusters");
      const labels = new Map();
      const note = (n) => {
        object(n, "text sources", "note");
        text(n.text, "note");
        paths(n.sources, "note.sources");
        need(
          n.sources.every((s) => d.sources.includes(s)),
          "Undeclared note source",
        );
      };
      d.clusters.forEach((c) => {
        object(
          c,
          "id title summary mentions evidence contradictions",
          "cluster",
        );
        ["id", "title", "summary"].forEach((k) => text(c[k], k));
        need(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(c.id), "Invalid cluster ID");
        arr(c.mentions, "mentions", 2);
        c.mentions.forEach((m) => {
          object(m, "id label", "mention");
          text(m.id, "mention.id");
          text(m.label, "mention.label");
          need(
            !labels.has(m.id) || labels.get(m.id) === m.label,
            "Inconsistent mention label",
          );
          labels.set(m.id, m.label);
        });
        const ids = c.mentions.map((m) => m.id);
        unique(ids, "mentions");
        arr(c.evidence, "evidence", 2);
        const covered = new Set();
        c.evidence.forEach((e) => {
          object(e, "mention_id source locator speaker quote", "evidence");
          need(ids.includes(e.mention_id), "Unknown mention");
          need(d.sources.includes(e.source), "Undeclared source");
          text(e.locator, "locator");
          text(e.speaker, "speaker");
          exact(e.source, e.quote);
          covered.add(e.mention_id);
        });
        unique(
          c.evidence.map((e) => JSON.stringify([e.source, e.quote])),
          "evidence",
        );
        need(covered.size === ids.length, "Each mention needs evidence");
        arr(c.contradictions, "contradictions");
        c.contradictions.forEach(note);
      });
      unique(
        d.clusters.map((c) => c.id),
        "clusters",
      );
      arr(d.outliers, "outliers");
      d.outliers.forEach(note);
    } else {
      object(
        d,
        "schema_version kind run_id clusters_file context_files opportunities",
        "scorecard",
      );
      need(
        d.clusters_file ===
          `output/${d.run_id}/discovery/feedback-clusters-v2.md`,
        "Cluster file must belong to same run",
      );
      const clusters = getReport(d.clusters_file, "feedback_clusters");
      need(clusters.data, `Invalid cluster report: ${clusters.error}`);
      paths(d.context_files, "context_files");
      need(
        [...d.context_files].sort().join("|") ===
          "context/company.md|context/strategy.md",
        "Expected company and strategy context",
      );
      arr(d.opportunities, "opportunities", 1);
      d.opportunities.forEach((o) => {
        object(o, "cluster_id dimensions conclusion", "opportunity");
        text(o.cluster_id, "cluster_id");
        text(o.conclusion, "conclusion");
        object(
          o.dimensions,
          "vision_fit repeatability buildability",
          "dimensions",
        );
        Object.values(o.dimensions).forEach((v) => {
          object(v, "score rationale references", "dimension");
          need(
            Number.isInteger(v.score) && v.score >= 1 && v.score <= 5,
            "Score must be integer 1–5",
          );
          text(v.rationale, "rationale");
          arr(v.references, "references", 1);
          v.references.forEach((r) => {
            object(r, "source quote", "reference");
            need(
              d.context_files.includes(r.source),
              "Undeclared context reference",
            );
            exact(r.source, r.quote);
          });
        });
      });
      const ids = d.opportunities.map((o) => o.cluster_id);
      unique(ids, "opportunities");
      need(
        [...ids].sort().join("|") ===
          clusters.data.clusters
            .map((c) => c.id)
            .sort()
            .join("|"),
        "Exactly one opportunity per cluster required",
      );
    }
    return d;
  }
  function getReport(p, kind) {
    if (reports.has(p)) return reports.get(p);
    let result;
    try {
      result = { data: validateReport(parseReport(existing(p)), p, kind) };
    } catch (error) {
      result = { error: error.message };
    }
    reports.set(p, result);
    return result;
  }
  return getReport;
}
