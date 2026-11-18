import { $ } from "./dom.js";
import { state } from "./state.js";
import { render } from "./ui.js";
import { applyDataset, datasetStatus } from "./dataset.js";
import { renderMembers } from "./components/profile.js";

// Short polling keeps the same shared Durable Object as the editor and works
// across reconnects/runtime restarts, without a separate realtime service.
export function startCollaboration() {
  let revision = -1;
  async function sync() {
    try {
      if (
        state.loading ||
        document.querySelector("dialog[open]") ||
        [...state.commentDrafts.values()].some(
          (d) => d.pending || d.deleting?.size,
        )
      )
        return;
      const response = await fetch(`/api/sync?revision=${revision}`, {
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) throw new Error("Connection lost");
      const body = await response.json();
      // A write or modal may have started while the request was in flight.
      if (
        state.loading ||
        document.querySelector("dialog[open]") ||
        [...state.commentDrafts.values()].some(
          (d) => d.pending || d.deleting?.size,
        )
      )
        return;
      if (Object.hasOwn(body, "dataset") && body.dataset) {
        const dataset = body.dataset;
        const changedDataset = dataset.uploadedAt !== state.uploadedAt;
        const changedDecisions =
          JSON.stringify(dataset.overrides) !== JSON.stringify(state.overrides);
        const changedComments =
          JSON.stringify(dataset.comments) !== JSON.stringify(state.comments);
        if (changedDataset || changedDecisions || changedComments) {
          const focused = document.activeElement;
          const composing = focused?.id === "comment-body";
          const selection = composing
            ? [focused.selectionStart, focused.selectionEnd]
            : null;
          const openCards = [
            ...document.querySelectorAll("[data-opportunity] details[open]"),
          ].map(
            (node) => node.closest("[data-opportunity]").dataset.opportunity,
          );
          const scrolls = [...document.querySelectorAll(".comments-list")].map(
            (node) => node.scrollTop,
          );
          if (changedDataset) {
            const drafts = new Map(state.commentDrafts);
            applyDataset(dataset);
            state.commentDrafts = drafts;
            $("#status").textContent = datasetStatus();
          } else {
            state.overrides = dataset.overrides;
            state.overrideRevision = dataset.overrideRevision;
            state.comments = dataset.comments;
          }
          render();
          document.querySelectorAll("[data-opportunity]").forEach((card) => {
            if (openCards.includes(card.dataset.opportunity))
              card.querySelector("details").open = true;
          });
          document.querySelectorAll(".comments-list").forEach((node, i) => {
            node.scrollTop = scrolls[i] || 0;
          });
          if (composing && $("#comment-body")) {
            $("#comment-body").focus({ preventScroll: true });
            $("#comment-body").setSelectionRange(...selection);
          }
        }
      }
      renderMembers(body.users);
      revision = body.revision;
      $("#sync-status").textContent = "● Live · shared board";
    } catch {
      $("#sync-status").textContent =
        "Reconnecting… changes will sync automatically";
    } finally {
      setTimeout(sync, 1500);
    }
  }
  sync();
}
