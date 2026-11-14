# Kajaawa — landing page

Redesign of the [kajaawa.com](https://www.kajaawa.com/) homepage (cabs, tours and stays in Meghalaya & Assam).
The copy is **word-for-word identical** to the live WordPress site; only the design changed.

## Stack

Next.js 16 (App Router, static prerender) · TypeScript · Tailwind CSS 4 · GSAP + Lenis (motion) · Radix Tabs · zod/mini

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

## Structure

```text
src/
  app/                 layout, page, global tokens (globals.css), /api/enquiry
  config/              site + server env (the only modules that read env vars)
  content/             home.snapshot.json (generated) + typed access (home.ts)
  features/
    home/              hero, intro, tours, day tours, destinations, cab board
    enquiry/           query form, shared schema, server use case + CF7 adapter
    site-chrome/       header, footer, mobile contact dock
  motion/              the single animation island (GSAP/Lenis, data-motion effects)
  ui/                  hand-drawn icons, shared shape tokens
scripts/               sync-home-snapshot.mjs — re-pulls copy + images from the live site
docs/design.md         design brief: tokens, type, motion rules
```

## Content

Never edit the snapshots by hand — they are copies of the live site. To refresh them:

```bash
node scripts/sync-home-snapshot.mjs     # homepage  → src/content/home.snapshot.json
node scripts/sync-tours-snapshot.mjs    # 93 tours  → src/content/tours/*.json (+ photos)
```

The tour sync whitelists links (site paths, Google Maps, own phone/WhatsApp/email),
drops scripts/iframes/forms, and prints every link or image it could not keep.

## Routes

| Path | Source |
|---|---|
| `/` | homepage snapshot |
| `/tours/<slug>/` | tour snapshots (all prerendered; unknown slugs return 404 via `src/proxy.ts`) |
| everything else | still links to the WordPress site (`src/content/routes.ts`) |

## Environment

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_LEGACY_SITE_ORIGIN` | Where inner pages (tours, cabs, guides) live. Defaults to `https://www.kajaawa.com`. |
| `ENQUIRY_CF7_ORIGIN` | WordPress origin whose Contact Form 7 receives enquiries. Unset = form asks visitors to WhatsApp/call instead. |
| `ENQUIRY_CF7_FORM_ID` | CF7 form id (default `2457`). |
