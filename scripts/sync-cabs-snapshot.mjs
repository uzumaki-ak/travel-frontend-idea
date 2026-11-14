#!/usr/bin/env node
/**
 * Snapshots the cab pages (/cars/ and every /cars/<slug>/ in the cab sitemap)
 * into `src/content/cabs/<slug>.json` (+ `_index.json` for /cars/), the shared
 * cab booking form into `src/content/cabs/form.json`, and any cab URL that the
 * live site redirects into `src/content/cabs/redirects.json`.
 *
 * Why jsdom: these pages are hand-written HTML (tables nested in tables, stray
 * <html>/<title>/<meta> inside the body). jsdom parses with the HTML standard
 * (parse5), so the DOM we read is the one a browser actually renders.
 *
 * Content rule: text is copied verbatim and kept in reading order as typed
 * blocks — never raw HTML. Safety rule: links are whitelisted (site paths,
 * google.com/maps, own tel/mailto/wa.me); scripts, styles, iframes, forms and
 * UI controls (read-more toggles, slider arrows/dots) are dropped. Every
 * dropped link/embed is printed in the report.
 *
 * Usage:
 *   node scripts/sync-cabs-snapshot.mjs                 # fetch live pages
 *   node scripts/sync-cabs-snapshot.mjs --from <dir>    # parse cached <slug>.html (_index.html = /cars/)
 */
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const SITE = "https://www.kajaawa.com";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "src/content/cabs");
const MEDIA_DIR = path.join(ROOT, "public/media/cabs");
const MEDIA_LOOKUP = [
  ["/media/home", path.join(ROOT, "public/media/home")],
  ["/media/tours", path.join(ROOT, "public/media/tours")],
  ["/media/cabs", MEDIA_DIR],
];
const FETCH_TIMEOUT_MS = 30_000;
const USER_AGENT = "Mozilla/5.0 (compatible; site-snapshot/1.0)";
const OWN_PHONE = "916033114867";
const OWN_EMAIL = "info@kajaawa.com";
/** Set by the theme's cab.js on every cab page (not present in the HTML). */
const HERO_IMAGE = "/wp-content/uploads/2021/02/Seven-Sister-Falls.jpeg";

const args = process.argv.slice(2);
const fromIdx = args.indexOf("--from");
const fromDir = fromIdx >= 0 ? args[fromIdx + 1] : null;

const report = { droppedLinks: [], droppedEmbeds: [], warnings: [] };
const clean = (s) => s.replace(/\s+/g, " ").trim();
const exists = (f) => access(f).then(() => true, () => false);

/* ------------------------------------------------------------------ */
/* Links + media                                                       */
/* ------------------------------------------------------------------ */

function sanitizeHref(raw, where) {
  const href = (raw ?? "").trim();
  if (!href || href.startsWith("#")) return null;
  let url;
  try {
    url = new URL(href, SITE);
  } catch {
    report.droppedLinks.push({ where, href, reason: "unparseable" });
    return null;
  }
  if (url.protocol === "tel:" && url.href.replace(/\D/g, "").endsWith(OWN_PHONE)) return `tel:+${OWN_PHONE}`;
  if (url.protocol === "mailto:" && url.pathname.toLowerCase() === OWN_EMAIL) return `mailto:${OWN_EMAIL}`;
  if (url.protocol === "https:") {
    const host = url.hostname.toLowerCase();
    if (host === "www.kajaawa.com" || host === "kajaawa.com") return url.pathname;
    if ((host === "www.google.com" || host === "google.com") && url.pathname.startsWith("/maps")) return url.href;
    if (host === "wa.me" && url.pathname.replace(/\D/g, "") === OWN_PHONE) return `https://wa.me/${OWN_PHONE}`;
  }
  report.droppedLinks.push({ where, href: href.slice(0, 160), reason: "not whitelisted" });
  return null;
}

const originalOf = (u) => u.replace(/-\d+x\d+(\.[a-z]+)$/i, "$1");
const mediaCache = new Map();

