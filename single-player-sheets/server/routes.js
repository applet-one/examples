import { check, HttpError, MAX_BYTES } from "../shared/contracts.js";

async function body(request) {
  check(
    (request.headers.get("content-type") || "").split(";")[0] ===
      "application/json",
    "Use application/json.",
    415,
  );
  check(
    Number(request.headers.get("content-length") || 0) <= MAX_BYTES,
    "Request exceeds 5 MiB. Local recovery is retained.",
    413,
  );
  const reader = request.body?.getReader();
  check(reader, "JSON body required.");
  const parts = [];
  let length = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > MAX_BYTES) {
      await reader.cancel();
      throw new HttpError(
        413,
        "Request exceeds 5 MiB. Local recovery is retained.",
      );
    }
    parts.push(value);
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    bytes.set(part, offset);
    offset += part.length;
  }
  let parsed;
  try {
    parsed = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new HttpError(400, "Invalid JSON.");
  }
  check(
    parsed && typeof parsed === "object" && !Array.isArray(parsed),
    "JSON object required.",
  );
  return parsed;
}
export async function routeApi(request, store) {
  const url = new URL(request.url),
    method = request.method;
  if (!["GET", "HEAD"].includes(method)) {
    const origin = request.headers.get("origin");
    check(
      !origin || origin === url.origin,
      "Cross-origin mutations are not allowed.",
      403,
    );
    check(
      !["cross-site", "same-site"].includes(
        request.headers.get("sec-fetch-site"),
      ),
      "Cross-origin mutations are not allowed.",
      403,
    );
  }
  const match =
    /^\/api\/workbooks(?:\/([a-f0-9-]{36})(?:\/(snapshot|duplicate))?)?$/.exec(
      url.pathname,
    );
  check(match, "Not found.", 404);
  const [, id, operation] = match;
  let result,
    status = 200;
  if (!id && method === "GET") result = store.list();
  else if (!id && method === "POST") {
    result = store.create(await body(request));
    status = 201;
  } else if (id && !operation && method === "GET") result = store.load(id);
  else if (id && !operation && method === "PATCH")
    result = store.rename(id, await body(request));
  else if (id && !operation && method === "DELETE")
    result = store.delete(id, await body(request));
  else if (operation === "duplicate" && method === "POST") {
    await body(request);
    result = store.duplicate(id);
    status = 201;
  } else if (operation === "snapshot" && method === "PUT") {
    const input = await body(request);
    const hash = [
      ...new Uint8Array(
        await crypto.subtle.digest(
          "SHA-256",
          new TextEncoder().encode(JSON.stringify(input)),
        ),
      ),
    ]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    result = store.save(id, input, hash);
  } else throw new HttpError(405, "Method not allowed.");
  return Response.json(result, { status });
}
