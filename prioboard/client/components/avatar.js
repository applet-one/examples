import { el } from "../dom.js";
import { userAppearance } from "../../shared/user-display.js";

export function avatar(name, className = "") {
  const { initials, color } = userAppearance(name);
  const node = el("span", `profile-avatar ${className}`.trim(), initials);
  node.style.backgroundColor = color;
  node.setAttribute("aria-hidden", "true");
  return node;
}
