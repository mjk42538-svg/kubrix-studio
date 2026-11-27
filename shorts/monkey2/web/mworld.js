// Monkey King world
import { THREE, scene, camera, plastic, P, glow, part, mesh, group, canvasTex, makeEnv, setEnvK, clamp, lerp, hash, noise, PI } from './core.js';

// ---------- sky ----------
const skyMat = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { top: { value: new THREE.Color() }, hor: { value: new THREE.Color() }, sunC: { value: new THREE.Color() }, sunDir: { value: new THREE.Vector3(0, 0.3, -1).normalize() } },
  vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
  fragmentShader: 'uniform vec3 top, hor, sunC, sunDir; varying vec3 vP; void main(){ float h = clamp(vP.y,0.,1.); vec3 c = mix(hor, top, pow(h,0.5)); if (vP.y < 0.) c = hor*0.9; float m = max(dot(vP, normalize(sunDir)),0.); c += sunC*(pow(m,400.)*6.+pow(m,16.)*0.5+pow(m,3.)*0.15); gl_FragColor = vec4(c,1.); }' });
export const sky = new THREE.Mesh(new THREE.SphereGeometry(1400, 32, 16), skyMat); sky.userData.noDepth = true; scene.add(sky);
export const stars = (() => { const n = 1500, p = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const th = hash(i) * PI * 2, ph = 0.05 + hash(i + 999) * 1.4; p.set([Math.cos(th) * Math.cos(ph) * 1200, Math.sin(ph) * 1200, Math.sin(th) * Math.cos(ph) * 1200], i * 3); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); const s = new THREE.Points(g, new THREE.PointsMaterial({ color: new THREE.Color(3, 3, 3.2), size: 2.4, sizeAttenuation: false, fog: false, depthWrite: false })); scene.add(s); return s; })();
scene.fog = new THREE.FogExp2('#cfe3f2', 0.0025);
export const hemi = new THREE.HemisphereLight('#bfe0ff', '#8a7a5a', 1.0); scene.add(hemi);
export const sun = new THREE.DirectionalLight('#fff1d6', 3.0); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 500 }); sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.04; sun.shadow.radius = 3; scene.add(sun, sun.target);
export const pl = []; for (let i = 0; i < 4; i++) { const l = new THREE.PointLight('#ffb35c', 0, 26, 1.6); scene.add(l); pl.push(l); }
const ENVS = {
  day: makeEnv({ top: '#4f9fe0', hor: '#dcefff', bot: '#7a8a5a', lights: [{ p: [20, 30, -20], c: '#fff4d8', i: 8, r: 5 }] }),
  gold: makeEnv({ top: '#e07a4a', hor: '#ffd6a0', bot: '#6a4a3a', lights: [{ p: [0, 8, -40], c: '#ffb060', i: 8, r: 6 }] }),
  heaven: makeEnv({ top: '#ffe9b0', hor: '#fff8ec', bot: '#ffffff', lights: [{ p: [0, 30, 0], c: '#fff0c0', i: 6, r: 8 }] }),
  night: makeEnv({ top: '#0a1433', hor: '#3c5a94', bot: '#1a2030', lights: [{ p: [10, 30, -30], c: '#e0e8ff', i: 4, r: 5 }, { p: [-10, 5, 10], c: '#ffb35c', i: 4, r: 2 }] }),
  cave: makeEnv({ top: '#2a4a50', hor: '#5a8a90', bot: '#2a3030', lights: [{ p: [0, 5, 20], c: '#cfefff', i: 6, r: 8 }] }),
  storm: makeEnv({ top: '#2a2440', hor: '#7a6a80', bot: '#2a2a2a', lights: [] }),
};
// name: env, sky top/hor/sun, sun color/int, dir, hemi sky/ground/int, fog color/density, envk, exposure
export const LP = {
  day: { env: 'day', top: '#3f93e0', hor: '#d6ecff', sunC: '#fff6e0', sc: '#fff1d6', si: 3.0, dir: [0.5, 0.75, 0.45], hs: '#bfe0ff', hg: '#8a7a5a', hi: 1.0, fog: '#cfe3f2', fd: 0.0022, envk: 1.0, exp: 1.0 },
  morning: { env: 'gold', top: '#5a9ae0', hor: '#ffe0b8', sunC: '#ffd090', sc: '#ffd9a8', si: 3.0, dir: [-0.6, 0.35, -0.7], hs: '#cfe0ff', hg: '#8a6a4a', hi: 0.9, fog: '#f2dcc0', fd: 0.003, envk: 1.0, exp: 1.0 },
  golden: { env: 'gold', top: '#d0704a', hor: '#ffcf8a', sunC: '#ffb060', sc: '#ffb878', si: 3.2, dir: [-0.3, 0.18, -0.95], hs: '#ffc9a0', hg: '#5a3a3a', hi: 0.9, fog: '#f0b88a', fd: 0.003, envk: 1.0, exp: 1.0 },
  heaven: { env: 'heaven', top: '#f4b860', hor: '#ffe8c4', sunC: '#fff0c0', sc: '#fff2d0', si: 2.0, dir: [0.3, 0.9, 0.3], hs: '#ffe8c8', hg: '#d8c8b0', hi: 0.9, fog: '#fff3e0', fd: 0.004, envk: 1.1, exp: 0.95 },
  misty: { env: 'day', top: '#a8c4d8', hor: '#eef4f6', sunC: '#ffffff', sc: '#f4f6ff', si: 1.8, dir: [0.4, 0.8, 0.3], hs: '#e8f0f6', hg: '#8a9a8a', hi: 1.3, fog: '#e6eef2', fd: 0.018, envk: 0.9, exp: 1.0 },
  night: { env: 'night', top: '#060d26', hor: '#25406e', sunC: '#a0b8ff', sc: '#9fb7ff', si: 1.2, dir: [-0.4, 0.8, 0.4], hs: '#6a84c8', hg: '#202838', hi: 0.7, fog: '#1a2a4a', fd: 0.006, envk: 0.8, exp: 1.0, stars: 1 },
  cave: { env: 'cave', top: '#203a40', hor: '#4a7a80', sunC: '#000', sc: '#cfeeff', si: 1.5, dir: [0, 0.3, 1], hs: '#5a8a96', hg: '#2a3030', hi: 0.8, fog: '#1e3236', fd: 0.012, envk: 1.0, exp: 1.0 },
  lair: { env: 'storm', top: '#1a0a14', hor: '#4a1a20', sunC: '#000', sc: '#ffb08a', si: 1.3, dir: [0.3, 0.8, 0.5], hs: '#8a5a7a', hg: '#2a1a1a', hi: 0.9, fog: '#2a1418', fd: 0.01, envk: 0.8, exp: 1.05 },
  deep: { env: 'cave', top: '#0a4a6a', hor: '#1a8aa8', sunC: '#000', sc: '#c8f8ff', si: 2.4, dir: [0.2, 1, 0.15], hs: '#6ad8f0', hg: '#1a4a50', hi: 1.2, fog: '#1a6a8a', fd: 0.016, envk: 1.0, exp: 1.05 },
  under: { env: 'storm', top: '#100608', hor: '#3a1014', sunC: '#000', sc: '#d0ffe0', si: 1.1, dir: [0.2, 0.9, 0.4], hs: '#8a5a60', hg: '#1a0a0a', hi: 0.9, fog: '#200a0e', fd: 0.01, envk: 0.7, exp: 1.05 },
  storm: { env: 'storm', top: '#1e1a30', hor: '#6a5a70', sunC: '#000', sc: '#b8a8d0', si: 1.4, dir: [0.4, 0.7, 0.3], hs: '#8a7aa0', hg: '#2a2630', hi: 0.8, fog: '#4a4258', fd: 0.006, envk: 0.7, exp: 1.0 },
};
export function setLight(name, center = [0, 0, 0]) {
  const L = LP[name]; scene.environment = ENVS[L.env]; setEnvK(L.envk);
  skyMat.uniforms.top.value.set(L.top); skyMat.uniforms.hor.value.set(L.hor); skyMat.uniforms.sunC.value.set(L.sunC); skyMat.uniforms.sunDir.value.set(...L.dir).normalize();
  hemi.color.set(L.hs); hemi.groundColor.set(L.hg); hemi.intensity = L.hi; sun.color.set(L.sc); sun.intensity = L.si;
  scene.fog.color.set(L.fog); scene.fog.density = L.fd; stars.visible = !!L.stars; sky.visible = true;
  const d = new THREE.Vector3(...L.dir).normalize(); sun.position.set(center[0] + d.x * 200, center[1] + d.y * 200, center[2] + d.z * 200); sun.target.position.set(...center);
  for (const l of pl) l.intensity = 0; return L;
}
export function lamp(i, pos, color = '#ffb35c', intensity = 30, dist = 26) { const l = pl[i]; l.position.set(...pos); l.color.set(color); l.intensity = intensity; l.distance = dist; }

