#!/usr/bin/env node
/**
 * Development-only, reproducible Wikimedia enrichment; the application never
 * needs live search. Run: node scripts/import-wikimedia.mjs
 * Options: --dry-run (do not write), --verify-websites (also GET official sites),
 * --verify-images (optional CDN reachability; failure never discards metadata).
 * Requires Node >= 18; no dependencies. Editorial copy/durations remain curated.
 * All API requests use a descriptive User-Agent, retries, and small batches.
 */
import { writeFile, rename } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { places, cities } from "../src/data.js";

const UA = "UnusualPlacesSeed/1.0 (Wikipedia/Commons travel catalogue; development import)";
const checkedAt = new Date().toISOString();
const dryRun = process.argv.includes("--dry-run");
const verifyWebsites = process.argv.includes("--verify-websites");
const verifyImages = process.argv.includes("--verify-images");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const chunks = (items, size) => Array.from(
  { length: Math.ceil(items.length / size) },
  (_, index) => items.slice(index * size, (index + 1) * size),
);

async function get(url, options = {}) {
  let lastError;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": UA, ...options.headers },
        signal: AbortSignal.timeout(45000),
        redirect: "follow",
      });
      if (!response.ok) {
        const retryAfter = Number(response.headers.get("retry-after"));
        await response.body?.cancel();
        const error = new Error(`HTTP ${response.status}: ${url}`);
        error.retryAfter = Number.isFinite(retryAfter) ? retryAfter : 0;
        throw error;
      }
      return response;
    } catch (error) {
      lastError = error;
      if (attempt < 3) {
        await sleep(Math.max(1500 * (attempt + 1), (error.retryAfter || 0) * 1000 + 1000));
      }
    }
  }
  throw lastError;
}

async function api(host, parameters) {
  const url = new URL(`https://${host}/w/api.php`);
  url.search = new URLSearchParams({
    action: "query", format: "json", formatversion: "2", ...parameters,
  }).toString();
  const data = await (await get(url)).json();
  if (data.error) throw new Error(`${host}: ${JSON.stringify(data.error)}`);
  if (!data.query?.pages) throw new Error(`No API pages returned by ${host}`);
  return data;
}