function localize(src) {
  if (!src) return Promise.resolve(null);
  if (!mediaCache.has(src)) {
    mediaCache.set(
      src,
      (async () => {
        let url;
        try {
          url = new URL(src, SITE);
        } catch {
          return null;
        }
        // The theme's grey lazy-load placeholder means "no photo" — the site shows its own tile instead.
        if (url.pathname.includes("placeholder-image")) return null;
        if (url.hostname !== "www.kajaawa.com" || !url.pathname.startsWith("/wp-content/uploads/")) {
          report.warnings.push(`image from unexpected host skipped: ${src}`);
          return null;
        }
        for (const candidate of [...new Set([originalOf(url.href), url.href])]) {
          const name = path.basename(new URL(candidate).pathname);
          for (const [prefix, dir] of MEDIA_LOOKUP) if (await exists(path.join(dir, name))) return `${prefix}/${name}`;
          const res = await fetch(candidate, { headers: { "user-agent": USER_AGENT }, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
          if (!res.ok || !(res.headers.get("content-type") ?? "").startsWith("image/")) continue;
          await mkdir(MEDIA_DIR, { recursive: true });
          await writeFile(path.join(MEDIA_DIR, name), Buffer.from(await res.arrayBuffer()));
          return `/media/cabs/${name}`;
        }
        report.warnings.push(`image unavailable on the live site: ${src}`);
        return null;
      })(),
    );
  }
  return mediaCache.get(src);
}

const imgSrc = (img) => img?.getAttribute("data-src") || img?.getAttribute("src") || null;

/* ------------------------------------------------------------------ */
/* Inline + block extraction                                           */
/* ------------------------------------------------------------------ */

const SKIP = new Set(["SCRIPT", "STYLE", "META", "TITLE", "LINK", "NOSCRIPT", "SVG", "BUTTON", "INPUT", "SELECT", "TEXTAREA", "LABEL", "FORM"]);
/** <i> is both an icon (Font Awesome, empty) and italic text on these pages — only icons are skipped. */
const isIcon = (el) => el.tagName === "I" && (/(^|\s)fa(\s|$)|(^|\s)fa-/.test(el.getAttribute("class") || "") || !el.textContent.trim());
const EMBEDS = new Set(["IFRAME", "VIDEO", "OBJECT", "EMBED"]);
const BLOCK_SELECTOR = "p,ul,ol,table,h1,h2,h3,h4,h5,h6,figure,img,div,section,iframe,blockquote";
/** Interface chrome from the old theme — not content. */
const UI_CHROME = ".readmore-btn-wrapper, #readMoreToggle, .tj-slider-dots, .tj-slider-btn, .contact-container, .wp-block-spacer";

function inlineOf(node, where) {
  const runs = [];
  const walk = (n, bold, href) => {
    if (n.nodeType === 3) {
      const t = n.textContent.replace(/\s+/g, " ");
      if (t) runs.push({ text: t, ...(bold && { bold: true }), ...(href && { href }) });
      return;
    }
    if (n.nodeType !== 1) return;
    if (SKIP.has(n.tagName) || n.tagName.toLowerCase() === "svg" || isIcon(n)) return;
    if (n.tagName === "BR") return runs.push({ text: " " });
    if (EMBEDS.has(n.tagName)) return report.droppedEmbeds.push({ where, src: (n.getAttribute("src") || "").slice(0, 120) });
    const nextBold = bold || n.tagName === "B" || n.tagName === "STRONG";
    const nextHref = n.tagName === "A" ? (sanitizeHref(n.getAttribute("href"), where) ?? undefined) : href;
    for (const c of n.childNodes) walk(c, nextBold, nextHref);
  };
  walk(node, false, undefined);
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

const LIST_MARKER = /^[➤•▪►✔✅⭐-]\s*/u;

async function tableOf(table) {
  const rowsOf = async (rows) =>
    Promise.all(
      rows.map(async (tr) =>
        Promise.all(
          [...tr.children]
            .filter((c) => c.tagName === "TD" || c.tagName === "TH")
            .map(async (cell) => {
              const img = cell.querySelector("img");
              const out = { text: clean(cell.textContent) };
              const cs = Number(cell.getAttribute("colspan") || 1);
              const rs = Number(cell.getAttribute("rowspan") || 1);
              if (cs > 1) out.colSpan = cs;
              if (rs > 1) out.rowSpan = rs;
              if (img) {
                const src = await localize(imgSrc(img));
                if (src) out.image = { src, alt: img.getAttribute("alt") || "" };
              }
              return out;
            }),
        ),
      ),
    );
  const own = (sel) => [...table.querySelectorAll(sel)].filter((r) => r.closest("table") === table);
  const headRows = own("thead > tr");
  const bodyRows = own("tbody > tr, :scope > tr").filter((tr) => !headRows.includes(tr));
  const caption = clean(table.querySelector(":scope > caption")?.textContent ?? "");
  const head = (await rowsOf(headRows)).filter((r) => r.some((c) => c.text || c.image));
  const rows = (await rowsOf(bodyRows)).filter((r) => r.some((c) => c.text || c.image));
  return { type: "table", ...(caption && { caption }), head, rows };
}

async function blocksOf(nodes, where) {
  const out = [];
  const visit = async (n) => {
    if (n.nodeType === 3) {
      const t = clean(n.textContent);
      if (t) out.push({ type: "p", content: [{ text: t }] });
      return;
    }
    if (n.nodeType !== 1) return;
    const tag = n.tagName;
    if (SKIP.has(tag) || tag.toLowerCase() === "svg" || isIcon(n)) return;
    if (EMBEDS.has(tag)) return report.droppedEmbeds.push({ where, src: (n.getAttribute("src") || "").slice(0, 120) });
    if (n.matches(UI_CHROME)) return;

    if (/^H[1-6]$/.test(tag)) {
      const text = clean(n.textContent);
      if (text) out.push({ type: "heading", level: Number(tag[1]), text });
      return;
    }
    if (n.matches(".schema-faq")) {
      out.push({
        type: "faq",
        items: [...n.querySelectorAll(".schema-faq-section")].map((q) => ({
          question: clean(q.querySelector(".schema-faq-question")?.textContent ?? ""),
          answer: inlineOf(q.querySelector(".schema-faq-answer"), `${where} › FAQ`),
        })),
      });
      return;
    }
    if (n.matches(".serial-links-container")) {
      const title = clean(n.querySelector("h1,h2,h3,h4")?.textContent ?? "");
      const items = [...n.querySelectorAll("li a")]
        .map((a) => ({ label: clean(a.textContent), href: sanitizeHref(a.getAttribute("href"), `${where} › links`) }))
        .filter((l) => l.label && l.href);
      out.push({ type: "links", ...(title && { title }), items });
      return;
    }
    if (n.matches(".carousel_container")) {
      const title = clean(n.querySelector(".info-heading")?.textContent ?? "");
      const items = [];
      for (const a of n.querySelectorAll("a.block_link")) {
        const price = a.querySelector(".related_price");
        const smalls = price ? [...price.querySelectorAll(".text-small")].map((s) => clean(s.textContent)) : [];
        items.push({
          title: clean(a.querySelector(".related_name")?.textContent ?? ""),
          href: sanitizeHref(a.getAttribute("href"), `${where} › cards`) ?? "",
          image: await localize(imgSrc(a.querySelector("img"))),
          duration: clean(a.querySelector(".related_days")?.textContent ?? ""),
          ...(price && {
            price: {
              label: smalls.length > 1 ? smalls[0] : "",
              amount: clean(price.querySelector(".price-number")?.textContent ?? price.textContent.replace(/[^\d,/-]/g, "")),
              unit: smalls.length > 1 ? smalls[1] : (smalls[0] ?? ""),
            },
          }),
        });
      }
      out.push({ type: "cards", ...(title && { title }), items });
      return;
    }
    if (n.matches(".combined-route-container")) {
      out.push({
        type: "routes",
        columns: [...n.querySelectorAll(".route-column")].map((col) => ({
          title: clean(col.querySelector(".route-title")?.textContent ?? ""),
          stops: [...col.querySelectorAll(".stops-inline > *")].map((s) => clean(s.textContent)).filter(Boolean),
        })),
      });
      return;
    }
    if (n.matches(".tj-slider-section")) {
      const heading = n.querySelector(".tj-slider-heading");
      for (const h of heading ? [heading] : []) await visitChildren(h); // empty on the live site, kept generic
      out.push({
        type: "trips",
        items: [...n.querySelectorAll(".tj-slide-card")].map((card) => {
          const route = card.querySelector(".tj-card-route");
          const routeLabel = clean(route?.querySelector("strong")?.textContent ?? "");
          return {
            number: clean(card.querySelector(".tj-card-number")?.textContent ?? ""),
            title: clean(card.querySelector(".tj-card-heading h3")?.textContent ?? ""),
            duration: clean(card.querySelector(".tj-card-heading span")?.textContent ?? ""),
            days: [...card.querySelectorAll(".tj-slide-day")].map((d) => ({
              marker: clean(d.querySelector(".tj-slide-day-marker")?.textContent ?? ""),
              title: clean(d.querySelector("h4")?.textContent ?? ""),
              text: clean(d.querySelector("p")?.textContent ?? ""),
            })),
            ...(route && { route: { label: routeLabel, text: clean(route.textContent.replace(routeLabel, "")) } }),
          };
        }),
      });
      return;
    }
    if (tag === "TABLE") {
      // Hand-written pages sometimes wrap a real table inside an empty outer one.
      const innerTables = [...n.querySelectorAll("table")];
      const ownCells = [...n.querySelectorAll("td,th")].filter((c) => c.closest("table") === n);
      if (innerTables.length && !ownCells.some((c) => clean(c.textContent))) {
        for (const t of innerTables.filter((t) => t.parentElement.closest("table") === n)) await visit(t);
        return;
      }
      out.push(await tableOf(n));
      return;
    }
    if (tag === "FIGURE" || n.matches(".wp-block-image")) {
      const img = n.querySelector("img");
      const src = await localize(imgSrc(img));
      const caption = clean(n.querySelector("figcaption")?.textContent ?? "");
      if (src) out.push({ type: "image", src, alt: img.getAttribute("alt") || "", ...(caption && { caption }) });
      else if (caption) out.push({ type: "p", content: [{ text: caption }] });
      return;
    }
    if (tag === "IMG") {
      const src = await localize(imgSrc(n));
      if (src) out.push({ type: "image", src, alt: n.getAttribute("alt") || "" });
      return;
    }
    if (tag === "UL" || tag === "OL") {
      const items = [...n.children]
        .filter((li) => li.tagName === "LI")
        .map((li) => {
          const runs = inlineOf(li, where);
          if (runs[0]) runs[0].text = runs[0].text.replace(LIST_MARKER, "");
          return runs.filter((r) => r.text);
        })
        .filter((r) => r.length);
      if (items.length) out.push({ type: "list", ordered: tag === "OL", items });
      return;
    }
    if (tag === "P" || ((tag === "DIV" || tag === "SPAN" || tag === "A" || tag === "STRONG" || tag === "B" || tag === "EM" || tag === "I") && !n.querySelector(BLOCK_SELECTOR))) {
      const content = inlineOf(n, where);
      if (content.length) out.push({ type: "p", content });
      return;
    }
    await visitChildren(n);
  };
  const visitChildren = async (el) => {
    for (const c of el.childNodes) await visit(c);
  };
  for (const n of nodes) await visit(n);
  return out;
}

/* ------------------------------------------------------------------ */
/* Pages                                                               */
/* ------------------------------------------------------------------ */

function featuresOf(row) {
  // The four service badges (icon + label) at the top of every cab page.
  return [...row.children].map((c) => clean(c.textContent)).filter(Boolean);
}

async function parseCabPage(html, slug) {
  const doc = new JSDOM(html).window.document;
  const where = slug || "cars";
  const head = doc.head;
  const seo = {
    title: (head.querySelector("title")?.textContent ?? "").trim(),
    description: head.querySelector('meta[name="description"]')?.getAttribute("content") ?? "",
    canonical: new URL(head.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? SITE).pathname,
  };

  const entry = doc.querySelector(".entry-content");
  const container = entry?.querySelector(":scope > .content-container");
  if (!entry || !container) throw new Error(`${where}: content container not found — has the theme changed?`);

  const rows = [...container.children];
  const featureRow = rows.find((r) => r.matches(".custom-row") && r.querySelector("svg") && !r.querySelector("p,h1,h2,h3,table"));
  const features = featureRow ? featuresOf(featureRow.querySelector(":scope > *")?.children.length > 1 ? featureRow.firstElementChild : featureRow) : [];
  const bodyNodes = rows.filter((r) => r !== featureRow);
  const after = [];
  for (let n = container.nextSibling; n; n = n.nextSibling) after.push(n);

  const blocks = [...(await blocksOf(bodyNodes, where)), ...(await blocksOf(after, where))];
  return { slug, url: slug ? `/cars/${slug}/` : "/cars/", seo, heroImage: await localize(HERO_IMAGE), features, blocks };
}

function parseForm(html) {
  const doc = new JSDOM(html).window.document;
  const form = doc.querySelector("form.wpcf7-form");
  const options = (name) => [...form.querySelectorAll(`select[name="${name}"] option`)].map((o) => clean(o.textContent));
  const placeholder = (name) => form.querySelector(`[name="${name}"]`)?.getAttribute("placeholder") ?? "";
  const split = (name) => {
    const [label, ...values] = options(name);
    return { placeholder: label, options: values };
  };
  return {
    cf7FormId: form.querySelector('input[name="_wpcf7"]')?.value ?? null,
    pickup: split("pickup-location"),
    drop: split("drop-location"),
    time: split("pickup-time"),
    vehicle: split("vehicle-type"),
    countryCodes: options("country-code"),
    placeholders: {
      date: placeholder("preferred-date"),
      name: placeholder("your-name"),
      email: placeholder("your-email"),
      phone: placeholder("phone-number"),
    },
    submitLabel: form.querySelector('[type="submit"]')?.getAttribute("value") ?? "",
    honeypotLabel: clean(form.querySelector(".hp-message")?.textContent ?? ""),
    // From the theme's cab.js date picker: today … +2 years, value format dd-M-yy (e.g. 14-Nov-2026).
    dateRule: { minDaysFromToday: 0, maxYearsAhead: 2, submitFormat: "dd-MMM-yyyy" },
  };
}

/* ------------------------------------------------------------------ */

async function listPaths() {
  const res = await fetch(`${SITE}/cab-sitemap.xml`, { headers: { "user-agent": USER_AGENT }, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  return [...(await res.text()).matchAll(/<loc>https:\/\/www\.kajaawa\.com(\/cars\/[^<]*)<\/loc>/g)].map((m) => m[1]);
}

async function loadPage(urlPath) {
  const slug = urlPath.replace(/^\/cars\/|\/$/g, "");
  if (fromDir) {
    const file = path.join(fromDir, `${slug || "_index"}.html`);
    return { slug, status: (await exists(file)) ? 200 : 301, html: (await exists(file)) ? await readFile(file, "utf8") : "" };
  }
  const res = await fetch(`${SITE}${urlPath}`, { headers: { "user-agent": USER_AGENT }, redirect: "manual", signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  return { slug, status: res.status, location: res.headers.get("location"), html: res.status === 200 ? await res.text() : "" };
}

async function main() {
  const paths = await listPaths();
  await mkdir(OUT_DIR, { recursive: true });
  const redirects = [];
  const pages = [];
  let form = null;

  for (const p of paths) {
    const page = await loadPage(p);
    if (page.status === 301 || page.status === 308) {
      const to = page.location ? new URL(page.location, SITE).pathname : null;
      if (to) redirects.push({ from: p, to, status: 301 });
      else report.warnings.push(`${p}: redirect target unknown (run without --from)`);
      continue;
    }
    if (page.status !== 200) {
      report.warnings.push(`${p}: HTTP ${page.status} — skipped`);
      continue;
    }
    const parsed = await parseCabPage(page.html, page.slug);
    pages.push(parsed);
    form ??= parseForm(page.html);
    console.log(`${p}: ${parsed.blocks.length} blocks`);
  }

  for (const page of pages) {
    await writeFile(path.join(OUT_DIR, `${page.slug || "_index"}.json`), `${JSON.stringify(page, null, 2)}\n`);
  }
  await writeFile(path.join(OUT_DIR, "form.json"), `${JSON.stringify(form, null, 2)}\n`);
  const slugs = pages.map((p) => p.slug).filter(Boolean).sort();
  await writeFile(path.join(OUT_DIR, "index.json"), `${JSON.stringify({ capturedAt: new Date().toISOString(), slugs }, null, 2)}\n`);
  if (!fromDir || redirects.length) {
    await writeFile(path.join(OUT_DIR, "redirects.json"), `${JSON.stringify(redirects, null, 2)}\n`);
  }

  console.log(`\nWrote ${pages.length} cab pages, form, ${redirects.length} redirects`);
  for (const r of redirects) console.log(`  redirect ${r.from} → ${r.to}`);
  console.log(`Dropped links (${report.droppedLinks.length}):`);
  for (const d of report.droppedLinks) console.log(`  - ${d.where}: ${d.href} (${d.reason})`);
  console.log(`Dropped embeds (${report.droppedEmbeds.length}):`);
  for (const d of report.droppedEmbeds) console.log(`  - ${d.where}: ${d.src}`);
  console.log(`Warnings (${report.warnings.length}):`);
  for (const w of report.warnings) console.log(`  - ${w}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
