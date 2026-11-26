// snowy night town + sets
import { THREE, scene, camera, plastic, P, glow, part, mesh, group, canvasTex, makeEnv, setEnvK, clamp, lerp, hash, noise, PI, noShadow } from './core.js';

// ---------- sky ----------
const skyMat = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { top: { value: new THREE.Color('#050b24') }, hor: { value: new THREE.Color('#2a4579') }, glowC: { value: new THREE.Color('#6d8fd0') }, moonDir: { value: new THREE.Vector3(0.3, 0.5, -0.8).normalize() } },
  vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
  fragmentShader: 'uniform vec3 top; uniform vec3 hor; uniform vec3 glowC; uniform vec3 moonDir; varying vec3 vP; void main(){ float h = clamp(vP.y,0.,1.); vec3 c = mix(hor, top, pow(h,0.45)); float m = max(dot(vP, moonDir),0.); c += glowC*(pow(m,12.)*0.5+pow(m,3.)*0.12); gl_FragColor = vec4(c,1.); }' });
export const sky = new THREE.Mesh(new THREE.SphereGeometry(1200, 32, 16), skyMat); sky.userData.noDepth = true; scene.add(sky);
export const stars = (() => { const n = 1800, p = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const th = hash(i) * PI * 2, ph = 0.06 + hash(i + 999) * 1.4; p.set([Math.cos(th) * Math.cos(ph) * 1000, Math.sin(ph) * 1000, Math.sin(th) * Math.cos(ph) * 1000], i * 3); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); const s = new THREE.Points(g, new THREE.PointsMaterial({ color: new THREE.Color(3, 3, 3.4), size: 2.6, sizeAttenuation: false, fog: false, depthWrite: false })); scene.add(s); return s; })();
export const moon = mesh(new THREE.SphereGeometry(38, 32, 20), new THREE.MeshBasicMaterial({ color: new THREE.Color(5.5, 5.4, 5.0), fog: false }), [300, 520, -900]); moon.castShadow = false;
scene.fog = new THREE.FogExp2('#22365f', 0.0085);

// ---------- lights ----------
export const hemi = new THREE.HemisphereLight('#7f9be0', '#c7d6f5', 0.9); scene.add(hemi);
export const moonLight = new THREE.DirectionalLight('#a9c1ff', 1.6); moonLight.castShadow = true; moonLight.shadow.mapSize.set(2048, 2048);
Object.assign(moonLight.shadow.camera, { left: -25, right: 25, top: 25, bottom: -25, near: 1, far: 400 }); moonLight.shadow.bias = -0.0005; moonLight.shadow.normalBias = 0.04; moonLight.shadow.radius = 3;
scene.add(moonLight, moonLight.target);
export const pl = []; for (let i = 0; i < 4; i++) { const l = new THREE.PointLight('#ffb35c', 0, 26, 1.6); scene.add(l); pl.push(l); }
const ENVS = {
  night: makeEnv({ top: '#0a1433', hor: '#3c5a94', bot: '#cfdcf5', lights: [{ p: [12, 10, 8], c: '#ffb35c', i: 6, r: 2 }, { p: [-15, 6, -10], c: '#ffb35c', i: 6, r: 2 }, { p: [10, 30, -30], c: '#e0e8ff', i: 4, r: 6 }] }),
  warm: makeEnv({ top: '#d9b48a', hor: '#a87a55', bot: '#5a4232', lights: [{ p: [0, 20, 5], c: '#fff0d0', i: 5, r: 5 }, { p: [-20, 8, 0], c: '#8fb0ff', i: 3, r: 4 }] }),
};
export const LP = {
  night: { env: 'night', envk: 0.9, hs: '#86a0e6', hg: '#cdd9f6', hi: 0.95, moon: 1.7, mc: '#aec5ff', fog: '#22365f', fd: 0.0085, exp: 1.0, sky: 1 },
  night2: { env: 'night', envk: 0.7, hs: '#5f78c0', hg: '#9fb2df', hi: 0.6, moon: 1.1, mc: '#9cb5ff', fog: '#121f3e', fd: 0.012, exp: 0.95, sky: 1 },
  warm: { env: 'warm', envk: 0.8, hs: '#ffe0bd', hg: '#8a6a52', hi: 1.0, moon: 1.6, mc: '#ffd9a8', fog: '#2a2030', fd: 0.002, exp: 1.0, sky: 0 },
};
export function setLight(name, center = [0, 0, 0], mdir = [-0.35, 0.8, 0.5]) {
  const L = LP[name]; scene.environment = ENVS[L.env]; setEnvK(L.envk);
  hemi.color.set(L.hs); hemi.groundColor.set(L.hg); hemi.intensity = L.hi; moonLight.intensity = L.moon; moonLight.color.set(L.mc);
  scene.fog.color.set(L.fog); scene.fog.density = L.fd; sky.visible = !!L.sky; stars.visible = !!L.sky; moon.visible = !!L.sky;
  const d = new THREE.Vector3(...mdir).normalize(); moonLight.position.set(center[0] + d.x * 150, center[1] + d.y * 150, center[2] + d.z * 150); moonLight.target.position.set(...center);
  for (const l of pl) l.intensity = 0;
  return L;
}
export function lamp(i, pos, color = '#ffb35c', intensity = 30, dist = 26) { const l = pl[i]; l.position.set(...pos); l.color.set(color); l.intensity = intensity; l.distance = dist; }

