// Kubrix engine v2 — PBR plastic look, HDR pipeline: scene -> bloom -> DOF -> ACES grade
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
export { THREE };
const _q = new URLSearchParams(location.search);
export const W = +(_q.get('w') || 1080), H = +(_q.get('h') || 1920);
export const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setSize(W, H); renderer.setPixelRatio(1); document.body.appendChild(renderer.domElement);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.shadowMap.autoUpdate = false;
renderer.toneMapping = THREE.NoToneMapping;
export const scene = new THREE.Scene();
export const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 1500);

// ---------- math ----------
export const PI = Math.PI;
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const ss = (t) => { t = clamp(t); return t * t * t * (t * (t * 6 - 15) + 10); };
export const ramp = (a, b, t) => clamp((t - a) / (b - a));
export const S = (a, b, t) => ss(ramp(a, b, t));
export const easeOut = (t) => 1 - Math.pow(1 - clamp(t), 3);
export const easeIn = (t) => Math.pow(clamp(t), 3);
export const back = (t) => { t = clamp(t); const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
export const spring = (t, f = 13, d = 6) => { t = Math.max(0, t); return 1 - Math.exp(-d * t) * Math.cos(f * t); };
export function hash(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
export const noise = (t, s = 0) => Math.sin(t * 1.3 + s) * 0.5 + Math.sin(t * 2.7 + s * 2.1) * 0.3 + Math.sin(t * 5.1 + s * 3.7) * 0.2;
export const lerp3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
export const V3 = (a) => new THREE.Vector3(...a);

// ---------- materials ----------
export const MATS = [];
let ENVK = 1;
export function plastic(color, o = {}) {
  const m = new THREE.MeshStandardMaterial({ color, roughness: o.rough ?? 0.42, metalness: o.metal ?? 0, emissive: o.emissive || '#000000', emissiveIntensity: o.ei ?? 1, transparent: !!o.transparent, opacity: o.opacity ?? 1, map: o.map || null, side: o.side || THREE.FrontSide, flatShading: !!o.flat });
  m.userData.env = o.env ?? 1; m.envMapIntensity = m.userData.env * ENVK; MATS.push(m); return m;
}
const _mc = {};
export function P(color, o) { if (o) return plastic(color, o); return _mc[color] || (_mc[color] = plastic(color)); }
export function glow(color, ei = 2.5) { return plastic(color, { emissive: color, ei, rough: 0.6 }); }
export function setEnvK(k) { ENVK = k; for (const m of MATS) m.envMapIntensity = m.userData.env * k; }

const _gc = {};
export function rgeo(w, h, d, r) { r = Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001); const k = [w, h, d, r].map(x => x.toFixed(3)).join(','); return _gc[k] || (_gc[k] = new RoundedBoxGeometry(w, h, d, 3, Math.max(0.002, r))); }
export function part(w, h, d, m, pos = [0, 0, 0], r = 0.08, parent = scene, rot = null) {
  const o = new THREE.Mesh(rgeo(w, h, d, r), m); o.position.set(...pos); if (rot) o.rotation.set(...rot);
  o.castShadow = true; o.receiveShadow = true; parent.add(o); return o;
}
export function mesh(geo, m, pos = [0, 0, 0], parent = scene, rot = null) { const o = new THREE.Mesh(geo, m); o.position.set(...pos); if (rot) o.rotation.set(...rot); o.castShadow = true; o.receiveShadow = true; parent.add(o); return o; }
export function group(pos = [0, 0, 0], parent = scene, rot = null) { const g = new THREE.Group(); g.position.set(...pos); if (rot) g.rotation.set(...rot); parent.add(g); return g; }
export function canvasTex(w, h, draw, srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const ctx = c.getContext('2d'); draw(ctx, w, h);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.userData.ctx = ctx; t.userData.canvas = c; return t;
}
export function noShadow(o) { o.traverse(x => { if (x.isMesh) { x.castShadow = false; } }); return o; }

// ---------- environment (reflections) ----------
const pmrem = new THREE.PMREMGenerator(renderer);
export function makeEnv(spec) {
  const es = new THREE.Scene();
  const sky = new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, uniforms: { top: { value: new THREE.Color(spec.top) }, hor: { value: new THREE.Color(spec.hor) }, bot: { value: new THREE.Color(spec.bot) } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: 'uniform vec3 top; uniform vec3 hor; uniform vec3 bot; varying vec3 vP; void main(){ float y=vP.y; vec3 c = y>0. ? mix(hor, top, pow(y,0.6)) : mix(hor, bot, pow(-y,0.4)); gl_FragColor=vec4(c,1.); }' }));
  es.add(sky);
  for (const L of spec.lights || []) { const m = new THREE.Mesh(new THREE.SphereGeometry(L.r || 3, 12, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(L.c).multiplyScalar(L.i || 4) })); m.position.set(...L.p); es.add(m); }
  const rt = pmrem.fromScene(es, 0.02); return rt.texture;
}

