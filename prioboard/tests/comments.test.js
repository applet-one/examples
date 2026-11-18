import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readdir, readFile } from "node:fs/promises";
import { DatasetStorage } from "../server/storage.js";
import { routeApi } from "../server/routes.js";
import { createReportReader } from "../shared/reports.js";

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
            toArray: () => statement.all(...args).map((r) => ({ ...r })),
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

test("comments validate writes, persist per opportunity/run, survive changed evidence, and remove orphan threads transactionally", async () => {
  const db = new DatabaseSync(":memory:");
  try {
    let store = new DatasetStorage(adapter(db));
    const data = await fixture();
    store.replace(data);
    const run_id = "2026-11-14";
    const path = `output/${run_id}/strategy/opportunity-scorecard-v2.md`;
    const report = createReportReader(
      new Map(data.files.map((f) => [f.path, f.content])),
    )(path, "opportunity_scorecard").data;
    const [a, b] = report.opportunities.map((o) => o.cluster_id);
    const payload = (cluster_id = a, body = " A useful comment ") => ({
      run_id,
      cluster_id,
      body,
      uploadedAt: store.read().uploadedAt,
    });
    const { token } = store.identity.login({
      firstName: "Markus",
      lastName: "Andrezak",
    });
    const request = (input, origin = "https://board.test", method = "POST") =>
      routeApi(
        new Request("https://board.test/api/comments", {
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
    await assert.rejects(
      request(payload(), "https://evil.test"),
      (e) => e.status === 403,
    );
    for (const input of [
      null,
      payload(a, " "),
      payload(a, "x".repeat(2001)),
      payload("missing"),
      { ...payload(), run_id: "bad" },
      { ...payload(), run_id: "2020-01-01" },
      payload(a, 42),
    ])
      await assert.rejects(
        request(input),
        (e) => e.status === (input === null ? 409 : 400),
      );
    await assert.rejects(
      request({ ...payload(), uploadedAt: "old" }),
      (e) => e.status === 409,
    );
    const first = (
      await (await request({ ...payload(), author: "Forged author" })).json()
    ).comment;
    assert.equal(first.author, "Markus Andrezak");
    assert.equal(first.body, "A useful comment");
    assert.ok(first.id);
    assert.ok(!Number.isNaN(Date.parse(first.created_at)));
    await request(payload(b, "<img src=x onerror=alert(1)>"));
    await request(payload(a, "Second comment"));
    assert.deepEqual(
      store.read().comments.map((c) => c.cluster_id),
      [a, b, a],
    );
    const temporary = (await (await request(payload(a, "Delete me"))).json())
      .comment;
    const deletion = { id: temporary.id, uploadedAt: store.read().uploadedAt };
    await assert.rejects(
      request(deletion, "https://evil.test", "DELETE"),
      (e) => e.status === 403,
    );
    await assert.rejects(
      request(
        { ...deletion, uploadedAt: "old" },
        "https://board.test",
        "DELETE",
      ),
      (e) => e.status === 409,
    );
    for (const id of [null, 42, " ", "x".repeat(101)])
      await assert.rejects(
        request({ ...deletion, id }, "https://board.test", "DELETE"),
        (e) => e.status === 400,
      );
    assert.equal(store.read().comments.length, 4);
    assert.equal(
      (await (await request(deletion, "https://board.test", "DELETE")).json())
        .deletedId,
      temporary.id,
    );
    assert.equal(store.read().comments.length, 3);
    assert.equal(
      (await request(deletion, "https://board.test", "DELETE")).status,
      200,
    );
    const saved = store.read();
    store = new DatasetStorage(adapter(db));
    assert.deepEqual(store.read(), saved);
    store.replace(data);
    assert.deepEqual(store.read().comments, saved.comments);
    const changed = structuredClone(data);
    changed.files.find((f) => f.path === "context/company.md").content +=
      "\nChanged context.\n";
    store.replace(changed);
    assert.deepEqual(store.read().comments, saved.comments);
    // Removing the scorecard would delete its threads, but a failing upload must roll back both.
    const removed = {
      name: "removed",
      files: changed.files.filter((f) => f.path !== path),
    };
    db.exec(
      "CREATE TRIGGER fail_insert BEFORE INSERT ON dataset_files BEGIN SELECT RAISE(ABORT, 'test failure'); END",
    );
    assert.throws(() => store.replace(removed), /test failure/);
    assert.deepEqual(store.read().comments, saved.comments);
    db.exec("DROP TRIGGER fail_insert");
    store.replace(removed);
    assert.deepEqual(store.read().comments, []);
    assert.equal(
      (await routeApi(new Request("https://board.test/api/comments"), store))
        .status,
      405,
    );
  } finally {
    db.close();
  }
});