// ---------- ground ----------
const snowTex = canvasTex(512, 512, (c, w, h) => { c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h); for (let i = 0; i < 3000; i++) { const v = 225 + hash(i) * 30 | 0; c.fillStyle = `rgb(${v - 8},${v - 4},${v})`; c.fillRect(hash(i * 3) * w, hash(i * 7) * h, 3 + hash(i) * 5, 3 + hash(i) * 4); } });
snowTex.wrapS = snowTex.wrapT = THREE.RepeatWrapping; snowTex.repeat.set(70, 70);
export const SNOW = plastic('#ffffff', { map: snowTex, rough: 0.78 });
const gg = new THREE.PlaneGeometry(900, 900, 160, 160); { const p = gg.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); const d = Math.min(1, Math.max(0, (Math.hypot(x, y) - 70) / 120)); p.setZ(i, (noise(x * 0.05, y * 0.03) * 0.5 + noise(y * 0.02, x * 0.04) * 0.5) * 0.35 + d * d * 6 * (0.6 + 0.4 * noise(x * 0.01, y * 0.013))); } gg.computeVertexNormals(); }
export const ground = mesh(gg, SNOW, [0, 0, 0], scene, [-PI / 2, 0, 0]); ground.castShadow = false;
const ROAD = plastic('#3f4556', { rough: 0.5, env: 1.4 });
part(220, 0.1, 12, ROAD, [0, 0.03, 0], 0.03).castShadow = false; // main street along x
part(12, 0.1, 60, ROAD, [0, 0.031, -32], 0.03).castShadow = false; // to hall
for (let x = -105; x < 105; x += 7) { part(3.2, 0.06, 0.32, P('#e8e4c8'), [x, 0.085, 0], 0.02).castShadow = false; }
for (const s of [-1, 1]) for (let x = -105; x < 105; x += 3.1) { const b = mesh(new THREE.SphereGeometry(1, 10, 6), SNOW, [x + hash(x) * 1.5, -0.25, s * (6.6 + hash(x * 3) * 0.6)]); b.scale.set(1.7 + hash(x) * 0.8, 0.75 + hash(x + 1) * 0.35, 1.0); b.castShadow = false; }
// plaza
const plaza = mesh(new THREE.CylinderGeometry(19, 19, 0.16, 48), plastic('#8c96ad', { rough: 0.55 }), [0, 0.05, -20]); plaza.castShadow = false;
mesh(new THREE.CylinderGeometry(17.5, 17.5, 0.18, 48), plastic('#f4f7fc', { rough: 0.8, map: snowTex }), [0, 0.06, -20]).castShadow = false;

