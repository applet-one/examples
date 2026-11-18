export const $ = (s) => document.querySelector(s);
export function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
}
export function add(parent, ...children) {
  children.forEach((c) => {
    if (c) parent.append(c);
  });
  return parent;
}
export function icon(name) {
  const ns = "http://www.w3.org/2000/svg",
    svg = document.createElementNS(ns, "svg"),
    use = document.createElementNS(ns, "use");
  svg.setAttribute("class", "icon lucide");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  use.setAttribute("href", `#lucide-${name}`);
  svg.append(use);
  return svg;
}
export function buttonLabel(node, label, iconName) {
  node.replaceChildren();
  node.classList.toggle("with-icon", !!iconName);
  if (iconName) node.append(icon(iconName));
  node.append(document.createTextNode(label));
  return node;
}
export function button(label, fn, cls = "", iconName = "") {
  const b = buttonLabel(el("button", cls), label, iconName);
  b.type = "button";
  b.addEventListener("click", fn);
  return b;
}
