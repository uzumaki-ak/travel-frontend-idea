#!/usr/bin/env node
/**
 * Snapshots the live tour listing (/tours/) into `src/content/tour-archive.json`.
 *
 * How the live listing works (theme plugin "archivescript.js"):
 *   - the first 9 cards are server-rendered HTML;
 *   - "Load More" fetches the next 9 from the public REST API
 *     (wp/v2/tours?per_page=9&offset=…&order=asc) and builds each card in JS,
 *     until data-maxpage is reached;
 *   - /tours/page/<n>/ URLs exist but all show the same first 9 cards.
 * So: cards 1–9 are copied from the HTML; the rest are built with the exact
 * same rules as that script, so every card reads as a visitor sees it.
 *
 * The listing shows "includes" as unlabeled SVG icons; each distinct icon is
 * mapped to the same include name the tour pages use. An unknown icon fails
 * the sync instead of being guessed.
 *
 * Usage:
 *   node scripts/sync-tour-archive.mjs               # fetch live pages
 *   node scripts/sync-tour-archive.mjs --from <dir>  # parse cached p1.html … pN.html
 */
import { createHash } from "node:crypto";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "node-html-parser";

const SITE = "https://www.kajaawa.com";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_FILE = path.join(ROOT, "src/content/tour-archive.json");
const MEDIA_DIRS = [
  ["/media/home", path.join(ROOT, "public/media/home")],
  ["/media/tours", path.join(ROOT, "public/media/tours")],
];
const DOWNLOAD_DIR = path.join(ROOT, "public/media/tours");
const FETCH_TIMEOUT_MS = 30_000;
const API_FIELDS = [
  "id", "title", "type", "link", "featured_media", "_links",
  "_kajaawa_tour_settings_duration_type", "_kajaawa_tour_settings_duration_day",
  "_kajaawa_tour_settings_single_price", "_kajaawa_tour_settings_standard_price",
  "_kajaawa_tour_settings_deluxe_price", "_kajaawa_tour_settings_luxury_price",
  "_kajaawa_tour_settings_package_includes",
].join(",");

/** Include keys used by the live script → include names used on the tour pages. */
const INCLUDE_KEYS = {
  building: "Hotel",
  car: "Transportation",
  cutlery: "Breakfast",
  camping: "Camping",
  camera: "Sightseeing",
  activities: "Activities",
};
const USER_AGENT = "Mozilla/5.0 (compatible; site-snapshot/1.0)";

/** md5 (first 8 hex) of each include icon's SVG markup → include name used on tour pages. */
const INCLUDE_ICONS = {
  "9b4bf40f": "Breakfast", // spoon + fork
  "9b6eaa4d": "Camping", // tent + moon
  "17821e2e": "Activities", // hiker
  "1d884a2e": "Hotel", // building
  "51c08d71": "Transportation", // car
  "7cf1226d": "Sightseeing", // camera
};

const args = process.argv.slice(2);
const fromIdx = args.indexOf("--from");
const fromDir = fromIdx >= 0 ? args[fromIdx + 1] : null;

// Collapse ordinary whitespace like a browser does, but keep non-breaking spaces (they render).
const clean = (s) => s.replace(/[ \t\n\r\f]+/g, " ").replace(/^[ \t\n\r\f]+|[ \t\n\r\f]+$/g, "");
const textOf = (n) => (n ? clean(n.text) : "");
const exists = (f) => access(f).then(() => true, () => false);