// ---------- props ----------
const WIN = glow('#ffc76b', 2.6), WIN2 = glow('#ffd590', 2.0);
const BULBS = ['#ff4a4a', '#4aff7a', '#ffd84a', '#4ab8ff', '#ff6ae0'].map(c => glow(c, 4));
export function pine(x, z, s = 1, parent = scene) {
  const g = group([x, 0, z], parent); g.scale.setScalar(s); g.rotation.y = hash(x * 3 + z) * 6;
  part(0.7, 2.2, 0.7, P('#5b3d2b'), [0, 1.1, 0], 0.1, g);
  const G = [P('#1f5e44'), P('#236b4c'), P('#2a7a55')];
  [[4.2, 3.2, 2.4], [3.4, 2.9, 4.4], [2.5, 2.5, 6.2], [1.5, 2.0, 7.8]].forEach(([r, h, y], i) => { mesh(new THREE.ConeGeometry(r, h, 7), G[i % 3], [0, y, 0], g); const sn = mesh(new THREE.ConeGeometry(r * 0.72, h * 0.42, 7), SNOW, [0, y + h * 0.3, 0], g); sn.castShadow = false; });
  return g;
}
export function streetLamp(x, z, parent = scene) {
  const g = group([x, 0, z], parent); const pm = plastic('#2b2f3a', { rough: 0.35, metal: 0.4 });
  part(0.35, 7.5, 0.35, pm, [0, 3.75, 0], 0.08, g); part(0.7, 0.4, 0.7, pm, [0, 0.2, 0], 0.08, g);
  part(1.2, 0.3, 1.2, pm, [0, 7.7, 0], 0.08, g); const b = part(0.85, 0.9, 0.85, glow('#ffd28a', 5), [0, 7.05, 0], 0.1, g); b.castShadow = false; part(1.0, 0.25, 1.0, SNOW, [0, 7.95, 0], 0.1, g);
  return g;
}
const DOORS = ['#8a3b2e', '#2e5a8a', '#3b7a46', '#7a2e6a'];
export function house(x, z, yaw = 0, o = {}) {
  const g = group([x, 0, z], scene, [0, yaw, 0]); const w = o.w || 12, d = o.d || 10, h = o.h || 7; const wc = P(o.color || '#c9604a'), trim = P('#f2efe8');
  part(w, h, d, wc, [0, h / 2, 0], 0.15, g);
  part(w + 0.4, 0.5, d + 0.4, trim, [0, 0.25, 0], 0.08, g);
  const rc = P(o.roof || '#5a3b46'); const rh = o.rh || 4.5; const sl = Math.hypot(d / 2 + 1, rh);
  const ang = Math.atan2(rh, d / 2 + 1);
  for (const s of [-1, 1]) { const r = part(w + 1.6, 0.5, sl, rc, [0, h + rh / 2, s * (d / 4 + 0.5)], 0.08, g, [s * ang, 0, 0]); const sn = part(w + 1.7, 0.42, sl * 0.98, SNOW, [0, h + rh / 2 + 0.38, s * (d / 4 + 0.5) + s * 0.08], 0.2, g, [s * ang, 0, 0]); }
  // gable fill
  const gs = new THREE.Shape(); gs.moveTo(-d / 2, 0); gs.lineTo(d / 2, 0); gs.lineTo(0, rh); gs.closePath();
  for (const s of [-1, 1]) { const m = mesh(new THREE.ShapeGeometry(gs), wc, [s * (w / 2 - 0.01), h - 0.01, 0], g, [0, s * PI / 2, 0]); m.material = wc; m.material.side = THREE.DoubleSide; }
  // chimney
  part(1.4, 3.5, 1.4, P('#7b4b3f'), [w * 0.28, h + rh * 0.75, -d * 0.18], 0.08, g); part(1.6, 0.4, 1.6, SNOW, [w * 0.28, h + rh * 0.75 + 1.9, -d * 0.18], 0.15, g);
  // door + windows (front = +z)
  part(2.2, 3.6, 0.3, P(o.door || DOORS[Math.floor(hash(x + z) * 4)]), [o.doorX ?? -w * 0.22, 1.8 + 0.4, d / 2 + 0.05], 0.08, g);
  part(0.2, 0.2, 0.2, plastic('#f4c430', { metal: 0.8, rough: 0.2 }), [(o.doorX ?? -w * 0.22) + 0.75, 2.2, d / 2 + 0.25], 0.06, g);
  const wins = o.wins || [[w * 0.18, 3.6], [w * 0.38, 3.6]];
  for (const [wx, wy] of wins) { part(2.2, 2.1, 0.22, trim, [wx, wy, d / 2 + 0.02], 0.06, g); const p = part(1.8, 1.7, 0.2, hash(wx + x) > 0.25 ? WIN : WIN2, [wx, wy, d / 2 + 0.08], 0.04, g); p.castShadow = false; part(0.12, 1.7, 0.24, trim, [wx, wy, d / 2 + 0.1], 0.02, g); part(1.8, 0.12, 0.24, trim, [wx, wy, d / 2 + 0.1], 0.02, g); part(2.6, 0.3, 0.6, SNOW, [wx, wy - 1.15, d / 2 + 0.3], 0.12, g); }
  for (const [wx, wy] of [[-w * 0.3, 3.6], [w * 0.3, 3.6]]) { const p = part(1.6, 1.6, 0.2, WIN2, [wx, wy, -d / 2 - 0.08], 0.04, g); p.castShadow = false; }
  // string lights along front eave
  if (o.lights !== false) for (let i = 0; i <= 14; i++) { const u = i / 14; const bx = -w / 2 - 0.6 + u * (w + 1.2); const by = h + 0.15 - Math.sin(u * PI * 3) ** 2 * 0.45; const b = mesh(new THREE.SphereGeometry(0.17, 8, 6), BULBS[i % 5], [bx, by, d / 2 + 0.9], g); b.castShadow = false; }
  return g;
}
export function textTex(text, o = {}) {
  const w = o.w || 1024, h = o.h || 256;
  return canvasTex(w, h, (c) => {
    if (o.bg) { c.fillStyle = o.bg; c.fillRect(0, 0, w, h); }
    if (o.border) { c.strokeStyle = o.border; c.lineWidth = o.bw || 16; c.strokeRect(10, 10, w - 20, h - 20); }
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `${o.weight || 900} ${o.size || 140}px ${o.font || '"DejaVu Sans", Arial'}`;
    const ls = text.split('\n'); ls.forEach((l, i) => { const y = h / 2 + (i - (ls.length - 1) / 2) * (o.size || 140) * 1.12; if (o.stroke) { c.strokeStyle = o.stroke; c.lineWidth = o.sw || 14; c.lineJoin = 'round'; c.strokeText(l, w / 2, y); } c.fillStyle = o.color || '#fff'; c.fillText(l, w / 2, y); });
  });
}