// ---------- render targets + post ----------
const rtScene = new THREE.WebGLRenderTarget(W, H, { samples: 4, type: THREE.HalfFloatType });
const rtDepth = new THREE.WebGLRenderTarget(W / 2, H / 2, { type: THREE.HalfFloatType });
const depthMat = new THREE.ShaderMaterial({ vertexShader: 'varying float vZ; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); vZ = -mv.z; gl_Position = projectionMatrix*mv; }', fragmentShader: 'varying float vZ; void main(){ gl_FragColor = vec4(vZ,0.,0.,1.); }' });
const half = [W / 2, H / 2], q4 = [W / 4, H / 4], q8 = [W / 8, H / 8];
const mk = (s) => new THREE.WebGLRenderTarget(s[0], s[1], { type: THREE.HalfFloatType });
const rtB1 = mk(half), rtB2 = mk(q4), rtB2b = mk(q4), rtB3 = mk(q8), rtB3b = mk(q8), rtB1b = mk(half);
const quadScene = new THREE.Scene(), quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2)); quadScene.add(quad);
const VS = 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }';
const brightMat = new THREE.ShaderMaterial({ uniforms: { t: { value: null }, th: { value: 1.0 } }, vertexShader: VS, fragmentShader: 'uniform sampler2D t; uniform float th; varying vec2 vUv; void main(){ vec3 c = texture2D(t,vUv).rgb; float l = max(c.r,max(c.g,c.b)); gl_FragColor = vec4(c*smoothstep(th, th*1.8, l),1.); }' });
const blurMat = new THREE.ShaderMaterial({ uniforms: { t: { value: null }, dir: { value: new THREE.Vector2() } }, vertexShader: VS, fragmentShader: 'uniform sampler2D t; uniform vec2 dir; varying vec2 vUv; void main(){ vec3 c = texture2D(t,vUv).rgb*0.227; c += (texture2D(t,vUv+dir*1.385).rgb+texture2D(t,vUv-dir*1.385).rgb)*0.316; c += (texture2D(t,vUv+dir*3.23).rgb+texture2D(t,vUv-dir*3.23).rgb)*0.070; gl_FragColor=vec4(c,1.); }' });
const finalMat = new THREE.ShaderMaterial({
  uniforms: { tC: { value: rtScene.texture }, tD: { value: rtDepth.texture }, b1: { value: rtB1b.texture }, b2: { value: rtB2b.texture }, b3: { value: rtB3b.texture }, res: { value: new THREE.Vector2(W, H) },
    focus: { value: 10 }, aperture: { value: 0 }, bloom: { value: 0.6 }, exposure: { value: 1 }, sat: { value: 1.08 }, contrast: { value: 1.05 }, vign: { value: 0.35 }, flash: { value: 0 }, fade: { value: 0 }, tint: { value: new THREE.Color(1, 1, 1) },
    ca: { value: 0 }, frost: { value: 0 }, utime: { value: 0 }, grain: { value: 0.025 }, desat: { value: 0 }, lift: { value: new THREE.Color(0, 0, 0) } },
  vertexShader: VS,
  fragmentShader: `
  uniform sampler2D tC, tD, b1, b2, b3; uniform vec2 res; uniform float focus, aperture, bloom, exposure, sat, contrast, vign, flash, fade, ca, frost, utime, grain, desat; uniform vec3 tint, lift; varying vec2 vUv;
  float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
  float coc(float z){ return clamp(abs(z - focus) / max(z, 0.1) * aperture, 0., 1.); }
  vec3 aces(vec3 x){ x *= 0.6; return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14), 0., 1.); }
  vec3 toSRGB(vec3 c){ c = max(c, 0.); return mix(c*12.92, 1.055*pow(c, vec3(1./2.4))-0.055, step(0.0031308, c)); }
  float frostN(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y); }
  void main(){
    vec2 uv = vUv;
    // frost distortion
    float fr = 0.; if (frost > 0.) { vec2 q = (uv-0.5)*vec2(1.,1.78); float d = length(q); float n = frostN(uv*vec2(40.,71.))*0.5+frostN(uv*vec2(110.,195.))*0.35+frostN(uv*vec2(9.,16.))*0.6; fr = smoothstep(1.05 - frost*1.2, 1.25 - frost*1.2, d + n*0.45); uv += (vec2(frostN(uv*300.), frostN(uv*300.+7.))-0.5)*0.012*fr; }
    float z = texture2D(tD, uv).r; float c0 = coc(z);
    vec3 col = texture2D(tC, uv).rgb;
    if (aperture > 0.) {
      vec3 acc = col; float wsum = 1.; float R = 22.;
      for (int i = 0; i < 28; i++) { float fi = float(i)+0.5; float r = sqrt(fi/28.); float a = fi*2.39996; vec2 su = uv + vec2(cos(a), sin(a))*r*R/res;
        float zs = texture2D(tD, su).r; float cs = coc(zs);
        float w = (zs < z - 0.05) ? smoothstep(r-0.2, r, cs) : smoothstep(r-0.2, r, min(cs, c0));
        acc += texture2D(tC, su).rgb*w; wsum += w; }
      col = acc/wsum;
    }
    if (ca > 0.) { vec2 d = (uv-0.5)*ca*0.02; col.r = texture2D(tC, uv+d).r; col.b = texture2D(tC, uv-d).b; }
    vec3 bl = texture2D(b1, uv).rgb*0.5 + texture2D(b2, uv).rgb*0.8 + texture2D(b3, uv).rgb*1.1;
    col += bl*bloom;
    col *= exposure * tint;
    vec3 s = toSRGB(aces(col));
    s = s + lift*(1.-s);
    float L = dot(s, vec3(0.299,0.587,0.114)); s = mix(vec3(L), s, sat*(1.-desat));
    s = (s-0.5)*contrast+0.5;
    vec2 q = vUv-0.5; q.x *= 0.85; s *= 1. - vign*smoothstep(0.2, 0.8, length(q)*1.35);
    s += (h21(vUv*res + fract(utime*7.13)*100.)-0.5)*grain;
    if (frost > 0.) { vec3 ice = vec3(0.82,0.93,1.0); float sp = step(0.985, h21(floor(vUv*res/3.)))*fr; s = mix(s, ice*(0.8+0.25*frostN(vUv*vec2(60.,107.))), fr*0.82) + sp*0.6; }
    s = mix(s, vec3(1.), flash); s = mix(s, vec3(0.), fade);
    gl_FragColor = vec4(clamp(s,0.,1.),1.);
  }`, depthTest: false, depthWrite: false });
