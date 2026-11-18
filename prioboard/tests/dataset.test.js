import test from "node:test";
import assert from "node:assert/strict";
import { validateDataset, limits } from "../shared/paths.js";
import { routeApi } from "../server/routes.js";
import { unzipSync, strFromU8 } from "fflate";

const dataset = () => ({
  name: "demo",
  files: [
    { path: "input/raw_feedback/a.md", content: "Grüße\r\n## Original\n" },
  ],
});
const request = (body, headers = {}) =>
  new Request("http://localhost/api/dataset", {
    method: "PUT",
    headers: {
      origin: "http://localhost",
      "content-type": "application/json",
      ...headers,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

test("file storage preserves original text and strips extraneous fields", () => {
  const input = dataset();
  const result = validateDataset({ ...input, unexpected: true });
  assert.deepEqual(result.files, input.files);
  assert.equal(
    result.bytes,
    new TextEncoder().encode(input.files[0].content).length,
  );
});

test("upload validates paths, file counts, text types, size and duplicate paths", () => {
  for (const path of [
    "../a.md",
    "/input/a.md",
    "input/../a.md",
    "input\\a.md",
    "input//a.md",
    "input/.secret.md",
    "app.js",
    "input/a.html",
    "input/a\u0000.md",
  ]) {
    assert.throws(() =>
      validateDataset({ ...dataset(), files: [{ path, content: "x" }] }),
    );
  }
  assert.throws(() => validateDataset({ ...dataset(), files: [] }));
  assert.throws(() =>
    validateDataset({
      ...dataset(),
      files: [...dataset().files, ...dataset().files],
    }),
  );
  assert.throws(() =>
    validateDataset({
      ...dataset(),
      files: [{ path: "input/a.md", content: 1 }],
    }),
  );
  assert.throws(() =>
    validateDataset({
      ...dataset(),
      files: [
        { path: "input/a.md", content: "x".repeat(limits.fileBytes + 1) },
      ],
    }),
  );
  assert.throws(() =>
    validateDataset({
      ...dataset(),
      files: Array.from({ length: 6 }, (_, i) => ({
        path: `input/${i}.md`,
        content: "x".repeat(limits.fileBytes),
      })),
    }),
  );
  assert.throws(() =>
    validateDataset({
      ...dataset(),
      files: Array.from({ length: 1001 }, (_, i) => ({
        path: `input/${i}.md`,
        content: "",
      })),
    }),
  );
});

test("API rejects malformed, invalid and cross-origin uploads before replacing", async () => {
  let calls = 0;
  const store = {
    identity: { current: () => ({ isAdmin: true }) },
    replace() {
      calls++;
    },
  };
  for (const [req, status] of [
    [request("{"), 400],
    [request({ ...dataset(), files: [] }), 400],
    [request(dataset(), { origin: "http://attacker.example" }), 403],
    [request(dataset(), { "content-type": "text/plain" }), 415],
    [
      request(dataset(), { "content-length": String(limits.requestBytes + 1) }),
      413,
    ],
  ])
    await assert.rejects(
      routeApi(req, store),
      (error) => error.status === status,
    );
  assert.equal(calls, 0);
});

test("ZIP download preserves paths and text; empty state returns 404", async () => {
  const req = new Request("http://localhost/api/dataset/download");
  await assert.rejects(
    routeApi(req, { read: () => null }),
    (error) => error.status === 404,
  );
  const result = await routeApi(req, { read: dataset });
  assert.equal(result.headers.get("content-type"), "application/zip");
  const zip = unzipSync(new Uint8Array(await result.arrayBuffer()));
  assert.deepEqual(Object.keys(zip), [dataset().files[0].path]);
  assert.equal(
    strFromU8(zip[dataset().files[0].path]),
    dataset().files[0].content,
  );
});