// ---------- town layout ----------
// main street along x (z=0). houses north side z=-14 (facing +z), south side z=+14 (facing -z)
const COLS = ['#c9604a', '#5f8fc4', '#e2b04a', '#6aa36f', '#b06ab3', '#d98a55', '#e6e1d3', '#4f9a9a'];
export const HOUSES = [];
let hi = 0;
for (let x = -96; x <= 96; x += 17) { if (Math.abs(x) < 25) continue; HOUSES.push(house(x, -14, 0, { color: COLS[hi % 8], w: 12 + hash(hi) * 2 })); hi++; HOUSES.push(house(x + 6, 14, PI, { color: COLS[(hi + 3) % 8], w: 12 + hash(hi + 9) * 2 })); hi++; }
// Henderson's house (left of plaza)
export const henHouse = house(-24, -38, 0, { color: '#5f8fc4', roof: '#3a3f5a', w: 13 });
export const HEN = [-24, 0, -28];
house(30, 24, PI, { color: '#e2b04a' }); house(-30, 24, PI, { color: '#6aa36f' });
for (let x = -100; x <= 100; x += 14) { streetLamp(x, -7.6); streetLamp(x + 7, 7.6); }
// forest ring
for (let i = 0; i < 260; i++) { const a = hash(i) * PI * 2, r = 70 + hash(i + 50) * 120; const x = Math.cos(a) * r, z = Math.sin(a) * r - 20; if (Math.abs(z) < 26 && Math.abs(x) < 110) continue; pine(x, z, 0.9 + hash(i + 3) * 0.9); }
for (const [x, z, s] of [[-18, -42, 1.1], [16, -44, 1.3], [-24, -8.5, 0.8], [22, -9, 0.75], [-12, -45, 0.9], [10, -47, 1.0], [40, -10, 0.9], [-45, -8.8, 0.85]]) pine(x, z, s);
// plaza banner arch
export const arch = group([0, 0, -6.5]);
{ const pm = plastic('#2b2f3a', { rough: 0.35, metal: 0.4 }); part(0.5, 9, 0.5, pm, [-7.5, 4.5, 0], 0.1, arch); part(0.5, 9, 0.5, pm, [7.5, 4.5, 0], 0.1, arch);
  const bt = textTex('NOVEMBER 2026', { bg: '#b8202a', color: '#ffffff', size: 150, border: '#ffd35c', bw: 18, w: 1400, h: 260 });
  const b = mesh(new THREE.BoxGeometry(14, 2.4, 0.2), [P('#b8202a'), P('#b8202a'), P('#b8202a'), P('#b8202a'), plastic('#ffffff', { map: bt, emissive: '#ffffff', emissiveMap: bt, ei: 0.35 }), plastic('#ffffff', { map: bt, emissive: '#ffffff', emissiveMap: bt, ei: 0.35 })], [0, 7.6, 0], arch); b.rotation.y = 0; arch.userData.banner = b;
  part(14.4, 0.4, 0.5, SNOW, [0, 8.95, 0], 0.15, arch); }
