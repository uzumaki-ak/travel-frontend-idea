#!/usr/bin/env node
/**
 * Snapshots the live kajaawa.com homepage into `src/content/home.snapshot.json`
 * and downloads every referenced image into `public/media/home/`.
 *
 * Why a snapshot: the client requires the copy to stay word-for-word identical
 * to the live WordPress site. Extracting it mechanically (instead of retyping)
 * makes that verifiable and repeatable until the new admin/CMS replaces it.
 *
 * Usage:
 *   node scripts/sync-home-snapshot.mjs                 # fetch live site
 *   node scripts/sync-home-snapshot.mjs --from page.html # parse a saved copy
 *   add --skip-media to skip image downloads
 *
 * Zero dependencies on purpose: the markup is the theme's own, predictable
 * template, and this script runs only at dev time.
 */
import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SITE = "https://www.kajaawa.com";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_JSON = path.join(ROOT, "src/content/home.snapshot.json");
const MEDIA_DIR = path.join(ROOT, "public/media/home");
const MEDIA_URL = "/media/home";
const FETCH_TIMEOUT_MS = 20_000;
const USER_AGENT = "Mozilla/5.0 (compatible; site-snapshot/1.0)";

const args = process.argv.slice(2);
const fromIdx = args.indexOf("--from");
const fromFile = fromIdx >= 0 ? args[fromIdx + 1] : null;
const skipMedia = args.includes("--skip-media");

/* ------------------------------------------------------------------ */
/* Text helpers                                                        */
/* ------------------------------------------------------------------ */

const NAMED_ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", copy: "©" };

function decodeEntities(text) {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&([a-z]+);/gi, (m, name) => NAMED_ENTITIES[name.toLowerCase()] ?? m);
}

/** Strips tags and collapses whitespace, keeping the visible words exactly. */
function toText(html) {
  return decodeEntities(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

/** Turns an absolute site URL into a root-relative path; leaves external URLs alone. */
function toSitePath(href) {
  const decoded = decodeEntities(href);
  return decoded.startsWith(SITE) ? decoded.slice(SITE.length) || "/" : decoded;
}

function firstMatch(html, re) {
  const m = html.match(re);
  return m ? m[1] : null;
}

/* ------------------------------------------------------------------ */
/* Extraction                                                          */
/* ------------------------------------------------------------------ */

/** Splits the main article into `{ heading, body }` chunks at every <h2>. */
function splitByH2(html) {
  const parts = [];
  const re = /<h2[^>]*>([\s\S]*?)<\/h2>/g;
  const hits = [...html.matchAll(re)];
  hits.forEach((hit, i) => {
    const start = hit.index + hit[0].length;
    const end = i + 1 < hits.length ? hits[i + 1].index : html.length;
    parts.push({ heading: toText(hit[1]), body: html.slice(start, end) });
  });
  return parts;
}

function extractCards(body) {
  const items = [];
  const re = /<a href="([^"]+)"[^>]*class="block_link"[^>]*>([\s\S]*?)<\/a>/g;
  for (const [, href, inner] of body.matchAll(re)) {
    const image = firstMatch(inner, /data-src="([^"]+)"/) ?? firstMatch(inner, /src="([^"]+)"/);
    const title = toText(firstMatch(inner, /<h3[^>]*>([\s\S]*?)<\/h3>/) ?? "");
    const duration = firstMatch(inner, /class="related_days">([\s\S]*?)<\/div>/);
    const price = firstMatch(inner, /class="related_price"[^>]*>([\s\S]*?)<\/p>/);
    items.push({
      title,
      href: toSitePath(href),
      image: image ? decodeEntities(image) : null,
      ...(duration !== null && { duration: toText(duration) }),
      ...(price !== null && { price: toText(price) }),
    });
  }
  return items;
}

function extractLinks(html) {
  const re = /<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
  return [...html.matchAll(re)]
    .map(([, href, inner]) => ({ label: toText(inner), href: toSitePath(href) }))
    .filter((l) => l.label.length > 0);
}

