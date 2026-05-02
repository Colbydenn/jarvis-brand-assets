// marquee.js — JS-driven marquee. CSS-only animation breaks for variable widths;
// this measures actual track width then animates with rAF for steady speed.
// Pauses on hover/focus, respects prefers-reduced-motion.

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const tracks = document.querySelectorAll("[data-marquee]");

tracks.forEach((track) => {
  if (reduce) return;
  // Duplicate items so loop reads continuous.
  const items = Array.from(track.children);
  items.forEach((n) => track.appendChild(n.cloneNode(true)));

  let x = 0;
  let paused = false;
  const speed = 0.6; // px/frame ~ 36 px/s @ 60fps. Tune via CSS later.

  track.addEventListener("mouseenter", () => (paused = true));
  track.addEventListener("mouseleave", () => (paused = false));
  track.addEventListener("focusin", () => (paused = true));
  track.addEventListener("focusout", () => (paused = false));

  function loop() {
    if (!paused) {
      x -= speed;
      const half = track.scrollWidth / 2;
      if (-x >= half) x = 0;
      track.style.transform = `translate3d(${x}px,0,0)`;
    }
    requestAnimationFrame(loop);
  }
  loop();
});
