# DEA-7 — Astrodither Brand GIF v0 — Creative Brief

## Purpose
v0 brand mark for cold outreach email. Two placements:
- **(a) Logo header**: small (~200x60 to 320x80 px), top of email.
- **(b) Body hero**: medium (~600x300 to 720x360 px), single in-body motif.

One asset family, ideally one source composition rendered at two sizes (or one size that scales acceptably in email clients).

## Aesthetic — "Astrodither"
Reference vibe: classic 1-bit / 2-bit ordered-dither, early-Mac / Susan Kare / spaceship-terminal CRT. Dithered gradients, halftone-feeling clouds, monochrome with optional 1 accent color.

Mandatories:
- Ordered dither (Bayer 4x4 or 8x8) or Floyd-Steinberg over a quantized palette of 2-4 colors.
- Visible pixel grain. Do NOT smooth.
- Retro/space/cosmic motif — orbiting body, scanline planet, dithered comet, terminal cursor — pick **one** simple motif, animate it minimally.

## Animation
- 12-24 frames. 8-12 fps. Total loop 1.5-3s.
- Subtle motion only (orbit, pulse, scanline sweep, twinkle). No flashy transitions, no text animation.
- Seamless loop.

## Brand-locked text (if any)
- Wordmark "Jarvis" in pixel/bitmap font (e.g., Chicago, IBM 3270, Press Start 2P, or hand-pixeled). v0 may ship without text — confirm with CEO before adding.

## Color
- Primary palette: pure black `#000000` + parchment/off-white `#F4ECD8` (or pure white `#FFFFFF`).
- Optional accent: one of cyan `#00E5FF`, amber `#FFB000`, magenta `#FF2D95`. v0: pick **one** and stick to it.

## Hard Constraints
- Final GIF **<500 KB** (logo size <80 KB target; hero <500 KB hard cap).
- Optimized via `gifsicle -O3 --lossy=80` or equivalent.
- Hosted on Cloudflare Pages (free tier). Public URL stable, cache-friendly.
- No external CDN dependencies. No tracking pixels.

## Pipeline (locally, free)
1. Source frames: SVG/Canvas/Python (Pillow) or hand-drawn pixel art per frame.
2. Generate frames -> PNG sequence.
3. Quantize + dither per frame: ImageMagick `convert -ordered-dither o8x8 -colors N` or Pillow `Image.convert("P", dither=Image.Dither.FLOYDSTEINBERG, palette=...)`.
4. Assemble: `ffmpeg -f image2 -framerate 10 -i frame_%03d.png -vf "split [a][b];[a] palettegen=max_colors=4 [p];[b][p] paletteuse=dither=bayer:bayer_scale=3" out.gif` OR `gifski` for higher quality.
5. Optimize: `gifsicle -O3 --lossy=80 -o final.gif out.gif`.
6. Verify size, loop, dither-grain integrity.

Use Codex OAuth for any code generation in the pipeline (free under OAuth seat). No paid API calls for v0.

## Hosting
- Repo: new Cloudflare Pages project `jarvis-brand-assets` (private GitHub repo, public Pages).
- Path: `/v0/logo.gif`, `/v0/hero.gif`.
- Set `Cache-Control: public, max-age=604800` on assets.

## Deliverables
1. `logo.gif` — small, <80 KB, transparent or solid bg matching email body.
2. `hero.gif` — medium, <500 KB.
3. Public URLs on Cloudflare Pages.
4. Source frames + script committed to repo.
5. Side-by-side preview screenshot (light + dark email client backgrounds).

## Out of scope (v0)
- A/B variants
- Multi-language wordmark
- Lottie/SVG animation alternatives (revisit if email-client GIF support disappoints)
- Tracking/analytics on the asset

## Acceptance
- CEO review of preview screenshots before public hosting.
- Renders cleanly in Gmail web + iOS Mail (manual spot check).
- Total file size budget hit.

## Iteration loop
v0 ship -> CEO + board review -> single round of revisions -> v1 lock.
