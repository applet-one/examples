import { test, expect } from "@playwright/test";
import { makeDataset, run } from "./fixture.mjs";
import { origin, assertTarget, login, dataset } from "./support.js";

test("prepare an empty local board with fictional product research", async ({
  request,
  playwright,
  baseURL,
}) => {
  assertTarget(baseURL);
  expect(await dataset(request), "Refuse an initialized database").toBeNull();
  const profile = await request.get(`${origin}/api/profile`);
  const { users } = await profile.json();
  const admin = users.find((user: { isAdmin: boolean }) => user.isAdmin);
  expect(admin.name).toBe("Markus Andrezak");
  await login(request, { userId: admin.id });
  const uploaded = await request.put(`${origin}/api/dataset`, {
    headers: { Origin: origin },
    data: makeDataset(),
  });
  expect(uploaded.ok(), await uploaded.text()).toBeTruthy();
  const saved = await dataset(request);
  expect(saved.overrides).toHaveLength(0);
  expect(saved.comments).toHaveLength(0);
  const seeds = [
    [
      "Ava",
      "Morgan",
      "guided-onboarding",
      "The checklist should help each team reach its first shared workflow.",
    ],
    [
      "Leo",
      "Park",
      "customer-reporting",
      "A concise weekly report would give every pilot team the same view of progress.",
    ],
  ];
  for (const [firstName, lastName, cluster_id, body] of seeds) {
    const member = await playwright.request.newContext();
    try {
      await login(member, { firstName, lastName });
      const result = await member.post(`${origin}/api/comments`, {
        headers: { Origin: origin },
        data: { run_id: run, cluster_id, body, uploadedAt: saved.uploadedAt },
      });
      expect(result.ok(), await result.text()).toBeTruthy();
    } finally {
      await member.dispose();
    }
  }
  expect((await dataset(request)).comments).toHaveLength(2);
});
