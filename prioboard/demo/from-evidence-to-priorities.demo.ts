import { test, expect } from "@pesuto/demotale";
import {
  run,
  opportunities,
  onboardingQuote,
  liveComment,
  reply,
  reason,
} from "./fixture.mjs";
import { origin, assertTarget, login, dataset, center } from "./support.js";

test("Prioboard from evidence to a product decision", async ({
  page,
  browser,
  baseURL,
  demo,
}) => {
  assertTarget(baseURL);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const profile = await page.request.get(`${origin}/api/profile`);
  const { users } = await profile.json();
  await login(page.request, {
    userId: users.find((user: { isAdmin: boolean }) => user.isAdmin).id,
  });
  const teammate = await browser.newContext({
    baseURL: origin,
    viewport: { width: 1440, height: 900 },
  });
  try {
    await login(teammate.request, { firstName: "Ava", lastName: "Morgan" });
    const member = await teammate.newPage();
    await member.goto("/");
    await expect(member.locator(".opportunity-card")).toHaveCount(6);
    await member
      .getByRole("button", { name: "Customer reporting", exact: true })
      .click();
    await page.goto("/");
    await expect(page.locator(".opportunity-card")).toHaveCount(6);
    await demo.card(
      "Prioboard",
      "Turn customer evidence into product priorities.",
    );
    await demo.hideCard();
    await demo.note("Local demo · sample product · fictional feedback");
    const cards = page.locator(".opportunity-card");
    const onboarding = page.locator('[data-opportunity="guided-onboarding"]');
    const reporting = page.locator('[data-opportunity="customer-reporting"]');

    await demo.step(
      "See your strongest product opportunities in one shared board.",
      async () => {
        await expect(cards.locator(".opportunity-select")).toHaveText(
          opportunities.map((o) => o.title),
        );
        await expect(cards.locator(".score")).toHaveText([
          "14 / 15",
          "13 / 15",
          "12 / 15",
          "11 / 15",
          "10 / 15",
          "9 / 15",
        ]);
        await expect(page.locator(".member-avatar")).toHaveCount(3);
        await expect(page.locator("#opportunity-comments")).toContainText(
          "Ava Morgan",
        );
        await demo.spotlight(onboarding.locator(".card-head"), 1_700);
        await demo.clearSpotlight();
        await demo.pause(1_200);
      },
    );

    await demo.step(
      "Go beyond the score. Trace every opportunity back to the evidence.",
      async () => {
        await demo.click(onboarding.locator("summary"));
        await expect(onboarding.locator(".dimension")).toHaveCount(3);
        await center(page, '[data-opportunity="guided-onboarding"] .dimension');
        await demo.spotlight(onboarding.locator(".dimension").first(), 1_500);
        await demo.clearSpotlight();
        const evidence = onboarding
          .locator("blockquote")
          .filter({ hasText: onboardingQuote });
        await demo.click(
          evidence.getByRole("button", {
            name: "input/raw_feedback/customer_interviews.md",
            exact: true,
          }),
        );
        const source = page.getByRole("dialog", {
          name: "customer_interviews.md",
          exact: true,
        });
        await expect(source).toBeVisible();
        await expect(source.locator("#dialog-path")).toHaveText(
          "input/raw_feedback/customer_interviews.md",
        );
        await expect(source.locator("mark")).toHaveText(onboardingQuote);
        await demo.spotlight(source.locator("mark"), 2_000);
        await demo.clearSpotlight();
        await demo.click(page.getByRole("button", { name: "Close source" }));
        await demo.click(onboarding.locator("summary"));
        await page.evaluate(() =>
          window.scrollTo({ top: 0, behavior: "instant" }),
        );
      },
    );

    await demo.step(
      "Keep the discussion beside the decision—with updates arriving live.",
      async () => {
        await demo.click(
          page.getByRole("button", { name: "Customer reporting", exact: true }),
        );
        const panel = page.locator("#opportunity-comments");
        await expect(panel).toContainText("Leo Park");
        const navigations: string[] = [];
        const onNavigation = (frame: import("@playwright/test").Frame) => {
          if (frame === page.mainFrame()) navigations.push(frame.url());
        };
        page.on("framenavigated", onNavigation);
        try {
          // Genuine separate-browser UI post. The recorded page only receives normal polling updates.
          await member
            .getByLabel("Add a comment", { exact: true })
            .fill(liveComment);
          await member
            .getByRole("button", { name: "Post comment", exact: true })
            .click();
          const incoming = panel
            .locator(".comment")
            .filter({ hasText: liveComment });
          await expect(incoming).toBeVisible();
          await expect(incoming.locator(".comment-author")).toHaveText(
            "Ava Morgan",
          );
          expect(navigations).toEqual([]);
          await demo.spotlight(incoming, 1_800);
          await demo.clearSpotlight();
          await panel.getByLabel("Add a comment", { exact: true }).fill(reply);
          await demo.click(
            panel.getByRole("button", { name: "Post comment", exact: true }),
          );
          await expect(
            panel
              .locator(".comment")
              .filter({ hasText: reply })
              .locator(".comment-author"),
          ).toHaveText("Markus Andrezak");
          const saved = await dataset(page.request);
          expect(
            saved.comments
              .filter(
                (c: { cluster_id: string }) =>
                  c.cluster_id === "customer-reporting",
              )
              .map((c: { body: string }) => c.body),
          ).toEqual([
            "A concise weekly report would give every pilot team the same view of progress.",
            liveComment,
            reply,
          ]);
          await demo.pause(1_300);
        } finally {
          page.off("framenavigated", onNavigation);
        }
      },
    );

    await demo.step(
      "When strategy changes, change the priority—and keep the reason.",
      async () => {
        await demo.click(reporting.locator("summary"));
        await demo.click(
          reporting.getByRole("button", { name: "Override", exact: true }),
        );
        const dialog = page.getByRole("dialog", {
          name: "Override priority",
          exact: true,
        });
        await expect(dialog).toBeVisible();
        await dialog.getByLabel("Position", { exact: true }).selectOption("1");
        await dialog.getByLabel("Reason", { exact: true }).fill(reason);
        await demo.pause(1_000);
        await demo.click(
          dialog.getByRole("button", { name: "Save override", exact: true }),
        );
        await expect(dialog).not.toBeVisible();
        await page.evaluate(() =>
          window.scrollTo({ top: 0, behavior: "instant" }),
        );
        await expect(cards.first()).toHaveAttribute(
          "data-opportunity",
          "customer-reporting",
        );
        await expect(reporting.locator(".score")).toHaveText("12 / 15");
        await expect(reporting.locator(".override-note")).toContainText(reason);
        const saved = await dataset(page.request);
        expect(saved.overrides).toMatchObject([
          {
            run_id: run,
            cluster_id: "customer-reporting",
            position: 1,
            reason,
          },
        ]);
        expect(saved.files).toEqual(
          (await import("./fixture.mjs"))
            .makeDataset()
            .files.slice()
            .sort((a, b) => a.path.localeCompare(b.path)),
        );
        await demo.spotlight(reporting.locator(".card-head"), 2_000);
        await demo.clearSpotlight();
      },
    );

    await demo.step(
      "Come back to the same priorities, evidence, and conversation.",
      async () => {
        await page.reload();
        await expect(cards.first()).toHaveAttribute(
          "data-opportunity",
          "customer-reporting",
        );
        await expect(reporting.locator(".override-note")).toContainText(reason);
        await expect(reporting.locator(".score")).toHaveText("12 / 15");
        await expect(page.locator("#opportunity-comments")).toContainText(
          liveComment,
        );
        await expect(page.locator("#opportunity-comments")).toContainText(
          reply,
        );
        await expect(reporting.locator(".opportunity-select")).toHaveAttribute(
          "aria-pressed",
          "true",
        );
        const saved = await dataset(page.request);
        expect(saved.comments).toHaveLength(4);
        expect(saved.overrides).toHaveLength(1);
        await demo.note("Local demo · sample product · fictional feedback");
        await demo.spotlight(reporting.locator(".card-head"), 1_600);
        await demo.clearSpotlight();
        await demo.pause(2_000);
      },
    );
    expect(new URL(page.url()).origin).toBe(origin);
    expect(errors).toEqual([]);
    await demo.card("Deploy your own app today at applet.one", "", 3_200);
  } finally {
    await teammate.close();
  }
});