function extractFooterWidget(html, title) {
  const re = new RegExp(`<h2 class="widget-title">${title}</h2>([\\s\\S]*?)</aside>`);
  const body = firstMatch(html, re);
  if (!body) throw new Error(`Footer widget "${title}" not found`);
  return body;
}

function extract(html) {
  const article = firstMatch(html, /<article[\s\S]*?>([\s\S]*?)<\/article>/);
  if (!article) throw new Error("Main <article> not found — has the theme changed?");

  const firstH2 = article.search(/<h2/);
  const introHtml = article.slice(0, firstH2);
  // The intro is a single block whose paragraphs are separated by <br>.
  const introBlock =
    firstMatch(introHtml, /class="wp-block-group__inner-container[^"]*">([\s\S]*?)<\/div>/) ?? "";
  const intro = introBlock
    .split(/<br\s*\/?>/i)
    .map((p) => toText(p))
    .filter(Boolean);
  if (intro.length === 0) throw new Error("Intro copy not found — has the homepage markup changed?");

  const heroImg = introHtml.match(
    /<img[^>]*width="(\d+)"[^>]*height="(\d+)"[^>]*src="([^"]+)"[^>]*alt="([^"]*)"/,
  );

  const sections = splitByH2(article).map(({ heading, body }) => {
    // Match the element, not the class name inside the inline <style> that precedes it.
    if (body.includes('<div class="serial-links-list">')) {
      return { kind: "links", title: heading, items: extractLinks(body) };
    }
    const items = extractCards(body);
    const isPriced = items.some((i) => "price" in i || "duration" in i);
    return { kind: isPriced ? "cards" : "destinations", title: heading, items };
  });

  const topbar = firstMatch(html, /<section class="topbar_contact">([\s\S]*?)<\/section>/) ?? "";
  const topbarItems = [...topbar.matchAll(/<div>\s*([^<]+?)\s*<a href="([^"]+)"[^>]*>([^<]+)<\/a>/g)].map(
    ([, label, href, value]) => ({ label: toText(label), href: decodeEntities(href), value: toText(value) }),
  );

  const navHtml = firstMatch(html, /<nav[^>]*id="site-navigation"[\s\S]*?<ul[^>]*>([\s\S]*?)<\/ul>/) ?? "";
  const sticky = firstMatch(html, /class="sticky-bar[^"]*">([\s\S]*?)<\/main>/) ?? "";

  const form = firstMatch(html, /<form[^>]*class="wpcf7-form[\s\S]*?>([\s\S]*?)<\/form>/) ?? "";
  const formFields = [...form.matchAll(/<label for="([^"]+)">([^<]+)<\/label>/g)].map(([, id, label]) => ({
    id,
    label: toText(label),
  }));
  const placeholders = [...form.matchAll(/placeholder="([^"]+)"[^>]*name="([^"]+)"/g)].map(([, placeholder, name]) => ({
    name,
    placeholder: decodeEntities(placeholder),
  }));

  const followHtml = extractFooterWidget(html, "Follow Us");
  const copyright = toText(firstMatch(html, /class="copyright-bar">([\s\S]*?)<\/div>/) ?? "");

  return {
    source: { url: `${SITE}/`, capturedAt: new Date().toISOString() },
    seo: {
      title: decodeEntities(firstMatch(html, /<title>([^<]*)<\/title>/) ?? ""),
      description: decodeEntities(firstMatch(html, /<meta name="description" content="([^"]*)"/) ?? ""),
    },
    brand: {
      name: "Kajaawa",
      logo: decodeEntities(firstMatch(html, /class="header-image is-logo-image" alt="[^"]*" src="([^"]+)"/) ?? ""),
    },
    topbar: topbarItems,
    nav: extractLinks(navHtml),
    hero: heroImg
      ? { src: decodeEntities(heroImg[3]), alt: decodeEntities(heroImg[4]), width: Number(heroImg[1]), height: Number(heroImg[2]) }
      : null,
    intro,
    sections,
    enquiry: {
      stickyButtonLabel: firstMatch(sticky, /value="([^"]+)" class="button-open-modal"/),
      whatsappHref: decodeEntities(firstMatch(sticky, /href="(https:\/\/wa\.me[^"]+)"/) ?? ""),
      phoneHref: firstMatch(sticky, /href="(tel:[^"]+)"/),
      formTitle: toText(firstMatch(form, /class="form-title-custom">([\s\S]*?)<\/h3>/) ?? ""),
      fields: formFields,
      placeholders,
      submitLabel: firstMatch(form, /type="submit" value="([^"]+)"/),
      honeypotLabel: toText(firstMatch(form, /class="hp-message">([\s\S]*?)<\/label>/) ?? ""),
      cf7FormId: firstMatch(form, /name="_wpcf7" value="(\d+)"/),
    },
    footer: {
      getInTouch: { title: "Get in Touch", links: extractLinks(extractFooterWidget(html, "Get in Touch")) },
      followUs: {
        title: "Follow Us",
        links: [...followHtml.matchAll(/<a href="([^"]+)"><i class="fa fa-([a-z]+)"/g)].map(([, href, network]) => ({
          network,
          href: decodeEntities(href),
        })),
      },
      taxiService: { title: "Our Taxi Service", links: extractLinks(extractFooterWidget(html, "Our Taxi Service")) },
      copyright,
    },
  };
}

