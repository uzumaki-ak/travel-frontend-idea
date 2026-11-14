#!/usr/bin/env node
/**
 * Snapshots every live tour page (/tours/<slug>/) into
 * `src/content/tours/<slug>.json` + `src/content/tours/index.json`, and
 * downloads the photos into `public/media/tours/`.
 *
 * Content rule: all text is copied verbatim from the rendered page — nothing
 * is written by hand. The page body is NOT available through the WordPress
 * REST API (it is rendered by the theme), so the rendered HTML is the source.
 *
 * Safety rule: the output never contains raw HTML. Text is extracted into a
 * small typed block model, and links are whitelisted:
 *   - kajaawa.com URLs        → kept as site paths
 *   - google.com/maps URLs    → kept (verified Google Maps domain)
 *   - their own tel / mailto / wa.me → kept
 *   - anything else (incl. opaque short links) → text only, listed in the report
 * Scripts, iframes, forms, inputs, icons and inline SVG are dropped.
 *
 * Usage:
 *   node scripts/sync-tours-snapshot.mjs                    # fetch live pages
 *   node scripts/sync-tours-snapshot.mjs --from <dir>       # parse cached <slug>.html files
 *   add --skip-media to skip image downloads
 */
import { access, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "node-html-parser";

const SITE = "https://www.kajaawa.com";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "src/content/tours");
const MEDIA_DIR = path.join(ROOT, "public/media/tours");
const HOME_MEDIA_DIR = path.join(ROOT, "public/media/home");
const FETCH_TIMEOUT_MS = 30_000;
const CONCURRENCY = 3;
const USER_AGENT = "Mozilla/5.0 (compatible; site-snapshot/1.0)";

const OWN_PHONE = "916033114867";
const OWN_EMAIL = "info@kajaawa.com";

const args = process.argv.slice(2);
const fromIdx = args.indexOf("--from");
const fromDir = fromIdx >= 0 ? args[fromIdx + 1] : null;
const skipMedia = args.includes("--skip-media");

const report = { droppedLinks: [], droppedElements: new Map(), warnings: [] };

/* ------------------------------------------------------------------ */
/* Text + link helpers                                                 */
/* ------------------------------------------------------------------ */

const clean = (s) => s.replace(/\s+/g, " ").trim();
const textOf = (node) => (node ? clean(node.text) : "");

function sanitizeHref(href, where) {
  const raw = (href ?? "").trim();
  let url;
  try {
    url = new URL(raw, SITE);
  } catch {
    report.droppedLinks.push({ where, href: raw, reason: "unparseable" });
    return null;
  }
  const host = url.hostname.toLowerCase();
  if (url.protocol === "tel:" && url.href.replace(/\D/g, "").endsWith(OWN_PHONE)) return `tel:+${OWN_PHONE}`;
  if (url.protocol === "mailto:" && url.pathname.toLowerCase() === OWN_EMAIL) return `mailto:${OWN_EMAIL}`;
  if (url.protocol !== "https:") {
    report.droppedLinks.push({ where, href: raw, reason: "non-https" });
    return null;
  }
  if (host === "www.kajaawa.com" || host === "kajaawa.com") return url.pathname;
  if ((host === "www.google.com" || host === "google.com") && url.pathname.startsWith("/maps")) return url.href;
  if (host === "wa.me" && url.pathname.replace(/\D/g, "") === OWN_PHONE) return url.href;
  report.droppedLinks.push({ where, href: raw, reason: "not whitelisted" });
  return null;
}

/** Inline content: runs of text, optionally bold and/or linked. */
function inlineOf(node, where) {
  const runs = [];
  const walk = (n, bold, href) => {
    if (n.nodeType === 3) {
      const t = n.text.replace(/\s+/g, " ");
      if (t.trim() || (runs.length && t === " ")) runs.push({ text: t, ...(bold && { bold: true }), ...(href && { href }) });
      return;
    }
    if (n.nodeType !== 1) return;
    const tag = n.rawTagName?.toLowerCase();
    if (["i", "svg", "img", "script", "style", "input", "button", "iframe", "form"].includes(tag)) return;
    if (tag === "br") return runs.push({ text: " " });
    const nextBold = bold || tag === "b" || tag === "strong";
    const nextHref = tag === "a" ? sanitizeHref(n.getAttribute("href"), where) ?? undefined : href;
    for (const c of n.childNodes) walk(c, nextBold, nextHref);
  };
  walk(node, false, undefined);
  // merge adjacent runs with identical formatting, then trim the ends
  const merged = [];
  for (const r of runs) {
    const last = merged.at(-1);
    if (last && last.bold === r.bold && last.href === r.href) last.text += r.text;
    else merged.push({ ...r });
  }
  for (const r of merged) r.text = r.text.replace(/\s+/g, " ");
  if (merged[0]) merged[0].text = merged[0].text.trimStart();
  if (merged.at(-1)) merged.at(-1).text = merged.at(-1).text.trimEnd();
  return merged.filter((r) => r.text.length > 0);
}