// city hall at north end of plaza
export const hall = group([28, 0, -40]);
{ const st = P('#d9d3c4'), st2 = P('#bfb8a8'); part(26, 12, 12, st, [0, 6, 0], 0.15, hall); part(28, 1.2, 14, st2, [0, 12.4, 0], 0.1, hall); part(28.4, 0.6, 14.4, SNOW, [0, 13.2, 0], 0.15, hall);
  for (let i = 0; i < 4; i++) part(26 - i * 0.5, 0.5, 2.0, st2, [0, 0.25 + i * 0.5, 7 + 1.6 * (3 - i) - 1.2], 0.05, hall);
  for (let i = -3; i <= 3; i++) { mesh(new THREE.CylinderGeometry(0.65, 0.7, 10, 16), P('#efeadf'), [i * 3.5, 7, 6.6], hall); }
  const tt = textTex('CITY HALL', { color: '#3a3428', size: 120, w: 1024, h: 200 }); const t = mesh(new THREE.PlaneGeometry(10, 2), plastic('#d9d3c4', { map: tt }), [0, 11.1, 6.05], hall); t.castShadow = false;
  for (const x of [-9, -5, 5, 9]) { const p = part(2, 3.2, 0.2, WIN, [x, 5, 6.05], 0.05, hall); p.castShadow = false; }
  const dr = part(3.4, 5, 0.3, P('#5a3424'), [0, 2.5 + 2, 6.05], 0.05, hall); }
