import assert from "node:assert/strict";
import { mkdtemp, cp, symlink, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import net from "node:net";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { blankWorkbook, UNIVER_VERSION } from "../shared/contracts.js";
import { parseCsv } from "../shared/csv.js";
const root = fileURLToPath(new URL("../", import.meta.url));
const scratch = await mkdtemp(path.join(tmpdir(), "single-player-sheets-"));
const project = path.join(scratch, "project");
await cp(root, project, {
  recursive: true,
  filter: (p) =>
    !["node_modules", ".applet", ".applet-build", ".wrangler", ".git"].includes(
      path.basename(p),
    ),
});
await symlink(
  path.join(root, "node_modules"),
  path.join(project, "node_modules"),
);
const probe = net.createServer();
await new Promise((resolve) => probe.listen(0, "127.0.0.1", resolve));
const port = probe.address().port;
await new Promise((resolve) => probe.close(resolve));
const origin = `http://127.0.0.1:${port}`;
let worker,
  output = "",
  browser;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function start() {
  worker = spawn("applet", ["dev", "--port", String(port)], {
    cwd: project,
    env: {
      ...process.env,
      APPLET_INIT_CWD: project,
      INIT_CWD: project,
      PWD: project,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  for (const stream of [worker.stdout, worker.stderr])
    stream.on("data", (data) => (output += data));
  for (let n = 0; n < 200; n++) {
    if (worker.exitCode !== null) throw new Error(output);
    try {
      if ((await fetch(`${origin}/api/workbooks`)).ok) return;
    } catch {}
    await sleep(100);
  }
  throw new Error(output);
}
async function stop() {
  if (worker && worker.exitCode === null) {
    const done = new Promise((resolve) => worker.once("exit", resolve));
    worker.kill("SIGTERM");
    await done;
  }
}
async function api(route = "", method = "GET", body) {
  const response = await fetch(`${origin}/api/workbooks${route}`, {
    method,
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: response.status, data: await response.json() };
}
try {
  await start();
  const book = (
    await api("", "POST", {
      title: "API round trip",
      snapshot: blankWorkbook(),
    })
  ).data;
  const payload = {
    baseRevision: 1,
    mutationId: crypto.randomUUID(),
    schemaVersion: 1,
    univerVersion: UNIVER_VERSION,
    snapshot: book.snapshot,
  };
  const concurrent = await Promise.all([
    api(`/${book.id}/snapshot`, "PUT", payload),
    api(`/${book.id}/snapshot`, "PUT", {
      ...payload,
      mutationId: crypto.randomUUID(),
    }),
  ]);
  assert.deepEqual(concurrent.map((r) => r.status).sort(), [200, 409]);
  assert.equal(
    (await api(`/${book.id}/snapshot`, "PUT", payload)).data.revision,
    2,
  );
  assert.equal(
    (
      await api(`/${book.id}/snapshot`, "PUT", {
        ...payload,
        snapshot: { ...payload.snapshot, name: "Changed" },
      })
    ).status,
    409,
  );
  const rejected = await fetch(`${origin}/api/workbooks`, {
    method: "POST",
    headers: {
      origin: "https://evil.example",
      "content-type": "application/json",
    },
    body: "{}",
  });
  assert.equal(rejected.status, 403);
  await stop();
  await start();
  assert.equal((await api(`/${book.id}`)).data.revision, 2);
  console.log(
    "Worker: concurrent revisions, idempotent retries, origin checks, restart persistence passed.",
  );
  browser = await chromium.launch({
    executablePath:
      process.env.CHROME_PATH ||
      (process.platform === "darwin"
        ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
        : undefined),
    headless: true,
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") console.error("Browser console:", msg.text());
  });
  await api(`/${book.id}`, "DELETE", { baseRevision: 2 });
  await page.goto(origin);
  await page.locator("#editor canvas:visible").first().waitFor();
  assert.equal(
    await page.locator(".editor-title").textContent(),
    "Untitled spreadsheet",
  );
  assert.equal(
    (await api()).data.length,
    1,
    "First visit should create just one blank workbook",
  );
  await page.locator(".file-menu summary").click();
  await page.getByRole("button", { name: "Try the studio example" }).click();
  await Promise.race([
    page.getByRole("button", { name: "Leave", exact: true }).waitFor(),
    page.waitForFunction(
      () =>
        document.querySelector(".editor-title")?.textContent ===
        "Studio operations",
    ),
  ]);
  if (
    await page.getByRole("button", { name: "Leave", exact: true }).isVisible()
  )
    await page.getByRole("button", { name: "Leave", exact: true }).click();
  await page.waitForFunction(
    () =>
      document.querySelector(".editor-title")?.textContent ===
      "Studio operations",
  );
  await page
    .locator("#editor canvas:visible")
    .first()
    .waitFor({ timeout: 30000 });
  await page.waitForTimeout(1500);
  for (const selector of [
    '#editor [data-u-comp="ribbon-header-menu"] [role="tablist"]',
    '#editor [data-u-comp="ribbon-toolbar"]',
  ]) {
    const row = page.locator(selector);
    assert.equal(
      await row.evaluate((node) => getComputedStyle(node).justifyContent),
      "flex-start",
    );
    const firstItem = await row.locator(":scope > *").first().boundingBox();
    assert.ok(
      firstItem && firstItem.x < 120,
      `Ribbon row should start at the left: ${selector}`,
    );
  }
  async function checkCompactHeader() {
    const header = await page.locator(".editor-header").boundingBox();
    const icon = await page.locator(".editor-header .logo").boundingBox();
    const title = await page.locator(".editor-title").boundingBox();
    const subline = await page.locator(".save-info").boundingBox();
    assert.ok(header && header.height <= 54, "Header should stay compact");
    assert.ok(
      icon && icon.width <= 28 && icon.height <= 28,
      "Header icon should be small",
    );
    assert.ok(
      title && subline && subline.y - title.y - title.height <= 2,
      "Title and subline should be close together",
    );
  }
  await checkCompactHeader();
  async function checkFilePosition() {
    const file = await page.locator(".file-menu summary").boundingBox();
    const start = await page
      .locator('#editor [data-u-comp="ribbon-header-menu"] [role="tab"]')
      .first()
      .boundingBox();
    assert.ok(file && start, "File and Start must both be visible");
    assert.ok(
      Math.abs(file.y + file.height / 2 - start.y - start.height / 2) < 5,
      "File should share the Start menu row",
    );
    assert.ok(
      file.x + file.width <= start.x,
      "File should sit immediately left of Start without overlapping",
    );
  }
  await checkFilePosition();
  assert.equal(
    await page.locator(".editor-header button").count(),
    0,
    "No dedicated save button in the header",
  );
  const saveInfo = await page.locator(".save-info").boundingBox();
  assert.ok(
    saveInfo && saveInfo.x < 100,
    "Cloud-save status should be on the left",
  );
  const id = page.url().split("#")[1];
  const cell = (book, row, column) =>
    book.snapshot.sheets[book.snapshot.sheetOrder[0]].cellData[row]?.[column];
  async function waitFor(check, message) {
    for (let i = 0; i < 120; i++) {
      if (await check()) return;
      await sleep(100);
    }
    throw new Error(message);
  }
  async function edit(target, address, value) {
    const name = target.locator("#editor input:not([aria-label])");
    await name.fill(address);
    await name.press("Enter");
    await target.keyboard.type(value);
    await target.keyboard.press("Enter");
  }
  await waitFor(async () => {
    const data = (await api(`/${id}`)).data;
    return (
      data.snapshot.sheetOrder.length === 4 &&
      typeof cell(data, 3, 1)?.v === "number" &&
      cell(data, 3, 1).v > 200000
    );
  }, "Sample cross-sheet forecast did not calculate and save");
  const sampleData = (await api(`/${id}`)).data;
  const projects = Object.values(sampleData.snapshot.sheets).find(
    (sheet) => sheet.name === "Projects",
  );
  assert.equal(
    projects.cellData[4][6].v,
    15000,
    "Project revenue should use the rate from Assumptions",
  );
  assert.equal(
    projects.cellData[4][10].v,
    7500,
    "Project profit should include internal and external costs",
  );
  assert.equal(
    cell(sampleData, 4, 4).v,
    15,
    "Dashboard should count all engagements",
  );
  assert.ok(
    typeof cell(sampleData, 3, 7).v === "number",
    "Cash forecast should calculate across sheets",
  );
  const baselineRevenue = cell(sampleData, 3, 1).v;
  await page.getByText("Assumptions", { exact: true }).click();
  await edit(page, "B10", "0.8");
  await waitFor(
    async () =>
      Math.abs(
        cell((await api(`/${id}`)).data, 3, 1).v - baselineRevenue * 0.8,
      ) < 0.01,
    "Changing scenario should recalculate the dashboard",
  );
  await edit(page, "B10", "1");
  await waitFor(
    async () => cell((await api(`/${id}`)).data, 3, 1).v === baselineRevenue,
    "Restoring scenario should restore the revenue forecast",
  );
  await page.locator(".file-menu summary").click();
  const assumptionsDownloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV…" }).click();
  const assumptionsDownload = await assumptionsDownloadPromise;
  assert.match(assumptionsDownload.suggestedFilename(), /Assumptions\.csv$/);
  const assumptionsCsv = parseCsv(
    await readFile(await assumptionsDownload.path(), "utf8"),
  );
  assert.equal(
    assumptionsCsv[0][0],
    "Planning assumptions",
    "Export must use the selected sheet, not the first sheet",
  );
  await page.getByText("Dashboard", { exact: true }).click();
  await page.screenshot({ path: path.join(scratch, "studio-sample.png") });
  console.log(
    "Browser: studio cross-sheet forecasts and editable scenario recalculation passed.",
  );
  await edit(page, "B4", "150");
  await waitFor(
    async () => cell((await api(`/${id}`)).data, 3, 1)?.v === 150,
    "Edited cell did not autosave",
  );
  await edit(page, "E4", "=B4*2");
  await waitFor(
    async () => cell((await api(`/${id}`)).data, 3, 4)?.v === 300,
    "Formula did not calculate and save",
  );
  assert.equal(cell((await api(`/${id}`)).data, 3, 4).f, "=B4*2");
  await page.reload();
  await page.locator("#editor canvas:visible").first().waitFor();
  await page.waitForTimeout(800);
  assert.equal(cell((await api(`/${id}`)).data, 3, 4).v, 300);
  console.log(
    "Browser: edit, formula calculation, autosave and reopen passed.",
  );
  // A second isolated browser has no recovery record and loads this revision.
  const secondContext = await browser.newContext();
  const second = await secondContext.newPage();
  second.on("pageerror", (e) => errors.push(e.message));
  await second.goto(origin);
  await second.waitForURL((url) => url.hash === `#${id}`);
  await second.locator("#editor canvas:visible").first().waitFor();
  await second.waitForTimeout(600);
  await edit(page, "B4", "180");
  await waitFor(
    async () => cell((await api(`/${id}`)).data, 3, 1)?.v === 180,
    "First tab save failed",
  );
  await edit(second, "B4", "999");
  await second
    .getByText("A newer cloud version exists.", { exact: false })
    .first()
    .waitFor();
  assert.equal(await second.locator("#save-status").textContent(), "Conflict");
  assert.equal(cell((await api(`/${id}`)).data, 3, 1).v, 180);
  await second
    .getByRole("button", { name: "Preserve as new workbook" })
    .click();
  await second.getByRole("button", { name: "Leave", exact: true }).click();
  await second.waitForURL((url) => url.hash !== `#${id}`);
  await second.locator("#editor canvas:visible").first().waitFor();
  const copyId = second.url().split("#")[1];
  assert.notEqual(copyId, id);
  assert.equal(cell((await api(`/${copyId}`)).data, 3, 1).v, 999);
  console.log(
    "Browser: stale tab blocked, recovery-as-copy preserved both versions.",
  );
  await secondContext.close();
  // A lost successful response must retry byte-for-byte, without incrementing twice.
  let droppedBody,
    droppedRevision,
    retries = 0;
  await page.route("**/api/workbooks/*/snapshot", async (route) => {
    const text = route.request().postData();
    if (!droppedBody) {
      droppedBody = text;
      const response = await route.fetch();
      droppedRevision = (await response.json()).revision;
      await route.abort("failed");
    } else {
      assert.equal(text, droppedBody);
      retries++;
      await route.continue();
    }
  });
  await edit(page, "B4", "200");
  await waitFor(
    async () =>
      retries > 0 &&
      (await page.locator("#save-status").textContent()) === "Saved",
    "Lost response did not safely retry",
  );
  assert.equal((await api(`/${id}`)).data.revision, droppedRevision);
  await page.unroute("**/api/workbooks/*/snapshot");
  console.log(
    "Browser: lost response retried with stable mutation ID and payload.",
  );
  // Offline edits survive reload through IndexedDB, then reconnect safely.
  await context.setOffline(true);
  await edit(page, "B4", "220");
  await page.waitForTimeout(1400);
  const local = await page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const request = indexedDB.open("single-player-sheets", 1);
        request.onsuccess = () => {
          const db = request.result;
          const req = db
            .transaction("workbooks")
            .objectStore("workbooks")
            .getAll();
          req.onsuccess = () => resolve(req.result);
          req.onerror = reject;
        };
      }),
  );
  assert.ok(local.some((r) => r.generation > r.savedGeneration));
  await context.setOffline(false);
  await page.keyboard.press("ControlOrMeta+s");
  await waitFor(
    async () => cell((await api(`/${id}`)).data, 3, 1)?.v === 220,
    "Offline edits did not reconnect",
  );
  console.log("Browser: offline recovery record and reconnect passed.");
  // Simulate an unreachable API while keeping the app shell available, then
  // reload the page: the only source of these edits is IndexedDB recovery.
  await page.route(`**/api/workbooks/${id}**`, (route) =>
    route.abort("failed"),
  );
  await edit(page, "B4", "230");
  await page.waitForTimeout(1400);
  page.once("dialog", (dialog) => dialog.accept());
  await page.reload();
  await page.locator("#editor canvas:visible").first().waitFor();
  await page.getByText("Offline cached workbook.", { exact: false }).waitFor();
  assert.equal(cell((await api(`/${id}`)).data, 3, 1).v, 220);
  await page.unroute(`**/api/workbooks/${id}**`);
  await page.locator(".file-menu summary").click();
  await page.getByRole("button", { name: "Save now", exact: true }).click();
  await waitFor(
    async () => cell((await api(`/${id}`)).data, 3, 1)?.v === 230,
    "Reloaded recovery edits were not restored",
  );
  assert.ok(
    cell((await api(`/${id}`)).data, 0, 0).s,
    "Cell formatting was lost",
  );
  console.log(
    "Browser: local edits survived reload, then saved from recovery.",
  );
  await page.locator(".file-menu summary").click();
  await page.getByRole("button", { name: "Open workbook…" }).click();
  await page
    .getByRole("heading", { name: "Open workbook", exact: true })
    .waitFor();
  const card = page.locator(".workbook-card").filter({
    has: page.getByRole("button", { name: "Studio operations", exact: true }),
  });
  await card.getByRole("button", { name: "Rename" }).click();
  await page
    .getByRole("textbox", { name: "Workbook title" })
    .fill("Renamed budget");
  await page
    .locator("#dialog")
    .getByRole("button", { name: "Rename", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Renamed budget", exact: true })
    .waitFor();
  assert.equal((await api(`/${id}`)).data.snapshot.name, "Renamed budget");
  assert.equal(
    await page.locator(".editor-title").textContent(),
    "Renamed budget",
  );
  const renamed = page.locator(".workbook-card").filter({
    has: page.getByRole("button", { name: "Renamed budget", exact: true }),
  });
  await renamed.getByRole("button", { name: "Duplicate" }).click();
  await page
    .getByRole("button", { name: "Renamed budget (copy)", exact: true })
    .waitFor();
  const duplicate = page.locator(".workbook-card").filter({
    has: page.getByRole("button", {
      name: "Renamed budget (copy)",
      exact: true,
    }),
  });
  await duplicate.getByRole("button", { name: "Delete" }).click();
  await page
    .locator("#dialog")
    .getByRole("button", { name: "Delete", exact: true })
    .click();
  await waitFor(
    async () =>
      !(await page
        .getByRole("button", { name: "Renamed budget (copy)", exact: true })
        .count()),
    "Delete failed",
  );
  await page
    .getByRole("button", { name: "Untitled spreadsheet", exact: true })
    .click();
  await Promise.race([
    page
      .getByRole("button", { name: "Open cloud version", exact: true })
      .waitFor(),
    page
      .locator("#dialog")
      .getByRole("button", { name: "Leave", exact: true })
      .waitFor(),
    page.waitForFunction(
      () =>
        document.querySelector(".editor-title")?.textContent ===
        "Untitled spreadsheet",
    ),
  ]);
  if (
    await page
      .locator("#dialog")
      .getByRole("button", { name: "Leave", exact: true })
      .isVisible()
  )
    await page.getByRole("button", { name: "Leave", exact: true }).click();
  await Promise.race([
    page
      .getByRole("button", { name: "Open cloud version", exact: true })
      .waitFor(),
    page.waitForFunction(
      () =>
        document.querySelector(".editor-title")?.textContent ===
        "Untitled spreadsheet",
    ),
  ]);
  if (
    await page
      .getByRole("button", { name: "Open cloud version", exact: true })
      .isVisible()
  )
    await page
      .getByRole("button", { name: "Open cloud version", exact: true })
      .click();
  await page.waitForFunction(
    () =>
      document.querySelector(".editor-title")?.textContent ===
      "Untitled spreadsheet",
  );
  await page.waitForTimeout(1500);
  await page.waitForFunction(
    () => document.querySelector("#save-status")?.textContent === "Saved",
  );
  const previousBlankURL = page.url();
  await page.locator(".file-menu summary").click();
  await page
    .getByRole("button", { name: "New blank spreadsheet", exact: true })
    .click();
  await page.waitForURL((url) => url.href !== previousBlankURL);
  await page.locator("#editor canvas:visible").first().waitFor();
  await page.waitForTimeout(1500);
  await page.waitForFunction(
    () => document.querySelector("#save-status")?.textContent === "Saved",
  );
  await page.locator(".file-menu summary").click();
  await page
    .getByRole("button", { name: "Save as copy…", exact: true })
    .click();
  await page.waitForFunction(
    () =>
      document.querySelector(".editor-title")?.textContent ===
      "Untitled spreadsheet (copy)",
  );
  console.log(
    "Browser: direct blank/latest startup, File menu create/open/save-as-copy and workbook management passed.",
  );
  await page.waitForTimeout(1500);
  await page.waitForFunction(
    () => document.querySelector("#save-status")?.textContent === "Saved",
  );
  const beforeImport = page.url();
  const workbookCount = (await api()).data.length;
  await page.locator(".file-menu summary").click();
  await page.getByRole("button", { name: "Import CSV…" }).click();
  await page.getByLabel("CSV file").setInputFiles({
    name: "Quarterly data.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(
      '\uFEFFName;Amount;Notes;Identifier\r\nAda;1250.5;"She said ""hello"";\nnext line";00123\r\nBen;-12.5;=1+1;1234567890123456\r\nTotal;;;\r\n',
    ),
  });
  await page.getByLabel("Delimiter", { exact: true }).selectOption(";");
  await page
    .locator("#dialog")
    .getByRole("button", { name: "Import", exact: true })
    .click();
  await page.waitForURL((url) => url.href !== beforeImport);
  await page.locator("#editor canvas:visible").first().waitFor();
  assert.equal(
    await page.locator(".editor-title").textContent(),
    "Quarterly data",
  );
  const csvId = page.url().split("#")[1];
  let imported = (await api(`/${csvId}`)).data;
  assert.equal((await api()).data.length, workbookCount + 1);
  assert.equal(cell(imported, 1, 1).v, 1250.5);
  assert.equal(cell(imported, 1, 2).v, 'She said "hello";\nnext line');
  assert.equal(cell(imported, 1, 3).v, "00123");
  assert.equal(cell(imported, 2, 2).v, "=1+1");
  assert.equal(
    cell(imported, 2, 2).f,
    undefined,
    "CSV formula text must not execute",
  );
  assert.equal(cell(imported, 2, 3).v, "1234567890123456");
  await page.waitForTimeout(1000);
  await edit(page, "B4", "=SUM(B2:B3)");
  await waitFor(
    async () => cell((await api(`/${csvId}`)).data, 3, 1)?.v === 1238,
    "Imported numbers should participate in formulas",
  );
  await page.locator(".file-menu summary").click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV…" }).click();
  const download = await downloadPromise;
  const exported = parseCsv(await readFile(await download.path(), "utf8"));
  assert.match(
    download.suggestedFilename(),
    /Quarterly data - Imported data\.csv/,
  );
  assert.deepEqual(exported[0], ["Name", "Amount", "Notes", "Identifier"]);
  assert.equal(exported[1][2], 'She said "hello";\nnext line');
  assert.equal(exported[1][3], "00123");
  assert.equal(
    exported[2][2],
    "'=1+1",
    "Export must neutralize formula-like text",
  );
  assert.equal(
    exported[3][1],
    "1238",
    "Export should contain calculated values, not formulas",
  );
  const beforeBadImport = (await api()).data.length;
  await page.locator(".file-menu summary").click();
  await page.getByRole("button", { name: "Import CSV…" }).click();
  await page.getByLabel("CSV file").setInputFiles({
    name: "broken.csv",
    mimeType: "text/csv",
    buffer: Buffer.from('"not closed'),
  });
  await page
    .locator("#dialog")
    .getByRole("button", { name: "Import", exact: true })
    .click();
  await page
    .locator("#dialog")
    .getByRole("alert")
    .filter({ hasText: "not closed" })
    .waitFor();
  assert.equal(
    (await api()).data.length,
    beforeBadImport,
    "Invalid import must not create a workbook",
  );
  await page
    .locator("#dialog")
    .getByRole("button", { name: "Cancel", exact: true })
    .click();
  assert.equal(
    await page.locator(".editor-title").textContent(),
    "Quarterly data",
  );
  console.log(
    "Browser: CSV import/export, delimiters, Unicode, quoted multiline fields, safe formula text, calculated values and invalid-file handling passed.",
  );
  // Exercise the integration module directly, without exposing any test API in
  // the application. This verifies actual OSS plugin resources after server
  // persistence, duplication (new workbook identity), dispose and restore.
  const moduleURL = await page.evaluate(() =>
    performance
      .getEntriesByType("resource")
      .map((r) => r.name)
      .find((name) => /\/assets\/editor-.*\.js$/.test(name)),
  );
  const featurePage = await context.newPage();
  await featurePage.route("**/assets/main.js", (route) =>
    route.fulfill({ contentType: "text/javascript", body: "" }),
  );
  await featurePage.goto(origin);
  const featureResult = await featurePage.evaluate(
    async ({ initial, moduleURL }) => {
      const { mountEditor } = await import(moduleURL);
      const container = document.createElement("div");
      container.style.cssText = "width:1000px;height:650px";
      document.body.append(container);
      let instance = mountEditor(container, initial, () => {});
      const book = instance.api.getActiveWorkbook();
      const sheet = book.getActiveSheet();
      sheet.getRange("A1:B3").setValues([
        ["Item", "Value"],
        ["A", 3],
        ["B", 7],
      ]);
      sheet.getRange("A2:B3").sort({ column: 1, ascending: false });
      sheet.getRange("B2:B3").setNumberFormat("0.00").setFontWeight("bold");
      sheet.getRange("D1:E1").merge();
      sheet.setFrozenRows(1);
      sheet.getRange("A1:B3").createFilter();
      sheet
        .getRange("B2:B3")
        .setDataValidation(
          instance.api.newDataValidation().requireNumberBetween(0, 100).build(),
        );
      sheet.addConditionalFormattingRule(
        sheet
          .getRange("B2:B3")
          .createConditionalFormattingRule()
          .whenNumberGreaterThan(5)
          .setBackground("#ff0000")
          .build(),
      );
      sheet.getRange("A2").createOrUpdateNote({
        note: "Persistent note",
        width: 160,
        height: 100,
      });
      await sheet.getRange("D2").setHyperLink("https://example.com", "Example");
      book.insertSheet("Second sheet");
      await new Promise((resolve) => setTimeout(resolve, 200));
      const snapshot = instance.capture();
      instance.dispose();
      const create = await fetch("/api/workbooks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: "Plugin round trip", snapshot }),
      });
      const saved = await create.json();
      if (!create.ok) throw new Error(JSON.stringify(saved));
      const copy = await (
        await fetch(`/api/workbooks/${saved.id}/duplicate`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: "{}",
        })
      ).json();
      instance = mountEditor(container, copy.snapshot, () => {});
      const restoredBook = instance.api.getActiveWorkbook();
      const restored = restoredBook.getSheetByName("Sheet1");
      const result = {
        sheetCount: restoredBook.getSheets().length,
        note: restored.getRange("A2").getNote()?.note,
        links: restored.getRange("D2").getHyperLinks().length,
        validation: !!restored.getRange("B2").getDataValidation(),
        conditional: restored.getRange("B2").getConditionalFormattingRules()
          .length,
        filter: !!restored.getRange("A1:B3").getFilter(),
        frozenRows: restored.getFrozenRows(),
        numberFormat: restored.getRange("B2").getNumberFormat(),
        sortedValue: restored.getRange("B2").getValue(),
        merges:
          instance.capture().sheets[initial.sheetOrder[0]].mergeData.length,
        resourceCount: copy.snapshot.resources.length,
        identityChanged: copy.id !== saved.id,
      };
      instance.dispose();
      container.remove();
      return result;
    },
    { initial: blankWorkbook(), moduleURL },
  );
  await featurePage.close();
  assert.equal(featureResult.sheetCount, 2);
  assert.equal(featureResult.note, "Persistent note");
  assert.equal(featureResult.links, 1);
  assert.equal(featureResult.validation, true);
  assert.equal(featureResult.conditional, 1);
  assert.equal(featureResult.filter, true);
  assert.equal(featureResult.frozenRows, 1);
  assert.equal(featureResult.numberFormat, "0.00");
  assert.equal(Number(featureResult.sortedValue), 7);
  assert.equal(featureResult.merges, 1);
  assert.ok(featureResult.resourceCount >= 4);
  assert.equal(featureResult.identityChanged, true);
  console.log(
    "Browser: sheets, merges, formatting, filters, validation, conditional formatting, notes and hyperlinks survived persistence/duplication.",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await checkCompactHeader();
  await checkFilePosition();
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page.locator(".file-menu summary").click();
  await page.getByRole("button", { name: "Open workbook…" }).click();
  await page
    .getByRole("heading", { name: "Open workbook", exact: true })
    .waitFor();
  await page.screenshot({ path: path.join(scratch, "workbook-picker.png") });
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.locator("#editor canvas:visible").first().waitFor();
  await page.screenshot({ path: path.join(scratch, "editor.png") });
  assert.deepEqual(errors, []);
  console.log(
    "Browser: workbook picker rename/duplicate/delete, mobile layout and lifecycle passed.",
  );
} catch (error) {
  for (const context of browser?.contexts() || [])
    for (const page of context.pages()) {
      console.error(
        "Failure page:",
        page.url(),
        await page
          .locator("#dialog")
          .textContent()
          .catch(() => ""),
      );
      await page
        .screenshot({ path: path.join(scratch, "failure.png") })
        .catch(() => {});
    }
  throw error;
} finally {
  await browser?.close();
  await stop();
  if (!process.env.KEEP_TEST_PROJECT)
    await rm(scratch, { recursive: true, force: true });
  else console.log("Test project:", scratch);
}