async function fetchText(url) {
  const res = await fetch(url, { headers: { "user-agent": USER_AGENT }, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  return { status: res.status, body: res.ok ? await res.text() : "" };
}

async function loadPage(n) {
  if (fromDir) {
    const file = path.join(fromDir, `p${n}.html`);
    return (await exists(file)) ? readFile(file, "utf8") : null;
  }
  const { status, body } = await fetchText(n === 1 ? `${SITE}/tours/` : `${SITE}/tours/page/${n}/`);
  return status === 200 ? body : null;
}

function sitePath(href) {
  const url = new URL(href, SITE);
  if (url.hostname !== "www.kajaawa.com" || !/^\/tours\/[a-z0-9-]+\/$/.test(url.pathname)) {
    throw new Error(`Unexpected card link: ${href}`);
  }
  return url.pathname;
}

const originalOf = (url) => url.replace(/-\d+x\d+(\.[a-z]+)$/i, "$1");

async function localizeImage(src) {
  if (!src) return null;
  const url = new URL(src, SITE);
  if (url.hostname !== "www.kajaawa.com" || !url.pathname.startsWith("/wp-content/uploads/")) return null;
  for (const candidate of [originalOf(url.href), url.href]) {
    const name = path.basename(new URL(candidate).pathname);
    for (const [prefix, dir] of MEDIA_DIRS) if (await exists(path.join(dir, name))) return `${prefix}/${name}`;
    const res = await fetch(candidate, { headers: { "user-agent": USER_AGENT }, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!res.ok || !(res.headers.get("content-type") ?? "").startsWith("image/")) continue;
    await mkdir(DOWNLOAD_DIR, { recursive: true });
    await writeFile(path.join(DOWNLOAD_DIR, name), Buffer.from(await res.arrayBuffer()));
    return `/media/tours/${name}`;
  }
  console.warn(`  image unavailable on the live site: ${src}`);
  return null;
}

async function parsePage(html, n) {
  const root = parse(html);
  const head = root.querySelector("head");
  const seo = {
    // Byte-exact, like the tour pages.
    title: (head.querySelector("title")?.text ?? "").trim(),
    description: head.querySelector('meta[name="description"]')?.getAttribute("content") ?? "",
    canonical: new URL(head.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? `${SITE}/tours/`).pathname,
  };

  const cards = [];
  for (const article of root.querySelectorAll("article.post-article--custom")) {
    const link = article.querySelector(".archive-title-heading a");
    const price = article.querySelector(".related_price");
    const smalls = price ? price.querySelectorAll(".text-small").map(textOf) : [];
    const includes = article.querySelectorAll(".related_includes svg").map((svg) => {
      const key = createHash("md5").update(svg.toString()).digest("hex").slice(0, 8);
      const name = INCLUDE_ICONS[key];
      if (!name) throw new Error(`Page ${n}: unknown include icon ${key} on "${textOf(link)}" — add it to INCLUDE_ICONS`);
      return name;
    });
    const img = article.querySelector("img");
    cards.push({
      title: textOf(link),
      href: sitePath(link.getAttribute("href")),
      image: await localizeImage(img?.getAttribute("data-src") || null),
      duration: textOf(article.querySelector(".related_days")),
      ...(price && {
        price: { label: smalls[0] ?? "", amount: textOf(price.querySelector(".price-number")), unit: smalls[1] ?? "" },
      }),
      includes,
      queryLabel: article.querySelector("input.enquiry-btn")?.getAttribute("value") ?? "",
      detailsLabel: textOf(article.querySelector("a.view_details")),
    });
  }

  return {
    seo,
    heading: textOf(root.querySelector("h1.page-title")),
    loadMoreLabel: textOf(root.querySelector("button.ajax-load-more")),
    cards,
  };
}

/** Decodes HTML entities in an API title (e.g. "&amp;", "&#8216;") exactly as a browser would. */
const decode = (html) => parse(`<p>${html}</p>`).text;

/** Builds one card from an API item using the same rules as the live "Load More" script. */
async function cardFromApi(item) {
  const type = item._kajaawa_tour_settings_duration_type;
  const day = String(item._kajaawa_tour_settings_duration_day ?? "");
  const includes = item._kajaawa_tour_settings_package_includes;
  let duration = "";
  let price;
  let icons = [];

  if (type === "multi") {
    const first = [
      item._kajaawa_tour_settings_standard_price,
      item._kajaawa_tour_settings_deluxe_price,
      item._kajaawa_tour_settings_luxury_price,
    ].find((p) => typeof p === "string" && p.length > 0);
    // The live script only builds "N Days / N-1 Nights" when the value is numeric
    // (`duration > 2` / `duration <= 2`). For a non-numeric value it prints the literal
    // text "undefined" — a bug we don't reproduce. Agreed with the client: show the
    // API's own value as-is (e.g. "4 Days / 3 Nights").
    if (day && !Number.isNaN(Number(day))) {
      duration = `${day} Days / ${Number(day) - 1} Nights`;
    } else if (day) {
      duration = day;
      console.warn(`  note: "${decode(item.title.rendered)}" duration "${day}" renders as "undefined" on the live listing — shown as the API value`);
    }
    if (first) price = { label: "Starting From:", amount: first, unit: "per person" };
    if (Array.isArray(includes) && includes.length) {
      // Same as the script: all 6 → four fixed icons; otherwise the first four in order.
      const keys = includes.length === 6 ? ["building", "car", "cutlery", "camping"] : includes.slice(0, 4);
      icons = keys.map((k) => {
        if (!INCLUDE_KEYS[k]) throw new Error(`Unknown include key "${k}" on "${item.title.rendered}"`);
        return INCLUDE_KEYS[k];
      });
    }
  } else if (type === "single") {
    duration = day;
    const single = item._kajaawa_tour_settings_single_price ?? "";
    // The live script prints the price line even when the price is empty
    // ("Starting From: ₹ per person"); keep that exactly and report it.
    if (!single) console.warn(`  note: "${decode(item.title.rendered)}" has an empty price on the live listing`);
    price = { label: "Starting From:", amount: single, unit: "per person" };
  } else {
    throw new Error(`Unknown duration type "${type}" on "${item.title.rendered}"`);
  }

  const media = item._embedded?.["wp:featuredmedia"]?.[0]?.media_details?.sizes?.medium_large?.source_url;
  return {
    title: decode(item.title.rendered),
    href: sitePath(item.link),
    image: await localizeImage(media ?? null),
    duration,
    ...(price && { price }),
    includes: icons,
    queryLabel: "Send Query",
    detailsLabel: "View Details",
  };
}

async function main() {
  const html = await loadPage(1);
  if (!html) throw new Error("Could not load /tours/");
  const first = await parsePage(html, 1);
  if (!first.cards.length) throw new Error("No tour listing found — has the theme changed?");
  const spanData = parse(html).querySelector(".span-data");
  const perPage = Number(spanData?.getAttribute("data-perpage") ?? 9);
  const maxPage = Number(spanData?.getAttribute("data-maxpage") ?? 1);
  console.log(`page 1 (HTML): ${first.cards.length} cards; load-more pages up to ${maxPage}`);

  const cards = [...first.cards];
  for (let page = 1; page < maxPage; page++) {
    const url = `${SITE}/wp-json/wp/v2/tours?per_page=${perPage}&offset=${perPage * page}&_embed&?filter[orderby]=date&order=asc&_fields=${API_FIELDS}`;
    const res = await fetch(url, { headers: { "user-agent": USER_AGENT }, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!res.ok) throw new Error(`API page ${page + 1}: HTTP ${res.status}`);
    const items = await res.json();
    if (!items.length) break;
    for (const item of items) cards.push(await cardFromApi(item));
    console.log(`load-more ${page + 1}: ${items.length} cards`);
  }

  // Which /tours/page/<n>/ URLs answer 200 on the live site (they all repeat page 1).
  let lastPagedUrl = 1;
  for (let n = 2; n <= 50; n++) {
    const res = await fetch(`${SITE}/tours/page/${n}/`, { method: "HEAD", headers: { "user-agent": USER_AGENT }, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS), redirect: "manual" });
    if (res.status !== 200) break;
    lastPagedUrl = n;
  }
  console.log(`/tours/page/2/ … /tours/page/${lastPagedUrl}/ answer 200 on the live site`);

  const out = {
    capturedAt: new Date().toISOString(),
    lastPagedUrl,
    seo: first.seo,
    heading: first.heading,
    loadMoreLabel: first.loadMoreLabel,
    perPage,
    cards,
  };
  await writeFile(OUT_FILE, `${JSON.stringify(out, null, 2)}
`);
  console.log(`Wrote ${path.relative(ROOT, OUT_FILE)}: ${cards.length} cards`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
