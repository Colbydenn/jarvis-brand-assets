// ogl-loader.js — OGL WebGL loader + cleanup wrapper.
// Why OGL over Three.js: ~25 KB vs ~600 KB. Reference set uses minimal WebGL —
// particles, shaders, post-fx — all of which OGL covers.

import { Renderer, Camera, Transform, Program, Mesh, Geometry, Vec2, Vec3 } from "https://esm.sh/ogl@1.0.11";

export { Renderer, Camera, Transform, Program, Mesh, Geometry, Vec2, Vec3 };

// Boot: returns { renderer, gl, scene, camera, dispose }.
// Caller writes their own render loop using the returned objects.
export function bootOGL(canvas, options = {}) {
  const renderer = new Renderer({
    canvas,
    width: canvas.clientWidth || 800,
    height: canvas.clientHeight || 600,
    dpr: Math.min(window.devicePixelRatio, 2),
    alpha: options.alpha ?? true,
    antialias: options.antialias ?? false,
  });
  const gl = renderer.gl;
  gl.clearColor(...(options.clearColor ?? [0, 0, 0, 0]));

  const camera = new Camera(gl, { fov: options.fov ?? 35 });
  camera.position.z = options.cameraZ ?? 5;

  const scene = new Transform();

  function resize() {
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    camera.perspective({ aspect: gl.canvas.width / gl.canvas.height });
  }
  window.addEventListener("resize", resize);
  resize();

  function dispose() {
    window.removeEventListener("resize", resize);
    const ext = gl.getExtension("WEBGL_lose_context");
    if (ext) ext.loseContext();
  }

  return { renderer, gl, scene, camera, dispose };
}
