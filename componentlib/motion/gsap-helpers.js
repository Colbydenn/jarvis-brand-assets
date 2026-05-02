// gsap-helpers.js — GSAP + ScrollTrigger reveal/sequence helpers.

import gsap from "https://esm.sh/gsap@3.12.5";
import ScrollTrigger from "https://esm.sh/gsap@3.12.5/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger };

// Reveal opacity+y on enter; honors prefers-reduced-motion.
export function revealOnScroll(selector, options = {}) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const targets = typeof selector === "string" ? document.querySelectorAll(selector) : selector;

  targets.forEach((el) => {
    if (reduced) {
      el.style.opacity = 1;
      return;
    }
    gsap.from(el, {
      opacity: 0,
      y: 24,
      duration: 1.2,
      ease: "expo.out",
      scrollTrigger: {
        trigger: el,
        start: "top 85%",
        toggleActions: "play none none reverse",
        ...options.scrollTrigger,
      },
      ...options.tween,
    });
  });
}

// Horizontal scroll-driven pan. Containers: outer (pin) + inner (translate).
export function horizontalPan(outerSel, innerSel) {
  const outer = document.querySelector(outerSel);
  const inner = document.querySelector(innerSel);
  if (!outer || !inner) return null;

  const distance = () => inner.scrollWidth - window.innerWidth;
  return gsap.to(inner, {
    x: () => -distance(),
    ease: "none",
    scrollTrigger: {
      trigger: outer,
      pin: true,
      scrub: 1,
      end: () => `+=${distance()}`,
      invalidateOnRefresh: true,
    },
  });
}
