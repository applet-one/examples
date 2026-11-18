import { DurableObject } from "cloudflare:workers";
import { assets } from "./generated/assets.js";
import { DatasetStorage } from "./server/storage.js";
import { routeApi, HttpError } from "./server/routes.js";

const securityHeaders = {
  "x-prioboard-version": "2026-11-16-members-1",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
  "referrer-policy": "no-referrer",
  "content-security-policy":
    "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
};

export class App extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.store = new DatasetStorage(ctx.storage);
  }

  async fetch(request) {
    let response;
    try {
      const path = new URL(request.url).pathname;
      if (path.startsWith("/api/"))
        response = await routeApi(request, this.store);
      else {
        const asset = assets[path];
        if (!Object.hasOwn(assets, path)) throw new HttpError(404, "Not found");
        if (!["GET", "HEAD"].includes(request.method))
          throw new HttpError(405, "Method not allowed");
        response = new Response(
          request.method === "HEAD" ? null : asset.content,
          { headers: { "content-type": asset.type } },
        );
      }
    } catch (error) {
      if (!(error instanceof HttpError))
        console.error("Priority board request failed");
      response = Response.json(
        {
          error:
            error instanceof HttpError
              ? error.message
              : "The request failed. The previous saved dataset was retained if replacement failed.",
        },
        { status: error instanceof HttpError ? error.status : 500 },
      );
    }
    for (const [name, value] of Object.entries(securityHeaders))
      response.headers.set(name, value);
    return response;
  }
}
