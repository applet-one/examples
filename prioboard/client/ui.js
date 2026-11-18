import { $, el, add, buttonLabel, button } from "./dom.js";
import { state, names } from "./state.js";
import { renderBoard } from "./views/opportunities.js";
import { renderFiles } from "./views/files.js";
import { renderToolbar } from "./components/toolbar.js";
import { renderProfile } from "./components/profile.js";
export function render() {
  renderProfile();
  $("#title").textContent = names[state.view];
  $("#crumb").textContent = `Priority board / ${state.root || "Saved dataset"}`;
  $("#workspace-name").textContent = state.root;
  buttonLabel(
    $("#open-folder"),
    state.root ? "Replace dataset" : "Upload folder",
    "folder-open",
  );
  $("#open-folder").hidden = !state.user?.isAdmin;
  $("#open-folder").disabled = state.loading || !state.user?.isAdmin;
  $("#download").disabled = state.loading || !state.root;
  document.querySelectorAll("[data-view]").forEach((b) => {
    const active = b.dataset.view === state.view;
    b.classList.toggle("active", active);
    if (active) b.setAttribute("aria-current", "page");
    else b.removeAttribute("aria-current");
  });
  for (const group of ["input", "context", "output"])
    $(`#${group}-count`).textContent = state.root
      ? [...state.files.keys()].filter((p) => p.startsWith(group + "/")).length
      : "";
  $("#cluster-count").textContent = "";
  $("#content").replaceChildren();
  $("#errors").replaceChildren();
  renderToolbar();
  state.loadWarnings.forEach((w) => add($("#errors"), el("div", "notice", w)));
  if (!state.root) {
    const box = el("div", "empty");
    const upload = button(
      "Upload data folder",
      () => $("#folder-input").click(),
      "primary",
      "folder-open",
    );
    upload.hidden = !state.user?.isAdmin;
    upload.disabled = state.loading || !state.user?.isAdmin;
    add(
      box,
      el("div", "pill", "PRIVATE · SAVED IN APPLET"),
      el("h2", "", "From raw feedback to product opportunities"),
      el(
        "p",
        "",
        state.user?.isAdmin
          ? "Upload data/ — the folder containing context/, input/, and output/. Browse original data, inspect evidence-backed clusters, and explore ranked scorecards."
          : "Waiting for Markus Andrezak (admin) to upload demo data. The board will appear automatically.",
      ),
      upload,
      el(
        "p",
        "small muted",
        "Only Markdown files are uploaded. Each upload replaces the complete saved dataset after confirmation. Generate new reports locally, then upload the folder again.",
      ),
    );
    add($("#content"), box);
    return;
  }
  if (["input", "context", "output"].includes(state.view)) renderFiles();
  else if (!state.run) {
    add(
      $("#content"),
      el(
        "div",
        "empty",
        "No dated output folders were found. Browse Inputs and Context, or generate a v2 report with the new skills.",
      ),
    );
  } else renderBoard();
}
export function setView(view) {
  state.view = view;
  state.filter = "";
  render();
}
