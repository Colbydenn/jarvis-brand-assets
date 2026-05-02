"""
Astrodither brand GIF v0 builder — DEA-7
Pillow-only pipeline. Generates logo + hero GIFs.

Aesthetic: 1-bit/2-bit ordered-dither (Bayer 8x8), palette {black, off-white, amber}.
Motif: dithered planet with orbiting body + slow scanline sweep.
Animation: 16 frames @ 10fps, seamless 1.6s loop.

Output:
  out/logo.gif   — 320x80
  out/hero.gif   — 720x360
  out/frames/*.png  — debug frame dumps
"""

import math
import os
from pathlib import Path
from PIL import Image, ImageDraw

OUT = Path(__file__).parent / "out"
OUT.mkdir(exist_ok=True)
FRAMES_DIR = OUT / "frames"
FRAMES_DIR.mkdir(exist_ok=True)

# Palette (RGB)
BLACK = (0, 0, 0)
WHITE = (255, 255, 255)
ORANGE = (255, 136, 0)
PALETTE_RGB = [BLACK, WHITE, ORANGE]

# Bayer 8x8 ordered dither matrix, normalized to [0,1)
BAYER8 = [
    [ 0, 32,  8, 40,  2, 34, 10, 42],
    [48, 16, 56, 24, 50, 18, 58, 26],
    [12, 44,  4, 36, 14, 46,  6, 38],
    [60, 28, 52, 20, 62, 30, 54, 22],
    [ 3, 35, 11, 43,  1, 33,  9, 41],
    [51, 19, 59, 27, 49, 17, 57, 25],
    [15, 47,  7, 39, 13, 45,  5, 37],
    [63, 31, 55, 23, 61, 29, 53, 21],
]


def bayer_threshold(x: int, y: int) -> float:
    return (BAYER8[y % 8][x % 8] + 0.5) / 64.0


def lerp(a, b, t):
    return a + (b - a) * t


def render_scene(width: int, height: int, t: float) -> Image.Image:
    """
    Render a single grayscale scene at normalized time t in [0,1).
    Returns a 'L' (8-bit grayscale) Image where 0=black, 255=white.
    Brightness map will be quantized via Bayer dither against the 3-color palette.
    """
    # Work in float buffer for clean gradients before dither
    img = Image.new("L", (width, height), 0)
    px = img.load()

    cx = width * 0.50
    cy = height * 0.55
    planet_r = min(width, height) * 0.32

    # Orbiting body — 360deg loop over t
    orbit_r = min(width, height) * 0.46
    angle = 2 * math.pi * t
    ox = cx + math.cos(angle) * orbit_r
    oy = cy + math.sin(angle) * orbit_r * 0.45  # ellipse for depth
    body_r = max(2.0, min(width, height) * 0.05)

    # Scanline phase (0 to 1, sweeps top-to-bottom over full loop)
    scan_y = t * height

    for y in range(height):
        for x in range(width):
            # Background: subtle vertical gradient (top dark, bottom mid)
            bg = 0.12 + 0.10 * (y / max(1, height - 1))

            # Stars: deterministic sparse twinkle
            star_seed = (x * 73856093) ^ (y * 19349663)
            if (star_seed % 2003) == 0:
                tw = 0.5 + 0.5 * math.sin(2 * math.pi * t + (star_seed % 13))
                bg = max(bg, 0.45 + 0.45 * tw)

            # Planet: radial gradient with terminator (dayside lit by amber-equivalent on right)
            dx = x - cx
            dy = y - cy
            dist = math.hypot(dx, dy)
            if dist < planet_r:
                # Inside planet
                # Day-night terminator slightly rotates with t (very subtle)
                light_angle = -0.6 + 0.2 * math.sin(2 * math.pi * t)
                lx = math.cos(light_angle)
                ly = math.sin(light_angle)
                ndotl = (dx / planet_r) * lx + (dy / planet_r) * ly
                # ndotl in [-1,1] -> [0,1]
                shade = max(0.0, ndotl * 0.5 + 0.5)
                # Bands of brightness so dither shows discrete steps
                base = 0.20 + 0.70 * shade
                # Equator band
                band = 0.04 * math.sin(dy / (planet_r * 0.18) + 2 * math.pi * t)
                v = base + band
                # Limb darkening
                edge = dist / planet_r
                v *= 1.0 - 0.25 * (edge ** 3)
                bg = max(bg, v)

            # Orbiting body
            obx = x - ox
            oby = y - oy
            obd = math.hypot(obx, oby)
            if obd < body_r:
                bg = max(bg, 0.92)
            elif obd < body_r * 1.6:
                # soft halo
                halo = 1.0 - (obd - body_r) / (body_r * 0.6)
                bg = max(bg, 0.40 * halo)

            # Scanline sweep (1px-wide bright line, soft fade above and below)
            scan_dist = abs(y - scan_y)
            if scan_dist < 1.5:
                bg = max(bg, 0.85)
            elif scan_dist < 6.0:
                bg = max(bg, 0.20 * (1.0 - (scan_dist - 1.5) / 4.5))

            # Vignette
            vx = (x - width * 0.5) / (width * 0.5)
            vy = (y - height * 0.5) / (height * 0.5)
            vig = 1.0 - 0.35 * min(1.0, vx * vx + vy * vy)
            bg *= vig

            # Clamp + write
            v8 = max(0, min(255, int(bg * 255)))
            px[x, y] = v8

    return img


