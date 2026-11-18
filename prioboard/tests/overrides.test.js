import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readdir, readFile } from "node:fs/promises";
import { DatasetStorage } from "../server/storage.js";
import { routeApi } from "../server/routes.js";
import { boardOrder } from "../shared/ranking.js";
import { createReportReader } from "../shared/reports.js";

const items = [15, 14, 13, 12, 11, 10].map((score, i) => ({
  cluster_id: String.fromCharCode(65 + i),
  dimensions: { x: { score } },
}));
const ids = (pins) =>
  boardOrder(items, pins).map((row) => row.opportunity.cluster_id);
test("absolute pins leave other pins fixed and fill gaps by calculated order", () => {
  assert.deepEqual(ids([]), ["A", "B", "C", "D", "E", "F"]);
  assert.deepEqual(ids([{ cluster_id: "D", position: 3 }]), [
    "A",
    "B",
    "D",
    "C",
    "E",
    "F",
  ]);
  assert.deepEqual(
    ids([
      { cluster_id: "F", position: 1 },
      { cluster_id: "E", position: 3 },
    ]),
    ["F", "A", "E", "B", "C", "D"],
  );
  assert.deepEqual(
    ids([
      { cluster_id: "F", position: 1 },
      { cluster_id: "E", position: 2 },
      { cluster_id: "D", position: 3 },
    ]),
    ["F", "E", "D", "A", "B", "C"],
  );
  const rows = boardOrder(items, [{ cluster_id: "D", position: 3 }]);
  assert.equal(rows[2].rank, 4);
  assert.equal(rows[2].position, 3);
  assert.equal(items[3].dimensions.x.score, 12);
});

async function fixture() {
  const files = [];
  const root = new URL("../data/", import.meta.url);
  async function walk(dir) {
    for (const entry of await readdir(new URL(dir, root), {
      withFileTypes: true,
    })) {
      const path = `${dir}${entry.name}`;
      if (entry.isDirectory()) await walk(`${path}/`);
      else if (path.endsWith(".md"))
        files.push({
          path,
          content: await readFile(new URL(path, root), "utf8"),
        });
    }
  }
  for (const dir of ["input/", "context/", "output/"]) await walk(dir);
  return { name: "demo", files };
}
function adapter(db) {
  return {
    sql: {
      exec(query, ...args) {
        const statement = db.prepare(query);
        if (/^(SELECT|PRAGMA)/.test(query))
          return {
            toArray: () => statement.all(...args).map((row) => ({ ...row })),
          };
        statement.run(...args);
      },
    },
    transactionSync(fn) {
      db.exec("BEGIN");
      try {
        const result = fn();
        db.exec("COMMIT");
        return result;
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    },
  };
}

test("override API validates, persists, replaces occupied pins, detects conflicts, and clears changed evidence", async () => {
  const db = new DatabaseSync(":memory:");
  try {
    let store = new DatasetStorage(adapter(db));
    const data = await fixture();
    store.replace(data);
    const run_id = "2026-11-14";
    const report = createReportReader(
      new Map(data.files.map((f) => [f.path, f.content])),
    )(
      `output/${run_id}/strategy/opportunity-scorecard-v2.md`,
      "opportunity_scorecard",
    ).data;
    const [a, b, c] = report.opportunities.map((o) => o.cluster_id);
    const payload = (cluster_id, position = 1, reason = "Human judgment") => ({
      run_id,
      cluster_id,
      position,
      reason,
      uploadedAt: store.read().uploadedAt,
      overrideRevision: store.read().overrideRevision,
    });
    const { token } = store.identity.login({
      firstName: "Markus",
      lastName: "Andrezak",
    });
    async function request(
      input,
      method = "PUT",
      origin = "https://board.test",
    ) {
      return routeApi(
        new Request("https://board.test/api/overrides", {
          method,
          headers: {
            origin,
            "content-type": "application/json",
            cookie: `prioboard_session=${token}`,
          },
          body: JSON.stringify(input),
        }),
        store,
      );
    }
    await assert.rejects(
      request(payload(a), "PUT", "https://evil.test"),
      (e) => e.status === 403,
    );
    for (const input of [
      payload(a, 4),
      payload(a, 0),
      payload(a, 1.5),
      payload(a, 1, " "),
      payload(a, 1, "x".repeat(2001)),
      payload("missing"),
      { ...payload(a), run_id: "missing" },
    ])
      await assert.rejects(request(input), (e) => e.status === 400);
    const stale = payload(a);
    assert.equal((await request(payload(a, 3))).status, 200);
    await assert.rejects(request(stale), (e) => e.status === 409);
    assert.equal(store.read().overrides[0].position, 3);
    await request(payload(b, 1));
    await request(payload(c, 3));
    assert.deepEqual(
      store.read().overrides.map((o) => [o.cluster_id, o.position]),
      [
        [b, 1],
        [c, 3],
      ],
    );
    await request(payload(c, 2, "Updated reason"));
    assert.deepEqual(
      store.read().overrides.map((o) => o.position),
      [1, 2],
    );
    const saved = store.read();
    store = new DatasetStorage(adapter(db));
    assert.deepEqual(store.read(), saved);
    db.exec(
      "CREATE TRIGGER fail_override BEFORE INSERT ON priority_overrides BEGIN SELECT RAISE(ABORT, 'test failure'); END",
    );
    assert.throws(() => store.updateOverride(payload(a, 1)), /test failure/);
    assert.deepEqual(store.read(), saved);
    db.exec("DROP TRIGGER fail_override");
    await request(payload(b), "DELETE");
    assert.deepEqual(
      store.read().overrides.map((o) => o.position),
      [2],
    );
    store.replace(data);
    assert.equal(
      store.read().overrides.length,
      1,
      "identical reupload preserves pins",
    );
    const beforeUpload = payload(c);
    const changed = structuredClone(data);
    changed.files.find((f) => f.path === "context/company.md").content +=
      "\nChanged context.\n";
    store.replace(changed);
    assert.equal(
      store.read().overrides.length,
      0,
      "changed evidence invalidates pins",
    );
    await assert.rejects(request(beforeUpload), (e) => e.status === 409);
    assert.equal(
      (await routeApi(new Request("https://board.test/api/overrides"), store))
        .status,
      405,
    );
  } finally {
    db.close();
  }
});
