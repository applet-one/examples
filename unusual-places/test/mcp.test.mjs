import assert from "node:assert/strict";
import { test } from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { handleMcp, UI_URI } from "../src/mcp.js";

const endpoint = "https://offbeat.test/mcp";
const html = "<!doctype html><html><script>window.__EMBEDDED__=true;window.offbeatHost={};</script><body>Offbeat explorer</body></html>";
const places = [
  { id: "one", name: "Unusual tower", city: "Bonn", category: "architecture" },
  { id: "two", name: "Unusual garden", city: "Bonn", category: "nature" },
];

async function fixture(t) {
  const states = new Map();
  const requests = [];
  const responses = [];
  const handlers = {
    async search(args) {
      return { places: [places[0]], allPlaces: places, total: 1, center: [50.737, 7.098], filters: args };
    },
    async getState(id) { return structuredClone(states.get(id) ?? { shortlist: [], trip: null }); },
    async saveState(id, state) {
      states.set(id, structuredClone(state));
      return structuredClone(state);
    },
    async getPlace(id) { return places.find((place) => place.id === id) ?? null; },
    async planTrip(ids) {
      return {
        places: ids.map((id) => places.find((place) => place.id === id)),
        legs: [],
        totalVisitMinutes: ids.length * 45,
        totalDistanceKm: 1,
        note: "Straight-line distances, not road routes or travel times.",
      };
    },
    async getHtml() { return html; },
  };
  const client = new Client({ name: "offbeat-integration-test", version: "1.0.0" });
  const transport = new StreamableHTTPClientTransport(new URL(endpoint), {
    fetch: async (input, init) => {
      const request = new Request(input, init);
      if (request.method === "POST") requests.push(await request.clone().json());
      const response = await handleMcp(request, handlers);
      responses.push({ status: response.status, headers: new Headers(response.headers) });
      return response;
    },
  });
  t.after(() => client.close());
  await client.connect(transport);
  const call = (name, args = {}) => client.callTool({ name, arguments: args });
  return { client, call, states, requests, responses, handlers };
}

test("MCP initializes through stateless HTTP and lists five annotated tools", async (t) => {
  const { client, requests, responses } = await fixture(t);
  assert.equal(requests[0].method, "initialize");
  assert.equal(client.getServerVersion().name, "offbeat-unusual-places");
  assert.ok(client.getServerCapabilities().tools);
  assert.ok(client.getServerCapabilities().resources);
  const { tools } = await client.listTools();
  assert.deepEqual(tools.map((tool) => tool.name), [
    "search_places", "get_place", "get_shortlist", "update_shortlist", "plan_trip",
  ]);
  const search = tools.find((tool) => tool.name === "search_places");
  assert.equal(search._meta.ui.resourceUri, UI_URI);
  assert.equal(search._meta["openai/outputTemplate"], UI_URI);
  assert.equal(search._meta["openai/widgetAccessible"], true);
  assert.equal(search.annotations.readOnlyHint, true);
  assert.equal(tools.find((tool) => tool.name === "update_shortlist").annotations.readOnlyHint, false);
  for (const response of responses) {
    assert.equal(response.headers.has("mcp-session-id"), false);
    assert.equal(response.headers.get("cache-control"), "no-store");
  }
});