export const HALL = [28, 0, -27.6]; // mayor spot
export const podium = group([HALL[0], 0, HALL[2] + 1.7]);
{ part(2.6, 3.4, 1.4, P('#5a3424'), [0, 1.7, 0], 0.1, podium); part(3.0, 0.3, 1.8, P('#6e4430'), [0, 3.5, 0], 0.08, podium); const seal = mesh(new THREE.CircleGeometry(0.75, 24), plastic('#f4c430', { metal: 0.7, rough: 0.25 }), [0, 2.0, 0.71], podium); part(0.08, 1.4, 0.08, plastic('#222', { metal: 0.6 }), [0.5, 4.2, -0.3], 0.03, podium, [-0.5, 0, 0]); mesh(new THREE.SphereGeometry(0.18, 10, 8), plastic('#111', { metal: 0.5, rough: 0.3 }), [0.5, 4.85, 0.05], podium); }
export const easel = group([HALL[0] + 5.5, 0, HALL[2] + 1.2], scene, [0, -0.35, 0]);
{ const chart = canvasTex(512, 400, (c, w, h) => { c.fillStyle = '#fff'; c.fillRect(0, 0, w, h); c.fillStyle = '#222'; c.font = '900 56px "DejaVu Sans"'; c.textAlign = 'center'; c.fillText('THE ECONOMY', w / 2, 70); c.strokeStyle = '#ddd'; c.lineWidth = 3; for (let y = 120; y < 380; y += 50) { c.beginPath(); c.moveTo(40, y); c.lineTo(w - 30, y); c.stroke(); } c.strokeStyle = '#e02b2b'; c.lineWidth = 16; c.lineJoin = 'round'; c.beginPath(); c.moveTo(50, 150); c.lineTo(150, 210); c.lineTo(230, 170); c.lineTo(330, 290); c.lineTo(450, 360); c.stroke(); c.fillStyle = '#e02b2b'; c.beginPath(); c.moveTo(475, 375); c.lineTo(420, 370); c.lineTo(462, 330); c.fill(); c.font = '900 40px "DejaVu Sans"'; c.fillStyle = '#1f6fd0'; c.fillText('BEAR = ???', 330, 160); });
  part(0.15, 6, 0.15, P('#6e4430'), [-1.4, 3, 0], 0.03, easel, [0, 0, 0.1]); part(0.15, 6, 0.15, P('#6e4430'), [1.4, 3, 0], 0.03, easel, [0, 0, -0.1]); part(0.15, 5.5, 0.15, P('#6e4430'), [0, 2.75, -0.9], 0.03, easel, [0.3, 0, 0]);
  part(3.6, 2.9, 0.12, plastic('#ffffff', { map: chart }), [0, 4.2, 0.12], 0.02, easel); }

// ---------- forest clearing (the meme photo) at z=-200 ----------
export const CLEAR = [0, 0, -210];
for (let i = 0; i < 90; i++) { const a = hash(i + 700) * PI * 2, r = 12 + hash(i + 800) * 30; pine(CLEAR[0] + Math.cos(a) * r, CLEAR[2] + Math.sin(a) * r - 6, 1.0 + hash(i) * 0.8); }

