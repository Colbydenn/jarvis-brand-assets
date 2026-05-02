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
├── heroes/           # 6 signature interactive heroes
│   └── canvas-dither/    # ✓ shipped
└── showcase/         # static index — lighter Storybook substitute
    └── index.html        # links every component, mobile-aware
```

## Status (v0)

- [x] Tokens — palette + type + copy patterns + niche-pack v0
- [x] Motion stack baseline — GSAP, Lenis, OGL loaders
- [x] 1/8 static organisms (hero-section)
- [x] 1/6 signature heroes (canvas-dither — Astrodither-native)
- [ ] 7 remaining organisms (next heartbeat)
- [ ] 5 remaining signature heroes (next heartbeat)
- [ ] Showcase index live on GitHub Pages

## Run locally

```bash
# Any static server. Examples:
python -m http.server 8000 -d componentlib
# then open http://localhost:8000/showcase/
```

## Why no Storybook?

Storybook = npm + node + 200 MB install for v0. Replaced with static `showcase/index.html` that links every component and renders inline. Re-evaluate Storybook at v1 once the library has 14+ surfaces.
