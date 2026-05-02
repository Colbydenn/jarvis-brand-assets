# Component Library v0 — Jarvis Website Business

Stage 2 deliverable for [DEA-6](../../README.md). Companion to brand assets in `/v0` and `/v1`.

## Goal

Modular building blocks for $1,497 preview homepages. Each piece is self-contained, zero-build, and Cloudflare-Pages / GitHub-Pages compatible. Reference DNA: Stringtune, Astrodither, Smooothy, AI Particle Simulator.

## Architecture

- **Zero build step.** Pure HTML/CSS/JS. ESM imports via [esm.sh](https://esm.sh) CDN.
- **No framework.** Vanilla DOM + canvas + WebGL. Astro islands or vanilla JS only.
- **Tokens-first.** All color/type/spacing/motion drawn from `tokens/` — never hardcoded.
- **Brand-locked.** Inherits palette + dither aesthetic from sibling `/v1` brand mark.

## Layout

```
componentlib/
├── tokens/           # niche pack v0 — palette, type, copy patterns, hero pairings
│   ├── tokens.css        # CSS custom properties (palette, type scale, spacing, motion)
│   ├── niche-pack.json   # vibe / palette_hint / hero_pairing per niche
│   └── copy-patterns.md  # hero/CTA/social-proof copy templates
├── motion/           # GSAP + Lenis + OGL baseline
│   ├── lenis-init.js     # smooth-scroll boot
│   ├── gsap-helpers.js   # scroll-trigger + reveal helpers
│   └── ogl-loader.js     # WebGL loader + cleanup
├── organisms/        # 8 static building blocks (hero, services, gallery, footer, etc.)
├── heroes/           # 6 signature interactive heroes (all shipped)
│   ├── canvas-dither/                # Astrodither-native Bayer 8×8
│   ├── webgl-particle/               # OGL particle field, mouse-repel
│   ├── cursor-trail-gallery/         # trailing tile strip
│   ├── scroll-driven-horizontal/     # GSAP horizontal pan
│   ├── tactile-single-interaction/   # drag-and-snap line + audio
│   └── parallax-dither/              # 3-layer parallax + dither overlay
└── showcase/         # static index — lighter Storybook substitute
    └── index.html        # links every component, mobile-aware
```

## Status (v0 — complete)

- [x] Tokens — palette + type + copy patterns + niche-pack v0
- [x] Motion stack baseline — GSAP, Lenis, OGL loaders
- [x] 8/8 static organisms — hero-static, services-grid, portfolio-strip, artist-roster, testimonial-ticker, faq-accordion, contact-block, footer-mini
- [x] 6/6 signature interactive heroes — canvas-dither, webgl-particle, cursor-trail-gallery, scroll-driven-horizontal, tactile-single-interaction, parallax-dither
- [x] Showcase index ready for GitHub Pages (workflow at `.github/workflows/pages.yml`)

## Run locally

```bash
# Any static server. Examples:
python -m http.server 8000 -d componentlib
# then open http://localhost:8000/showcase/
```

## Why no Storybook?

Storybook = npm + node + 200 MB install for v0. Replaced with static `showcase/index.html` that links every component and renders inline. Re-evaluate Storybook at v1 once the library has 14+ surfaces.
