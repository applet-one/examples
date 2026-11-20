import { test } from "node:test";
import assert from "node:assert/strict";
import { SaveCoordinator } from "../client/persistence.js";
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
function fixture(send, persist = async () => {}) {
  let value = "one";
  const states = [];
  const c = new SaveCoordinator({
    id: "test",
    revision: 1,
    capture: () => ({ value }),
    send,
    persist,
    onState: (state) => states.push(state),
  });
  return {
    c,
    states,
    edit(v) {
      value = v;
      c.change();
    },
  };
}
test("edits during save remain dirty and are submitted at acknowledged revision", async () => {
  let resolve;
  const calls = [];
  const f = fixture((body) => {
    calls.push(body);
    return new Promise((r) => (resolve = r));
  });
  try {
    f.edit("first");
    const saving = f.c.flush();
    await tick();
    f.edit("second");
    resolve({ revision: 2, savedAt: "now" });
    await saving;
    assert.equal(f.c.dirty, true);
    assert.equal(f.c.savedGeneration, 1);
    const second = f.c.flush();
    await tick();
    assert.equal(calls[1].baseRevision, 2);
    assert.equal(calls[1].snapshot.value, "second");
    resolve({ revision: 3, savedAt: "later" });
    await second;
    assert.equal(f.c.dirty, false);
    assert.equal(f.c.state, "Saved");
  } finally {
    f.c.stop();
  }
});
test("lost response retries exact payload, not newer edits", async () => {
  const calls = [];
  const f = fixture(async (body) => {
    calls.push(body);
    if (calls.length === 1) throw new TypeError("Lost response");
    return { revision: 2, savedAt: "now" };
  });
  try {
    f.edit("original");
    await f.c.flush();
    f.edit("newer");
    await f.c.flush();
    assert.deepEqual(calls[0], calls[1]);
    assert.equal(calls[1].snapshot.value, "original");
    assert.equal(f.c.revision, 2);
    assert.equal(f.c.dirty, true);
  } finally {
    f.c.stop();
  }
});
test("conflicts and permanent errors pause autosave; recovery remains dirty", async () => {
  const records = [];
  let calls = 0;
  const f = fixture(
    async () => {
      calls++;
      throw Object.assign(new Error("Conflict"), { status: 409 });
    },
    async (r) => records.push(r),
  );
  try {
    f.edit("local");
    await f.c.flush();
    await f.c.flush();
    assert.equal(calls, 1);
    assert.equal(f.c.state, "Conflict");
    assert.equal(f.c.dirty, true);
    assert.equal(records.at(-1).snapshot.value, "local");
    assert.ok(records.at(-1).pending.body.mutationId);
  } finally {
    f.c.stop();
  }
});
test("local storage failure warns but does not prevent cloud save", async () => {
  const f = fixture(
    async () => ({ revision: 2, savedAt: "now" }),
    async () => {
      throw new Error("Quota");
    },
  );
  try {
    f.edit("value");
    await f.c.flush();
    assert.equal(f.c.dirty, false);
    assert.ok(f.states.some((state) => /Quota/.test(state.warning)));
  } finally {
    f.c.stop();
  }
});
test("an acknowledgement after route disposal cannot capture a disposed editor", async () => {
  let resolve,
    disposed = false,
    captures = 0;
  const c = new SaveCoordinator({
    id: "closed",
    revision: 1,
    capture() {
      assert.equal(disposed, false);
      captures++;
      return {};
    },
    send: () => new Promise((r) => (resolve = r)),
    persist: async () => {},
    onState: () => {},
  });
  c.change();
  const saving = c.flush();
  await tick();
  c.stop();
  await c.queue;
  disposed = true;
  const before = captures;
  resolve({ revision: 2, savedAt: "now" });
  await saving;
  assert.equal(captures, before);
  assert.ok(c.pending, "Recovery must retain the exact unacknowledged request");
});
test("recovery writes serialize older before newer generations", async () => {
  const writes = [];
  let release;
  const f = fixture(
    async () => ({}),
    async (r) => {
      if (!writes.length) await new Promise((resolve) => (release = resolve));
      writes.push(r.generation);
    },
  );
  try {
    f.edit("one");
    f.c.local();
    await tick();
    f.edit("two");
    const queued = f.c.local();
    release();
    await queued;
    assert.deepEqual(writes, [1, 2]);
  } finally {
    f.c.stop();
  }
});