// Metadata is plain text, never executable Commons HTML.
function plain(value = "") {
  return String(value)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"')
    .replace(/&apos;|&#039;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/\s+/g, " ").trim();
}

function cleanMediaURL(value) {
  const url = new URL(value);
  // Wikimedia now sometimes returns thumb.wikimedia.org. The equivalent actual
  // upload.wikimedia.org path is checked below rather than guessed unchecked.
  if (url.hostname === "thumb.wikimedia.org") url.hostname = "upload.wikimedia.org";
  url.search = "";
  return url.href;
}

async function imageWorks(url) {
  try {
    const response = await get(url, { headers: { Range: "bytes=0-1023" } });
    const isImage = /^image\//i.test(response.headers.get("content-type") || "");
    await response.body?.cancel();
    return isImage;
  } catch {
    return false;
  }
}

function wikiIdentity(place) {
  const url = new URL(place.wikipedia);
  if (!/^(en|de)\.wikipedia\.org$/.test(url.hostname)) {
    throw new Error(`Unexpected Wikipedia host for ${place.id}`);
  }
  return {
    host: url.hostname,
    title: decodeURIComponent(url.pathname.replace(/^\/wiki\//, "")).replaceAll("_", " "),
  };
}

const pagesByPlace = new Map();
const groups = new Map();
for (const place of places) {
  const { host, title } = wikiIdentity(place);
  if (!groups.has(host)) groups.set(host, []);
  groups.get(host).push({ place, title });
}

for (const [host, entries] of groups) {
  for (const batch of chunks(entries, 12)) {
    const data = await api(host, {
      titles: batch.map((entry) => entry.title).join("|"),
      redirects: "1", prop: "pageimages|coordinates|info|pageprops",
      ppprop: "wikibase_item",
      piprop: "original|thumbnail|name", pithumbsize: "960",
      colimit: "max", inprop: "url",
    });
    const aliases = new Map([
      ...(data.query.normalized || []), ...(data.query.redirects || []),
    ].map(({ from, to }) => [from, to]));
    for (const entry of batch) {
      let title = entry.title;
      const seen = new Set();
      while (aliases.has(title) && !seen.has(title)) {
        seen.add(title);
        title = aliases.get(title);
      }
      const page = data.query.pages.find((item) => item.title === title);
      if (!page || page.missing) throw new Error(`Wikipedia page missing: ${entry.title}`);
      if (!entry.place.imageFile && !page.pageimage) {
        throw new Error(`No free pageimage: ${entry.place.id}; choose a verified Commons imageFile`);
      }
      pagesByPlace.set(entry.place.id, page);
    }
  }
}

const files = [...new Set(places.map((place) =>
  `File:${place.imageFile || pagesByPlace.get(place.id).pageimage}`,
))];
const images = new Map();
for (const batch of chunks(files, 8)) {
  const data = await api("commons.wikimedia.org", {
    titles: batch.join("|"), prop: "imageinfo", iiprop: "url|extmetadata",
    iiurlwidth: "960", iiextmetadatalanguage: "en", redirects: "1",
  });
  const normalization = new Map([
    ...(data.query.normalized || []), ...(data.query.redirects || []),
  ].map(({ from, to }) => [from, to]));
  for (const title of batch) {
    let normalized = title;
    const seen = new Set();
    while (normalization.has(normalized) && !seen.has(normalized)) {
      seen.add(normalized);
      normalized = normalization.get(normalized);
    }
    const page = data.query.pages.find((item) => item.title === normalized);
    const info = page?.imageinfo?.[0];
    if (!info) throw new Error(`Commons image missing: ${title}`);
    images.set(title, { title: page.title.replace(/^File:/, ""), ...info });
  }
}

const enriched = [];
for (const place of places) {
  const page = pagesByPlace.get(place.id);
  const info = images.get(`File:${place.imageFile || page.pageimage}`);
  const metadata = info.extmetadata || {};
  const artist = plain(metadata.Attribution?.value || metadata.Artist?.value);
  const license = plain(metadata.LicenseShortName?.value);
  if (!artist || !license) throw new Error(`Missing image attribution/license: ${place.id}`);
  const original = cleanMediaURL(info.url);
  let image = cleanMediaURL(info.thumburl || info.url);
  let imageCheckStatus = "metadata-verified";
  if (verifyImages) {
    if (await imageWorks(image)) {
      imageCheckStatus = "reachable";
    } else if (await imageWorks(original)) {
      image = original;
      imageCheckStatus = "reachable-original";
    } else {
      // A CDN 429/temporary transport failure is not evidence of a missing file.
      imageCheckStatus = "temporarily-unreachable";
      console.warn(`CDN reachability inconclusive: ${place.id}; keeping verified API URL`);
    }
  }
  const record = {
    ...place,
    wikipedia: page.canonicalurl || page.fullurl || place.wikipedia,
    image,
    imageCredit: artist,
    imageLicense: license,
    imageSource: info.descriptionurl,
    imageLicenseUrl: metadata.LicenseUrl?.value || "",
    imageOriginal: original,
    imageFile: info.title,
    wikipediaPageId: page.pageid,
    wikipediaRevisionId: page.lastrevid,
    wikidataId: page.pageprops?.wikibase_item || "",
    wikidata: page.pageprops?.wikibase_item
      ? `https://www.wikidata.org/wiki/${page.pageprops.wikibase_item}` : "",
    sourceCheckedAt: checkedAt,
    imageMetadataCheckedAt: checkedAt,
    imageCheckStatus,
  };
  if (verifyImages) record.imageCheckedAt = checkedAt;
  if (verifyWebsites && record.website) {
    const response = await get(record.website);
    if (!/text\/html/i.test(response.headers.get("content-type") || "")) {
      throw new Error(`Official site did not return HTML: ${record.website}`);
    }
    record.website = response.url;
    record.websiteCheckedAt = checkedAt;
    await response.body?.cancel();
  }
  record.sources = [...new Set([
    record.wikipedia, ...(record.wikidata ? [record.wikidata] : []),
    ...(record.website ? [record.website] : []),
  ])];
  enriched.push(record);
  console.log(`✓ ${place.name} — ${artist} / ${license}`);
  if (verifyImages) await sleep(400);
}

if (new Set(enriched.map((place) => place.id)).size !== enriched.length) {
  throw new Error("Duplicate place IDs");
}
for (const place of enriched) {
  if (!["architecture", "nature", "museums", "industrial"].includes(place.category) ||
      typeof place.outdoor !== "boolean" || !Number.isFinite(place.lat) ||
      !Number.isFinite(place.lng) || !Number.isInteger(place.durationMinutes)) {
    throw new Error(`Invalid editorial fields: ${place.id}`);
  }
}

const header = `// Curated static seed; no runtime API/search dependency.
// Wikipedia facts and Commons images verified with scripts/import-wikimedia.mjs.
// Descriptions/whyVisit are original editorial summaries, not copied extracts.
// durationMinutes is a planning estimate, never an opening-hours claim.
// outdoor means mainly open-air; mixed indoor/outdoor sites may be marked true.
// Coordinates are attraction locations, not routing or accessibility guarantees.
// Display imageCredit + imageLicense and link imageSource / imageLicenseUrl.
`;
if (!dryRun) {
  const destination = fileURLToPath(new URL("../src/data.js", import.meta.url));
  const temporary = `${destination}.tmp`;
  await writeFile(temporary, `${header}\nexport const places = ${JSON.stringify(enriched, null, 2)};\n\nexport const cities = ${JSON.stringify(cities, null, 2)};\n`);
  await rename(temporary, destination);
}
console.log(`${dryRun ? "Verified" : "Wrote"} ${enriched.length} places with verified Commons metadata.`);
