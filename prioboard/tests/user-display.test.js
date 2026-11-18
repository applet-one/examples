import test from "node:test";
import assert from "node:assert/strict";
import { userAppearance, relativeTime } from "../shared/user-display.js";

test("avatars have stable per-person colors and Unicode initials", () => {
  assert.equal(userAppearance("Markus Andrezak").initials, "MA");
  assert.equal(userAppearance("Ava Tester").initials, "AT");
  assert.equal(userAppearance("Érna Müller").initials, "ÉM");
  assert.equal(userAppearance("Anna van Gogh").initials, "AG");
  assert.equal(userAppearance("").initials, "?");
  assert.equal(
    userAppearance("  markus  ANDREZAK ").color,
    userAppearance("Markus Andrezak").color,
  );
  assert.notEqual(
    userAppearance("Markus Andrezak").color,
    userAppearance("Ava Tester").color,
  );
});

test("relative comment times handle boundaries, future dates and older comments", () => {
  const now = Date.parse("2026-11-16T12:00:00Z");
  const ago = (seconds) => new Date(now - seconds * 1000).toISOString();
  for (const [seconds, expected] of [
    [-60, "Just now"],
    [0, "Just now"],
    [59, "Just now"],
    [60, "1 min ago"],
    [3599, "59 min ago"],
    [3600, "1 h ago"],
    [7200, "2 h ago"],
    [86400, "1 d ago"],
    [604800, "1 w ago"],
    [2592000, "1 mo ago"],
    [31536000, "1 y ago"],
  ])
    assert.equal(relativeTime(ago(seconds), now), expected);
  assert.equal(relativeTime("invalid", now), "Unknown time");
});
