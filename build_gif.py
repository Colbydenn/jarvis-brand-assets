"""
Astrodither brand GIF v1 builder — DEA-7
Pillow-only pipeline. Generates logo + hero GIFs.

Aesthetic: 1-bit/2-bit ordered-dither (Bayer 8x8).
Palette: 5 colors {black, white, orange, magenta, gray}.
v1 adds wordmark: "Get Yourself Online" (magenta) + "by Deals Unleashed" (gray).

Hero: motif (planet + moon + scanline + stars) + wordmark stack overlaid.
Logo: text-led wordmark, motif-free (320x80 too cramped for both).

Animation: 16 frames @ 10 fps, 1.6 s seamless loop.

Output:
  out/logo.gif   — 320x80   (copy to v1/logo.gif for hosting)
  out/hero.gif   — 720x360  (copy to v1/hero.gif for hosting)
  out/frames/*.png  — debug frame dumps (gitignored)
"""

import math
from pathlib import Path
from typing import Tuple

from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).parent / "out"
OUT.mkdir(exist_ok=True)
FRAMES_DIR = OUT / "frames"
FRAMES_DIR.mkdir(exist_ok=True)

RGB = Tuple[int, int, int]

# Palette (RGB)
BLACK: RGB = (0, 0, 0)
WHITE: RGB = (255, 255, 255)
ORANGE: RGB = (255, 136, 0)
MAGENTA: RGB = (255, 45, 149)
GRAY: RGB = (136, 136, 136)
PALETTE_RGB = [BLACK, WHITE, ORANGE, MAGENTA, GRAY]

# Bayer 8x8 ordered dither matrix
BAYER8 = [
    [0, 32, 8, 40, 2, 34, 10, 42],
    [48, 16, 56, 24, 50, 18, 58, 26],
    [12, 44, 4, 36, 14, 46, 6, 38],
    [60, 28, 52, 20, 62, 30, 54, 22],
    [3, 35, 11, 43, 1, 33, 9, 41],
    [51, 19, 59, 27, 49, 17, 57, 25],
    [15, 47, 7, 39, 13, 45, 5, 37],
    [63, 31, 55, 23, 61, 29, 53, 21],
]

# Fonts (Windows system paths)
FONT_BOLD = "C:/Windows/Fonts/arialbd.ttf"
FONT_REG = "C:/Windows/Fonts/arial.ttf"


def bayer_threshold(x: int, y: int) -> float:
    return (BAYER8[y % 8][x % 8] + 0.5) / 64.0


def render_scene(width: int, height: int, t: float) -> Image.Image:
    """Render grayscale scene (motif only). Quantized later via Bayer."""
    img = Image.new("L", (width, height), 0)
    px = img.load()

    cx = width * 0.50
    cy = height * 0.55
    planet_r = min(width, height) * 0.32

    orbit_r = min(width, height) * 0.46
    angle = 2 * math.pi * t
    ox = cx + math.cos(angle) * orbit_r
    oy = cy + math.sin(angle) * orbit_r * 0.45
    body_r = max(2.0, min(width, height) * 0.05)

    scan_y = t * height

    for y in range(height):
        for x in range(width):
            bg = 0.12 + 0.10 * (y / max(1, height - 1))

            star_seed = (x * 73856093) ^ (y * 19349663)
            if (star_seed % 2003) == 0:
                tw = 0.5 + 0.5 * math.sin(2 * math.pi * t + (star_seed % 13))
                bg = max(bg, 0.45 + 0.45 * tw)

            dx = x - cx
            dy = y - cy
            dist = math.hypot(dx, dy)
            if dist < planet_r:
                light_angle = -0.6 + 0.2 * math.sin(2 * math.pi * t)
                lx = math.cos(light_angle)
                ly = math.sin(light_angle)
                ndotl = (dx / planet_r) * lx + (dy / planet_r) * ly
                shade = max(0.0, ndotl * 0.5 + 0.5)
                base = 0.20 + 0.70 * shade
                band = 0.04 * math.sin(dy / (planet_r * 0.18) + 2 * math.pi * t)
                v = base + band
                edge = dist / planet_r
                v *= 1.0 - 0.25 * (edge ** 3)
                bg = max(bg, v)

            obx = x - ox
            oby = y - oy
            obd = math.hypot(obx, oby)
            if obd < body_r:
                bg = max(bg, 0.92)
            elif obd < body_r * 1.6:
                halo = 1.0 - (obd - body_r) / (body_r * 0.6)
                bg = max(bg, 0.40 * halo)

            scan_dist = abs(y - scan_y)
            if scan_dist < 1.5:
                bg = max(bg, 0.85)
            elif scan_dist < 6.0:
                bg = max(bg, 0.20 * (1.0 - (scan_dist - 1.5) / 4.5))

            vx = (x - width * 0.5) / (width * 0.5)
            vy = (y - height * 0.5) / (height * 0.5)
            vig = 1.0 - 0.35 * min(1.0, vx * vx + vy * vy)
            bg *= vig

            v8 = max(0, min(255, int(bg * 255)))
            px[x, y] = v8

    return img


def quantize_with_bayer(gray: Image.Image) -> Image.Image:
    """Dither grayscale -> 3-color {BLACK, ORANGE, WHITE}."""
    w, h = gray.size
    out = Image.new("RGB", (w, h))
    src = gray.load()
    dst = out.load()
    for y in range(h):
        for x in range(w):
            v = src[x, y] / 255.0
            t = bayer_threshold(x, y)
            v_d = v + (t - 0.5) * 0.18
            if v_d < 0.30:
                dst[x, y] = BLACK
            elif v_d < 0.62:
                dst[x, y] = ORANGE
            else:
                dst[x, y] = WHITE
    return out


