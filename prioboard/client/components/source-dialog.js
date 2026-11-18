import { $, el, add, button } from "../dom.js";
import { state } from "../state.js";
export function sourceLink(p, quote = "", label = p) {
  return button(label, () => showSource(p, quote), "source-link");
}
export function showSource(p, quote = "") {
  $("#dialog-title").textContent = p.split("/").at(-1);
  $("#dialog-path").textContent = p;
  const box = $("#dialog-content");
  box.replaceChildren();
  if (!state.files.has(p)) {
    add(box, el("div", "notice", `File unavailable: ${p}`));
  } else {
    const pre = el("pre"),
      raw = state.files.get(p),
      index = quote ? raw.indexOf(quote) : -1;
    if (index >= 0) {
      pre.append(
        document.createTextNode(raw.slice(0, index)),
        el("mark", "", quote),
        document.createTextNode(raw.slice(index + quote.length)),
      );
    } else pre.textContent = raw;
    add(box, el("div", "small muted", "Raw Markdown · read-only"), pre);
  }
  const dialog = $("#source-dialog");
  if (!dialog.open) dialog.showModal();
  dialog.scrollTop = 0;
  const mark = box.querySelector("mark");
  if (mark)
    requestAnimationFrame(() => mark.scrollIntoView({ block: "center" }));
}
export function notes(parent, items, heading) {
  if (!items.length) return;
  add(parent, el("h3", "", heading));
  items.forEach((n) => {
    const box = el("div", "notice");
    add(box, el("div", "", n.text));
    n.sources.forEach((s) => add(box, sourceLink(s)));
    add(parent, box);
  });
}
export function evidence(parent, c) {
  add(parent, el("h3", "", "Evidence"));
  c.evidence.forEach((e) => {
    const q = el("blockquote", "quote");
    add(
      q,
      el("p", "", `“${e.quote}”`),
      el("div", "small muted", `${e.speaker} · ${e.locator}`),
      sourceLink(e.source, e.quote),
    );
    add(parent, q);
  });
  notes(parent, c.contradictions, "Contradictions / differing accounts");
}