// ---------- classroom at (300,0,0) ----------
export const CLS = [300, 0, 0];
export const room = group(CLS);
export const slideTex = canvasTex(1024, 576, () => {});
export function drawSlide(n) {
  const c = slideTex.userData.ctx, w = 1024, h = 576; c.fillStyle = '#f7f9ff'; c.fillRect(0, 0, w, h); c.fillStyle = '#2a4cc9'; c.fillRect(0, 0, w, 120);
  c.fillStyle = '#fff'; c.font = '900 64px "DejaVu Sans"'; c.textAlign = 'left'; c.fillText(n <= 1 ? 'THE BEAR: A THEORY' : n < 20 ? 'WHY IS HE A BEAR?' : n < 39 ? 'NOVEMBER = ???' : 'CONCLUSION:', 40, 84);
  c.fillStyle = '#222'; c.font = '700 40px "DejaVu Sans"';
  const L = n <= 1 ? ['• What is a bear', '• What is November', '• What is a meme', '• (37 more slides)'] : n < 20 ? ['• bears are white', '• memes are also white?', '• see slide 41', '• graph →'] : n < 39 ? ['• Nov + bear = ?', '• ? = bear²', '• trust me'] : ['• I also do not', '   understand it.'];
  L.forEach((l, i) => c.fillText(l, 60, 200 + i * 70));
  if (n > 1 && n < 39) { c.strokeStyle = '#e02b2b'; c.lineWidth = 10; c.beginPath(); c.moveTo(640, 480); for (let i = 0; i < 8; i++) c.lineTo(660 + i * 42, 480 - hash(n * 9 + i) * 300); c.stroke(); }
  c.fillStyle = '#888'; c.font = '700 36px "DejaVu Sans"'; c.textAlign = 'right'; c.fillText(`${n}/40`, w - 30, h - 24);
  slideTex.needsUpdate = true;
}
drawSlide(1);
{ const wall = P('#e9d9b9'), wall2 = P('#d6c39e'), floor = plastic('#a8794f', { rough: 0.5 });
  part(36, 0.4, 30, floor, [0, -0.2, 0], 0.02, room).castShadow = false;
  part(36, 16, 0.5, wall, [0, 8, -12], 0.02, room); part(0.5, 16, 30, wall2, [-16, 8, 0], 0.02, room); part(0.5, 16, 30, wall2, [16, 8, 0], 0.02, room); part(36, 0.5, 30, P('#f2ead8'), [0, 16, 0], 0.02, room);
  part(36, 1.0, 0.6, P('#8a5a3c'), [0, 0.5, -11.7], 0.02, room);
  // screen
  part(13, 7.6, 0.25, P('#222'), [0, 8.3, -11.6], 0.06, room); const sc = mesh(new THREE.PlaneGeometry(12.4, 7.0), new THREE.MeshBasicMaterial({ map: slideTex, color: new THREE.Color(1.6, 1.6, 1.6) }), [0, 8.3, -11.43], room); sc.castShadow = false;
  // window with night outside
  const win = mesh(new THREE.PlaneGeometry(9, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color('#2b4a88').multiplyScalar(1.3) }), [15.7, 8, -1], room, [0, -PI / 2, 0]); win.castShadow = false;
  part(0.3, 6.4, 0.35, P('#fff'), [15.6, 8, -1], 0.04, room); part(0.3, 0.35, 9.3, P('#fff'), [15.6, 8, -1], 0.04, room);
  // desks
  for (let r = 0; r < 3; r++) for (let k = -1; k <= 1; k++) { const dx = k * 7.5, dz = -1 + r * 7; part(4.4, 0.3, 2.8, P('#c48a52'), [dx, 3.1, dz], 0.08, room); for (const [a, b] of [[-1.9, -1.1], [1.9, -1.1], [-1.9, 1.1], [1.9, 1.1]]) part(0.22, 3, 0.22, P('#555b66'), [dx + a, 1.5, dz + b], 0.04, room); part(2.2, 0.25, 2.0, P('#3f74c9'), [dx, 1.75, dz + 2.3], 0.06, room); }
  // clock
  mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.2, 24), P('#ffffff'), [-9, 12.6, -11.7], room, [PI / 2, 0, 0]);
  part(2.6, 3.4, 0.12, plastic('#ffffff', { map: textTex('NOV\n2026', { bg: '#ffffff', color: '#c42020', size: 120, w: 512, h: 640 }) }), [10, 9.5, -11.7], 0.03, room);
}
// ---------- living room at (400,0,0) ----------
export const LIV = [400, 0, 0];
export const liv = group(LIV);
{ const wall = P('#9fb7a8'), floor = plastic('#7a5236', { rough: 0.45 });
  part(32, 0.4, 28, floor, [0, -0.2, 0], 0.02, liv).castShadow = false; part(14, 0.08, 9, P('#b4434a'), [0, 0.03, 2], 0.02, liv).castShadow = false;
  part(23, 16, 0.5, wall, [-4.5, 8, -10], 0.02, liv); part(2, 16, 0.5, wall, [13, 8, -10], 0.02, liv); part(6, 5.5, 0.5, wall, [9, 2.75, -10], 0.02, liv); part(6, 5.5, 0.5, wall, [9, 13.25, -10], 0.02, liv); part(0.5, 16, 28, P('#93ab9c'), [-14, 8, 0], 0.02, liv); part(0.5, 16, 28, P('#93ab9c'), [14, 8, 0], 0.02, liv); part(32, 0.5, 28, P('#efe8dc'), [0, 15, 0], 0.02, liv);
  // couch facing +z (TV at +z side... we face couch to -z wall? ) couch against back wall facing +z
  const cm = P('#4a5a8a'); part(10, 1.6, 3.6, cm, [0, 1.6, -7.3], 0.4, liv); part(10, 3.2, 1.2, cm, [0, 3.0, -8.9], 0.45, liv); part(1.3, 2.6, 3.8, cm, [-5.3, 2.0, -7.4], 0.45, liv); part(1.3, 2.6, 3.8, cm, [5.3, 2.0, -7.4], 0.45, liv);
  for (const x of [-2.4, 2.4]) part(4.6, 0.9, 3.2, P('#5b6c9e'), [x, 2.7, -7.1], 0.4, liv);
  // window on back wall right of couch with night outside
  const win = mesh(new THREE.PlaneGeometry(6, 5), plastic('#a8c8ff', { transparent: true, opacity: 0.12, rough: 0.05, env: 2 }), [9, 8, -9.72], liv); win.castShadow = false; win.userData.noDepth = true; liv.userData.win = win; part(6.2, 10.6, 0.4, P('#9fb7a8'), [9, 0.1, -10], 0.02, liv).visible = false;
  part(6.6, 0.35, 0.5, P('#fff'), [9, 10.6, -9.6], 0.05, liv); part(6.6, 0.35, 0.5, P('#fff'), [9, 5.4, -9.6], 0.05, liv); part(0.35, 5.6, 0.5, P('#fff'), [5.9, 8, -9.6], 0.05, liv); part(0.35, 5.6, 0.5, P('#fff'), [12.1, 8, -9.6], 0.05, liv); part(0.2, 5.0, 0.3, P('#fff'), [9, 8, -9.6], 0.03, liv);
  // lamp + plant + frame
  part(0.2, 6, 0.2, plastic('#c9a24a', { metal: 0.6 }), [-8, 3, -8], 0.05, liv); const sh = mesh(new THREE.CylinderGeometry(0.9, 1.4, 1.6, 16, 1, true), glow('#ffdca0', 1.6), [-8, 6.5, -8], liv); sh.castShadow = false;
  part(4, 3, 0.15, plastic('#ffffff', { map: textTex('HOME', { bg: '#f2d6a0', color: '#7a4a2a', size: 150, w: 512, h: 384 }) }), [-3, 8.5, -9.7], 0.04, liv);
  // TV in front (z=+9) facing couch
  part(8, 4.6, 0.4, P('#111'), [0, 5.0, 10], 0.1, liv); const tv = mesh(new THREE.PlaneGeometry(7.5, 4.1), new THREE.MeshBasicMaterial({ color: new THREE.Color('#5aa0ff').multiplyScalar(1.4) }), [0, 5.0, 9.78], liv, [0, PI, 0]); tv.castShadow = false;
  part(9, 2.4, 2, P('#6e4a30'), [0, 1.2, 10.2], 0.1, liv);
}
// outside the living room window: little snow + where the bear peeks
export const LIVOUT = [LIV[0] + 9, 0, LIV[2] - 14];
{ for (let i = 0; i < 14; i++) pine(LIV[0] - 10 + i * 4, LIV[2] - 30 - hash(i) * 10, 1.2); part(60, 0.4, 30, SNOW, [LIV[0], -0.1, LIV[2] - 28], 0.1).castShadow = false; }

