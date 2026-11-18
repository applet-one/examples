// Use the name (not a browser-local ID) so existing comments and profiles agree.
export function userAppearance(name = "") {
  const parts = name.trim().split(/\s+/u).filter(Boolean);
  const initials = parts.length
    ? (
        [...parts[0]][0] + (parts.length > 1 ? [...parts.at(-1)][0] : "")
      ).toUpperCase()
    : "?";
  const key = parts.join(" ").normalize("NFC").toLocaleLowerCase("en-US");
  let hash = 0;
  for (const character of key)
    hash = (Math.imul(hash, 31) + character.codePointAt(0)) >>> 0;
  return { initials, color: `hsl(${hash % 360} 65% 36%)` };
}

export function relativeTime(timestamp, now = Date.now()) {
  const elapsed = Math.max(0, Math.floor((now - Date.parse(timestamp)) / 1000));
  if (!Number.isFinite(elapsed)) return "Unknown time";
  if (elapsed < 60) return "Just now";
  for (const [seconds, unit] of [
    [31536000, "y"],
    [2592000, "mo"],
    [604800, "w"],
    [86400, "d"],
    [3600, "h"],
    [60, "min"],
  ]) {
    if (elapsed >= seconds)
      return `${Math.floor(elapsed / seconds)} ${unit} ago`;
  }
}
