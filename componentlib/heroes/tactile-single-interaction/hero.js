// tactile-single-interaction/hero.js
// Single bold drag interaction: pluck a line, release to snap with subtle audio.
// Audio off by default (autoplay policies + user respect). Toggle button enables.
// Reduced-motion: line stays static, sound disabled.

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const hero = document.getElementById("tsHero");
const svg = document.getElementById("tsSvg");
const line = document.getElementById("tsLine");
const soundBtn = document.getElementById("tsSound");

let dragging = false;
let dragX = 500;
let dragY = 300;
let releaseTime = 0;
let releaseAmp = 0;
let raf = null;
let audioCtx = null;
let soundOn = false;

function pathFor(midX, midY, time) {
  // Cubic curve: anchor 0,300 -> mid -> 1000,300
  // After release, oscillate y around 300 with damped sine.
  const t = (performance.now() - releaseTime) / 1000;
  const damp = Math.exp(-t * 4) * releaseAmp;
  const offset = damp * Math.sin(t * 22);
  const y = dragging ? midY : 300 + offset;
  const x = dragging ? midX : 500;
  return `M 0 300 Q ${x} ${y} 1000 300`;
}

function tick() {
  line.setAttribute("d", pathFor(dragX, dragY));
  raf = requestAnimationFrame(tick);
}

function svgCoords(clientX, clientY) {
  const rect = svg.getBoundingClientRect();
  const nx = ((clientX - rect.left) / rect.width) * 1000;
  const ny = ((clientY - rect.top) / rect.height) * 600;
  return { x: nx, y: ny };
}

if (!reduce) {
  hero.addEventListener("pointerdown", (e) => {
    dragging = true;
    const p = svgCoords(e.clientX, e.clientY);
    dragX = p.x;
    dragY = p.y;
    hero.setPointerCapture?.(e.pointerId);
  });
  hero.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const p = svgCoords(e.clientX, e.clientY);
    dragX = p.x;
    dragY = p.y;
  });
  function release() {
    if (!dragging) return;
    dragging = false;
    releaseTime = performance.now();
    releaseAmp = Math.min(80, Math.abs(dragY - 300));
    if (soundOn) twang(releaseAmp);
  }
  hero.addEventListener("pointerup", release);
  hero.addEventListener("pointercancel", release);
  hero.addEventListener("pointerleave", release);
  raf = requestAnimationFrame(tick);
} else {
  line.setAttribute("d", "M 0 300 Q 500 300 1000 300");
}

soundBtn.addEventListener("click", () => {
  soundOn = !soundOn;
  soundBtn.setAttribute("aria-pressed", String(soundOn));
  soundBtn.lastElementChild.textContent = soundOn ? "sound on" : "sound off";
  if (soundOn && !audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
});

function twang(amp) {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "sine";
  // Pitch tied to amplitude — bigger pluck = lower note.
  const freq = 220 - Math.min(80, amp * 0.8);
  osc.frequency.value = freq;
  osc.frequency.exponentialRampToValueAtTime(freq * 0.5, now + 0.6);
  gain.gain.value = 0.0001;
  gain.gain.exponentialRampToValueAtTime(Math.min(0.18, amp * 0.003), now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 0.85);
}