// ---------- textures ----------
const rockTex = canvasTex(512, 512, (c, w, h) => { c.fillStyle = '#8a8478'; c.fillRect(0, 0, w, h); for (let i = 0; i < 260; i++) { const v = 125 + hash(i) * 30 | 0; c.fillStyle = `rgb(${v},${v - 6},${v - 16})`; c.beginPath(); c.roundRect(hash(i * 3) * w, hash(i * 7) * h, 30 + hash(i) * 60, 20 + hash(i + 2) * 40, 10); c.fill(); }  });
rockTex.wrapS = rockTex.wrapT = THREE.RepeatWrapping; rockTex.repeat.set(3, 3);
const grassTex = canvasTex(512, 512, (c, w, h) => { c.fillStyle = '#5aa84a'; c.fillRect(0, 0, w, h); for (let i = 0; i < 2500; i++) { const g = 140 + hash(i) * 60 | 0; c.fillStyle = `rgb(${70 + hash(i + 1) * 30 | 0},${g},${50 + hash(i + 2) * 20 | 0})`; c.fillRect(hash(i * 3) * w, hash(i * 7) * h, 3, 6); } });
grassTex.wrapS = grassTex.wrapT = THREE.RepeatWrapping; grassTex.repeat.set(30, 30);
export const ROCK = plastic('#ffffff', { map: rockTex, rough: 0.8 }), GRASS = plastic('#ffffff', { map: grassTex, rough: 0.85 }), STONE = plastic('#a8a29a', { rough: 0.7 });
export function textTex(text, o = {}) { const w = o.w || 1024, h = o.h || 256; return canvasTex(w, h, (c) => { if (o.bg) { c.fillStyle = o.bg; c.fillRect(0, 0, w, h); } if (o.border) { c.strokeStyle = o.border; c.lineWidth = o.bw || 16; c.strokeRect(10, 10, w - 20, h - 20); } c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `${o.weight || 900} ${o.size || 140}px ${o.font || '"Noto Sans CJK SC", "Noto Serif CJK SC", "DejaVu Sans", sans-serif'}`; const ls = text.split('\n'); ls.forEach((l, i) => { const y = h / 2 + (i - (ls.length - 1) / 2) * (o.size || 140) * 1.12; if (o.stroke) { c.strokeStyle = o.stroke; c.lineWidth = o.sw || 14; c.lineJoin = 'round'; c.strokeText(l, w / 2, y); } c.fillStyle = o.color || '#fff'; c.fillText(l, w / 2, y); }); }); }

