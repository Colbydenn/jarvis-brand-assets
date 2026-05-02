// lenis-init.js — smooth-scroll boot
// Usage: import { initLenis } from "../motion/lenis-init.js";
// Returns the Lenis instance so callers can pause/resume.

import Lenis from "https://esm.sh/lenis@1.1.13";

export function initLenis(options = {}) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return null;
  }

  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    smoothTouch: false,
    ...options,
  });

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  return lenis;
}
