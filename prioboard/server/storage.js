import { validateDataset } from "../shared/paths.js";
import { createReportReader } from "../shared/reports.js";
import { IdentityStorage } from "./identity.js";

export class OverrideError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

export class DatasetStorage {
  constructor(storage) {
    this.storage = storage;
    this.sql = storage.sql;
    this.identity = new IdentityStorage(this.sql);
    this.sql.exec(
      "CREATE TABLE IF NOT EXISTS dataset_metadata (id INTEGER PRIMARY KEY CHECK (id = 1), name TEXT NOT NULL, uploaded_at TEXT NOT NULL)",
    );
    this.sql.exec(
      "CREATE TABLE IF NOT EXISTS dataset_files (path TEXT PRIMARY KEY)",
    );
    // Keep each row well below Durable Object SQLite's row/string size limits.
    this.sql.exec(
      "CREATE TABLE IF NOT EXISTS dataset_chunks (path TEXT NOT NULL REFERENCES dataset_files(path), chunk_index INTEGER NOT NULL, content TEXT NOT NULL, PRIMARY KEY (path, chunk_index))",
    );
    this.sql.exec(
      "CREATE TABLE IF NOT EXISTS priority_overrides (run_id TEXT NOT NULL, cluster_id TEXT NOT NULL, position INTEGER NOT NULL, reason TEXT NOT NULL, updated_at TEXT NOT NULL, PRIMARY KEY (run_id, cluster_id), UNIQUE (run_id, position))",
    );
    this.sql.exec(
      "CREATE TABLE IF NOT EXISTS opportunity_comments (id TEXT PRIMARY KEY, run_id TEXT NOT NULL, cluster_id TEXT NOT NULL, body TEXT NOT NULL, created_at TEXT NOT NULL)",
    );
    const columns = this.sql
      .exec("PRAGMA table_info(opportunity_comments)")
      .toArray();
    if (!columns.some((column) => column.name === "author"))
      this.sql.exec(
        "ALTER TABLE opportunity_comments ADD COLUMN author TEXT NOT NULL DEFAULT 'Unknown author'",
      );
    this.sql.exec(
      "CREATE TABLE IF NOT EXISTS decision_revision (id INTEGER PRIMARY KEY CHECK (id = 1), revision INTEGER NOT NULL)",
    );
    this.sql.exec(
      "INSERT OR IGNORE INTO decision_revision (id, revision) VALUES (1, 0)",
    );
  }

  read() {
    const meta = this.sql
      .exec(
        "SELECT name, uploaded_at AS uploadedAt FROM dataset_metadata WHERE id = 1",
      )
      .toArray()[0];
    if (!meta) return null;
    const files = new Map(
      this.sql
        .exec("SELECT path FROM dataset_files ORDER BY path")
        .toArray()
        .map(({ path }) => [path, { path, content: "" }]),
    );
    for (const chunk of this.sql
      .exec(
        "SELECT path, content FROM dataset_chunks ORDER BY path, chunk_index",
      )
      .toArray())
      files.get(chunk.path).content += chunk.content;
    return {
      ...meta,
      files: [...files.values()],
      ...this.decisions(),
      comments: this.comments(),
    };
  }

  decisions() {
    return {
      overrides: this.sql
        .exec(
          "SELECT run_id, cluster_id, position, reason, updated_at FROM priority_overrides ORDER BY run_id, position",
        )
        .toArray(),
      overrideRevision: this.sql
        .exec("SELECT revision FROM decision_revision WHERE id = 1")
        .toArray()[0].revision,
    };
  }

  comments() {
    return this.sql
      .exec(
        "SELECT id, run_id, cluster_id, body, created_at, author FROM opportunity_comments ORDER BY created_at, rowid",
      )
      .toArray();
  }

  deleteComment(input) {
    const dataset = this.read();
    if (!dataset || input?.uploadedAt !== dataset.uploadedAt)
      throw new OverrideError(
        "The dataset changed. Reload before trying again.",
        409,
      );
    if (
      typeof input.id !== "string" ||
      !input.id.trim() ||
      input.id.length > 100
    )
      throw new OverrideError("Invalid comment ID");
    // Idempotent: retrying a deletion after a lost response is safe.
    this.sql.exec("DELETE FROM opportunity_comments WHERE id = ?", input.id);
    return { deletedId: input.id };
  }

  addComment(input, user) {
    const dataset = this.read();
    if (!dataset || input?.uploadedAt !== dataset.uploadedAt)
      throw new OverrideError(
        "The dataset changed. Reload before trying again.",
        409,
      );
    if (
      typeof input.run_id !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(input.run_id)
    )
      throw new OverrideError("Invalid run");
    const report = createReportReader(
      new Map(dataset.files.map((f) => [f.path, f.content])),
    )(
      `output/${input.run_id}/strategy/opportunity-scorecard-v2.md`,
      "opportunity_scorecard",
    );
    if (
      !report.data?.opportunities.some((o) => o.cluster_id === input.cluster_id)
    )
      throw new OverrideError("Unknown opportunity or invalid scorecard");
    if (
      typeof input.body !== "string" ||
      !input.body.trim() ||
      input.body.trim().length > 2000
    )
      throw new OverrideError("A comment of 1–2,000 characters is required");
    const comment = {
      id: crypto.randomUUID(),
      run_id: input.run_id,
      cluster_id: input.cluster_id,
      body: input.body.trim(),
      author: user?.name || "Unknown author",
      created_at: new Date().toISOString(),
    };
    this.sql.exec(
      "INSERT INTO opportunity_comments (id, run_id, cluster_id, body, created_at, author) VALUES (?, ?, ?, ?, ?, ?)",
      comment.id,
      comment.run_id,
      comment.cluster_id,
      comment.body,
      comment.created_at,
      comment.author,
    );
    return { comment };
  }

