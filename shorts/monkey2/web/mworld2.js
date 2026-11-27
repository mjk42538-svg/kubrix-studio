// Part 2 sets: demon lair, dragon palace (underwater), underworld
import { THREE, scene, plastic, P, glow, part, mesh, group, canvasTex, makeEnv, clamp, lerp, hash, PI } from './core.js';
import { ROCK, STONE, textTex, cloudPuff } from './mworld.js';

// ---------- weapons / props ----------
export function staff(len = 9, parent = scene) { const g = group([0, 0, 0], parent); const gold = plastic('#e0a83a', { metal: 0.85, rough: 0.22 }), iron = plastic('#2a2426', { metal: 0.6, rough: 0.35 });
  mesh(new THREE.CylinderGeometry(0.16, 0.16, len * 0.78, 14), iron, [0, 0, 0], g); for (const s of [-1, 1]) { mesh(new THREE.CylinderGeometry(0.2, 0.2, len * 0.11, 14), gold, [0, s * len * 0.445, 0], g); for (let i = 0; i < 3; i++) mesh(new THREE.TorusGeometry(0.2, 0.035, 6, 16), gold, [0, s * (len * 0.37 - i * 0.12), 0], g, [PI / 2, 0, 0]); } return g; }
export function sword(len = 4, col = '#c9ced8', parent = scene) { const g = group([0, 0, 0], parent); part(0.14, len, 0.45, plastic(col, { metal: 0.9, rough: 0.2 }), [0, len / 2 + 0.6, 0], 0.03, g); part(0.3, 0.2, 1.3, plastic('#d4a017', { metal: 0.8, rough: 0.3 }), [0, 0.55, 0], 0.04, g); part(0.22, 1.0, 0.22, P('#3a2018'), [0, 0, 0], 0.06, g); return g; }
export function spear(len = 7, parent = scene) { const g = group([0, 0, 0], parent); mesh(new THREE.CylinderGeometry(0.09, 0.09, len, 8), P('#6a4a2a'), [0, len / 2, 0], g); mesh(new THREE.ConeGeometry(0.22, 0.9, 6), plastic('#c9ced8', { metal: 0.9, rough: 0.2 }), [0, len + 0.4, 0], g); mesh(new THREE.ConeGeometry(0.3, 0.4, 8), P('#c42b2b'), [0, len - 0.2, 0], g, [PI, 0, 0]); return g; }
export function halberd(len = 9, parent = scene) { const g = spear(len, parent); part(1.4, 0.9, 0.08, plastic('#c9ced8', { metal: 0.9, rough: 0.2 }), [0.55, len - 0.6, 0], 0.02, g); return g; }
export function chain(n = 10, parent = scene) { const g = group([0, 0, 0], parent); const m = plastic('#8a8a92', { metal: 0.8, rough: 0.3 }); for (let i = 0; i < n; i++) mesh(new THREE.TorusGeometry(0.16, 0.05, 6, 12), m, [0, -i * 0.26, 0], g, [0, i % 2 ? PI / 2 : 0, 0]); return g; }
// ---------- demon lair at (-200,0,0) ----------
export const LAIR = [-200, 0, 0]; export const lair = group(LAIR);
{ const dark = plastic('#3a3040', { rough: 0.85 }); part(40, 1, 40, dark, [0, -0.5, 0], 0.2, lair).castShadow = false;
  for (let i = 0; i < 14; i++) { const a = i / 14 * PI * 2, r = 16 + hash(i) * 3; mesh(new THREE.ConeGeometry(2.5 + hash(i + 2) * 2, 10 + hash(i + 4) * 12, 6), dark, [Math.cos(a) * r, 5, Math.sin(a) * r - 4], lair); }
  part(30, 18, 1, dark, [0, 9, -16], 0.5, lair);
  // cages
  const bar = plastic('#5a5048', { metal: 0.6, rough: 0.4 }); lair.userData.cages = [];
  for (let c = 0; c < 3; c++) { const g = group([-8 + c * 8, 0, -9], lair); part(5, 0.4, 5, bar, [0, 0.2, 0], 0.05, g); part(5, 0.4, 5, bar, [0, 5.2, 0], 0.05, g); for (let i = 0; i < 6; i++) for (const s of [-1, 1]) { part(0.15, 5, 0.15, bar, [-2.3 + i * 0.92, 2.7, s * 2.4], 0.03, g); part(0.15, 5, 0.15, bar, [s * 2.4, 2.7, -2.3 + i * 0.92], 0.03, g); } lair.userData.cages.push(g); }
  for (const x of [-12, 12]) { part(0.5, 4, 0.5, P('#3a2a20'), [x, 2, 2], 0.05, lair); const f = part(1, 1.2, 1, glow('#ff7a2a', 4), [x, 4.4, 2], 0.3, lair); f.castShadow = false; }
}
// ---------- dragon palace, underwater at (0,-300,700) ----------
export const DRG = [0, -300, 700]; export const dragon = group(DRG);
const causTex = canvasTex(512, 512, (c, w, h) => { c.fillStyle = '#000'; c.fillRect(0, 0, w, h); c.strokeStyle = 'rgba(200,255,255,0.8)'; c.lineWidth = 5; for (let i = 0; i < 70; i++) { c.beginPath(); const x = hash(i) * w, y = hash(i + 9) * h; c.ellipse(x, y, 20 + hash(i + 3) * 40, 14 + hash(i + 5) * 30, hash(i) * 3, 0, 7); c.stroke(); } }, false);
causTex.wrapS = causTex.wrapT = THREE.RepeatWrapping; causTex.repeat.set(8, 8);
export const SAND = plastic('#d8c890', { rough: 0.9, emissive: '#bff8ff', ei: 0.5 }); SAND.emissiveMap = causTex;
export function updateCaustics(t) { causTex.offset.set(Math.sin(t * 0.3) * 0.2, t * 0.05); }
{ part(160, 1, 160, SAND, [0, -0.5, 0], 0.2, dragon).castShadow = false;
  const CORAL = ['#ff6a8a', '#ff9a4a', '#c86aff', '#4ad8c8'].map(c => plastic(c, { rough: 0.6, emissive: c, ei: 0.15 }));
  for (let i = 0; i < 60; i++) { const a = hash(i + 40) * PI * 2, r = 14 + hash(i + 41) * 50; const g = group([Math.cos(a) * r, 0, Math.sin(a) * r], dragon); for (let k = 0; k < 4; k++) mesh(new THREE.CylinderGeometry(0.2, 0.35, 2 + hash(i * 3 + k) * 3, 6), CORAL[i % 4], [(hash(i + k) - 0.5) * 1.5, 1.2, (hash(i + k + 7) - 0.5) * 1.5], g, [(hash(k + i) - 0.5) * 0.8, 0, (hash(k + i + 2) - 0.5) * 0.8]); }
  dragon.userData.weed = []; for (let i = 0; i < 40; i++) { const a = hash(i + 80) * PI * 2, r = 10 + hash(i + 81) * 40; const g = group([Math.cos(a) * r, 0, Math.sin(a) * r], dragon); part(0.4, 5 + hash(i) * 4, 0.12, plastic('#2f9a5a', { rough: 0.6 }), [0, 3, 0], 0.05, g); dragon.userData.weed.push(g); }
  const JADE = plastic('#3fb8a8', { rough: 0.25, metal: 0.2 }), GOLD = plastic('#e0b040', { metal: 0.8, rough: 0.25 }), CRYS = plastic('#9ff0ff', { rough: 0.05, emissive: '#5ad8ff', ei: 0.6, transparent: true, opacity: 0.85 });
  for (let i = 0; i < 6; i++) { const x = -12.5 + i * 5; mesh(new THREE.CylinderGeometry(0.7, 0.8, 12, 6), CRYS, [x, 6, -12], dragon); }
  part(32, 1.2, 9, GOLD, [0, 12.6, -13], 0.2, dragon); for (const s of [-1, 1]) part(36, 0.6, 7.5, JADE, [0, 14.4, -13 + s * 2.8], 0.1, dragon, [s * 0.5, 0, 0]);
  part(30, 12, 1, plastic('#2a6a8a', { rough: 0.4 }), [0, 6, -17], 0.1, dragon); part(22, 0.6, 12, JADE, [0, 0.3, -11], 0.1, dragon);
  part(4.2, 1.2, 3.4, GOLD, [0, 1.6, -13], 0.2, dragon); part(4.6, 4.5, 0.8, GOLD, [0, 4, -14.6], 0.3, dragon);
  const sign = textTex('水晶宫', { bg: '#1a3a6a', color: '#ffd77a', size: 160, border: '#e0b040', bw: 12, w: 700, h: 240 }); part(8, 2.6, 0.3, plastic('#ffffff', { map: sign }), [0, 11, -11.6], 0.06, dragon);
  // weapon rack
  const rk = group([10, 0, -6], dragon, [0, -0.6, 0]); part(7, 0.3, 1, P('#6a3a2a'), [0, 4.5, 0], 0.05, rk); part(0.3, 5, 0.3, P('#6a3a2a'), [-3.3, 2.5, 0], 0.05, rk); part(0.3, 5, 0.3, P('#6a3a2a'), [3.3, 2.5, 0], 0.05, rk);
  for (let i = 0; i < 5; i++) { const s = i % 2 ? spear(5.5, rk) : sword(3, '#c9ced8', rk); s.position.set(-2.4 + i * 1.2, 0.4, 0.3); }
}
// the pillar (sea-stabilizing iron), in a trench at DRG + (0,0,30)
export const PIL = [DRG[0], DRG[1], DRG[2] + 34];
export const pillar = group(PIL);
export const pillarStaff = staff(40, pillar); pillarStaff.position.y = 20;
export const pillarGlow = mesh(new THREE.CylinderGeometry(1.4, 1.4, 44, 16, 1, true), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 2.2, 0.8), transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }), [0, 20, 0], pillar); pillarGlow.castShadow = false;
{ for (let i = 0; i < 16; i++) { const a = i / 16 * PI * 2; mesh(new THREE.DodecahedronGeometry(2 + hash(i) * 2, 0), ROCK, [Math.cos(a) * 7, 0.5, Math.sin(a) * 7], pillar); } }
// ---------- underworld at (0,0,-900) ----------
export const UW = [0, 0, -900]; export const under = group(UW);
{ const wall = plastic('#3a1a1e', { rough: 0.8 }), flr = plastic('#2a1418', { rough: 0.5, env: 1.5 });
  part(60, 1, 60, flr, [0, -0.5, 0], 0.1, under).castShadow = false; part(60, 24, 1, wall, [0, 12, -22], 0.1, under);
  for (let i = 0; i < 10; i++) { const x = -18 + i * 4; mesh(new THREE.CylinderGeometry(0.6, 0.7, 14, 10), P('#5a1a1e'), [x, 7, -18], under); }
  under.userData.desks = []; for (let i = 0; i < 10; i++) { const s = i < 5 ? -1 : 1, k = i % 5; const pos = [s * (8 + k * 0.5), 0, -14 + k * 5.5]; const d = group(pos, under, [0, -s * PI / 2, 0]); part(4, 2.4, 2, P('#4a2a1e'), [0, 1.2, 0], 0.1, d); part(4.2, 0.2, 2.2, P('#2a1810'), [0, 2.5, 0], 0.05, d); under.userData.desks.push({ pos, yaw: -s * PI / 2 }); }
  for (const x of [-14, 14]) for (const z of [-16, -4, 8]) { part(0.5, 5, 0.5, P('#2a1a14'), [x * 1.4, 2.5, z], 0.05, under); const f = part(0.9, 1.1, 0.9, glow('#6affb0', 4), [x * 1.4, 5.4, z], 0.3, under); f.castShadow = false; }
  // book stand
  part(2.6, 3.4, 1.6, P('#3a2014'), [0, 1.7, -6], 0.1, under);
}
export const bookTex = canvasTex(1024, 640, () => {});
export function drawBook(crossed = 0, highlight = false) { const c = bookTex.userData.ctx, w = 1024, h = 640; c.fillStyle = '#f2e6c8'; c.fillRect(0, 0, w, h); c.fillStyle = '#8a6a40'; c.fillRect(w / 2 - 4, 0, 8, h);
  c.fillStyle = '#2a1a10'; c.font = '700 34px "DejaVu Serif", serif'; c.textAlign = 'left';
  const L = ['Tiger ............ 61 yrs', 'Crane .......... 900 yrs', 'Fox ................ 30 yrs', 'Turtle ....... 1000 yrs', 'Monkey #1 .... 88 yrs', 'Monkey #2 .... 91 yrs'];
  L.forEach((l, i) => c.fillText(l, 40, 70 + i * 90));
  if (highlight) { c.fillStyle = 'rgba(255,220,80,0.6)'; c.fillRect(540, 150, 460, 200); }
  c.fillStyle = '#2a1a10'; c.font = '800 54px "DejaVu Serif", serif'; c.fillText('SUN WUKONG', 560, 215); c.fillStyle = '#b8222a'; c.font = '800 46px "DejaVu Serif", serif'; c.fillText('dies: TONIGHT', 575, 305);
  c.fillStyle = '#2a1a10'; c.font = '700 34px "DejaVu Serif", serif'; c.fillText('Monkey #3 .... 77 yrs', 560, 450); c.fillText('Monkey #4 .... 80 yrs', 560, 530);
  c.strokeStyle = '#b8222a'; c.lineWidth = 16; c.lineCap = 'round';
  const k1 = clamp(crossed); if (k1 > 0) { c.beginPath(); c.moveTo(545, 200); c.lineTo(545 + 450 * k1, 230 + 40 * k1); c.stroke(); c.beginPath(); c.moveTo(560, 290); c.lineTo(560 + 420 * clamp(k1 * 1.5 - 0.5), 290); c.stroke(); }
  const k2 = clamp(crossed - 1); if (k2 > 0) { for (const [x, y] of [[30, 430], [30, 520], [550, 440], [550, 520]]) { c.beginPath(); c.moveTo(x, y); c.lineTo(x + 440 * k2, y - 6); c.stroke(); } }
  bookTex.needsUpdate = true; }
drawBook(0);
export const book = group([UW[0], 3.6, UW[2] - 6]); { part(4.4, 0.3, 2.8, P('#5a1a1e'), [0, 0, 0], 0.06, book); mesh(new THREE.PlaneGeometry(4.2, 2.6), plastic('#ffffff', { map: bookTex, rough: 0.8 }), [0, 0.17, 0], book, [-PI / 2, 0, 0]); book.rotation.x = 0.35; }
export const scroll = group([0, 0, 0]); { mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.6, 10), P('#8a5a2a'), [0, 0.7, 0], scroll, [0, 0, PI / 2]); mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.6, 10), P('#8a5a2a'), [0, -0.7, 0], scroll, [0, 0, PI / 2]); mesh(new THREE.PlaneGeometry(1.4, 1.4), plastic('#f2e6c8', { map: textTex('COMPLAINT', { bg: '#f2e6c8', color: '#b8222a', size: 110, w: 700, h: 700 }), side: THREE.DoubleSide }), [0, 0, 0], scroll); scroll.visible = false; }