def text_mask(text: str, font_path: str, size: int) -> Image.Image:
    """Render text to grayscale mask. Returns L-mode image sized to text bbox."""
    font = ImageFont.truetype(font_path, size)
    # Pillow >=10: getbbox for accurate sizing
    bbox = font.getbbox(text)
    w = bbox[2] - bbox[0] + 4
    h = bbox[3] - bbox[1] + 4
    mask = Image.new("L", (w, h), 0)
    draw = ImageDraw.Draw(mask)
    draw.text((-bbox[0] + 2, -bbox[1] + 2), text, fill=255, font=font)
    return mask


def paint_text(canvas: Image.Image, mask: Image.Image, x: int, y: int, color: RGB, threshold: int = 128) -> None:
    """Paint thresholded text mask onto RGB canvas at (x,y) with given color (no antialias)."""
    canvas_px = canvas.load()
    mask_px = mask.load()
    mw, mh = mask.size
    cw, ch = canvas.size
    for j in range(mh):
        for i in range(mw):
            if mask_px[i, j] >= threshold:
                cx = x + i
                cy = y + j
                if 0 <= cx < cw and 0 <= cy < ch:
                    canvas_px[cx, cy] = color


def palette_image() -> Image.Image:
    pal = Image.new("P", (1, 1))
    flat = []
    for c in PALETTE_RGB:
        flat.extend(c)
    flat.extend([0] * (768 - len(flat)))
    pal.putpalette(flat)
    return pal


def to_palette(rgb_img: Image.Image) -> Image.Image:
    return rgb_img.quantize(palette=palette_image(), dither=Image.Dither.NONE)


def build_hero_frame(width: int, height: int, t: float) -> Image.Image:
    """Hero = dithered motif + wordmark stacked top-center."""
    gray = render_scene(width, height, t)
    rgb = quantize_with_bayer(gray)

    # Big wordmark
    big_size = max(28, height // 8)  # ~45 at 360 height
    big_mask = text_mask("Get Yourself Online", FONT_BOLD, big_size)
    bx = (width - big_mask.size[0]) // 2
    by = int(height * 0.08)
    paint_text(rgb, big_mask, bx, by, MAGENTA)

    # Sub wordmark
    sub_size = max(12, height // 22)  # ~16 at 360
    sub_mask = text_mask("by Deals Unleashed", FONT_REG, sub_size)
    sx = (width - sub_mask.size[0]) // 2
    sy = by + big_mask.size[1] + 2
    paint_text(rgb, sub_mask, sx, sy, GRAY)

    return rgb


def build_logo_frame(width: int, height: int, t: float) -> Image.Image:
    """Logo = text-led, no motif. Subtle scanline + tiny dithered orange star for personality."""
    # Black canvas
    rgb = Image.new("RGB", (width, height), BLACK)

    # Subtle scanline animation: bright row sweeps top->bottom, leaves faint dithered trail
    scan_y = int(t * height)
    for x in range(width):
        # Bayer-dithered orange stars at fixed positions, twinkling
        seed = (x * 73856093) ^ (scan_y * 19349663)
        if (seed % 521) == 0:
            tw = 0.5 + 0.5 * math.sin(2 * math.pi * t + seed % 11)
            if tw > 0.5:
                rgb.putpixel((x, (seed >> 4) % height), ORANGE)

    # Faint scanline at scan_y (1px white, dithered fade above/below)
    if 0 <= scan_y < height:
        for x in range(width):
            # Bayer-controlled visibility
            if bayer_threshold(x, scan_y) < 0.6:
                rgb.putpixel((x, scan_y), ORANGE)

    # Big wordmark (single line, centered vertically a bit above middle)
    big_size = max(20, height // 3)  # ~26 at 80
    big_mask = text_mask("Get Yourself Online", FONT_BOLD, big_size)
    # If too wide for width, scale font down
    while big_mask.size[0] > width - 8 and big_size > 12:
        big_size -= 1
        big_mask = text_mask("Get Yourself Online", FONT_BOLD, big_size)
    bx = (width - big_mask.size[0]) // 2
    by = max(2, (height - big_mask.size[1] - height // 5) // 2)
    paint_text(rgb, big_mask, bx, by, MAGENTA)

    # Sub wordmark
    sub_size = max(8, height // 7)  # ~11 at 80
    sub_mask = text_mask("by Deals Unleashed", FONT_REG, sub_size)
    while sub_mask.size[0] > width - 8 and sub_size > 7:
        sub_size -= 1
        sub_mask = text_mask("by Deals Unleashed", FONT_REG, sub_size)
    sx = (width - sub_mask.size[0]) // 2
    sy = by + big_mask.size[1] + 1
    paint_text(rgb, sub_mask, sx, sy, GRAY)

    return rgb


def build_gif(
    width: int,
    height: int,
    n_frames: int,
    out_path: Path,
    fps: int,
    is_logo: bool,
) -> None:
    print(f"[build] {out_path.name}: {width}x{height}, {n_frames} frames @ {fps}fps")
    frames = []
    for i in range(n_frames):
        t = i / n_frames
        if is_logo:
            rgb = build_logo_frame(width, height, t)
        else:
            rgb = build_hero_frame(width, height, t)
        pframe = to_palette(rgb)
        frames.append(pframe)
        if i in (0, n_frames // 4, n_frames // 2):
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


def main() -> None:
    build_gif(720, 360, 16, OUT / "hero.gif", fps=10, is_logo=False)
    build_gif(320, 80, 16, OUT / "logo.gif", fps=10, is_logo=True)


if __name__ == "__main__":
    main()