const LIST_MARKER = /^[➤•▪►-]\s*/;
const INLINE_TAGS = new Set(["a", "strong", "b", "em", "span", "u"]);
const BLOCK_SELECTOR = "p,ul,ol,table,div,h2,h3,h4";

/** Generic, whitelisted block extraction for any section body. */
function blocksOf(container, where) {
  const blocks = [];
  const visit = (n) => {
    if (n.nodeType === 3) {
      const t = clean(n.text);
      if (t) blocks.push({ type: "p", content: [{ text: t }] });
      return;
    }
    if (n.nodeType !== 1) return;
    const tag = n.rawTagName?.toLowerCase();
    const cls = n.getAttribute("class") ?? "";
    if (["script", "style", "iframe", "form", "input", "button", "img", "svg", "i", "video", "object", "embed", "head", "title", "meta", "link"].includes(tag)) {
      if (["script", "iframe", "form", "video", "object", "embed"].includes(tag)) {
        report.droppedElements.set(tag, (report.droppedElements.get(tag) ?? 0) + 1);
      }
      return;
    }
    if (tag === "h2" || tag === "h3" || tag === "h4") {
      const t = textOf(n);
      if (t) blocks.push({ type: "heading", text: t });
      return;
    }
    if (tag === "p" && /text-semi-bold/.test(cls) && n.querySelector("span.span-normal")) {
      const value = textOf(n.querySelector("span.span-normal"));
      const label = clean(n.text.replace(n.querySelector("span.span-normal").text, "")).replace(/:\s*$/, "");
      blocks.push({ type: "fact", label, value });
      return;
    }
    if (tag === "p") {
      const content = inlineOf(n, where);
      if (content.length) blocks.push({ type: "p", content });
      return;
    }
    if (tag === "ul" || tag === "ol") {
      const items = n
        .querySelectorAll(":scope > li")
        .map((li) => {
          const content = inlineOf(li, where);
          if (content[0]) content[0].text = content[0].text.replace(LIST_MARKER, "");
          return content.filter((r) => r.text.length > 0);
        })
        .filter((c) => c.length);
      if (items.length) blocks.push({ type: "list", items });
      return;
    }
    if (tag === "table") {
      const caption = textOf(n.querySelector("caption"));
      const head = n.querySelectorAll("thead th").map(textOf);
      const rows = n
        .querySelectorAll("tbody tr")
        .map((tr) => tr.querySelectorAll("td,th").map(textOf))
        .filter((r) => r.length);
      blocks.push({ type: "table", ...(caption && { caption }), head, rows });
      return;
    }
    if (tag === "div" && (/activity-title/.test(cls) || /text-semi-bold/.test(cls)) && !n.querySelector("p,ul,div")) {
      const t = textOf(n);
      if (t) blocks.push({ type: "label", text: t });
      return;
    }
    // Inline-only content (e.g. `<div><strong>Location Map:</strong> <a>…</a></div>` or a bare
    // <a>/<strong>) becomes one paragraph, so bold text and links stay together and every
    // link still goes through the whitelist.
    if (INLINE_TAGS.has(tag) || (tag === "div" && !n.querySelector(BLOCK_SELECTOR))) {
      const content = inlineOf(n, where);
      if (content.length) blocks.push({ type: "p", content });
      return;
    }
    for (const c of n.childNodes) visit(c);
  };
  for (const c of container.childNodes) visit(c);
  return blocks;
}

/* ------------------------------------------------------------------ */
/* Section parsers                                                     */
/* ------------------------------------------------------------------ */

function parseItinerary(container) {
  return container.querySelectorAll(".tour-itinerary").map((day) => {
    const notes = [];
    for (const p of day.querySelectorAll(".tour-day-additional-items p")) {
      const t = textOf(p);
      if (t && !notes.includes(t)) notes.push(t);
    }
    return {
      ...(day.querySelector(".tour-day-title") && { title: textOf(day.querySelector(".tour-day-title")) }),
      items: day.querySelectorAll(".tour-day-list-item").map(textOf).filter(Boolean),
      notes,
    };
  });
}