// ---------- sea ----------
const seaGeo = new THREE.PlaneGeometry(2400, 2400, 120, 120); const seaBase = seaGeo.attributes.position.array.slice();
export const sea = mesh(seaGeo, plastic('#1f86b0', { rough: 0.12, env: 1.6 }), [0, -0.5, 0], scene, [-PI / 2, 0, 0]); sea.castShadow = false;
export function updateSea(t, amp = 1) { const p = seaGeo.attributes.position; for (let i = 0; i < p.count; i++) { const x = seaBase[i * 3], y = seaBase[i * 3 + 1]; p.setZ(i, amp * (Math.sin(x * 0.05 + t * 1.3) * 0.5 + Math.sin(y * 0.07 + t * 1.7) * 0.4 + Math.sin((x + y) * 0.11 + t * 2.3) * 0.2)); } p.needsUpdate = true; seaGeo.computeVertexNormals(); }

// ---------- props ----------
const LEAF = [P('#3f9a3a'), P('#4fb046'), P('#2f8a3a')], BLOS = P('#ffb0c8'), PEACH = plastic('#ffa07a', { rough: 0.5 }), BARK = P('#7a5236');
export function peachTree(x, y, z, s = 1, parent = scene) {
  const g = group([x, y, z], parent); g.scale.setScalar(s); g.rotation.y = hash(x + z) * 6;
  part(0.7, 3.2, 0.7, BARK, [0, 1.6, 0], 0.15, g); part(0.4, 1.6, 0.4, BARK, [0.6, 3.2, 0], 0.1, g, [0, 0, -0.6]);
  for (let i = 0; i < 5; i++) { const a = i / 5 * PI * 2; mesh(new THREE.SphereGeometry(1.6 + hash(i + x) * 0.5, 12, 8), LEAF[i % 3], [Math.cos(a) * 1.3, 4.3 + hash(i) * 0.8, Math.sin(a) * 1.3], g); }
  mesh(new THREE.SphereGeometry(1.8, 12, 8), LEAF[1], [0, 5.2, 0], g);
  for (let i = 0; i < 14; i++) { const a = hash(i * 3 + x) * PI * 2, r = 2.0 + hash(i) * 0.4; mesh(new THREE.SphereGeometry(0.28, 10, 8), i % 3 ? PEACH : BLOS, [Math.cos(a) * r, 3.6 + hash(i + 5) * 2.4, Math.sin(a) * r], g); }
  return g;
}
export function pineTree(x, y, z, s = 1, parent = scene) { const g = group([x, y, z], parent); g.scale.setScalar(s); g.rotation.y = hash(x * 3 + z) * 6; part(0.6, 2.6, 0.6, BARK, [0, 1.3, 0], 0.1, g); [[3.2, 2.8, 3.0], [2.6, 2.5, 4.8], [1.8, 2.2, 6.4], [1.0, 1.8, 7.8]].forEach(([r, h, y2], i) => mesh(new THREE.ConeGeometry(r, h, 7), LEAF[i % 3 === 0 ? 2 : 0], [0, y2, 0], g)); return g; }
export function cloudPuff(x, y, z, s = 1, parent = scene, m = null) { const g = group([x, y, z], parent); g.scale.setScalar(s); const cm = m || plastic('#ffffff', { rough: 0.9 }); for (let i = 0; i < 7; i++) { const a = i / 7 * PI * 2; mesh(new THREE.SphereGeometry(1.3 + hash(i + x) * 0.8, 14, 10), cm, [Math.cos(a) * 1.8, hash(i) * 0.6, Math.sin(a) * 1.2], g).castShadow = false; } mesh(new THREE.SphereGeometry(2.0, 14, 10), cm, [0, 0.8, 0], g).castShadow = false; return g; }
function karst(x, z, h, r, parent = scene) { const g = group([x, 0, z], parent); const m = mesh(new THREE.CylinderGeometry(r * 0.75, r, h, 9, 4), ROCK, [0, h / 2 - 1, 0], g); m.geometry = m.geometry.clone(); const p = m.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const n = 1 + (hash(i * 1.7 + x) - 0.5) * 0.18; p.setX(i, p.getX(i) * n); p.setZ(i, p.getZ(i) * n); } m.geometry.computeVertexNormals(); mesh(new THREE.SphereGeometry(r * 0.85, 12, 8), GRASS, [0, h - 1, 0], g).scale.y = 0.45; for (let i = 0; i < 3; i++) mesh(new THREE.SphereGeometry(r * 0.35, 10, 6), LEAF[i], [Math.cos(i * 2.1) * r * 0.5, h - 0.4, Math.sin(i * 2.1) * r * 0.5], g); return g; }

