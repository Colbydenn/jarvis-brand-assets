// canvas-dither hero — Bayer 8x8 ordered dither over a quantized brand palette.
// Aesthetic match to /v1 brand mark. Live grid + contrast sliders.
// No external deps; pure canvas + procedural fallback motif if user supplies no image.

const PALETTE = [
  [0x00, 0x00, 0x00],   // ink
  [0xFF, 0xFF, 0xFF],   // paper
  [0xFF, 0x88, 0x00],   // orange
  [0xFF, 0x2D, 0x95],   // magenta
  [0x88, 0x88, 0x88],   // gray
];

// 8x8 Bayer matrix, normalized 0..1 (offset is computed at apply time).
const BAYER8 = (() => {
  const base2 = [[0, 2], [3, 1]];
  function expand(m) {
    const n = m.length;
    const out = Array.from({ length: 2 * n }, () => Array(2 * n).fill(0));
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const v = 4 * m[y][x];
        out[y][x] = v;
        out[y][x + n] = v + 2;
        out[y + n][x] = v + 3;
        out[y + n][x + n] = v + 1;
      }
    }
    return out;
  }
  let m = base2;
  m = expand(m);   // 4x4
  m = expand(m);   // 8x8
  // normalize to 0..1
  return m.map((r) => r.map((v) => (v + 0.5) / 64));
})();

const canvas = document.getElementById("cdCanvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });

const gridInput = document.getElementById("cdGrid");
const contrastInput = document.getElementById("cdContrast");
const loadBtn = document.getElementById("cdLoad");
const fileInput = document.getElementById("cdFile");

let dpr = Math.min(window.devicePixelRatio || 1, 2);
let sourceImage = null; // ImageBitmap | HTMLImageElement | null (procedural)
let frame = 0;
let rafId = null;

function fitCanvas() {
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);
}

function quantize(r, g, b, palette) {
  let best = 0, bestD = Infinity;
  for (let i = 0; i < palette.length; i++) {
    const dr = r - palette[i][0];
    const dg = g - palette[i][1];
    const db = b - palette[i][2];
    const d = dr * dr + dg * dg + db * db;
    if (d < bestD) { bestD = d; best = i; }
  }
  return palette[best];
}

// Procedural fallback motif — orbiting planet + scanlines + stars.
function drawProcedural(time) {
  const w = canvas.width, h = canvas.height;
  // Solid bg
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, w, h);

  // Star field
  const seed = 1337;
  ctx.fillStyle = "#FFFFFF";
  for (let i = 0; i < 220; i++) {
    const sx = ((seed * (i + 1) * 9301 + 49297) % 233280) / 233280;
    const sy = ((seed * (i + 1) * 16807) % 233280) / 233280;
    const tw = 0.5 + 0.5 * Math.sin(time * 0.001 + i);
    if (tw > 0.6) ctx.fillRect(Math.floor(sx * w), Math.floor(sy * h), 2, 2);
  }

  // Planet
  const cx = w * 0.65;
  const cy = h * 0.55;
  const r = Math.min(w, h) * 0.18;
  const grad = ctx.createRadialGradient(cx - r * 0.4, cy - r * 0.4, r * 0.1, cx, cy, r);
  grad.addColorStop(0, "#FF8800");
  grad.addColorStop(0.7, "#FF2D95");
  grad.addColorStop(1, "#000000");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // Scanline sweep
  const sweepY = ((time * 0.05) % h);
  ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
  ctx.fillRect(0, sweepY, w, 2);

  // Orbiting moon
  const t = time * 0.0006;
  const mx = cx + Math.cos(t) * r * 1.7;
  const my = cy + Math.sin(t) * r * 0.6;
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(mx, my, r * 0.18, 0, Math.PI * 2);
  ctx.fill();
}

function drawSourceImage() {
  if (!sourceImage) return;
  const w = canvas.width, h = canvas.height;
  // cover-fit
  const ir = sourceImage.width / sourceImage.height;
  const cr = w / h;
  let sw, sh, sx, sy;
  if (ir > cr) { sh = sourceImage.height; sw = sh * cr; sx = (sourceImage.width - sw) / 2; sy = 0; }
  else { sw = sourceImage.width; sh = sw / cr; sx = 0; sy = (sourceImage.height - sh) / 2; }
  ctx.drawImage(sourceImage, sx, sy, sw, sh, 0, 0, w, h);
}

function applyDither(grid, contrast) {
  const w = canvas.width, h = canvas.height;
  const img = ctx.getImageData(0, 0, w, h);
  const data = img.data;
  // We treat `grid` as the chunky pixel scale (1 = full res; 8 = 8px blocks).
  const step = Math.max(1, Math.floor(grid));
  const bayerN = BAYER8.length;

  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      const idx = (y * w + x) * 4;
      // contrast adjust
      let r = data[idx], g = data[idx + 1], b = data[idx + 2];
      r = Math.max(0, Math.min(255, (r - 128) * contrast + 128));
      g = Math.max(0, Math.min(255, (g - 128) * contrast + 128));
      b = Math.max(0, Math.min(255, (b - 128) * contrast + 128));

      // Bayer offset
      const bx = (x / step) | 0;
      const by = (y / step) | 0;
      const threshold = (BAYER8[by % bayerN][bx % bayerN] - 0.5) * 64;

      const [pr, pg, pb] = quantize(r + threshold, g + threshold, b + threshold, PALETTE);

      // splat block
      for (let dy = 0; dy < step && y + dy < h; dy++) {
        for (let dx = 0; dx < step && x + dx < w; dx++) {
          const k = ((y + dy) * w + (x + dx)) * 4;
          data[k] = pr;
          data[k + 1] = pg;
          data[k + 2] = pb;
          data[k + 3] = 255;
        }
      }
    }
  }
  ctx.putImageData(img, 0, 0);
}

function tick(time) {
  if (sourceImage) drawSourceImage();
  else drawProcedural(time);
  applyDither(parseInt(gridInput.value, 10), parseFloat(contrastInput.value));
  frame++;
  rafId = requestAnimationFrame(tick);
}

function start() {
  fitCanvas();
  cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(tick);
}

window.addEventListener("resize", () => {
  cancelAnimationFrame(rafId);
  fitCanvas();
  rafId = requestAnimationFrame(tick);
});

loadBtn.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const bmp = await createImageBitmap(file);
  sourceImage = bmp;
});

// Reduced-motion: render one static frame.
if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  fitCanvas();
  drawProcedural(0);
  applyDither(parseInt(gridInput.value, 10), parseFloat(contrastInput.value));
} else {
  start();
}
