const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const os = require("node:os");
const net = require("node:net");
const { spawn } = require("node:child_process");
const { chromium } = require("playwright");
const { unzipSync, strFromU8 } = require("fflate");

const root = path.resolve(__dirname, "..");
const demo = path.resolve(root, "data");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
(async () => {
  const scratch = await fs.mkdtemp(
    path.join(os.tmpdir(), "priority-applet-test-"),
  );
  const project = path.join(scratch, "project");
  await fs.cp(root, project, {
    recursive: true,
    filter: (source) =>
      !["node_modules", ".applet", ".git"].includes(path.basename(source)),
  });
  await fs.symlink(
    path.join(root, "node_modules"),
    path.join(project, "node_modules"),
  );
  const probe = net.createServer();
  await new Promise((resolve) => probe.listen(0, "127.0.0.1", resolve));
  const port = probe.address().port;
  await new Promise((resolve) => probe.close(resolve));
  const origin = `http://127.0.0.1:${port}`;
  let process,
    browser,
    output = "";
  async function start() {
    process = spawn("applet", ["dev", "--port", String(port)], {
      cwd: project,
      env: {
        ...global.process.env,
        APPLET_INIT_CWD: project,
        INIT_CWD: project,
        PWD: project,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    process.stdout.on("data", (data) => {
      output += data;
    });
    process.stderr.on("data", (data) => {
      output += data;
    });
    for (let i = 0; i < 200; i++) {
      if (process.exitCode !== null) throw new Error(output);
      try {
        if ((await fetch(`${origin}/api/dataset`)).ok) return;
      } catch {}
      await sleep(100);
    }
    throw new Error(`Local runtime did not start: ${output}`);
  }
  async function stop() {
    if (!process || process.exitCode !== null) return;
    const exited = new Promise((resolve) => process.once("exit", resolve));
    process.kill("SIGTERM");
    await exited;
  }
  try {
    await start();
    browser = await chromium.launch({
      executablePath: processEnvChrome(),
      headless: true,
    });
    const page = await browser.newPage({ acceptDownloads: true });
    const errors = [];
    page.on("pageerror", (error) => {
      errors.push(error.message);
      console.error("Browser error:", error.message);
    });
    const cspErrors = [];
    page.on("console", (message) => {
      if (/Content Security Policy|violates.*directive/i.test(message.text()))
        cspErrors.push(message.text());
    });
    await page.goto(origin);
    await page
      .locator("#profile-person")
      .selectOption({ label: "Markus Andrezak · Admin" });
    await page.getByRole("button", { name: "Join board", exact: true }).click();
    await page.locator("#profile-dialog").waitFor({ state: "hidden" });
    assert.match(
      await page.locator("#profile-card").textContent(),
      /MA.*Markus Andrezak.*Admin/,
    );
    const memberContext = await browser.newContext();
    const member = await memberContext.newPage();
    member.on("pageerror", (error) => errors.push(error.message));
    await member.clock.install();
    await member.goto(origin);
    await member.getByLabel("First name", { exact: true }).fill("Ava");
    await member.getByLabel("Last name", { exact: true }).fill("Tester");
    await member
      .getByRole("button", { name: "Join board", exact: true })
      .click();
    await member.locator("#profile-dialog").waitFor({ state: "hidden" });
    assert.equal(await member.locator("#open-folder").isVisible(), false);
    await page.waitForFunction(() =>
      document
        .querySelector("#board-members")
        .getAttribute("aria-label")
        .includes("Ava Tester"),
    );
    for (const board of [page, member]) {
      assert.equal(await board.locator(".member-avatar").count(), 2);
      assert.match(
        await board.locator("#board-members").textContent(),
        /Shared with 2/,
      );
      assert.equal(
        await board.locator('.member-avatar[title="Ava Tester"]').textContent(),
        "AT",
      );
    }
    await page
      .getByRole("button", { name: "Upload folder", exact: true })
      .waitFor();
    await page.waitForFunction(
      () => !document.querySelector("#open-folder").disabled,
    );
    assert.equal(await page.locator("#download").isDisabled(), true);
    let files = [];
    async function collect(relative) {
      for (const entry of await fs.readdir(path.join(demo, relative), {
        withFileTypes: true,
      })) {
        const child = `${relative}/${entry.name}`;
        if (entry.isDirectory()) await collect(child);
        else if (entry.name.endsWith(".md")) files.push(child);
      }
    }
    for (const folder of ["input", "context", "output"]) await collect(folder);
    const uploadRoot = path.join(scratch, "demo");
    for (const relative of files) {
      await fs.mkdir(path.dirname(path.join(uploadRoot, relative)), {
        recursive: true,
      });
      await fs.copyFile(
        path.join(demo, relative),
        path.join(uploadRoot, relative),
      );
    }
    let confirmations = 0;
    page.on("dialog", async (dialog) => {
      confirmations++;
      await dialog.accept();
    });
    await page.locator("#folder-input").setInputFiles(uploadRoot);
    await page.waitForFunction(
      () => document.querySelectorAll(".card").length === 6,
    );
    assert.equal(confirmations, 1);
    assert.match(
      await page.locator("#status").textContent(),
      /saved Markdown files/,
    );
    let saved = (await (await fetch(`${origin}/api/dataset`)).json()).dataset;
    assert.equal(saved.files.length, files.length);
    await page.reload();
    await page.waitForFunction(
      () => document.querySelectorAll(".card").length === 6,
    );
    await member.waitForFunction(
      () => document.querySelectorAll(".card").length === 6,
    );
    assert.match(
      await member.locator("#profile-card").textContent(),
      /AT.*Ava Tester/,
    );
    assert.equal(
      await member
        .getByRole("button", { name: "Override", exact: true })
        .count(),
      0,
    );
    // Server checks cannot be bypassed by unhiding controls or forging input.
    const denied = await member.evaluate(async () => {
      const statuses = [];
      for (const [url, method] of [
        ["/api/dataset", "PUT"],
        ["/api/overrides", "PUT"],
        ["/api/comments", "DELETE"],
      ])
        statuses.push(
          (
            await fetch(url, {
              method,
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                isAdmin: true,
                author: "Markus Andrezak",
              }),
            })
          ).status,
        );
      return statuses;
    });
    assert.deepEqual(denied, [403, 403, 403]);
    await member
      .getByLabel("Add a comment", { exact: true })
      .fill("Hello from another browser");
    await member
      .getByRole("button", { name: "Post comment", exact: true })
      .click();
    await page
      .getByText("Hello from another browser", { exact: true })
      .waitFor();
    assert.equal(
      await page.locator(".comment-author").last().textContent(),
      "Ava Tester",
    );
    assert.equal(
      await page.locator(".comment-avatar").last().textContent(),
      "AT",
    );
    const memberColor = await member
      .locator("#profile-card .profile-avatar")
      .evaluate((node) => getComputedStyle(node).backgroundColor);
    assert.equal(
      await page
        .locator(".comment-avatar")
        .last()
        .evaluate((node) => getComputedStyle(node).backgroundColor),
      memberColor,
    );
    assert.notEqual(
      await page
        .locator("#profile-card .profile-avatar")
        .evaluate((node) => getComputedStyle(node).backgroundColor),
      memberColor,
    );
    assert.equal(
      await page.locator(".comment time").last().textContent(),
      "Just now",
    );
    assert.ok(await page.locator(".comment time").last().getAttribute("title"));
    // Older labels render compactly, and the timer updates in place.
    await member.locator(".comment time").evaluate((node) => {
      node.dateTime = new Date(Date.now() - 7200000).toISOString();
    });
    await member.clock.fastForward(30000);
    assert.equal(
      await member.locator(".comment time").textContent(),
      "2 h ago",
    );
    await member.clock.resume();
    assert.equal(await member.locator(".comment-delete").count(), 0);
    await page.locator(".comment").last().hover();
    await page
      .getByRole("button", { name: "Delete comment", exact: true })
      .click();
    await member
      .getByText("Hello from another browser", { exact: true })
      .waitFor({ state: "detached" });
    // Priority changes arrive without refreshing and do not erase a draft/caret.
    await member
      .getByLabel("Add a comment", { exact: true })
      .fill("Keep my multiplayer draft");
    await member
      .locator("#comment-body")
      .evaluate((node) => node.setSelectionRange(5, 5));
    const pin = await page.evaluate(async () => {
      const dataset = (await (await fetch("/api/dataset")).json()).dataset;
      const input = {
        run_id: document.querySelector("#toolbar select").value,
        cluster_id: [...document.querySelectorAll("[data-opportunity]")].at(-1)
          .dataset.opportunity,
        position: 1,
        reason: "Multiplayer priority",
        uploadedAt: dataset.uploadedAt,
        overrideRevision: dataset.overrideRevision,
      };
      const response = await fetch("/api/overrides", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });
      return { input, result: await response.json(), status: response.status };
    });
    assert.equal(pin.status, 200);
    await member.waitForFunction(
      (id) =>
        document.querySelector("[data-opportunity]").dataset.opportunity === id,
      pin.input.cluster_id,
    );
    assert.equal(
      await member.locator("#comment-body").inputValue(),
      "Keep my multiplayer draft",
    );
    assert.equal(
      await member
        .locator("#comment-body")
        .evaluate((node) => node.selectionStart),
      5,
    );
    const unpinStatus = await page.evaluate(
      async ({ input, result }) =>
        (
          await fetch("/api/overrides", {
            method: "DELETE",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              ...input,
              overrideRevision: result.overrideRevision,
            }),
          })
        ).status,
      pin,
    );
    assert.equal(unpinStatus, 200);
    await page.waitForFunction(() => !document.querySelector(".override-note"));
    await member.waitForFunction(
      () => !document.querySelector(".override-note"),
    );
    await member.locator("#profile-card").click();
    await member.locator("#profile-person").waitFor();
    assert.equal(
      await member
        .locator("#profile-person option")
        .filter({ hasText: "Ava Tester" })
        .count(),
      1,
    );
    await member.getByRole("button", { name: "Cancel", exact: true }).click();
    await memberContext.close();
    const originalTitles = await page.locator(".card h2").allTextContents();
    const originalScores = await page.locator(".card .score").allTextContents();
    // Selection is independent of rank and can be changed with the keyboard.
    const sendButton = page.getByRole("button", {
      name: "Post comment",
      exact: true,
    });
    assert.equal(
      await sendButton.locator("svg use").getAttribute("href"),
      "#lucide-send",
    );
    assert.equal(await sendButton.textContent(), "");
    assert.equal(await page.locator(".comment-form label").count(), 0);
    const selections = page.locator(".opportunity-select");
    assert.equal(await selections.first().getAttribute("aria-pressed"), "true");
    await page
      .getByLabel("Add a comment", { exact: true })
      .fill("Draft for first opportunity");
    await selections.nth(1).focus();
    await page.keyboard.press("Enter");
    assert.equal(await selections.nth(1).getAttribute("aria-pressed"), "true");
    assert.equal(
      await page.getByLabel("Add a comment", { exact: true }).inputValue(),
      "",
    );
    assert.match(
      await page.locator(".comments-list").textContent(),
      /No comments yet/,
    );
    await selections.first().click();
    assert.equal(
      await page.getByLabel("Add a comment", { exact: true }).inputValue(),
      "Draft for first opportunity",
    );
    const commentText =
      "<script>window.commentInjected = true</script>\nA persisted comment";
    const composer = page.getByLabel("Add a comment", { exact: true });
    await composer.fill("<script>window.commentInjected = true</script>");
    await composer.press("Shift+Enter");
    await page.keyboard.insertText("A persisted comment");
    assert.equal(await composer.inputValue(), commentText);
    assert.equal(await page.locator(".comment-body").count(), 0);
    await page.route("**/api/comments", (route) =>
      route.fulfill({
        status: 409,
        contentType: "application/json",
        body: JSON.stringify({ error: "Reload before trying again." }),
      }),
    );
    await page
      .getByRole("button", { name: "Post comment", exact: true })
      .click();
    await page
      .getByRole("status")
      .filter({ hasText: "Could not save comment" })
      .waitFor();
    assert.equal(
      await page.getByLabel("Add a comment", { exact: true }).inputValue(),
      commentText,
    );
    await page.unroute("**/api/comments");
    await composer.press("Enter");
    await page.locator(".comment-body").waitFor();
    assert.equal(
      await page.locator(".comment-body").textContent(),
      commentText,
    );
    assert.equal(await page.evaluate(() => window.commentInjected), undefined);
    assert.equal(
      await page
        .getByRole("button", { name: "Post comment", exact: true })
        .isDisabled(),
      true,
    );
    await selections.nth(1).click();
    assert.equal(await page.locator(".comment-body").count(), 0);
    await selections.first().click();
    await page.setViewportSize({ width: 1600, height: 1000 });
    const boardBounds = await page
      .locator(".opportunities-board")
      .boundingBox();
    const panelBounds = await page.locator(".comments-panel").boundingBox();
    assert.ok(panelBounds.x >= boardBounds.x + boardBounds.width);
    async function assertComposerAboveFold() {
      await page.waitForFunction(() => {
        const button = document
          .querySelector(".comment-form button")
          .getBoundingClientRect();
        const textarea = document
          .querySelector(".comment-form textarea")
          .getBoundingClientRect();
        const panel = document
          .querySelector(".comments-panel")
          .getBoundingClientRect();
        return (
          textarea.top >= 0 &&
          button.bottom <= textarea.bottom &&
          button.right <= textarea.right &&
          button.top >= textarea.top &&
          button.bottom <= innerHeight - 8 &&
          panel.bottom <= innerHeight
        );
      });
    }
    await assertComposerAboveFold();
    await page.setViewportSize({ width: 1440, height: 720 });
    await assertComposerAboveFold();
    // Long threads scroll internally without pushing the composer off screen.
    await page.locator(".comments-list").evaluate((list) => {
      for (let i = 0; i < 30; i++) {
        const p = document.createElement("p");
        p.textContent = "An additional comment in a long discussion.";
        list.append(p);
      }
    });
    assert.equal(
      await page
        .locator(".comments-list")
        .evaluate((list) => list.scrollHeight > list.clientHeight),
      true,
    );
    await assertComposerAboveFold();
    await page.evaluate(() => window.scrollTo(0, 400));
    await assertComposerAboveFold();
    await page.evaluate(() => window.scrollTo(0, 0));
    await assertComposerAboveFold();
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
    );
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.reload();
    await page.locator(".comment-body").waitFor();
    assert.equal(
      await page.locator(".comment-body").textContent(),
      commentText,
    );
    // A save finishing after navigating away and back must refresh the new panel.
    let finishComment;
    const commentGate = new Promise((resolve) => {
      finishComment = resolve;
    });
    await page.route("**/api/comments", async (route) => {
      const response = await route.fetch();
      await commentGate;
      await route.fulfill({ response });
    });
    await page
      .getByLabel("Add a comment", { exact: true })
      .fill("Saved while navigating");
    const sending = page.waitForRequest("**/api/comments");
    await page
      .getByRole("button", { name: "Post comment", exact: true })
      .click();
    await sending;
    await page.getByRole("button", { name: /^Clusters/ }).click();
    await page
      .getByRole("button", { name: "Opportunities", exact: true })
      .click();
    finishComment();
    await page.waitForFunction(
      () => document.querySelectorAll(".comment-body").length === 2,
    );
    assert.equal(
      await page.getByLabel("Add a comment", { exact: true }).isEnabled(),
      true,
    );
    await page.unroute("**/api/comments");
    saved = (await (await fetch(`${origin}/api/dataset`)).json()).dataset;
    assert.equal(saved.comments.length, 2);
    const toDelete = page.locator(".comment").nth(1);
    const deleteButton = toDelete.getByRole("button", {
      name: "Delete comment",
    });
    await page.mouse.move(0, 0);
    assert.equal(
      await deleteButton.evaluate((node) => getComputedStyle(node).opacity),
      "0",
    );
    await toDelete.hover();
    assert.equal(
      await deleteButton.evaluate((node) => getComputedStyle(node).opacity),
      "1",
    );
    await page
      .getByLabel("Add a comment", { exact: true })
      .fill("Keep this draft");
    await page.route("**/api/comments", (route) =>
      route.fulfill({
        status: 409,
        contentType: "application/json",
        body: JSON.stringify({ error: "Reload before trying again." }),
      }),
    );
    await toDelete.hover();
    await deleteButton.click();
    await page
      .getByRole("status")
      .filter({ hasText: "Could not delete comment" })
      .waitFor();
    assert.equal(await page.locator(".comment").count(), 2);
    await page.unroute("**/api/comments");
    await deleteButton.focus();
    await page.keyboard.press("Enter");
    await page.waitForFunction(
      () => document.querySelectorAll(".comment").length === 1,
    );
    assert.equal(
      await page.getByLabel("Add a comment", { exact: true }).inputValue(),
      "Keep this draft",
    );
    assert.equal(
      await page.locator(".comment-body").textContent(),
      commentText,
    );
    await page.reload();
    await page.locator(".comment-body").waitFor();
    assert.equal(await page.locator(".comment").count(), 1);
    saved = (await (await fetch(`${origin}/api/dataset`)).json()).dataset;
    assert.equal(saved.comments.length, 1);
    async function openOverride(title, editing = false) {
      const card = page.locator(".card").filter({
        has: page.getByRole("heading", { name: title, exact: true }),
      });
      await card.locator("summary").click();
      const overrideButton = card.getByRole("button", {
        name: editing ? "Edit override" : "Override",
        exact: true,
      });
      assert.ok(
        (await overrideButton.getAttribute("class"))
          .split(" ")
          .includes("primary"),
      );
      assert.equal(
        await overrideButton.locator("svg use").getAttribute("href"),
        "#lucide-flag",
      );
      await overrideButton.click();
      await page.locator("#override-dialog[open]").waitFor();
    }
    async function savePin(title, position, reason) {
      await openOverride(title);
      assert.equal(
        await page.getByLabel("Position", { exact: true }).inputValue(),
        "1",
      );
      await page
        .getByLabel("Position", { exact: true })
        .selectOption(String(position));
      await page.getByLabel("Reason", { exact: true }).fill(reason);
      await page
        .getByRole("button", { name: "Save override", exact: true })
        .click();
      await page.locator("#override-dialog").waitFor({ state: "detached" });
    }
    await openOverride(originalTitles[5]);
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    assert.deepEqual(
      (await (await fetch(`${origin}/api/dataset`)).json()).dataset,
      saved,
    );
    // Cancel leaves the card expanded; close it before using the helper again.
    await page.locator(".card summary").nth(5).click();
    await savePin(
      originalTitles[5],
      3,
      "<script>window.overrideInjected = true</script>",
    );
    assert.deepEqual(await page.locator(".card h2").allTextContents(), [
      originalTitles[0],
      originalTitles[1],
      originalTitles[5],
      originalTitles[2],
      originalTitles[3],
      originalTitles[4],
    ]);
    assert.equal(
      (await page.locator(".card .score").allTextContents())[2],
      originalScores[5],
    );
    assert.equal(await page.evaluate(() => window.overrideInjected), undefined);
    await savePin(originalTitles[4], 1, "First priority");
    await openOverride(originalTitles[3]);
    await page.getByLabel("Position", { exact: true }).selectOption("3");
    assert.match(
      await page.locator("#override-warning").textContent(),
      /replaces the manual override/,
    );
    await page
      .getByLabel("Reason", { exact: true })
      .fill("Replace occupied pin");
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
    );
    await page
      .getByRole("button", { name: "Save override", exact: true })
      .click();
    await page.locator("#override-dialog").waitFor({ state: "detached" });
    await page.setViewportSize({ width: 1280, height: 900 });
    assert.equal(
      (await page.locator(".card h2").allTextContents())[0],
      originalTitles[4],
    );
    assert.equal(
      (await page.locator(".card h2").allTextContents())[2],
      originalTitles[3],
    );
    await openOverride(originalTitles[3], true);
    assert.equal(
      await page.getByLabel("Position", { exact: true }).inputValue(),
      "3",
    );
    await page.getByLabel("Position", { exact: true }).selectOption("2");
    await page
      .getByRole("button", { name: "Save override", exact: true })
      .click();
    await page.locator("#override-dialog").waitFor({ state: "detached" });
    await openOverride(originalTitles[3], true);
    await page
      .getByRole("button", { name: "Remove override", exact: true })
      .click();
    await page.locator("#override-dialog").waitFor({ state: "detached" });
    saved = (await (await fetch(`${origin}/api/dataset`)).json()).dataset;
    assert.equal(saved.overrides.length, 1);
    await page.reload();
    await page.waitForFunction(
      () => document.querySelectorAll(".card").length === 6,
    );
    assert.equal(
      (await page.locator(".card h2").allTextContents())[0],
      originalTitles[4],
    );
    assert.match(
      await page.locator(".card .override-note").textContent(),
      /First priority/,
    );
    assert.equal(
      await page.locator(".override-pill").textContent(),
      "Manual override",
    );
    assert.equal(
      await page
        .locator(".override-pill")
        .evaluate((node) => getComputedStyle(node).backgroundColor),
      "rgb(254, 226, 226)",
    );
    await page.locator(".card summary").first().click();
    await page.locator(".card .source-link").first().click();
    await page.locator("#source-dialog[open] mark").waitFor();
    await page.getByRole("button", { name: "Close source" }).click();
    await page.getByRole("button", { name: /^Clusters/ }).click();
    assert.equal(await page.locator(".card").count(), 6);
    for (const name of ["Inputs", "Context", "Reports"]) {
      await page
        .getByRole("button", { name: new RegExp(`^${name}`), exact: false })
        .first()
        .click();
      await page.locator(".file-list").waitFor();
    }
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
    );
    await page.setViewportSize({ width: 1280, height: 900 });
    const downloadPromise = page.waitForEvent("download");
    await page.locator("#download").click();
    const download = await downloadPromise;
    const zip = unzipSync(await fs.readFile(await download.path()));
    assert.equal(Object.keys(zip).length, files.length);
    for (const file of saved.files)
      assert.equal(strFromU8(zip[file.path]), file.content);
    const adminCookies = (await page.context().cookies())
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");
    const bad = await fetch(`${origin}/api/dataset`, {
      method: "PUT",
      headers: {
        origin,
        "content-type": "application/json",
        cookie: adminCookies,
      },
      body: JSON.stringify({
        name: "bad",
        files: [{ path: "../bad.md", content: "bad" }],
      }),
    });
    assert.equal(bad.status, 400);
    assert.deepEqual(
      (await (await fetch(`${origin}/api/dataset`)).json()).dataset,
      saved,
    );
    const forbidden = await fetch(`${origin}/api/dataset`, {
      method: "PUT",
      headers: {
        origin: "https://evil.example",
        "content-type": "application/json",
      },
      body: "{}",
    });
    assert.equal(forbidden.status, 403);
    await stop();
    await start();
    assert.deepEqual(
      (await (await fetch(`${origin}/api/dataset`)).json()).dataset,
      saved,
    );
    // Replacement deletes absent files, accepts raw reports even when not structurally valid,
    // and renders uploaded text without executing HTML.
    await fs.rm(uploadRoot, { recursive: true });
    await fs.mkdir(path.join(uploadRoot, "input"), { recursive: true });
    await fs.writeFile(
      path.join(uploadRoot, "input", "only.md"),
      "<script>window.injected = true</script>",
    );
    await page.reload();
    await page.waitForFunction(
      () => !document.querySelector("#open-folder").disabled,
    );
    await page.locator("#folder-input").setInputFiles(uploadRoot);
    await page.waitForFunction(
      () => document.querySelector("#input-count").textContent === "1",
    );
    assert.equal(confirmations, 2);
    const replacement = (await (await fetch(`${origin}/api/dataset`)).json())
      .dataset;
    assert.equal(replacement.files.length, 1);
    assert.equal(replacement.overrides.length, 0);
    assert.equal(replacement.comments.length, 0);
    await page.getByRole("button", { name: /^Inputs/ }).click();
    await page.getByRole("button", { name: "only.md", exact: true }).click();
    assert.match(await page.locator(".reader pre").textContent(), /<script>/);
    assert.equal(await page.evaluate(() => window.injected), undefined);
    // Cancelling the one global confirmation leaves the saved dataset unchanged.
    page.removeAllListeners("dialog");
    page.on("dialog", (dialog) => dialog.dismiss());
    await page.locator("#folder-input").setInputFiles(uploadRoot);
    await page.waitForFunction(
      () => !document.querySelector("#open-folder").disabled,
    );
    assert.deepEqual(
      (await (await fetch(`${origin}/api/dataset`)).json()).dataset,
      replacement,
    );
    assert.deepEqual(errors, []);
    assert.deepEqual(cspErrors, []);
    console.log(
      "PASS: manual pin ordering/edit/removal/collision, upload confirmation, viewer parity, reload/restart persistence, ZIP round-trip, replacement, cancellation, validation, XSS, CSP, and mobile layout",
    );
  } finally {
    await browser?.close();
    await stop();
    await fs.rm(scratch, { recursive: true, force: true });
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

function processEnvChrome() {
  return (
    process.env.CHROME_PATH ||
    (process.platform === "darwin"
      ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
      : undefined)
  );
}
