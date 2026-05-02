// cursor-trail-gallery/hero.js
// Trailing tile strip following cursor. Click pins current set.
// Procedural-fill tiles (deterministic dithered SVG per index) so no asset deps.
// Reduced-motion: drop trail, render static grid instead.

const PALETTE = ["#000000", "#FFFFFF", "#FF8800", "#FF2D95", "#888888"];
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function svgFor(seed) {
  const w = 280, h = 350;
  const rng = mulberry32(seed * 9301 + 49297);
  let cells = "";
  const grid = 14;
  for (let y = 0; y < h; y += grid) {
    for (let x = 0; x < w; x += grid) {
      cells += `<rect x="${x}" y="${y}" width="${grid}" height="${grid}" fill="${PALETTE[Math.floor(rng() * PALETTE.length)]}"/>`;
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice">${cells}</svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}

const trail = document.getElementById("ctTrail");
const hero = document.getElementById("ctHero");
const TILE_COUNT = 14;
const tiles = [];

for (let i = 0; i < TILE_COUNT; i++) {
  const el = document.createElement("div");
  el.className = "ct-tile";
  el.style.backgroundImage = svgFor(i + 1);
  el.style.zIndex = String(TILE_COUNT - i);
  trail.appendChild(el);
  tiles.push({ el, x: 0, y: 0 });
}

if (reduce) {
  // Static grid layout instead of trail.
  hero.style.cursor = "auto";
  tiles.forEach((t, i) => {
    const cols = 5;
    const col = i % cols;
    const row = Math.floor(i / cols);
    t.el.style.left = `${10 + col * 17}%`;
    t.el.style.top = `${30 + row * 28}%`;
    t.el.classList.add("in");
  });
} else {
  let mx = window.innerWidth / 2;
  let my = window.innerHeight / 2;
  let head = 0;
  let lastEmit = 0;

  hero.addEventListener("pointermove", (e) => {
    mx = e.clientX;
    my = e.clientY;
    const now = performance.now();
    if (now - lastEmit < 80) return;
    lastEmit = now;
    const t = tiles[head];
    t.x = mx;
    t.y = my;
    t.el.style.left = `${mx}px`;
    t.el.style.top = `${my}px`;
    t.el.classList.remove("in");
    void t.el.offsetWidth;
    t.el.classList.add("in");
    head = (head + 1) % TILE_COUNT;
    setTimeout(() => t.el.classList.remove("in"), 1100);
  });

  hero.addEventListener("click", () => {
    // Pin current frame: lock all visible tiles.
    tiles.forEach((t) => t.el.classList.add("in"));
  });
}
