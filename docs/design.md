# Kajaawa landing — design brief

## Subject

Kajaawa is a local cab, tour and stay operator in Meghalaya and Assam (since 2018).
The page has one job: get a visitor from "where is this?" to a tour, a cab route
or an enquiry. Content is a word-for-word snapshot of the live homepage
(`src/content/home.snapshot.json`); the design may reorder and restyle it, never rewrite it.

## Concept — "Abode of Clouds"

Meghalaya literally means *abode of the clouds*. The page moves from fog
(light, airy, type-led) down into water (the deep glass-green of the Dawki/Umngot river)
and ends on wet slate. Every colour is taken from that world, not from a template.

Avoided on purpose (generic AI clusters): Inter/Geist, purple gradients, near-black with an
acid-green pop, cream + serif + terracotta, icon-over-heading card rows, `rounded-lg`
on everything, decorative 01/02/03 numbering.

## Tokens (defined once in `src/app/globals.css`)

| Token        | Role                                   |
|--------------|----------------------------------------|
| `fog`        | page ground — cool mist, green-biased  |
| `cloud`      | raised surfaces, input fills           |
| `ink`        | text — wet slate, never pure black     |
| `moss`       | secondary text                         |
| `river`      | deep Dawki water — dark bands          |
| `river-deep` | darkest band (cab board, footer)       |
| `jade`       | highlights on river bands only         |
| `mandarin`   | the single accent: Khasi mandarin — primary actions only |

The brand's own green lives only in the logo.

## Type

- **Display — Bricolage Grotesque** (variable `opsz` + `wdth`): headings and the hero. Used big, tight, sparingly.
- **Body — Schibsted Grotesk**: running text, ~65ch measure.
- **Utility — Martian Mono**: durations (`10D/9N`), prices, route boards, small labels. Tabular numbers.

## Layout

Full-bleed bands; one inner wrapper with a fluid gutter (`max(16px, safe-area)`, growing to 56px).
Mobile-first; every grid collapses to one or two columns at ~400px. No horizontal page scroll —
only the tour rails scroll sideways, inside their own container.

## Motion

One orchestrated moment: the hero headline rising out of its masks while the Krang Suri
panorama opens from a slit (pure CSS, so it plays on first paint without waiting for JS).
Scroll then expands that panorama to full bleed. Everything else is quiet:

- below-fold blocks rise in once, ~24px, staggered;
- the intro paragraph's words fill in as you read (scroll-scrubbed);
- destination links show a floating photo preview on hover (fine pointers only);
- cab routes "flip" like a departure board on hover.

Rules: transform/opacity/clip-path only; everything visible without JS; `prefers-reduced-motion`
disables smooth scroll and all non-essential motion.

## Performance budget

- Page is fully static (prerendered). Images served by `next/image` as AVIF/WebP with `sizes`.
- Only the hero is eager; all other images lazy.
- Animation code is one client island (`src/motion/`); sections stay server components.