/* ------------------------------------------------------------------ */
/* Media                                                               */
/* ------------------------------------------------------------------ */

async function fetchWithTimeout(url) {
  return fetch(url, { headers: { "user-agent": USER_AGENT }, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
}

/** WordPress resized copies end in `-768x473`; the original sits next to them. */
function originalOf(url) {
  return url.replace(/-\d+x\d+(\.[a-z]+)$/i, "$1");
}

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

async function downloadImage(url) {
  const candidates = [...new Set([originalOf(url), url])];
  for (const candidate of candidates) {
    const fileName = path.basename(new URL(candidate).pathname);
    const target = path.join(MEDIA_DIR, fileName);
    if (await exists(target)) return `${MEDIA_URL}/${fileName}`;
    const res = await fetchWithTimeout(candidate);
    if (!res.ok) continue;
    await writeFile(target, Buffer.from(await res.arrayBuffer()));
    return `${MEDIA_URL}/${fileName}`;
  }
  throw new Error(`Could not download ${url}`);
}

/** Replaces every remote image URL in the snapshot with its local path. */
async function localizeMedia(snapshot) {
  await mkdir(MEDIA_DIR, { recursive: true });
  const cache = new Map();
  const localize = async (url) => {
    if (!url) return url;
    if (!cache.has(url)) cache.set(url, await downloadImage(url));
    return cache.get(url);
  };

  if (snapshot.hero) snapshot.hero.src = await localize(snapshot.hero.src);
  snapshot.brand.logo = await localize(snapshot.brand.logo);
  for (const section of snapshot.sections) {
    for (const item of section.items) if ("image" in item) item.image = await localize(item.image);
  }
  return cache.size;
}

/* ------------------------------------------------------------------ */

async function main() {
  const html = fromFile
    ? await readFile(fromFile, "utf8")
    : await (await fetchWithTimeout(`${SITE}/`)).text();

  const snapshot = extract(html);
  const downloaded = skipMedia ? 0 : await localizeMedia(snapshot);

  await mkdir(path.dirname(OUT_JSON), { recursive: true });
  await writeFile(OUT_JSON, `${JSON.stringify(snapshot, null, 2)}\n`);

  const counts = snapshot.sections.map((s) => `${s.title} (${s.kind}: ${s.items.length})`);
  console.log(`Wrote ${path.relative(ROOT, OUT_JSON)}`);
  console.log(`Intro paragraphs: ${snapshot.intro.length}; images: ${downloaded}`);
  console.log(counts.join("\n"));
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
