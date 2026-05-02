// webgl-particle/hero.js
// OGL particle field, mouse-repel. Brand-palette point colors.
// Reduced-motion: render single static frame, skip RAF loop.

import { Renderer, Camera, Transform, Program, Mesh, Geometry } from "../../motion/ogl-loader.js";

const canvas = document.getElementById("wpCanvas");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

const renderer = new Renderer({
  canvas,
  width: canvas.clientWidth,
  height: canvas.clientHeight,
  dpr: Math.min(window.devicePixelRatio, 2),
  alpha: true,
  antialias: false,
});
const gl = renderer.gl;
gl.clearColor(0, 0, 0, 1);

const camera = new Camera(gl, { fov: 35 });
camera.position.z = 5;
const scene = new Transform();

const COUNT = reduce ? 600 : 2400;
const positions = new Float32Array(COUNT * 3);
const colorsArr = new Float32Array(COUNT * 3);
const homes = new Float32Array(COUNT * 3);
const PALETTE = [
  [1.0, 0.533, 0.0],   // orange
  [1.0, 0.176, 0.584], // magenta
  [0.533, 0.533, 0.533],
  [1.0, 1.0, 1.0],
];

for (let i = 0; i < COUNT; i++) {
  const r = Math.sqrt(Math.random()) * 3.4;
  const a = Math.random() * Math.PI * 2;
  const x = Math.cos(a) * r;
  const y = Math.sin(a) * r * 0.55;
  const z = (Math.random() - 0.5) * 0.6;
  positions[i * 3] = homes[i * 3] = x;
  positions[i * 3 + 1] = homes[i * 3 + 1] = y;
  positions[i * 3 + 2] = homes[i * 3 + 2] = z;
  const c = PALETTE[Math.floor(Math.random() * PALETTE.length)];
  colorsArr[i * 3] = c[0];
  colorsArr[i * 3 + 1] = c[1];
  colorsArr[i * 3 + 2] = c[2];
}

const geometry = new Geometry(gl, {
  position: { size: 3, data: positions },
  color: { size: 3, data: colorsArr },
});

const vertex = /* glsl */ `
  attribute vec3 position;
  attribute vec3 color;
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  uniform float uPixel;
  varying vec3 vColor;
  void main() {
    vColor = color;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uPixel * (1.4 / -mv.z);
  }
`;
const fragment = /* glsl */ `
  precision mediump float;
  varying vec3 vColor;
  void main() {
    vec2 c = gl_PointCoord - vec2(0.5);
    float d = dot(c, c);
    if (d > 0.25) discard;
    float a = smoothstep(0.25, 0.0, d);
    gl_FragColor = vec4(vColor, a);
  }
`;
const program = new Program(gl, {
  vertex,
  fragment,
  uniforms: { uPixel: { value: 220 } },
  transparent: true,
  depthTest: false,
});

const mesh = new Mesh(gl, { mode: gl.POINTS, geometry, program });
mesh.setParent(scene);

function resize() {
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  camera.perspective({ aspect: gl.canvas.width / gl.canvas.height });
  program.uniforms.uPixel.value = Math.min(canvas.clientWidth, 360);
}
window.addEventListener("resize", resize);
resize();

const mouse = { x: 999, y: 999, active: false };
canvas.addEventListener("pointermove", (e) => {
  const rect = canvas.getBoundingClientRect();
  const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
  mouse.x = nx * 4;
  mouse.y = ny * 2.2;
  mouse.active = true;
});
canvas.addEventListener("pointerleave", () => (mouse.active = false));

function tick(t) {
  const time = t * 0.0006;
  const posAttr = geometry.attributes.position;
  for (let i = 0; i < COUNT; i++) {
    const ix = i * 3;
    const hx = homes[ix];
    const hy = homes[ix + 1];
    const hz = homes[ix + 2];
    const wob = Math.sin(time + i * 0.15) * 0.02;
    let x = hx + wob;
    let y = hy + Math.cos(time * 0.8 + i * 0.1) * 0.02;
    let z = hz;
    if (mouse.active) {
      const dx = x - mouse.x;
      const dy = y - mouse.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < 1.4) {
        const f = (1.4 - d2) * 0.7;
        const inv = 1 / Math.max(0.05, Math.sqrt(d2));
        x += dx * inv * f * 0.4;
        y += dy * inv * f * 0.4;
      }
    }
    positions[ix] = x;
    positions[ix + 1] = y;
    positions[ix + 2] = z;
  }
  posAttr.needsUpdate = true;
  renderer.render({ scene, camera });
  if (!reduce) requestAnimationFrame(tick);
}
tick(0);
