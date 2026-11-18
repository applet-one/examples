import { add, el, button } from "../dom.js";
import { state } from "../state.js";
import { saveOverride } from "../api.js";
import { render } from "../ui.js";

export function openOverrideDialog(opportunity, title, opportunities) {
  const current = state.overrides.find(
    (o) => o.run_id === state.run && o.cluster_id === opportunity.cluster_id,
  );
  const run = state.run;
  const uploadedAt = state.uploadedAt;
  const overrideRevision = state.overrideRevision;
  const dialog = el("dialog", "override-dialog");
  dialog.id = "override-dialog";
  dialog.setAttribute("aria-labelledby", "override-title");
  const form = el("form", "override-form");
  const heading = el("h2", "", current ? "Edit override" : "Override priority");
  heading.id = "override-title";
  const positionLabel = el("label", "", "Position");
  positionLabel.htmlFor = "override-position";
  const position = el("select");
  position.id = "override-position";
  for (let i = 1; i <= Math.min(3, opportunities.length); i++) {
    const option = el("option", "", `#${i}`);
    option.value = String(i);
    position.append(option);
  }
  position.value = String(current?.position || 1);
  const reasonLabel = el("label", "", "Reason");
  reasonLabel.htmlFor = "override-reason";
  const reason = el("textarea");
  reason.id = "override-reason";
  reason.required = true;
  reason.maxLength = 2000;
  reason.rows = 4;
  reason.value = current?.reason || "";
  const warning = el("p", "override-warning");
  warning.id = "override-warning";
  warning.setAttribute("aria-live", "polite");
  position.setAttribute("aria-describedby", warning.id);
  function updateWarning() {
    const occupied = state.overrides.find(
      (o) =>
        o.run_id === run &&
        o.position === Number(position.value) &&
        o.cluster_id !== opportunity.cluster_id,
    );
    warning.textContent = occupied
      ? `This replaces the manual override for “${opportunities.find((o) => o.cluster_id === occupied.cluster_id)?.title || occupied.cluster_id}” at #${occupied.position}. That opportunity will return to calculated ordering.`
      : "Other manual overrides keep their positions. Unpinned opportunities fill the gaps in calculated score order.";
  }
  position.addEventListener("change", updateWarning);
  updateWarning();
  const status = el("p", "override-status");
  status.setAttribute("role", "status");
  let saving = false;
  const cancel = button("Cancel", () => dialog.close());
  const save = el("button", "primary", "Save override");
  save.type = "submit";
  const actions = add(el("div", "override-actions"), cancel, save);
  async function submit(remove = false) {
    if (saving) return;
    if (!remove && !reason.value.trim()) {
      reason.setCustomValidity("Please explain the override.");
      reason.reportValidity();
      return;
    }
    saving = true;
    state.loading = true;
    for (const control of form.elements) control.disabled = true;
    status.textContent = "Saving…";
    try {
      const result = await saveOverride(
        {
          run_id: run,
          cluster_id: opportunity.cluster_id,
          position: Number(position.value),
          reason: reason.value,
          uploadedAt,
          overrideRevision,
        },
        remove,
      );
      state.overrides = result.overrides;
      state.overrideRevision = result.overrideRevision;
      state.loading = false;
      render();
      dialog.close();
    } catch (error) {
      status.textContent = `${error.message} If the connection was interrupted, reload to check whether the change was saved.`;
    } finally {
      saving = false;
      state.loading = false;
      for (const control of form.elements) control.disabled = false;
    }
  }
  if (current)
    actions.prepend(button("Remove override", () => submit(true), "danger"));
  reason.addEventListener("input", () => reason.setCustomValidity(""));
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    submit();
  });
  dialog.addEventListener("cancel", (event) => {
    if (saving) event.preventDefault();
  });
  dialog.addEventListener("close", () => dialog.remove());
  add(
    form,
    heading,
    el("p", "", title),
    positionLabel,
    position,
    reasonLabel,
    reason,
    warning,
    el("p", "small muted", "Scores and scoring rationales remain unchanged."),
    status,
    actions,
  );
  add(dialog, form);
  document.body.append(dialog);
  dialog.showModal();
  reason.focus();
}