// ---------- Flower Fruit Mountain (island at origin, summit plateau y=30) ----------
export const SUMMIT = [0, 30, 0];
export const island = group([0, 0, 0]);
{ // base mound
  const base = mesh(new THREE.CylinderGeometry(70, 110, 30, 28, 6), ROCK, [0, 14.5, 0], island); base.geometry = base.geometry.clone(); const p = base.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const n = 1 + (hash(i * 3.3) - 0.5) * 0.12; p.setX(i, p.getX(i) * n); p.setZ(i, p.getZ(i) * n); } base.geometry.computeVertexNormals();
  const top = mesh(new THREE.CylinderGeometry(70, 70, 0.6, 40), GRASS, [0, 29.9, 0], island); top.castShadow = false;
  // stone path + flat summit rock for egg
  mesh(new THREE.CylinderGeometry(6, 7, 1.4, 16), STONE, [0, 30.3, 0], island);
  for (const [x, z, h, r] of [[-30, -35, 34, 7], [28, -40, 42, 8], [-48, -8, 26, 6], [45, -15, 30, 6], [-15, -55, 48, 9], [10, -62, 38, 7], [55, 20, 24, 6], [-58, 25, 22, 6]]) karst(x, z, h + 30, r, island);
  for (let i = 0; i < 26; i++) { const a = hash(i + 300) * PI * 2, r = 14 + hash(i + 301) * 45; const x = Math.cos(a) * r, z = Math.sin(a) * r; if (Math.hypot(x, z - 0) < 10) continue; if (z > 20 && Math.abs(x) < 20) continue; peachTree(x, 30, z, 0.9 + hash(i) * 0.4, island); }
  // banner stone tablet
  const tab = textTex('花果山', { bg: '#7a6e60', color: '#f4e2b0', size: 200, w: 300, h: 700 });
  const tb = part(2.4, 5.6, 0.8, plastic('#ffffff', { map: tab, rough: 0.7 }), [9, 32.8, 6], 0.1, island, [0, -0.6, 0]);
}
// stone egg on summit
export const egg = group([0, 31, 0]);
const eggTex = canvasTex(512, 512, (c, w, h) => { c.fillStyle = '#b8b2a8'; c.fillRect(0, 0, w, h); for (let i = 0; i < 200; i++) { c.fillStyle = `rgba(80,70,60,${hash(i) * 0.2})`; c.beginPath(); c.arc(hash(i * 3) * w, hash(i * 7) * h, 4 + hash(i) * 14, 0, 7); c.fill(); } });
const crackT = canvasTex(512, 512, (c, w, h) => { c.fillStyle = '#000'; c.fillRect(0, 0, w, h); c.strokeStyle = '#fff'; c.lineCap = 'round'; c.lineJoin = 'round'; for (let i = 0; i < 9; i++) { c.lineWidth = 4 + hash(i) * 6; let x = hash(i * 3 + 1) * w, y = h * 0.45 + (hash(i) - 0.5) * 80; c.beginPath(); c.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (hash(i * 5 + k) - 0.3) * 70; y += (hash(i * 9 + k) - 0.5) * 70; c.lineTo(x, y); } c.stroke(); } c.lineWidth = 8; c.beginPath(); c.moveTo(0, h * 0.5); for (let x = 0; x <= w; x += 32) c.lineTo(x, h * 0.5 + (x / 32 % 2 ? -18 : 18)); c.stroke(); });
export const eggCrackMat = plastic('#ffffff', { map: eggTex, rough: 0.6, emissive: '#ffc85a', ei: 0 }); eggCrackMat.emissiveMap = crackT;
export const eggHalves = [];
for (const s of [0, 1]) { const g = group([0, 0, 0], egg); const geo = new THREE.SphereGeometry(2.2, 32, 24, 0, PI * 2, s ? PI / 2 : 0, PI / 2); const m = mesh(geo, eggCrackMat, [0, 0, 0], g); m.scale.set(1, 1.35, 1); m.material.side = THREE.DoubleSide; eggHalves.push(g); }
egg.position.y = 31 + 2.6;
// cave entrance + waterfall on the island's south cliff
export const FALL = [0, 0, 98]; // base of waterfall (pool)
const waterTex = canvasTex(256, 512, (c, w, h) => { c.fillStyle = 'rgba(220,240,255,0.55)'; c.fillRect(0, 0, w, h); for (let i = 0; i < 160; i++) { c.fillStyle = `rgba(255,255,255,${0.3 + hash(i) * 0.6})`; c.fillRect(hash(i * 3) * w, hash(i * 7) * h, 2 + hash(i) * 4, 30 + hash(i + 4) * 120); } });
waterTex.wrapS = waterTex.wrapT = THREE.RepeatWrapping; waterTex.repeat.set(2, 2);
export const WATER = plastic('#d8f0ff', { map: waterTex, transparent: true, opacity: 0.82, rough: 0.1, emissive: '#8fc8e8', ei: 0.35, side: THREE.DoubleSide });
export const fall = group(FALL);
{ const cliff = part(60, 34, 14, ROCK, [0, 16, -9], 0.5, fall); const curtain = mesh(new THREE.PlaneGeometry(13, 30), WATER, [0, 15, -1.6], fall); curtain.castShadow = false; fall.userData.curtain = curtain;
  const pool = mesh(new THREE.CircleGeometry(18, 32), plastic('#2a9ac0', { rough: 0.08, env: 1.8 }), [0, 0.26, 8], fall, [-PI / 2, 0, 0]); pool.castShadow = false;
  for (let i = 0; i < 18; i++) { const a = PI + hash(i) * PI, r = 14 + hash(i + 3) * 6; mesh(new THREE.DodecahedronGeometry(1.6 + hash(i) * 1.8, 0), STONE, [Math.cos(a) * r * 1.1, 0.5, 8 - Math.sin(a) * r * 0.7], fall); }
  for (const [x, z, s] of [[-14, 16, 1.0], [15, 15, 1.1], [-22, 4, 1.2], [22, 3, 1.0]]) peachTree(x, 0, z, s, fall);
  part(160, 1, 120, GRASS, [0, -0.3, 30], 0.2, fall).castShadow = false;
  for (const x of [-28, -42, 30, 44]) karst(x, -14, 48, 8, fall);
}
export function updateWater(t) { waterTex.offset.y = -t * 1.6; }
// cave interior (separate set) at (200,0,0); mouth faces +z with waterfall curtain
export const CAVE = [200, 0, 0];
export const cave = group(CAVE);
{ const cm = plastic('#6a6a64', { map: rockTex, rough: 0.85 });
  part(40, 1, 40, plastic('#7a7468', { rough: 0.8 }), [0, -0.5, 0], 0.2, cave).castShadow = false;
  part(1, 20, 40, cm, [-18, 10, 0], 0.3, cave); part(1, 20, 40, cm, [18, 10, 0], 0.3, cave); part(40, 20, 1, cm, [0, 10, -18], 0.3, cave); part(40, 1, 40, cm, [0, 19, 0], 0.3, cave);
  part(13, 20, 1, cm, [-12.5, 10, 18], 0.3, cave); part(13, 20, 1, cm, [12.5, 10, 18], 0.3, cave); part(12, 8, 1, cm, [0, 16, 18], 0.3, cave);
  const curtain = mesh(new THREE.PlaneGeometry(12, 12), WATER, [0, 6, 18.4], cave, [0, PI, 0]); curtain.castShadow = false;
  const bright = mesh(new THREE.PlaneGeometry(14, 14), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 2.5, 2.6) }), [0, 6, 19.5], cave, [0, PI, 0]); bright.castShadow = false;
  for (let i = 0; i < 4; i++) part(4.5, 1.2, 2.4, STONE, [-11 + i * 7.3, 0.6, -12], 0.25, cave);
  for (let i = 0; i < 5; i++) mesh(new THREE.CylinderGeometry(0.8, 0.5, 0.6, 14), STONE, [-6 + i * 3, 1.5, -3], cave);
  part(8, 1.4, 3, STONE, [0, 0.7, -3], 0.2, cave); // stone table
  part(3, 4, 2, STONE, [0, 2, -15], 0.4, cave); // throne back
  part(3.2, 1.6, 2.6, STONE, [0, 0.8, -14], 0.3, cave);
  for (let i = 0; i < 9; i++) { const x = -16 + hash(i) * 32; const m = mesh(new THREE.ConeGeometry(0.6 + hash(i + 1) * 0.6, 2 + hash(i + 2) * 3, 6), cm, [x, 18 - hash(i + 3), -14 + hash(i + 4) * 26], cave, [PI, 0, 0]); }
  const pq = textTex('水帘洞', { bg: '#4a3a2a', color: '#ffd77a', size: 170, border: '#c9a24a', bw: 14, w: 760, h: 260 }); const plq = part(7.5, 2.6, 0.3, plastic('#ffffff', { map: pq, rough: 0.5 }), [0, 13, -17.3], 0.1, cave);
}
// ---------- heaven ----------
export const HEAV = [0, 400, -600];
export const heaven = group(HEAV);
{ const CL = plastic('#d6d2e2', { rough: 0.9, emissive: '#fff4e0', ei: 0.03 });
  for (let i = 0; i < 40; i++) { const a = hash(i + 900) * PI * 2, r = 6 + hash(i + 901) * 60; cloudPuff(Math.cos(a) * r, -2 - hash(i) * 3, Math.sin(a) * r, 2.2 + hash(i + 3) * 1.8, heaven, CL); }
  const floor = mesh(new THREE.CylinderGeometry(16, 16, 0.8, 32), plastic('#cfc4b0', { rough: 0.35 }), [0, 0, 0], heaven);
  const RED = P('#b8222a'), GOLD = plastic('#e0b040', { metal: 0.75, rough: 0.28 }), JADE = plastic('#4fb89a', { rough: 0.3 });
  for (let i = 0; i < 6; i++) { const x = -10 + i * 4; mesh(new THREE.CylinderGeometry(0.55, 0.6, 11, 14), RED, [x, 5.9, -9], heaven); }
  part(26, 1.2, 8, GOLD, [0, 11.8, -10], 0.2, heaven); // roof beam
  // curved roof: two slopes + upturned corners
  for (const s of [-1, 1]) part(30, 0.6, 7, plastic('#e8b84a', { metal: 0.5, rough: 0.35 }), [0, 13.6, -10 + s * 2.6], 0.1, heaven, [s * 0.5, 0, 0]);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) part(2.5, 0.6, 1.2, GOLD, [sx * 15.5, 13.2, -10 + sz * 4.2], 0.1, heaven, [0, 0, sx * 0.5]);
  part(20, 0.6, 12, JADE, [0, 0.7, -10], 0.1, heaven);
  // throne
  part(4.2, 1.2, 3.4, GOLD, [0, 1.6, -11], 0.2, heaven); part(4.6, 4.5, 0.8, GOLD, [0, 4, -12.6], 0.3, heaven); part(0.8, 2, 3, GOLD, [-2.3, 2.6, -11], 0.2, heaven); part(0.8, 2, 3, GOLD, [2.3, 2.6, -11], 0.2, heaven);
  const sign = textTex('凌霄宝殿', { bg: '#1a3a6a', color: '#ffd77a', size: 150, border: '#e0b040', bw: 12, w: 900, h: 240 }); part(9, 2.4, 0.3, plastic('#ffffff', { map: sign, rough: 0.4 }), [0, 10.3, -5.3], 0.08, heaven);
  // small tea table
  part(1.8, 0.2, 1.2, P('#6a3a2a'), [2.6, 2.6, -9.4], 0.05, heaven); part(0.25, 1.8, 0.25, P('#6a3a2a'), [2.6, 1.5, -9.4], 0.05, heaven);
}
export const teacup = group([0, 0, 0]); { mesh(new THREE.CylinderGeometry(0.22, 0.16, 0.3, 16), plastic('#f4f8ff', { rough: 0.2 }), [0, 0.15, 0], teacup); mesh(new THREE.CircleGeometry(0.2, 16), plastic('#8a6a20', { rough: 0.1 }), [0, 0.28, 0], teacup, [-PI / 2, 0, 0]); }
// ---------- ocean raft (anywhere at sea; uses sea) ----------
export const raft = group([-300, 0, 300]);
{ for (let i = 0; i < 6; i++) mesh(new THREE.CylinderGeometry(0.45, 0.45, 7, 10), P('#8a6a42'), [-2.5 + i, 0.2, 0], raft, [PI / 2, 0, 0]); part(0.25, 8, 0.25, P('#6a4a2a'), [0, 4.2, -1.5], 0.05, raft); const sail = part(4.5, 4.5, 0.1, P('#e8dcc0'), [0, 5.5, -1.4], 0.04, raft); sail.rotation.y = 0.2; raft.userData.sail = sail; }
// ---------- Subodhi's misty mountain temple at (400,0,400) ----------
export const TEM = [400, 0, 400];
export const temple = group(TEM);
{ part(60, 1, 60, plastic('#c8c0b0', { rough: 0.7 }), [0, -0.5, 0], 0.2, temple).castShadow = false;
  for (let i = -3; i <= 3; i++) for (let k = -3; k <= 3; k++) part(3.8, 0.12, 3.8, plastic(hash(i * 7 + k) > 0.5 ? '#d6cfc0' : '#cbc3b2', { rough: 0.7 }), [i * 4, 0.05, k * 4], 0.05, temple).castShadow = false;
  const RED = P('#a8282a'), ROOF = plastic('#3a4a5a', { rough: 0.5 });
  for (const x of [-9, -3, 3, 9]) mesh(new THREE.CylinderGeometry(0.6, 0.65, 9, 14), RED, [x, 4.5, -14], temple);
  part(24, 3, 8, P('#e8dcc8'), [0, 10.2, -16], 0.1, temple); for (const s of [-1, 1]) part(28, 0.6, 7.5, ROOF, [0, 13, -16 + s * 2.8], 0.1, temple, [s * 0.5, 0, 0]);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) part(2.5, 0.6, 1.2, ROOF, [sx * 14.5, 12.4, -16 + sz * 4.4], 0.1, temple, [0, 0, sx * 0.5]);
  part(22, 9, 1, P('#d8ccb6'), [0, 4.5, -19], 0.1, temple);
  const sign = textTex('斜月三星洞', { bg: '#2a2a2a', color: '#ffd77a', size: 120, w: 900, h: 200 }); part(8, 1.8, 0.3, plastic('#ffffff', { map: sign }), [0, 8.4, -13.6], 0.05, temple);
  part(6, 1, 4, STONE, [0, 0.5, -9], 0.2, temple); // dais
  for (const [x, z, s] of [[-18, -6, 1.3], [18, -4, 1.2], [-22, 10, 1.4], [20, 14, 1.3], [-12, 20, 1.1], [26, -18, 1.4], [-26, -18, 1.3]]) pineTree(x, 0, z, s, temple);
  // stone lantern
  for (const x of [-6, 6]) { part(0.6, 2.4, 0.6, STONE, [x, 1.2, -4], 0.1, temple); const l = part(1.1, 1.1, 1.1, glow('#ffc070', 0), [x, 2.9, -4], 0.15, temple); temple.userData['lan' + x] = l; part(1.6, 0.4, 1.6, STONE, [x, 3.6, -4], 0.1, temple); }
  for (let i = 0; i < 30; i++) { const a = hash(i + 500) * PI * 2, r = 32 + hash(i + 501) * 40; pineTree(Math.cos(a) * r, -2, Math.sin(a) * r, 1.4 + hash(i) * 0.8, temple); }
  for (const [x, z, h, r] of [[-40, -50, 70, 9], [30, -60, 80, 10], [60, -20, 60, 8], [-60, 0, 55, 8]]) karst(x, z, h, r, temple);
}
// ---------- globe for the somersault at (0,0,-3000) ----------
export const GLOBE = [0, 0, -3000];
const earthTex = canvasTex(1024, 512, (c, w, h) => { c.fillStyle = '#1e6fb8'; c.fillRect(0, 0, w, h); c.fillStyle = '#4caf50'; const blobs = [[200, 160, 110, 80], [260, 330, 60, 110], [520, 150, 120, 70], [560, 300, 70, 100], [760, 180, 160, 90], [860, 360, 60, 40], [480, 60, 300, 25]]; for (const [x, y, rx, ry] of blobs) { for (let i = 0; i < 9; i++) { c.beginPath(); c.ellipse(x + (hash(i + x) - 0.5) * rx, y + (hash(i + y) - 0.5) * ry, rx * 0.55, ry * 0.55, hash(i) * 3, 0, 7); c.fill(); } } c.fillStyle = 'rgba(255,255,255,0.9)'; c.fillRect(0, 0, w, 18); c.fillRect(0, h - 22, w, 22); });
export const globe = mesh(new THREE.SphereGeometry(40, 48, 32), plastic('#ffffff', { map: earthTex, rough: 0.6 }), GLOBE);
export const atmo = mesh(new THREE.SphereGeometry(42.5, 48, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.5, 0.8, 1.6), transparent: true, opacity: 0.18, side: THREE.BackSide }), GLOBE); atmo.castShadow = false;
// flying cloud (nimbus) prop
export const nimbus = group([0, 0, 0]); { const nm = plastic('#ffffff', { rough: 0.8, emissive: '#fff2d0', ei: 0.25 }); for (let i = 0; i < 6; i++) mesh(new THREE.SphereGeometry(0.9 + hash(i) * 0.4, 12, 8), nm, [-1.8 + i * 0.7, hash(i + 1) * 0.3, (hash(i + 2) - 0.5) * 0.8], nimbus).castShadow = false; nimbus.visible = false; }
// ---------- particles: mist + petals ----------
const N = 1400; const pg = new THREE.BufferGeometry(); const pp = new Float32Array(N * 3); pg.setAttribute('position', new THREE.BufferAttribute(pp, 3));
const petalTex = canvasTex(64, 64, (c) => { c.fillStyle = '#ffc0d6'; c.beginPath(); c.ellipse(32, 32, 26, 14, 0.6, 0, 7); c.fill(); });
export const petals = new THREE.Points(pg, new THREE.PointsMaterial({ map: petalTex, size: 0.35, transparent: true, depthWrite: false, alphaTest: 0.3 })); petals.frustumCulled = false; scene.add(petals);
export function updatePetals(t, on = true, kind = 'petal') {
  petals.visible = on; if (!on) return; const c = camera.position, R = 22;
  petals.material.map = kind === 'spark' ? null : petalTex; petals.material.color.set(kind === 'spark' ? '#fff3b0' : '#ffffff'); petals.material.size = kind === 'spark' ? 0.12 : 0.35;
  for (let i = 0; i < N; i++) { const bx = hash(i) * 2 * R, by = hash(i + 1e4) * 24, bz = hash(i + 2e4) * 2 * R; let x = bx + Math.sin(t * 0.8 + i) * 1.2 + t * 0.9, y = by - t * 0.7 * (0.6 + hash(i + 5)), z = bz + Math.cos(t * 0.6 + i * 1.3) * 1.0;
    x = ((x - c.x + R) % (2 * R) + 2 * R) % (2 * R) + c.x - R; z = ((z - c.z + R) % (2 * R) + 2 * R) % (2 * R) + c.z - R; y = ((y - c.y + 12) % 24 + 24) % 24 + c.y - 12; pp.set([x, y, z], i * 3); }
  pg.attributes.position.needsUpdate = true;
}
