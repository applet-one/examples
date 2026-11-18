import { $, el, add, icon, button } from "../dom.js";
import { state } from "../state.js";
import { showSource } from "./source-dialog.js";
import { setView, render } from "../ui.js";
export function renderToolbar() {
  const toolbar = $("#toolbar");
  toolbar.replaceChildren();
  if (!state.root) return;
  const badge = el("label", "badge blue");
  badge.append(icon("history"), document.createTextNode("Run · "));
  const select = el("select");
  select.setAttribute("aria-label", "Select dated output run");
  if (!state.runs.length) {
    const option = el("option", "", "No dated outputs");
    select.append(option);
    select.disabled = true;
  } else
    state.runs.forEach((run) => {
      const option = el("option", "", run);
      option.value = run;
      option.selected = run === state.run;
      select.append(option);
    });
  select.addEventListener("change", () => {
    state.run = select.value;
    state.folder.output = `output/${state.run}`;
    delete state.selected.output;
    render();
  });
  add(badge, select);
  add(toolbar, badge);
  const types = [
    ["slack.md", "Slack", "hash"],
    ["emails.md", "Email", "mail"],
    ["customer_interviews.md", "Interviews", "mic"],
    ["internal_docs.md", "Docs", "file-text"],
  ];
  types.forEach(([file, label, iconName]) => {
    const matches = [...state.files.keys()].filter(
      (p) => p.startsWith("input/") && p.split("/").at(-1) === file,
    );
    add(
      toolbar,
      button(
        `${label} · ${matches.length} file${matches.length === 1 ? "" : "s"}`,
        () => {
          if (matches[0]) showSource(matches[0]);
        },
        "badge",
        iconName,
      ),
    );
  });
  add(
    toolbar,
    button(
      "Strategy context",
      () => setView("context"),
      "badge green",
      "target",
    ),
  );
}
