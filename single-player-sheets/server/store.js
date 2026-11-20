import {
  check,
  title,
  snapshot,
  saveInput,
  SCHEMA_VERSION,
  UNIVER_VERSION,
} from "../shared/contracts.js";

// All catalog/content/receipt changes share the Applet's SQLite transaction.
// There is deliberately no D1 or second Durable Object namespace.
export class WorkbookStore {
  constructor(storage) {
    this.storage = storage;
    this.sql = storage.sql;
    this.sql.exec(`CREATE TABLE IF NOT EXISTS workbooks (
      id TEXT PRIMARY KEY, title TEXT NOT NULL, revision INTEGER NOT NULL,
      createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL, deletedAt TEXT)`);
    this.sql.exec(`CREATE TABLE IF NOT EXISTS chunks (
      workbookId TEXT NOT NULL, part INTEGER NOT NULL, content TEXT NOT NULL,
      PRIMARY KEY(workbookId, part))`);
    this.sql.exec(`CREATE TABLE IF NOT EXISTS receipts (
      workbookId TEXT NOT NULL, mutationId TEXT NOT NULL, hash TEXT NOT NULL,
      revision INTEGER NOT NULL, savedAt TEXT NOT NULL,
      PRIMARY KEY(workbookId, mutationId))`);
  }
  list() {
    return this.sql
      .exec(
        "SELECT id, title, revision, createdAt, updatedAt FROM workbooks WHERE deletedAt IS NULL ORDER BY updatedAt DESC",
      )
      .toArray();
  }
  meta(id) {
    const row = this.sql
      .exec("SELECT * FROM workbooks WHERE id = ?", id)
      .toArray()[0];
    check(row && !row.deletedAt, "Workbook not found or deleted.", 404);
    return row;
  }
  load(id) {
    const meta = this.meta(id);
    const data = JSON.parse(
      this.sql
        .exec(
          "SELECT content FROM chunks WHERE workbookId = ? ORDER BY part",
          id,
        )
        .toArray()
        .map((r) => r.content)
        .join(""),
    );
    data.name = meta.title;
    return {
      ...meta,
      snapshot: data,
      schemaVersion: SCHEMA_VERSION,
      univerVersion: UNIVER_VERSION,
    };
  }
  write(id, data) {
    const json = JSON.stringify(data);
    this.sql.exec("DELETE FROM chunks WHERE workbookId = ?", id);
    // UTF-8 worst case stays well under the SQLite per-row/string limit.
    for (let start = 0, part = 0; start < json.length; part++) {
      let end = Math.min(start + 64000, json.length);
      // Never split a surrogate pair across SQLite UTF-8 string bindings.
      if (end < json.length && /[\uD800-\uDBFF]/.test(json[end - 1])) end--;
      this.sql.exec(
        "INSERT INTO chunks VALUES (?, ?, ?)",
        id,
        part,
        json.slice(start, end),
      );
      start = end;
    }
  }
  create(input) {
    const name = title(input.title);
    snapshot(input.snapshot);
    const id = crypto.randomUUID(),
      now = new Date().toISOString();
    const data = { ...input.snapshot, id, name };
    this.storage.transactionSync(() => {
      this.sql.exec(
        "INSERT INTO workbooks VALUES (?, ?, 1, ?, ?, NULL)",
        id,
        name,
        now,
        now,
      );
      this.write(id, data);
    });
    return this.load(id);
  }
  save(id, input, hash) {
    saveInput(input, id);
    return this.storage.transactionSync(() => {
      const meta = this.meta(id);
      const receipt = this.sql
        .exec(
          "SELECT * FROM receipts WHERE workbookId = ? AND mutationId = ?",
          id,
          input.mutationId,
        )
        .toArray()[0];
      if (receipt) {
        check(
          receipt.hash === hash,
          "Mutation ID was already used for different content.",
          409,
        );
        return { revision: receipt.revision, savedAt: receipt.savedAt };
      }
      check(
        meta.revision === input.baseRevision,
        "A newer cloud version exists. Reload it or preserve your work as a copy.",
        409,
      );
      const revision = meta.revision + 1,
        savedAt = new Date().toISOString();
      this.write(id, { ...input.snapshot, name: meta.title });
      this.sql.exec(
        "UPDATE workbooks SET revision = ?, updatedAt = ? WHERE id = ?",
        revision,
        savedAt,
        id,
      );
      this.sql.exec(
        "INSERT INTO receipts VALUES (?, ?, ?, ?, ?)",
        id,
        input.mutationId,
        hash,
        revision,
        savedAt,
      );
      // Seven days or the newest 1000 receipts per workbook, whichever is smaller.
      this.sql.exec(
        "DELETE FROM receipts WHERE workbookId = ? AND (savedAt < ? OR mutationId NOT IN (SELECT mutationId FROM receipts WHERE workbookId = ? ORDER BY revision DESC LIMIT 1000))",
        id,
        new Date(Date.now() - 7 * 86400000).toISOString(),
        id,
      );
      return { revision, savedAt };
    });
  }
  rename(id, input) {
    const name = title(input.title);
    return this.storage.transactionSync(() => {
      const meta = this.meta(id);
      check(
        input.baseRevision === meta.revision,
        "Workbook changed. Refresh the dashboard before renaming.",
        409,
      );
      this.sql.exec(
        "UPDATE workbooks SET title = ?, revision = revision + 1, updatedAt = ? WHERE id = ?",
        name,
        new Date().toISOString(),
        id,
      );
      return this.meta(id);
    });
  }
  duplicate(id) {
    const original = this.load(id);
    // Workbook identity is global; sheet/style/resource identities stay workbook-local.
    return this.create({
      title: `${original.title.slice(0, 113)} (copy)`,
      snapshot: original.snapshot,
    });
  }
  delete(id, input) {
    return this.storage.transactionSync(() => {
      const meta = this.meta(id);
      check(
        input.baseRevision === meta.revision,
        "Workbook changed. Refresh before deleting.",
        409,
      );
      this.sql.exec(
        "UPDATE workbooks SET deletedAt = ? WHERE id = ?",
        new Date().toISOString(),
        id,
      );
      this.sql.exec("DELETE FROM chunks WHERE workbookId = ?", id);
      this.sql.exec("DELETE FROM receipts WHERE workbookId = ?", id);
      return { deleted: true };
    });
  }
}
