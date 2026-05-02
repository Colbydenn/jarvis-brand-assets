// scroll-driven-horizontal/hero.js
// Vertical scroll → horizontal pan via GSAP ScrollTrigger.
// Reduced-motion: skip pin, allow native horizontal scroll on touch.

import { gsap, ScrollTrigger, horizontalPan } from "../../motion/gsap-helpers.js";

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

if (reduce) {
  const pan = document.getElementById("shPan");
  const inner = document.getElementById("shInner");
  pan.style.overflowX = "auto";
  pan.style.overflowY = "hidden";
  inner.style.willChange = "auto";
} else {
  horizontalPan("#shPan", "#shInner");
  // ScrollTrigger needs a refresh after layout.
  requestAnimationFrame(() => ScrollTrigger.refresh());
}
