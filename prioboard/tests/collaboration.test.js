import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { DatasetStorage } from "../server/storage.js";
import { routeApi } from "../server/routes.js";

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
        const value = fn();
        db.exec("COMMIT");
        return value;
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    },
  };
}

test("passwordless profiles, server permissions, durable sessions and live snapshot revisions", async () => {
  const db = new DatabaseSync(":memory:");
  try {
    let store = new DatasetStorage(adapter(db));
    const request = (
      path,
      method = "GET",
      input,
      cookie = "",
      origin = "https://board.test",
    ) =>
      routeApi(
        new Request(`https://board.test${path}`, {
          method,
          headers: { origin, cookie, "content-type": "application/json" },
          ...(input === undefined ? {} : { body: JSON.stringify(input) }),
        }),
        store,
      );
    const profile = await (await request("/api/profile")).json();
    assert.equal(profile.user, null);
    assert.equal(profile.users.length, 1);
    assert.equal(profile.users[0].name, "Markus Andrezak");
    assert.equal(profile.users[0].isAdmin, true);
    for (const input of [
      null,
      {},
      { firstName: "Ava" },
      { firstName: " ", lastName: "Tester" },
      { firstName: "x".repeat(81), lastName: "Tester" },
      { userId: "missing" },
    ])
      await assert.rejects(
        request("/api/profile", "POST", input),
        (error) => error.status === 400,
      );
    await assert.rejects(
      request(
        "/api/profile",
        "POST",
        { userId: profile.users[0].id },
        "",
        "https://evil.test",
      ),
      (error) => error.status === 403,
    );
    const memberResponse = await request("/api/profile", "POST", {
      firstName: " Ava ",
      lastName: " Tester ",
    });
    const member = (await memberResponse.json()).user;
    const memberCookie = memberResponse.headers.get("set-cookie").split(";")[0];
    assert.match(
      memberResponse.headers.get("set-cookie"),
      /HttpOnly; SameSite=Strict; Path=\/.*Secure/,
    );
    assert.equal(member.name, "Ava Tester");
    assert.equal(member.isAdmin, false);
    const duplicate = (
      await (
        await request("/api/profile", "POST", {
          firstName: "ava",
          lastName: "tester",
        })
      ).json()
    ).user;
    assert.equal(duplicate.id, member.id);
    const adminResponse = await request("/api/profile", "POST", {
      firstName: "markus",
      lastName: "andrezak",
    });
    assert.equal((await adminResponse.json()).user.isAdmin, true);
    const adminCookie = adminResponse.headers.get("set-cookie").split(";")[0];
    for (const [path, method] of [
      ["/api/dataset", "PUT"],
      ["/api/overrides", "PUT"],
      ["/api/overrides", "DELETE"],
      ["/api/comments", "DELETE"],
    ]) {
      await assert.rejects(
        request(path, method, {}, memberCookie),
        (error) => error.status === 403,
      );
      await assert.rejects(
        request(path, method, {}, "prioboard_session=forged"),
        (error) => error.status === 401,
      );
    }
    await assert.rejects(
      request("/api/comments", "POST", {}),
      (error) => error.status === 401,
    );
    const empty = await (await request("/api/sync?revision=-1")).json();
    const users = store.identity.users();
    assert.deepEqual(empty, { revision: 0, dataset: null, users });
    const input = {
      name: "test",
      files: [{ path: "input/a.md", content: "Original" }],
    };
    await request("/api/dataset", "PUT", input, adminCookie);
    const snapshot = await (await request("/api/sync?revision=0")).json();
    assert.equal(snapshot.revision, 1);
    assert.equal(snapshot.dataset.files[0].content, "Original");
    assert.deepEqual(await (await request("/api/sync?revision=1")).json(), {
      revision: 1,
      users,
    });
    await assert.rejects(
      request("/api/dataset", "PUT", { name: "bad", files: [] }, adminCookie),
    );
    assert.deepEqual(await (await request("/api/sync?revision=1")).json(), {
      revision: 1,
      users,
    });
    store = new DatasetStorage(adapter(db));
    const restored = await (
      await request("/api/profile", "GET", undefined, memberCookie)
    ).json();
    assert.equal(restored.user.id, member.id);
    assert.equal(restored.users.length, 2);
    assert.deepEqual(await (await request("/api/sync?revision=1")).json(), {
      revision: 1,
      users,
    });
  } finally {
    db.close();
  }
});
