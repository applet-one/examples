import { App } from "@modelcontextprotocol/ext-apps";

// Bundle this module inline BEFORE the shared UI script. No CDN imports remain.
const listeners = new Set();
let latest;
let app;
let connected = false;
let ready;
const requestOptions = { timeout: 12000 };
const openai = () => window.openai;

function normalize(raw) {
  if (!raw || typeof raw !== "object") return null;
  if (raw.isError) {
    return { error: raw.content?.filter((c) => c.type === "text").map((c) => c.text).join("\n") || "The host tool failed." };
  }
  let data = raw.structuredContent;
  if (!data && Array.isArray(raw.content)) {
    for (const block of raw.content) {
      if (block.type !== "text") continue;
      try { data = JSON.parse(block.text); break; } catch { /* Human-readable tool text. */ }
    }
  }
  data ??= raw;
  return { ...data, ...(raw._meta?.allPlaces ? { allPlaces: raw._meta.allPlaces } : {}) };
}

function publish(raw) {
  const data = normalize(raw);
  if (!data) return;
  latest = data;
  for (const callback of listeners) {
    try { callback(data); } catch (error) { console.error("Offbeat result listener:", error); }
  }
}

function legacyResult(globals = openai()) {
  if (globals?.toolOutput) publish(globals.toolOutput);
}

function requireSuccess(response, operation) {
  if (response?.isError || response?.success === false) {
    throw new Error(`The host rejected ${operation}. Nothing was confirmed sent.`);
  }
}

window.offbeatHost = {
  available() {
    return Boolean((connected && app.getHostCapabilities()?.serverTools) || typeof openai()?.callTool === "function");
  },
  async callTool(name, args = {}) {
    await ready;
    let raw;
    if (connected && app.getHostCapabilities()?.serverTools) {
      raw = await app.callServerTool({ name, arguments: args }, requestOptions);
    } else if (typeof openai()?.callTool === "function") {
      raw = await openai().callTool(name, args);
    } else {
      throw new Error("No assistant tool bridge is available. Open Offbeat in a compatible MCP Apps host.");
    }
    const data = normalize(raw);
    if (data?.error) throw new Error(data.error);
    publish(raw);
    return data;
  },
  onResult(callback) {
    if (typeof callback !== "function") throw new TypeError("onResult needs a callback.");
    listeners.add(callback);
    // Replay a result that arrived during the host handshake, before UI setup.
    if (latest) queueMicrotask(() => {
      if (listeners.has(callback)) {
        try { callback(latest); } catch (error) { console.error("Offbeat result listener:", error); }
      }
    });
    return () => listeners.delete(callback);
  },
  async sendSelection({ ids = [], places = [], prompt } = {}) {
    await ready;
    const selection = {
      ids: [...new Set(ids)],
      // Keep the context compact and never send visitor bearer capabilities.
      places: places.map((p) => ({
        id: p.id, name: p.name ?? p.title, city: p.city,
        category: p.category, description: p.description,
      })),
    };
    const message = prompt?.trim() || "Help me plan a day trip around these selected unusual places.";
    if (connected) {
      const capabilities = app.getHostCapabilities();
      if (!capabilities?.updateModelContext || !capabilities?.message) {
        throw new Error("This host cannot update model context and send a user message. Your selection has not been sent.");
      }
      const contextResult = await app.updateModelContext({
        ...(capabilities.updateModelContext.structuredContent ? { structuredContent: { selection } } : {}),
        content: [{ type: "text", text: `Offbeat selected places: ${JSON.stringify(selection)}` }],
      }, requestOptions);
      requireSuccess(contextResult, "the selection context update");
      const messageResult = await app.sendMessage({
        role: "user", content: [{ type: "text", text: message }],
      }, requestOptions);
      requireSuccess(messageResult, "the follow-up message");
    } else {
      const host = openai();
      if (typeof host?.setWidgetState !== "function" || typeof host?.sendFollowUpMessage !== "function") {
        throw new Error("No compatible assistant messaging bridge is available. Your selection has not been sent.");
      }
      // Current ChatGPT API is synchronous; older implementations may return a promise.
      const contextResult = await host.setWidgetState({
        ...(host.widgetState ?? {}),
        modelContent: { selection },
      });
      requireSuccess(contextResult, "the selection context update");
      const messageResult = await host.sendFollowUpMessage({ prompt: message });
      requireSuccess(messageResult, "the follow-up message");
    }
    return { sent: true, contextUpdated: true };
  },
};

// The compatibility host may inject its initial output before our script runs,
// or announce a later tool result through the globals event.
legacyResult();
window.addEventListener("openai:set_globals", (event) => {
  const globals = event.detail?.globals;
  if (globals && Object.hasOwn(globals, "toolOutput")) legacyResult(globals);
});

async function initialize() {
  if (window.parent === window && !window.__EMBEDDED__) return window.offbeatHost.available();
  app = new App({ name: "Offbeat explorer", version: "1.0.0" }, {}, { autoResize: false });
  // Must be installed before connect to capture the initial result.
  app.ontoolresult = publish;
  try {
    await app.connect(undefined, { timeout: 2500 });
    connected = true;
    const resize = () => {
      if (document.body && typeof ResizeObserver !== "undefined") app.setupSizeChangedNotifications();
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", resize, { once: true });
    else resize();
  } catch {
    // A regular website / older ChatGPT host is not an MCP Apps parent.
    connected = false;
  }
  legacyResult();
  window.dispatchEvent(new CustomEvent("offbeat:host-ready", { detail: { available: window.offbeatHost.available() } }));
  return window.offbeatHost.available();
}
ready = initialize();
window.offbeatHost.ready = ready;
