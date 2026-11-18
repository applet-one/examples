import { $, el, add, button } from "../dom.js";
import { state, dimensions, getReport } from "../state.js";
import { total, boardOrder } from "../../shared/ranking.js";
import { openOverrideDialog } from "../components/override-dialog.js";
import { sourceLink, evidence, notes } from "../components/source-dialog.js";
import { setView } from "../ui.js";
import { runPaths } from "../state.js";
import { renderComments } from "../components/comments.js";
export function renderBoard() {
  let content = $("#content");
  const p = runPaths();
  const cr = getReport(p.clusters, "feedback_clusters");
  if (!cr.data) {
    emptyReport("feedback clusters", p.clusters, cr.error);
    return;
  }
  $("#cluster-count").textContent = cr.data.clusters.length;
  if (state.view === "clusters") {
    cr.data.clusters.forEach((c, i) => {
      const card = el("article", "card"),
        head = el("div", "card-head");
      const body = add(
        el("div"),
        el("h2", "", c.title),
        el(
          "div",
          "subtitle",
          `${c.mentions.length} independent voices · ${c.evidence.length} quotes · ${new Set(c.evidence.map((e) => e.source)).size} source files`,
        ),
        el("p", "summary", c.summary),
      );
      add(head, el("div", "rank", String(i + 1)), body);
      add(card, head);
      const details = el("details");
      add(details, el("summary", "", "View evidence and contradictions"));
      const inner = el("div", "detail");
      add(
        inner,
        el("div", "small muted", c.mentions.map((m) => m.label).join(" · ")),
      );
      evidence(inner, c);
      add(details, inner);
      add(card, details);
      add(content, card);
    });
    notes(content, cr.data.outliers, "Other / individual cases");
    add(
      content,
      sourceLink(p.clusters, "", "Read full cluster report (raw Markdown)"),
    );
    return;
  }
  const sr = getReport(p.opportunities, "opportunity_scorecard");
  if (!sr.data) {
    emptyReport("opportunity scorecards", p.opportunities, sr.error);
    add(
      content,
      button("Browse available clusters", () => setView("clusters")),
    );
    return;
  }
  const layout = el("div", "opportunities-layout");
  content = el("div", "opportunities-board");
  const panel = el("section", "comments-panel");
  add($("#content"), add(layout, content, panel));
  const ordered = boardOrder(
    sr.data.opportunities,
    state.overrides.filter((o) => o.run_id === state.run),
  );
  if (
    !ordered.some(
      ({ opportunity: o }) =>
        o.cluster_id === state.selectedOpportunity[state.run],
    )
  )
    state.selectedOpportunity[state.run] = ordered[0]?.opportunity.cluster_id;
  const selectOpportunity = (id, title) => {
    state.selectedOpportunity[state.run] = id;
    content.querySelectorAll("[data-opportunity]").forEach((card) => {
      const selected = card.dataset.opportunity === id;
      card.classList.toggle("selected-opportunity", selected);
      card
        .querySelector(".opportunity-select")
        .setAttribute("aria-pressed", String(selected));
    });
    renderComments(panel, id, title);
  };
  add(
    content,
    el(
      "p",
      "small muted",
      "Select an opportunity to view or add comments. Board positions follow total score unless manually pinned. Equal scores share a calculated rank. Product potential is not the same as short-term revenue.",
    ),
  );
  ordered.forEach(({ opportunity: o, rank, position, override }) => {
    const c = cr.data.clusters.find((c) => c.id === o.cluster_id),
      card = el("article", "card opportunity-card"),
      head = el("div", "card-head");
    card.dataset.opportunity = o.cluster_id;
    const select = button(
      c.title,
      () => selectOpportunity(o.cluster_id, c.title),
      "opportunity-select",
    );
    select.setAttribute("aria-controls", "opportunity-comments");
    select.setAttribute("aria-pressed", "false");
    card.addEventListener("click", (event) => {
      if (event.target.closest("button, a, input, select, textarea, summary"))
        return;
      selectOpportunity(o.cluster_id, c.title);
    });
    const info = add(
      el("div"),
      add(el("h2"), select),
      el(
        "div",
        "subtitle",
        `${c.mentions.length} independent voices · ${c.evidence.length} supporting quotes`,
      ),
    );
    const score = el("div", "score");
    add(
      score,
      document.createTextNode(String(total(o))),
      el("small", "", " / 15"),
    );
    const bar = el("div", "bar"),
      fill = el("span");
    fill.style.width = `${(total(o) / 15) * 100}%`;
    add(score, add(bar, fill));
    if (override)
      add(
        info,
        add(
          el("p", "override-note"),
          el("span", "override-pill", "Manual override"),
          document.createTextNode(` ${override.reason}`),
        ),
      );
    add(head, el("div", "rank", String(position)), info, score);
    add(card, head);
    const details = el("details");
    add(details, el("summary", "", "View scorecard, evidence, and conclusion"));
    const inner = el("div", "detail");
    add(
      inner,
      el(
        "p",
        "small muted",
        `Calculated rank: #${rank} · Board priority: #${position}`,
      ),
    );
    Object.entries(dimensions).forEach(([key, label]) => {
      const d = o.dimensions[key],
        row = el("div", "dimension");
      add(
        row,
        add(
          el("strong"),
          el("span", "", label),
          el("span", "", `${d.score}/5`),
        ),
        el("p", "", d.rationale),
      );
      d.references.forEach((r) => {
        const q = el("div", "quote");
        add(q, el("p", "small", `“${r.quote}”`), sourceLink(r.source, r.quote));
        add(row, q);
      });
      add(inner, row);
    });
    add(
      inner,
      el("h3", "", "Conclusion"),
      el("p", "conclusion", o.conclusion),
      el("h3", "", "Feedback cluster"),
      el("p", "", c.summary),
    );
    evidence(inner, c);
    if (state.user?.isAdmin)
      add(
        inner,
        button(
          override ? "Edit override" : "Override",
          () =>
            openOverrideDialog(
              o,
              c.title,
              sr.data.opportunities.map((item) => ({
                ...item,
                title: cr.data.clusters.find(
                  (cluster) => cluster.id === item.cluster_id,
                ).title,
              })),
            ),
          "primary",
          "flag",
        ),
      );
    add(details, inner);
    add(card, details);
    add(content, card);
  });
  panel.id = "opportunity-comments";
  const selectedId = state.selectedOpportunity[state.run];
  if (selectedId)
    selectOpportunity(
      selectedId,
      cr.data.clusters.find((c) => c.id === selectedId).title,
    );
  else add(panel, el("p", "muted", "Select an opportunity to view comments."));
  add(
    content,
    sourceLink(
      p.opportunities,
      "",
      "Read full opportunity report (raw Markdown)",
    ),
  );
}
function emptyReport(label, p, error) {
  const box = el("div", "empty");
  add(
    box,
    el("h2", "", `No valid ${label} for this run`),
    el(
      "p",
      "",
      state.files.has(p)
        ? `Validation failed: ${error}`
        : "This dated folder has no v2 report yet. Existing reports are still available in Reports.",
    ),
    el("code", "", p),
    el(
      "p",
      "small muted",
      "Run the corresponding -2 skill locally, then use Replace dataset to upload the whole folder.",
    ),
  );
  add($("#content"), box);
}
