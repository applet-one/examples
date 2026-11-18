import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { DatasetStorage } from "../server/storage.js";

// Exercise the actual SQLite statements and transactional rollback without a hosted app.
function storageAdapter(db) {
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
    transactionSync(callback) {
      db.exec("BEGIN");
      try {
        const value = callback();
        db.exec("COMMIT");
        return value;
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    },
  };
}

test("snapshot replacement removes missing files, survives store recreation and rolls back SQL failure", () => {
  const db = new DatabaseSync(":memory:");
  try {
    const store = new DatasetStorage(storageAdapter(db));
    assert.equal(store.read(), null);
    store.replace({
      name: "first",
      files: [
        { path: "input/old.md", content: "old" },
        { path: "context/strategy.md", content: "strategy" },
      ],
    });
    store.replace({
      name: "second",
      files: [{ path: "input/new.md", content: "new" }],
    });
    const saved = store.read();
    assert.equal(saved.name, "second");
    assert.deepEqual(saved.files, [{ path: "input/new.md", content: "new" }]);
    assert.deepEqual(new DatasetStorage(storageAdapter(db)).read(), saved);
    db.exec(
      "CREATE TRIGGER fail_insert BEFORE INSERT ON dataset_files WHEN NEW.path = 'input/fail.md' BEGIN SELECT RAISE(ABORT, 'test failure'); END",
    );
    assert.throws(
      () =>
        store.replace({
          name: "failure",
          files: [
            { path: "input/ok.md", content: "ok" },
            { path: "input/fail.md", content: "fail" },
          ],
        }),
      /test failure/,
    );
    assert.deepEqual(store.read(), saved);
    assert.throws(() => store.replace({ name: "invalid", files: [] }));
    assert.deepEqual(store.read(), saved);
    const large = "x".repeat(65535) + "😀" + "漢".repeat(800000);
    store.replace({
      name: "chunked",
      files: [
        { path: "input/large.md", content: large },
        { path: "input/empty.md", content: "" },
      ],
    });
    assert.deepEqual(store.read().files, [
      { path: "input/empty.md", content: "" },
      { path: "input/large.md", content: large },
    ]);
    assert.ok(
      db.prepare("SELECT MAX(length(content)) AS n FROM dataset_chunks").get()
        .n <= 65536,
    );
  } finally {
    db.close();
  }
});