function pass(m, target) { quad.material = m; renderer.setRenderTarget(target); renderer.render(quadScene, quadCam); }
export const post = finalMat.uniforms;
export const PRE = []; // hooks run before main render (e.g. render-to-texture screens)
export function draw(st = {}) {
  post.focus.value = st.focus ?? 10; post.aperture.value = st.aperture ?? 0; post.bloom.value = st.bloom ?? 0.55; post.exposure.value = st.exposure ?? 1;
  post.sat.value = st.sat ?? 1.08; post.contrast.value = st.contrast ?? 1.05; post.vign.value = st.vign ?? 0.35; post.flash.value = st.flash || 0; post.fade.value = st.fade || 0;
  post.tint.value.set(st.tint || '#ffffff'); post.ca.value = st.ca || 0; post.frost.value = st.frost || 0; post.utime.value = st.time || 0; post.desat.value = st.desat || 0; post.lift.value.set(st.lift || '#000000');
  for (const f of PRE) f();
  camera.updateMatrixWorld(); camera.updateProjectionMatrix();
  renderer.shadowMap.needsUpdate = true;
  renderer.setRenderTarget(rtScene); renderer.setClearColor('#000'); renderer.clear(); renderer.render(scene, camera);
  if ((st.aperture ?? 0) > 0) {
    const hid = []; scene.traverse(o => { if (o.visible && (o.isPoints || o.isSprite || o.userData.noDepth)) { hid.push(o); o.visible = false; } });
    const bg = scene.background, fog = scene.fog; scene.background = null; scene.fog = null; scene.overrideMaterial = depthMat;
    renderer.setRenderTarget(rtDepth); renderer.setClearColor(new THREE.Color(1000, 0, 0)); renderer.clear(); renderer.render(scene, camera);
    scene.overrideMaterial = null; scene.background = bg; scene.fog = fog; for (const o of hid) o.visible = true;
  }
  brightMat.uniforms.t.value = rtScene.texture; brightMat.uniforms.th.value = st.bloomTh ?? 1.0; pass(brightMat, rtB1);
  const blur = (src, dst, tmp, s) => { blurMat.uniforms.t.value = src.texture; blurMat.uniforms.dir.value.set(1 / s[0], 0); pass(blurMat, tmp); blurMat.uniforms.t.value = tmp.texture; blurMat.uniforms.dir.value.set(0, 1 / s[1]); pass(blurMat, dst); };
  blur(rtB1, rtB1b, rtB2, half); // rtB2 used as tmp (size mismatch ok: sampled by uv)
  blur(rtB1b, rtB2b, rtB2, q4);
  blur(rtB2b, rtB3b, rtB3, q8);
  pass(finalMat, null);
}
