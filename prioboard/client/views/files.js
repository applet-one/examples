import { $, el, add, button } from "../dom.js";
import { state } from "../state.js";
import { render } from "../ui.js";
export function renderFiles() {
  const content = $("#content"),
    view = state.view,
    folder = state.folder[view];
  const layout = el("div", "files-layout"),
    list = el("div", "file-list"),
    reader = el("div", "reader");
  const search = el("input", "search");
  search.type = "search";
  search.placeholder = "Filter file names…";
  search.setAttribute("aria-label", "Filter file names");
  search.value = state.filter;
  search.addEventListener("input", () => {
    state.filter = search.value;
    render();
    const input = $(".search");
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  });
  add(list, search, el("div", "folder-title", `${folder}/`));
  if (folder !== view)
    add(
      list,
      button(
        "← Parent folder",
        () => {
          state.folder[view] = folder.split("/").slice(0, -1).join("/");
          state.filter = "";
          render();
        },
        "folder-back",
      ),
    );
  const paths = [...state.files.keys()]
    .filter((p) => p.startsWith(folder + "/"))
    .sort();
  const folders = new Set();
  let shown = 0;
  paths.forEach((p) => {
    const relative = p.slice(folder.length + 1);
    if (relative.includes("/")) folders.add(relative.split("/")[0]);
  });
  [...folders].forEach((f) =>
    add(
      list,
      button(`▸ ${f}/`, () => {
        state.folder[view] = `${folder}/${f}`;
        state.filter = "";
        render();
      }),
    ),
  );
  paths
    .filter((p) => !p.slice(folder.length + 1).includes("/"))
    .forEach((p) => {
      if (state.filter && !p.toLowerCase().includes(state.filter.toLowerCase()))
        return;
      shown++;
      add(
        list,
        button(
          p.split("/").at(-1),
          () => {
            state.selected[view] = p;
            render();
          },
          state.selected[view] === p ? "selected" : "",
        ),
      );
    });
  const selected = state.selected[view];
  if (selected && state.files.has(selected)) {
    add(
      reader,
      el("h2", "", selected.split("/").at(-1)),
      el("div", "reader-path", selected),
      el("div", "small muted", "Raw Markdown · unmodified · read-only"),
      el("pre", "", state.files.get(selected)),
    );
  } else
    add(
      reader,
      el("h2", "", "Browse Markdown files"),
      el(
        "p",
        "muted",
        "Select a folder and file to view its original contents.",
      ),
    );
  if (!shown && !folders.size)
    add(list, el("p", "small muted", "No Markdown files in this folder."));
  add(layout, list, reader);
  add(content, layout);
}