  updateOverride(input, remove = false) {
    const dataset = this.read();
    if (
      !dataset ||
      input?.uploadedAt !== dataset.uploadedAt ||
      input?.overrideRevision !== dataset.overrideRevision
    ) {
      throw new OverrideError(
        "The dataset or overrides changed. Reload before trying again.",
        409,
      );
    }
    if (
      typeof input.run_id !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(input.run_id)
    )
      throw new OverrideError("Invalid run");
    const report = createReportReader(
      new Map(dataset.files.map((f) => [f.path, f.content])),
    )(
      `output/${input.run_id}/strategy/opportunity-scorecard-v2.md`,
      "opportunity_scorecard",
    );
    if (!report.data)
      throw new OverrideError(`Invalid scorecard: ${report.error}`);
    if (
      !report.data.opportunities.some((o) => o.cluster_id === input.cluster_id)
    )
      throw new OverrideError("Unknown opportunity");
    if (
      !remove &&
      (!Number.isInteger(input.position) ||
        input.position < 1 ||
        input.position > Math.min(3, report.data.opportunities.length))
    )
      throw new OverrideError("Position must be 1, 2, or 3");
    if (
      !remove &&
      (typeof input.reason !== "string" ||
        !input.reason.trim() ||
        input.reason.trim().length > 2000)
    )
      throw new OverrideError("A reason of 1–2,000 characters is required");
    this.storage.transactionSync(() => {
      this.sql.exec(
        "DELETE FROM priority_overrides WHERE run_id = ? AND cluster_id = ?",
        input.run_id,
        input.cluster_id,
      );
      if (!remove) {
        this.sql.exec(
          "DELETE FROM priority_overrides WHERE run_id = ? AND position = ?",
          input.run_id,
          input.position,
        );
        this.sql.exec(
          "INSERT INTO priority_overrides (run_id, cluster_id, position, reason, updated_at) VALUES (?, ?, ?, ?, ?)",
          input.run_id,
          input.cluster_id,
          input.position,
          input.reason.trim(),
          new Date().toISOString(),
        );
      }
      this.sql.exec(
        "UPDATE decision_revision SET revision = revision + 1 WHERE id = 1",
      );
    });
    return this.decisions();
  }

  replace(input) {
    const dataset = validateDataset(input);
    const previous = this.read();
    const uploadedAt = new Date().toISOString();
    this.storage.transactionSync(() => {
      // Decisions are tied to their evidence snapshot. Preserve them only when
      // that run's reports, all inputs, and all context remain byte-identical.
      const relevant = (files, run) =>
        JSON.stringify(
          files
            .filter(
              (f) =>
                f.path.startsWith("input/") ||
                f.path.startsWith("context/") ||
                f.path.startsWith(`output/${run}/`),
            )
            .map((f) => [f.path, f.content])
            .sort(([a], [b]) => a.localeCompare(b)),
        );
      for (const run of new Set(
        (previous?.overrides || []).map((o) => o.run_id),
      )) {
        if (relevant(previous.files, run) !== relevant(dataset.files, run))
          this.sql.exec("DELETE FROM priority_overrides WHERE run_id = ?", run);
      }
      this.sql.exec(
        "UPDATE decision_revision SET revision = revision + 1 WHERE id = 1",
      );
      // Keep discussions when evidence changes, but remove threads whose
      // opportunity no longer exists in a valid scorecard for that run.
      const readReport = createReportReader(
        new Map(dataset.files.map((f) => [f.path, f.content])),
      );
      for (const run of new Set(
        (previous?.comments || []).map((c) => c.run_id),
      )) {
        const report = readReport(
          `output/${run}/strategy/opportunity-scorecard-v2.md`,
          "opportunity_scorecard",
        );
        const ids = new Set(
          report.data?.opportunities.map((o) => o.cluster_id) || [],
        );
        for (const comment of previous.comments.filter((c) => c.run_id === run))
          if (!ids.has(comment.cluster_id))
            this.sql.exec(
              "DELETE FROM opportunity_comments WHERE id = ?",
              comment.id,
            );
      }
      this.sql.exec("DELETE FROM dataset_chunks");
      this.sql.exec("DELETE FROM dataset_files");
      for (const file of dataset.files) {
        this.sql.exec("INSERT INTO dataset_files (path) VALUES (?)", file.path);
        let index = 0;
        for (let start = 0; start < file.content.length;) {
          let end = Math.min(start + 64 * 1024, file.content.length);
          // Do not split a Unicode surrogate pair across SQLite strings.
          const last = file.content.charCodeAt(end - 1);
          if (end < file.content.length && last >= 0xd800 && last <= 0xdbff)
            end--;
          this.sql.exec(
            "INSERT INTO dataset_chunks (path, chunk_index, content) VALUES (?, ?, ?)",
            file.path,
            index++,
            file.content.slice(start, end),
          );
          start = end;
        }
      }
      this.sql.exec(
        "INSERT INTO dataset_metadata (id, name, uploaded_at) VALUES (1, ?, ?) ON CONFLICT(id) DO UPDATE SET name = excluded.name, uploaded_at = excluded.uploaded_at",
        dataset.name,
        uploadedAt,
      );
    });
    return {
      name: dataset.name,
      uploadedAt,
      fileCount: dataset.files.length,
      bytes: dataset.bytes,
      ...this.decisions(),
      comments: this.comments(),
    };
  }
}
