import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { WorkbookStore } from "../server/store.js";
import { routeApi } from "../server/routes.js";
import {
  blankWorkbook,
  UNIVER_VERSION,
  MAX_BYTES,
} from "../shared/contracts.js";

function fixture() {
  const db = new DatabaseSync(":memory:");
  const sql = {
    exec(query, ...params) {
      const statement = db.prepare(query);
      return {
        toArray: () => statement.all(...params),
        ...(!statement.columns().length ? (statement.run(...params), {}) : {}),
      };
    },
  };
  const storage = {
    sql,
    transactionSync(fn) {
      db.exec("BEGIN");
      try {
        const result = fn();
        db.exec("COMMIT");
        return result;
      } catch (e) {
        db.exec("ROLLBACK");
        throw e;
      }
    },
  };
  return { store: new WorkbookStore(storage), db };
}
const input = (book) => ({
  schemaVersion: 1,
  univerVersion: UNIVER_VERSION,
  baseRevision: book.revision,
  mutationId: crypto.randomUUID(),
  snapshot: book.snapshot,
});
test("CRUD, revisions, receipts, resource round trips, tombstones", () => {
  const { store, db } = fixture();
  const snapshot = blankWorkbook();
  snapshot.resources = [{ name: "test", data: '{"sheet":"resource"}' }];
  const book = store.create({ title: "Budget", snapshot });
  assert.notEqual(book.id, snapshot.id);
  assert.deepEqual(store.load(book.id).snapshot.resources, snapshot.resources);
  const payload = input(book);
  assert.equal(store.save(book.id, payload, "hash").revision, 2);
  assert.equal(store.save(book.id, payload, "hash").revision, 2);
  assert.throws(() => store.save(book.id, payload, "different"), {
    status: 409,
  });
  assert.throws(
    () =>
      store.save(
        book.id,
        { ...payload, mutationId: crypto.randomUUID() },
        "new",
      ),
    { status: 409 },
  );
  store.rename(book.id, { title: "New name", baseRevision: 2 });
  assert.equal(store.load(book.id).snapshot.name, "New name");
  const duplicate = store.duplicate(book.id);
  assert.notEqual(duplicate.id, book.id);
  assert.deepEqual(duplicate.snapshot.resources, snapshot.resources);
  assert.deepEqual(duplicate.snapshot.sheetOrder, snapshot.sheetOrder);
  assert.throws(() => store.delete(book.id, { baseRevision: 2 }), {
    status: 409,
  });
  store.delete(book.id, { baseRevision: 3 });
  assert.equal(store.list().length, 1);
  assert.throws(() => store.load(book.id), { status: 404 });
  assert.throws(() => store.save(book.id, payload, "hash"), { status: 404 });
  db.close();
});
test("request validation, bounded bodies and mutation origin checks", async () => {
  const { store, db } = fixture();
  const request = (path, method, value, headers = {}) =>
    new Request(`https://example.test/api/workbooks${path}`, {
      method,
      headers: { "content-type": "application/json", ...headers },
      body: value,
    });
  await assert.rejects(
    routeApi(request("", "POST", "{}", { origin: "https://evil.test" }), store),
    { status: 403 },
  );
  await assert.rejects(
    routeApi(
      request("", "POST", "{}", { "sec-fetch-site": "cross-site" }),
      store,
    ),
    { status: 403 },
  );
  await assert.rejects(routeApi(request("", "POST", "{"), store), {
    status: 400,
  });
  await assert.rejects(
    routeApi(
      request("", "POST", JSON.stringify({ title: "Bad", snapshot: {} })),
      store,
    ),
    { status: 400 },
  );
  await assert.rejects(
    routeApi(request("", "POST", "x".repeat(MAX_BYTES + 1)), store),
    { status: 413 },
  );
  const book = store.create({ title: "Okay", snapshot: blankWorkbook() });
  await assert.rejects(
    routeApi(
      request(
        `/${book.id}/snapshot`,
        "PUT",
        JSON.stringify({ ...input(book), univerVersion: "old" }),
      ),
      store,
    ),
    { status: 400 },
  );
  db.close();
});
test("chunking preserves Unicode at boundaries and multi-row snapshots", () => {
  const { store, db } = fixture();
  const snapshot = blankWorkbook();
  snapshot.resources = [
    {
      name: "unicode",
      data: "x".repeat(63000) + "🧮".repeat(10000) + "y".repeat(70000),
    },
  ];
  const book = store.create({ title: "Unicode", snapshot });
  assert.deepEqual(store.load(book.id).snapshot.resources, snapshot.resources);
  assert.ok(
    store.sql.exec("SELECT COUNT(*) AS count FROM chunks").toArray()[0].count >
      1,
  );
  db.close();
});
test("failed content write rolls back metadata", () => {
  const { store, db } = fixture();
  const book = store.create({ title: "Atomic", snapshot: blankWorkbook() });
  const originalWrite = store.write;
  store.write = () => {
    throw new Error("Disk error");
  };
  assert.throws(() => store.save(book.id, input(book), "hash"));
  assert.equal(store.meta(book.id).revision, 1);
  assert.throws(() =>
    store.create({ title: "Failed", snapshot: blankWorkbook() }),
  );
  assert.equal(store.list().length, 1);
  store.write = originalWrite;
  assert.equal(store.load(book.id).snapshot.id, book.id);
  db.close();
});
