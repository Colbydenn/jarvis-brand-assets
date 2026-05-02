# jarvis-brand-assets

Brand assets for the Jarvis Website Business outreach pipeline (operated by Deals Unleashed).

## Versions

### v1 (current — board-approved direction)

Astrodither + wordmark.
Palette: black `#000000`, white `#FFFFFF`, orange `#FF8800`, magenta `#FF2D95`, gray `#888888`.
Bayer 8×8 ordered dither, 16 frames @ 10 fps, 1.6 s seamless loop.
Wordmark: "Get Yourself Online" (magenta, bold) + "by Deals Unleashed" (gray, regular).

- Hero: `/v1/hero.gif` — 720×360, ~87 KB. Planet motif + wordmark stacked top-center.
- Logo: `/v1/logo.gif` — 320×80, ~16 KB. Text-led, scanline + stars accent.

### v0 (initial — motif only, board-approved aesthetic)

Black + white + orange. No text. Same Bayer 8×8 dither + planet motif.

- Hero: `/v0/hero.gif` — 720×360, ~60 KB.
- Logo: `/v0/logo.gif` — 320×80, ~11 KB.

## Build

```bash
python build_gif.py
```

Outputs to `out/`. Pure Pillow + Windows system fonts (Arial). Deterministic, no external services.

## License

MIT.