test("search returns defaults and private visitor state while full collection is UI-only", async (t) => {
  const { call } = await fixture(t);
  const response = await call("search_places");
  assert.notEqual(response.isError, true);
  const data = response.structuredContent;
  assert.deepEqual(data.filters, { city: "Bonn", radius: 100, category: "all", outdoor: false, q: "" });
  assert.equal(data.total, 1);
  assert.deepEqual(data.places, [places[0]]);
  assert.match(data.visitorId, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.deepEqual(data.state, { shortlist: [], trip: null });
  assert.equal(Object.hasOwn(data, "allPlaces"), false);
  assert.deepEqual(response._meta.allPlaces, places);
  assert.ok(response.content.every((block) => !block.text?.includes("Unusual garden")));
  const filtered = await call("search_places", {
    city: "Cologne", radius: "all", category: "industrial", outdoor: true, q: "steel",
    visitorId: data.visitorId,
  });
  assert.equal(filtered.structuredContent.visitorId, data.visitorId);
  assert.equal(filtered.structuredContent.filters.radius, "all");
});

test("UI resource advertises MCP Apps metadata and returns embedded HTML with CSP", async (t) => {
  const { client } = await fixture(t);
  const { resources } = await client.listResources();
  assert.equal(resources.length, 1);
  assert.equal(resources[0].uri, UI_URI);
  assert.equal(resources[0].mimeType, "text/html;profile=mcp-app");
  const { contents } = await client.readResource({ uri: UI_URI });
  assert.equal(contents.length, 1);
  assert.equal(contents[0].uri, UI_URI);
  assert.equal(contents[0].mimeType, "text/html;profile=mcp-app");
  assert.equal(contents[0].text, html);
  assert.match(contents[0].text, /__EMBEDDED__=true/);
  const metadata = contents[0]._meta;
  assert.deepEqual(metadata.ui.csp.connectDomains, ["https://offbeat.test"]);
  assert.ok(metadata.ui.csp.resourceDomains.includes("https://*.tile.openstreetmap.org"));
  assert.ok(metadata.ui.csp.resourceDomains.includes("https://upload.wikimedia.org"));
  assert.deepEqual(metadata["openai/widgetCSP"].resource_domains, metadata.ui.csp.resourceDomains);
});

test("invalid schema arguments and nonexistent place IDs fail without saving state", async (t) => {
  const { call, states } = await fixture(t);
  for (const [name, args] of [
    ["search_places", { radius: -1 }],
    ["search_places", { category: "restaurants" }],
    ["search_places", { visitorId: "global" }],
    ["get_place", {}],
    ["get_shortlist", {}],
    ["update_shortlist", { visitorId: "public", ids: ["one"] }],
    ["plan_trip", { ids: [] }],
    ["plan_trip", { ids: Array(51).fill("one") }],
  ]) {
    const response = await call(name, args);
    assert.equal(response.isError, true, `${name} should reject ${JSON.stringify(args)}`);
  }
  assert.equal((await call("get_place", { id: "missing" })).isError, true);
  const visitorId = (await call("search_places")).structuredContent.visitorId;
  assert.equal((await call("update_shortlist", { visitorId, ids: ["one", "missing"] })).isError, true);
  assert.equal((await call("plan_trip", { ids: ["one", "missing"] })).isError, true);
  assert.equal(states.size, 0);
});

test("shortlist updates are visitor-isolated, deduplicated, and preserve existing trip", async (t) => {
  const { call, states } = await fixture(t);
  const first = (await call("search_places")).structuredContent.visitorId;
  const second = (await call("search_places")).structuredContent.visitorId;
  assert.notEqual(first, second);
  const existingTrip = { ids: ["two"], note: "Existing saved trip" };
  states.set(first, { shortlist: [], trip: existingTrip });
  const saved = (await call("update_shortlist", { visitorId: first, ids: ["one", "one"] })).structuredContent;
  assert.deepEqual(saved.state, { shortlist: ["one"], trip: existingTrip });
  const own = (await call("get_shortlist", { visitorId: first })).structuredContent;
  assert.deepEqual(own.shortlist, ["one"]);
  assert.deepEqual(own.places, [places[0]]);
  assert.deepEqual(own.trip, existingTrip);
  const other = (await call("get_shortlist", { visitorId: second })).structuredContent;
  assert.deepEqual(other.state, { shortlist: [], trip: null });
  assert.deepEqual(other.places, []);
  assert.equal(JSON.stringify(other).includes(first), false);
  const resumed = (await call("search_places", { visitorId: first })).structuredContent;
  assert.deepEqual(resumed.state.shortlist, ["one"]);
  const cleared = (await call("update_shortlist", { visitorId: first, ids: [] })).structuredContent;
  assert.deepEqual(cleared.shortlist, []);
  assert.deepEqual(cleared.trip, existingTrip);
});

test("place lookup and trip planning return known places without changing visitor state", async (t) => {
  const { call, states } = await fixture(t);
  assert.deepEqual((await call("get_place", { id: "two" })).structuredContent.place, places[1]);
  const response = await call("plan_trip", { ids: ["two", "one", "two"] });
  assert.deepEqual(response.structuredContent.places.map((place) => place.id), ["two", "one"]);
  assert.equal(response.structuredContent.totalVisitMinutes, 90);
  assert.equal(response.structuredContent.totalDistanceKm, 1);
  assert.deepEqual(response.structuredContent.trip.places, response.structuredContent.places);
  assert.match(response.content[0].text, /straight-line/);
  assert.match(response.content[0].text, /not road routes or travel times/);
  assert.equal(states.size, 0);
});

test("stateless endpoint handles CORS preflight and rejects standalone SSE/session deletion", async (t) => {
  const { handlers } = await fixture(t);
  const preflight = await handleMcp(new Request(endpoint, { method: "OPTIONS" }), handlers);
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get("access-control-allow-origin"), "*");
  assert.match(preflight.headers.get("access-control-allow-headers"), /MCP-Protocol-Version/);
  for (const method of ["GET", "DELETE"]) {
    const response = await handleMcp(new Request(endpoint, { method }), handlers);
    assert.equal(response.status, 405);
    assert.equal(response.headers.get("allow"), "POST, OPTIONS");
  }
});
