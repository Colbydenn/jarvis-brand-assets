// tile-fill.js — procedural fallback so portfolio strip renders w/o asset deps.
// Generates a deterministic dithered SVG per tile from data-bg index.
// Real implementation: replace data-bg with data-src and lazy-load <img>.

const PALETTE = ["#000000", "#FFFFFF", "#FF8800", "#FF2D95", "#888888"];

function svgFor(seed) {
  const w = 320, h = 400;
  const rng = mulberry32(seed * 9301 + 49297);
  let cells = "";
  const grid = 16;
  for (let y = 0; y < h; y += grid) {
    for (let x = 0; x < w; x += grid) {
      const c = PALETTE[Math.floor(rng() * PALETTE.length)];
      cells += `<rect x="${x}" y="${y}" width="${grid}" height="${grid}" fill="${c}"/>`;
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice">${cells}</svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const tiles = document.querySelectorAll(".pf-tile__img[data-bg]");
tiles.forEach((el) => {
  const seed = parseInt(el.dataset.bg, 10) || 1;
  el.style.backgroundImage = svgFor(seed);
});
