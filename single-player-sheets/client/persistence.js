import { SCHEMA_VERSION, UNIVER_VERSION } from "../shared/contracts.js";

export function openRecovery() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("single-player-sheets", 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore("workbooks", { keyPath: "key" });
    request.onerror = () => reject(request.error);
    request.onblocked = () =>
      reject(new Error("Recovery database upgrade blocked by another tab."));
    request.onsuccess = () => {
      const db = request.result;
      const run = (mode, action) =>
        new Promise((res, rej) => {
          const tx = db.transaction("workbooks", mode);
          const req = action(tx.objectStore("workbooks"));
          tx.oncomplete = () => res(req.result);
          tx.onerror = tx.onabort = () =>
            rej(tx.error || new Error("Browser storage unavailable."));
        });
      resolve({
        get: (id) => run("readonly", (s) => s.get(id)),
        all: () => run("readonly", (s) => s.getAll()),
        put: (record) => run("readwrite", (s) => s.put(record)),
        delete: (id) => run("readwrite", (s) => s.delete(id)),
      });
    };
  });
}

// Exactly one in-flight request; pending payloads are immutable until acknowledged.
export class SaveCoordinator {
  constructor({ id, revision, capture, send, persist, onState, recovery }) {
    Object.assign(this, { id, revision, capture, send, persist, onState });
    this.generation = recovery?.generation || 0;
    this.savedGeneration = recovery?.savedGeneration || 0;
    this.pending = recovery?.pending || null;
    this.savedAt = recovery?.savedAt || null;
    this.queue = Promise.resolve();
    this.retry = 0;
    this.stopped = false;
    this.emit(this.dirty ? "Unsaved changes" : "Saved");
  }
  get dirty() {
    return this.generation > this.savedGeneration || !!this.pending;
  }
  emit(state, error) {
    this.state = state;
    this.onState({ state, error, dirty: this.dirty, savedAt: this.savedAt });
  }
  change() {
    if (this.stopped) return;
    this.generation++;
    if (!this.blocked && !this.inflight) this.emit("Unsaved changes");
    clearTimeout(this.localTimer);
    this.localTimer = setTimeout(() => this.local(), 200);
    this.localMax ||= setTimeout(() => this.local(), 1000);
    if (!this.blocked) {
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.flush(), 1000);
      this.maxTimer ||= setTimeout(() => this.flush(), 5000);
    }
  }
  local() {
    clearTimeout(this.localTimer);
    clearTimeout(this.localMax);
    this.localMax = null;
    let record;
    try {
      record = {
        id: this.id,
        revision: this.revision,
        snapshot: this.capture(),
        generation: this.generation,
        savedGeneration: this.savedGeneration,
        pending: this.pending,
        savedAt: this.savedAt,
        timestamp: Date.now(),
      };
    } catch (error) {
      this.onState({ warning: `Local recovery failed: ${error.message}` });
      return this.queue;
    }
    // Capture before enqueue; IndexedDB writes are serialized, so old writes cannot win.
    this.queue = this.queue
      .then(() => this.persist(record))
      .catch((error) =>
        this.onState({
          warning: `Local recovery unavailable: ${error.message}. Keep this tab open until cloud save succeeds.`,
        }),
      );
    return this.queue;
  }
  async flush() {
    clearTimeout(this.timer);
    clearTimeout(this.maxTimer);
    this.maxTimer = null;
    if (this.stopped || this.inflight || this.blocked || !this.dirty) return;
    this.inflight = true;
    try {
      if (!this.pending)
        this.pending = {
          generation: this.generation,
          body: {
            baseRevision: this.revision,
            mutationId: crypto.randomUUID(),
            schemaVersion: SCHEMA_VERSION,
            univerVersion: UNIVER_VERSION,
            snapshot: this.capture(),
          },
        };
      await this.local();
      if (this.stopped) return;
      this.emit("Saving");
      const response = await this.send(this.pending.body);
      // A closed route retains the persisted pending payload. Do not capture a
      // disposed editor or let an old response update the next route's state.
      if (this.stopped) return;
      this.revision = response.revision;
      this.savedGeneration = this.pending.generation;
      this.savedAt = response.savedAt;
      this.pending = null;
      this.retry = 0;
      await this.local();
      if (!this.stopped) this.emit(this.dirty ? "Unsaved changes" : "Saved");
    } catch (error) {
      if (this.stopped) return;
      if (
        error.status &&
        error.status < 500 &&
        ![408, 429].includes(error.status)
      ) {
        this.blocked = true;
        this.emit(error.status === 409 ? "Conflict" : "Error", error.message);
      } else {
        this.emit("Offline / retrying", error.message);
        const delay =
          Math.min(30000, 1000 * 2 ** this.retry++) *
          (0.8 + Math.random() * 0.4);
        clearTimeout(this.timer);
        this.timer = setTimeout(() => this.flush(), delay);
      }
    } finally {
      this.inflight = false;
      if (
        !this.stopped &&
        this.dirty &&
        !this.blocked &&
        this.state !== "Offline / retrying"
      )
        this.timer = setTimeout(() => this.flush(), 100);
    }
  }
  stop() {
    this.local();
    this.stopped = true;
    for (const timer of ["timer", "maxTimer", "localTimer", "localMax"])
      clearTimeout(this[timer]);
  }
}