/** "Standard" heading rows followed by "<b>Place:</b> hotels" rows. Returns null if the list doesn't fit. */
function parseHotels(container) {
  const lis = container.querySelectorAll("ul > li");
  const tiers = [];
  for (const li of lis) {
    const b = li.querySelector("b,strong");
    const hasMarker = !!li.querySelector("i");
    if (b && !hasMarker && clean(li.text) === clean(b.text)) {
      tiers.push({ name: clean(b.text).replace(/:$/, ""), stays: [] });
    } else if (b && tiers.length) {
      tiers.at(-1).stays.push({ place: clean(b.text).replace(/:$/, ""), names: clean(li.text.replace(b.text, "")) });
    } else if (hasMarker && tiers.length && /^[^:]+:/.test(clean(li.text))) {
      // The live markup sometimes has a broken bold tag (`</b>Place:</b>`); split on the first colon.
      const [, place, names] = clean(li.text).match(/^([^:]+):\s*(.*)$/);
      tiers.at(-1).stays.push({ place: place.trim(), names });
    } else if (hasMarker && tiers.length && clean(li.text)) {
      // A row with no place label (e.g. a stray "Similar") — kept verbatim.
      tiers.at(-1).stays.push({ place: "", names: clean(li.text) });
    } else {
      return null;
    }
  }
  return tiers.length ? tiers : null;
}

function parseMainSection(container, slug) {
  // Only a leading <h2> is the section title. A later <h2> (e.g. "Safari Zones…" below a
  // price table) stays in place as a heading block so the original order is preserved.
  const first = container.childNodes.find((n) => n.nodeType === 1);
  const h2 = first?.rawTagName?.toLowerCase() === "h2" ? first : null;
  const title = h2 ? textOf(h2) : "";
  const where = `${slug} › ${title}`;
  if (title === "Package Includes") {
    return { kind: "includes", title, items: container.querySelectorAll(".tour-icon span").map(textOf).filter(Boolean) };
  }
  if (title === "Tour Highlights") {
    return { kind: "highlights", title, items: container.querySelectorAll("li").map(textOf).filter(Boolean) };
  }
  if (container.querySelector("#tour-itinerary-content")) {
    return { kind: "itinerary", title, days: parseItinerary(container) };
  }
  if (title === "Hotels") {
    const tiers = parseHotels(container);
    if (tiers) return { kind: "hotels", title, tiers };
    report.warnings.push(`${slug}: Hotels list has an unexpected shape — kept as generic blocks`);
  }
  h2?.remove();
  return { kind: "generic", title, blocks: blocksOf(container, where) };
}

function parsePrice(root) {
  const aside = root.querySelector("#aside-sticky");
  if (!aside) return { tiers: [] };
  const labels = new Map(
    aside.querySelectorAll(".price-block input[type=radio]").map((input) => {
      const id = input.getAttribute("id");
      return [input.getAttribute("value"), textOf(aside.querySelector(`label[for="${id}"]`))];
    }),
  );
  const tiers = aside.querySelectorAll("p.price-text").map((p) => {
    const key = p.getAttribute("data-price");
    return {
      ...(key && labels.get(key) && { name: labels.get(key) }),
      amount: textOf(p.querySelector(".price-number")),
      unit: textOf(p.querySelector(".text-small")),
    };
  });
  return {
    tiers: tiers.filter((t) => t.amount),
    note: textOf(aside.querySelector("p.text-light")),
    enquireLabel: aside.querySelector("input.button-open-modal")?.getAttribute("value") ?? "",
  };
}

function parseInclusions(root) {
  const tabs = root.querySelector(".tabs");
  if (!tabs) return null;
  const tabLabels = tabs.querySelectorAll("[role=tab]").map(textOf);
  const panel = (id) => tabs.querySelectorAll(`#${id} li`).map(textOf).filter(Boolean);
  return {
    includedLabel: tabLabels[0] ?? "",
    excludedLabel: tabLabels[1] ?? "",
    included: panel("panel-1"),
    excluded: panel("panel-2"),
  };
}

function parseRelated(root) {
  const box = root.querySelector(".related_packages_container");
  if (!box) return null;
  return {
    title: textOf(box.querySelector("h2")),
    items: box.querySelectorAll(".related_package__item a.block_link").map((a) => {
      const price = a.querySelector(".related_price");
      const smalls = price ? price.querySelectorAll(".text-small").map(textOf) : [];
      const img = a.querySelector("img");
      return {
        href: sanitizeHref(a.getAttribute("href"), "related") ?? "",
        title: textOf(a.querySelector(".related_name")),
        duration: textOf(a.querySelector(".related_days")),
        ...(price && {
          price: { label: smalls[0] ?? "", amount: textOf(price.querySelector(".price-number")), unit: smalls[1] ?? "" },
        }),
        image: img?.getAttribute("data-src") ?? img?.getAttribute("src") ?? null,
      };
    }),
  };
}