// ---------- snow particles ----------
const SN = 3200; const snowGeo = new THREE.BufferGeometry(); const snowPos = new Float32Array(SN * 3); snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPos, 3));
const flake = canvasTex(64, 64, (c) => { const g = c.createRadialGradient(32, 32, 0, 32, 32, 30); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.45, 'rgba(255,255,255,0.75)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 64); });
export const snow = new THREE.Points(snowGeo, new THREE.PointsMaterial({ map: flake, size: 0.15, transparent: true, depthWrite: false, color: new THREE.Color(1.6, 1.7, 1.9) })); snow.frustumCulled = false; scene.add(snow);
export function updateSnow(t, on = true, speed = 1, wind = 0.4) {
  snow.visible = on; if (!on) return; const c = camera.position, R = 26;
  for (let i = 0; i < SN; i++) { const bx = hash(i) * 2 * R, by = hash(i + 1e4) * 26, bz = hash(i + 2e4) * 2 * R;
    let x = bx + Math.sin(t * 0.8 + i) * 0.7 + t * wind * speed, y = by - t * 1.6 * speed * (0.7 + hash(i + 5) * 0.6), z = bz + Math.cos(t * 0.6 + i * 1.3) * 0.7;
    x = ((x - c.x + R) % (2 * R) + 2 * R) % (2 * R) + c.x - R; z = ((z - c.z + R) % (2 * R) + 2 * R) % (2 * R) + c.z - R; y = ((y - c.y + 13) % 26 + 26) % 26 + c.y - 13;
    snowPos.set([x, y, z], i * 3); }
  snowGeo.attributes.position.needsUpdate = true;
}
