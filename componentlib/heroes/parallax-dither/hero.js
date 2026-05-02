// parallax-dither/hero.js
// Mouse + scroll parallax across 3 layers, Bayer 8×8 dither overlay rendered to canvas.
// Reduced-motion: skip parallax, render single dither pass once.

const BAYER_8 = [
  [0,32,8,40,2,34,10,42],
  [48,16,56,24,50,18,58,26],
  [12,44,4,36,14,46,6,38],
  [60,28,52,20,62,30,54,22],
  [3,35,11,43,1,33,9,41],
  [51,19,59,27,49,17,57,25],
  [15,47,7,39,13,45,5,37],
  [63,31,55,23,61,29,53,21],
];
const BAYER_DIVISOR = 64;

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const hero = document.getElementById("pdHero");
const layers = document.querySelectorAll("#pdLayers .pd-layer:not(.pd-layer--dither)");
const canvas = document.getElementById("pdDither");
const ctx = canvas.getContext("2d");

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  // Render at low resolution then scale up for performant dither.
  const w = Math.floor(hero.clientWidth / 4);
  const h = Math.floor(hero.clientHeight / 4);
  canvas.width = w;
  canvas.height = h;
  drawDither(w, h);
}

function drawDither(w, h) {
  const img = ctx.createImageData(w, h);
  const data = img.data;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      // Threshold from Bayer matrix → on/off per pixel.
      const t = BAYER_8[y % 8][x % 8] / BAYER_DIVISOR;
      // Vertical fade so dither is densest mid-screen, sparse at edges.
      const fade = Math.abs((y / h) - 0.55);
      const v = 0.45 + fade * 0.5;
      const on = v > t;
      const i = (y * w + x) * 4;
      data[i] = on ? 0 : 255;
      data[i + 1] = on ? 0 : 255;
      data[i + 2] = on ? 0 : 255;
      data[i + 3] = on ? 200 : 0;
    }
  }
  ctx.putImageData(img, 0, 0);
}

resize();
window.addEventListener("resize", resize);

if (!reduce) {
  let mx = 0, my = 0, sy = 0;
  hero.addEventListener("pointermove", (e) => {
    const rect = hero.getBoundingClientRect();
    mx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    my = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    apply();
  });
  window.addEventListener("scroll", () => {
    sy = window.scrollY;
    apply();
  }, { passive: true });

  function apply() {
    layers.forEach((el) => {
      const d = parseFloat(el.dataset.depth) || 0.1;
      const tx = -mx * d * 60;
      const ty = -my * d * 40 + sy * d * 0.4;
      el.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
    });
  }
}
