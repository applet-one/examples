import { DurableObject } from "cloudflare:workers";
import { assets } from "./generated/assets.js";
import { WorkbookStore } from "./server/store.js";
import { routeApi } from "./server/routes.js";
import { HttpError } from "./shared/contracts.js";

export default {
  fetch(request, env) {
    return env.APPLET_STATE.get(env.APPLET_STATE.idFromName("default")).fetch(
      request,
    );
  },
};

export class AppletState extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.store = new WorkbookStore(ctx.storage);
  }
  async fetch(request) {
    let response;
    try {
      const path = new URL(request.url).pathname;
      if (path.startsWith("/api/"))
        response = await routeApi(request, this.store);
      else {
        if (!["GET", "HEAD"].includes(request.method))
          throw new HttpError(405, "Method not allowed.");
        if (!Object.hasOwn(assets, path))
          throw new HttpError(404, "Not found.");
        const asset = assets[path];
        response = new Response(
          request.method === "HEAD" ? null : asset.content,
          { headers: { "content-type": asset.type } },
        );
      }
    } catch (error) {
      if (!(error instanceof HttpError))
        console.error("Spreadsheet request failed", error.message);
      response = Response.json(
        {
          error:
            error instanceof HttpError
              ? error.message
              : "Storage request failed. Please retry.",
        },
        { status: error.status || 500 },
      );
    }
    response.headers.set("cache-control", "no-store");
    response.headers.set("x-content-type-options", "nosniff");
    response.headers.set("referrer-policy", "no-referrer");
    response.headers.set(
      "content-security-policy",
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; worker-src 'self' blob:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
    );
    return response;
  }
}