/** The theme draws the rupee sign as an icon (<i class="fa fa-inr">); keep it as real text. */
const RUPEE_ICON = /<i\b[^>]*class=["'][^"']*\bfa-inr\b[^"']*["'][^>]*>\s*<\/i>/g;

function parseTour(html, slug) {
  const root = parse(html.replace(RUPEE_ICON, "₹"), { comment: false });
  const head = root.querySelector("head");
  const meta = (sel) => head?.querySelector(sel)?.getAttribute("content") ?? "";

  const container = root.querySelector("#tour-container");
  if (!container) throw new Error(`${slug}: #tour-container not found — has the theme changed?`);

  const header = container.querySelector("h1#tour-title")?.parentNode;
  const durationP = header?.querySelector("p.text-semi-bold");

  const mainColumn = container.querySelector("#flex-child");
  const main = mainColumn
    .querySelectorAll(":scope > .container-div")
    .filter((c) => clean(c.text).length > 0)
    .map((c) => parseMainSection(c, slug));

  const lower = container
    .querySelectorAll(".flex-div-child > .container-div")
    .filter((c) => c.querySelector("h2"))
    .map((c) => {
      const h2 = c.querySelector("h2");
      const title = textOf(h2);
      h2.remove();
      return { kind: "generic", title, blocks: blocksOf(c, `${slug} › ${title}`) };
    });

  const faqBox = container.querySelector(".schema-faq")?.closest(".container-div");
  const faq = faqBox
    ? {
        title: textOf(faqBox.querySelector("h2")),
        items: faqBox.querySelectorAll(".schema-faq-section").map((q) => ({
          question: textOf(q.querySelector(".schema-faq-question")),
          answer: inlineOf(q.querySelector(".schema-faq-answer"), `${slug} › FAQ`),
        })),
      }
    : null;

  // Customer reviews block (one camping page). Names, stars and text are kept verbatim.
  // Deliberately NOT kept: reviewer profile photos (third-party personal images) and the
  // opaque "View More" short links — both are recorded in the report.
  const reviewCards = container.querySelectorAll(".review-card");
  const reviews = reviewCards.length
    ? {
        title: textOf(container.querySelectorAll("h2").find((h) => /customers/i.test(h.text))),
        items: reviewCards.map((c) => {
          const more = c.querySelector("a");
          if (more) sanitizeHref(more.getAttribute("href"), `${slug} › review`);
          return {
            name: textOf(c.querySelector(".reviewer-name")),
            rating: (textOf(c.querySelector(".review-stars")).match(/★/g) ?? []).length,
            text: textOf(c.querySelector(".review-text")),
          };
        }),
      }
    : null;
  if (reviews) report.warnings.push(`${slug}: ${reviews.items.length} reviews kept as text; reviewer photos not copied`);

  const form = root.querySelector("form.wpcf7-form");

  return {
    slug,
    url: `/tours/${slug}/`,
    seo: {
      // SEO tags are kept byte-exact (incl. non-breaking spaces); only the ends are trimmed.
      title: (head?.querySelector("title")?.text ?? "").trim(),
      description: meta('meta[name="description"]'),
      ogImage: meta('meta[property="og:image"]') || null,
    },
    title: textOf(container.querySelector("h1#tour-title")),
    duration: durationP
      ? { label: clean(durationP.text.replace(durationP.querySelector("span")?.text ?? "", "")).replace(/:$/, ""), value: textOf(durationP.querySelector("span")) }
      : null,
    gallery: container
      .querySelectorAll(".tour_gallery img")
      .map((img) => ({ src: img.getAttribute("data-src") ?? img.getAttribute("src"), alt: img.getAttribute("alt") ?? "" }))
      .filter((g) => g.src && !g.src.includes("placeholder-image")),
    main,
    price: parsePrice(container),
    inclusions: parseInclusions(container),
    policies: lower,
    related: parseRelated(root),
    faq,
    reviews,
    enquiry: {
      formTitle: textOf(form?.querySelector(".form-title-custom")),
      cf7FormId: form?.querySelector('input[name="_wpcf7"]')?.getAttribute("value") ?? null,
      adultsMax: Number(form?.querySelector('input[name="number-of-adults"]')?.getAttribute("max") ?? 0) || null,
      childrenMax: Number(form?.querySelector('input[name="number-of-children"]')?.getAttribute("max") ?? 0) || null,
    },
  };
}

/* ------------------------------------------------------------------ */
/* Media                                                               */
/* ------------------------------------------------------------------ */

const exists = (f) => access(f).then(() => true, () => false);
const originalOf = (url) => url.replace(/-\d+x\d+(\.[a-z]+)$/i, "$1");

async function fetchWithTimeout(url) {
  return fetch(url, { headers: { "user-agent": USER_AGENT }, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
}

const mediaCache = new Map();
async function localize(url) {
  if (!url) return null;
  if (mediaCache.has(url)) return mediaCache.get(url);
  const job = (async () => {
    let parsed;
    try {
      parsed = new URL(url, SITE);
    } catch {
      return null;
    }
    if (parsed.hostname !== "www.kajaawa.com" || !parsed.pathname.startsWith("/wp-content/uploads/")) {
      report.warnings.push(`image from unexpected host skipped: ${url}`);
      return null;
    }
    for (const candidate of [...new Set([originalOf(parsed.href), parsed.href])]) {
      const name = path.basename(new URL(candidate).pathname);
      if (await exists(path.join(HOME_MEDIA_DIR, name))) return `/media/home/${name}`;
      const target = path.join(MEDIA_DIR, name);
      if (await exists(target)) return `/media/tours/${name}`;
      if (skipMedia) return `/media/tours/${name}`;
      const res = await fetchWithTimeout(candidate);
      if (!res.ok || !(res.headers.get("content-type") ?? "").startsWith("image/")) continue;
      await writeFile(target, Buffer.from(await res.arrayBuffer()));
      return `/media/tours/${name}`;
    }
    report.warnings.push(`image could not be downloaded: ${url}`);
    return null;
  })();
  mediaCache.set(url, job);
  return job;
}

async function localizeTour(tour) {
  tour.gallery = (await Promise.all(tour.gallery.map(async (g) => ({ ...g, src: await localize(g.src) })))).filter((g) => g.src);
  tour.seo.ogImage = await localize(tour.seo.ogImage);
  if (tour.related) {
    for (const item of tour.related.items) item.image = await localize(item.image);
  }
}

/* ------------------------------------------------------------------ */

async function listSlugs() {
  if (fromDir) {
    return (await readdir(fromDir)).filter((f) => f.endsWith(".html")).map((f) => f.replace(/\.html$/, "")).sort();
  }
  const xml = await (await fetchWithTimeout(`${SITE}/tours-sitemap.xml`)).text();
  return [...xml.matchAll(/<loc>https:\/\/www\.kajaawa\.com\/tours\/([^/<]+)\/<\/loc>/g)].map((m) => m[1]).sort();
}

async function loadHtml(slug) {
  if (fromDir) return readFile(path.join(fromDir, `${slug}.html`), "utf8");
  const res = await fetchWithTimeout(`${SITE}/tours/${slug}/`);
  if (!res.ok) throw new Error(`${slug}: HTTP ${res.status}`);
  return res.text();
}

async function main() {
  const slugs = await listSlugs();
  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(MEDIA_DIR, { recursive: true });

  const tours = [];
  for (let i = 0; i < slugs.length; i += CONCURRENCY) {
    const batch = await Promise.all(
      slugs.slice(i, i + CONCURRENCY).map(async (slug) => {
        const tour = parseTour(await loadHtml(slug), slug);
        await localizeTour(tour);
        return tour;
      }),
    );
    tours.push(...batch);
  }

  for (const tour of tours) {
    await writeFile(path.join(OUT_DIR, `${tour.slug}.json`), `${JSON.stringify(tour, null, 2)}\n`);
  }

  const index = tours.map((t) => ({
    slug: t.slug,
    title: t.title,
    duration: t.duration?.value ?? null,
    price: t.price.tiers[0] ?? null,
    image: t.gallery[0]?.src ?? t.seo.ogImage ?? null,
  }));
  await writeFile(
    path.join(OUT_DIR, "index.json"),
    `${JSON.stringify({ capturedAt: new Date().toISOString(), tours: index }, null, 2)}\n`,
  );

  console.log(`Wrote ${tours.length} tours to ${path.relative(ROOT, OUT_DIR)}`);
  console.log(`Images referenced: ${mediaCache.size}`);
  console.log(`Dropped links (${report.droppedLinks.length}):`);
  for (const d of report.droppedLinks) console.log(`  - ${d.where}: ${d.href} (${d.reason})`);
  console.log(`Dropped elements: ${JSON.stringify(Object.fromEntries(report.droppedElements))}`);
  console.log(`Warnings (${report.warnings.length}):`);
  for (const w of report.warnings) console.log(`  - ${w}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