def quantize_with_bayer(gray: Image.Image) -> Image.Image:
    """
    Dither grayscale -> 3-color palette {black, parchment, amber} using Bayer 8x8.
    Mapping: 0..0.33 -> black, 0.33..0.66 -> amber (mid), 0.66..1.0 -> parchment.
    """
    w, h = gray.size
    out = Image.new("RGB", (w, h))
    src = gray.load()
    dst = out.load()
    for y in range(h):
        for x in range(w):
            v = src[x, y] / 255.0
            t = bayer_threshold(x, y)
            # 3-level quantization with Bayer offset between thresholds
            # Use 2 thresholds: low ~0.33, high ~0.66
            v_d = v + (t - 0.5) * 0.18  # dither perturbation amplitude
            if v_d < 0.30:
                dst[x, y] = BLACK
            elif v_d < 0.62:
                dst[x, y] = ORANGE
            else:
                dst[x, y] = WHITE
    return out


def palette_image() -> Image.Image:
    """Build a 3-color paletted Image.P that GIF can use efficiently."""
    pal = Image.new("P", (1, 1))
    flat = []
    for c in PALETTE_RGB:
        flat.extend(c)
    # Pad to 256 colors as required by Pillow
    flat.extend([0] * (768 - len(flat)))
    pal.putpalette(flat)
    return pal


def to_palette(rgb_img: Image.Image) -> Image.Image:
    pal = palette_image()
    return rgb_img.quantize(palette=pal, dither=Image.Dither.NONE)


def build_gif(width: int, height: int, n_frames: int, out_path: Path, fps: int):
    print(f"[build] {out_path.name}: {width}x{height}, {n_frames} frames @ {fps}fps")
    frames = []
    for i in range(n_frames):
        t = i / n_frames
        gray = render_scene(width, height, t)
        rgb = quantize_with_bayer(gray)
        pframe = to_palette(rgb)
        frames.append(pframe)
        if out_path.stem == "hero" and i in (0, n_frames // 4, n_frames // 2):
            rgb.save(FRAMES_DIR / f"{out_path.stem}_f{i:02d}.png")
    duration_ms = int(1000 / fps)
    frames[0].save(
        out_path,
        save_all=True,
        append_images=frames[1:],
        duration=duration_ms,
        loop=0,
        optimize=True,
        disposal=2,
    )
    size_kb = out_path.stat().st_size / 1024
    print(f"[done] {out_path.name}: {size_kb:.1f} KB")


def main():
    # Hero: 720x360 hero motif (full email-body width on most clients)
    build_gif(720, 360, 16, OUT / "hero.gif", fps=10)
    # Logo: 320x80 cropped/downsized variant (header)
    build_gif(320, 80, 16, OUT / "logo.gif", fps=10)


if __name__ == "__main__":
    main()
