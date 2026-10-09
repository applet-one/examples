import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";

export const UI_URI = "ui://offbeat/explore-v1.html";
const UI_MIME = "text/html;profile=mcp-app";
// This UUID is a bearer capability, not a user name or a public session key.
const visitorIdSchema = z.string().regex(
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  "Use the private UUID v4 visitorId returned by search_places.",
).describe("Private visitor capability returned by search_places. Never invent or expose it publicly.");
const placeIdSchema = z.string().min(1).max(100);
const idsSchema = z.array(placeIdSchema).max(50);
const uiMeta = {
  ui: { resourceUri: UI_URI, visibility: ["model", "app"] },
  "openai/outputTemplate": UI_URI,
  "openai/widgetAccessible": true,
};
const annotations = (readOnly = true) => ({
  readOnlyHint: readOnly,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
});
const result = (data, text) => ({
  content: [{ type: "text", text }],
  structuredContent: data,
});
const toolError = (text) => ({
  isError: true,
  content: [{ type: "text", text }],
});

function createServer(handlers, origin) {
  const server = new McpServer(
    { name: "offbeat-unusual-places", version: "1.0.0" },
    { instructions: "Explore a curated collection of unusual places around Bonn and the Rhine. Call search_places to open the interactive map. Reuse its private visitorId for only that visitor's shortlist; never guess another visitor's ID. Trip legs show straight-line distances, not road routes or travel times. Visit durations are estimates; check opening hours before visiting." },
  );
  const csp = {
    connectDomains: [origin],
    resourceDomains: [
      "https://*.tile.openstreetmap.org",
      "https://tile.openstreetmap.org",
      "https://upload.wikimedia.org",
      "https://fonts.googleapis.com",
      "https://fonts.gstatic.com",
      "data:",
    ],
  };
  const resourceMeta = {
    ui: { prefersBorder: false, csp },
    "openai/widgetDescription": "Offbeat: an interactive unusual-places map with filters, a private shortlist, and a day-trip planner.",
    "openai/widgetPrefersBorder": false,
    "openai/widgetCSP": {
      connect_domains: csp.connectDomains,
      resource_domains: csp.resourceDomains,
    },
  };
  server.registerResource("offbeat-explorer", UI_URI, {
    title: "Offbeat unusual places explorer",
    description: "Interactive map, place cards, shortlist, and trip planner.",
    mimeType: UI_MIME,
    _meta: resourceMeta,
  }, async () => ({
    contents: [{
      uri: UI_URI,
      mimeType: UI_MIME,
      text: await handlers.getHtml(),
      _meta: resourceMeta,
    }],
  }));

  server.registerTool("search_places", {
    title: "Explore unusual places",
    description: "Search the curated Rhine-region collection and show its interactive map. The default city is Bonn. Returns a new private visitorId when omitted; reuse it to retain the visitor's shortlist.",
    inputSchema: {
      city: z.string().trim().min(1).max(120).default("Bonn"),
      radius: z.union([z.number().min(0).max(1000), z.literal("all")]).default(100)
        .describe("Radius in kilometres, or all for the full collection."),
      category: z.enum(["all", "architecture", "nature", "museums", "industrial"]).default("all"),
      outdoor: z.boolean().default(false).describe("When true, show only outdoor places."),
      q: z.string().trim().max(300).default(""),
      visitorId: visitorIdSchema.optional(),
    },
    annotations: annotations(),
    _meta: uiMeta,
  }, async (args) => {
    const visitorId = args.visitorId ?? crypto.randomUUID();
    const [matches, state] = await Promise.all([
      handlers.search(args),
      handlers.getState(visitorId),
    ]);
    const { allPlaces, ...searchResult } = matches;
    return {
      ...result({ ...searchResult, visitorId, state },
        `Found ${matches.total ?? matches.places.length} unusual places near ${args.city}. Use the map to explore, shortlist stops, or build a trip.`),
      // Full map data is UI-only, not additional model context on every search.
      _meta: { allPlaces: allPlaces ?? matches.places },
    };
  });

  server.registerTool("get_place", {
    title: "Get unusual place details",
    description: "Get a curated place by its ID from search_places.",
    inputSchema: { id: placeIdSchema },
    annotations: annotations(),
  }, async ({ id }) => {
    const place = await handlers.getPlace(id);
    return place
      ? result({ place }, `Details for ${place.name ?? place.title ?? id}.`)
      : toolError("That place is not in the curated collection. Search again for a valid place ID.");
  });

  server.registerTool("get_shortlist", {
    title: "Read your private shortlist",
    description: "Read only the shortlist belonging to the private visitorId returned by search_places.",
    inputSchema: { visitorId: visitorIdSchema },
    annotations: annotations(),
  }, async ({ visitorId }) => {
    const state = await handlers.getState(visitorId);
    const places = (await Promise.all((state.shortlist ?? []).map((id) => handlers.getPlace(id)))).filter(Boolean);
    return result({ visitorId, state, places, shortlist: state.shortlist, trip: state.trip },
      `Your shortlist has ${places.length} places.`);
  });

  server.registerTool("update_shortlist", {
    title: "Save your private shortlist",
    description: "Replace this visitor's shortlist with the supplied place IDs. Requires the private visitorId from search_places; preserves their existing trip.",
    inputSchema: { visitorId: visitorIdSchema, ids: idsSchema },
    annotations: { ...annotations(false), destructiveHint: true },
  }, async ({ visitorId, ids }) => {
    const shortlist = [...new Set(ids)];
    const places = await Promise.all(shortlist.map((id) => handlers.getPlace(id)));
    if (places.some((place) => !place)) return toolError("One or more place IDs are unknown. Nothing was saved.");
    const current = await handlers.getState(visitorId);
    const state = await handlers.saveState(visitorId, { shortlist, trip: current.trip ?? null });
    return result({ visitorId, state, shortlist: state.shortlist, trip: state.trip, places },
      `Saved ${shortlist.length} places to your private shortlist.`);
  });

  server.registerTool("plan_trip", {
    title: "Plan an unusual day trip",
    description: "Build a day-trip itinerary for selected curated place IDs. Legs show straight-line distances, not road routes or travel times. Visit durations are estimates; check opening times and accessibility before visiting. This calculation does not change the saved shortlist.",
    inputSchema: { ids: idsSchema.min(1) },
    annotations: annotations(),
  }, async ({ ids }) => {
    const uniqueIds = [...new Set(ids)];
    const places = await Promise.all(uniqueIds.map((id) => handlers.getPlace(id)));
    if (places.some((place) => !place)) return toolError("One or more place IDs are unknown. Search again for valid stops.");
    const trip = await handlers.planTrip(uniqueIds);
    return result({ ...trip, trip }, `Planned ${trip.places?.length ?? uniqueIds.length} stops. Distances are straight-line, not road routes or travel times. Visit durations are estimates.`);
  });
  return server;
}

/**
 * A fresh official SDK server/transport per HTTP request: no process-local MCP
 * session state, Node HTTP objects, or global visitor-state enumeration.
 * Business persistence is delegated to the caller's Durable Object handlers.
 */
export async function handleMcp(request, handlers) {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept, MCP-Protocol-Version, MCP-Session-Id, Last-Event-ID, Authorization",
    "Access-Control-Expose-Headers": "MCP-Protocol-Version, MCP-Session-Id",
    "Cache-Control": "no-store",
  };
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  // A stateless server does not provide a standalone SSE event stream.
  if (request.method === "GET" || request.method === "DELETE") {
    return new Response("This stateless MCP endpoint accepts POST requests.", {
      status: 405, headers: { ...cors, Allow: "POST, OPTIONS" },
    });
  }
  const server = createServer(handlers, new URL(request.url).origin);
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
    maxRequestBodySize: 1024 * 1024,
  });
  try {
    await server.connect(transport);
    const response = await transport.handleRequest(request);
    // JSON mode resolves only after the complete response is available.
    const headers = new Headers(response.headers);
    for (const [key, value] of Object.entries(cors)) headers.set(key, value);
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  } finally {
    await server.close();
  }
}
