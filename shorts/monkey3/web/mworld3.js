// Monkey King Part 3 sets: stable, peach garden, banquet, Laozi's lab, heavenly army
import { THREE, scene, PI, hash, plastic, P, glow, group, mesh, part, canvasTex } from './core.js';
import { cloudPuff, peachTree, textTex } from './mworld.js';

export const SETS = {};
const CL = plastic('#e4e0ee', { rough: 0.9, emissive: '#fff4e0', ei: 0.04 });
const RED = P('#b8222a'), GOLD = plastic('#e0b040', { metal: 0.75, rough: 0.28 }), WOOD = P('#7a4a2a'), DARK = P('#3a2418');
function cloudFloor(g, r = 40, n = 30, seed = 0) {
  mesh(new THREE.CylinderGeometry(r * 0.55, r * 0.55, 0.8, 32), plastic('#dcd6e6', { rough: 0.85, emissive: '#fff4e0', ei: 0.05 }), [0, -0.4, 0], g).castShadow = false;
  for (let i = 0; i < n; i++) { const a = hash(i + seed) * PI * 2, rr = r * 0.45 + hash(i + seed + 1) * r * 0.7; cloudPuff(Math.cos(a) * rr, -1.8 - hash(i + seed) * 2, Math.sin(a) * rr, 2.0 + hash(i + seed + 3) * 1.6, g, CL); }
}

// ---------- heavenly stable ----------
export const STB = [300, 400, -600]; export const stable = group(STB); SETS.stable = stable;
const horseM = [plastic('#f4f0ea', { rough: 0.55 }), plastic('#e8dcc8', { rough: 0.55 }), plastic('#cfd6e0', { rough: 0.55 })];
export function horse(x, y, z, yaw = 0, s = 1, parent = scene, mi = 0) {
  const g = group([x, y, z], parent, [0, yaw, 0]); g.scale.setScalar(s); const m = horseM[mi % 3], mane = P('#e0b040'), hoof = P('#3a3030');
  part(1.4, 1.5, 3.4, m, [0, 3.0, 0], 0.5, g);
  for (const [lx, lz] of [[-0.45, 1.2], [0.45, 1.2], [-0.45, -1.2], [0.45, -1.2]]) { part(0.4, 2.3, 0.4, m, [lx, 1.25, lz], 0.15, g); part(0.46, 0.3, 0.5, hoof, [lx, 0.15, lz], 0.08, g); }
  const nk = group([0, 3.4, 1.5], g, [-0.6, 0, 0]); part(0.8, 2.2, 0.9, m, [0, 1.0, 0], 0.35, nk); part(0.25, 1.9, 0.5, mane, [0, 1.0, -0.45], 0.1, nk);
  const hd = group([0, 2.0, 0.1], nk, [1.25, 0, 0]); part(0.75, 0.75, 1.6, m, [0, 0, 0.5], 0.3, hd);
  for (const ex of [-0.39, 0.39]) mesh(new THREE.SphereGeometry(0.12, 8, 6), P('#111'), [ex, 0.15, 0.6], hd);
  for (const ex of [-0.22, 0.22]) mesh(new THREE.ConeGeometry(0.12, 0.4, 6), m, [ex, 0.5, 0.15], hd);
  part(0.25, 1.6, 0.25, mane, [0, 2.6, -1.8], 0.1, g, [0.6, 0, 0]);
  g.userData.neck = nk; return g;
}
export const horses = [];
{ cloudFloor(stable, 46, 34, 10);
  const fence = P('#c8a060');
  for (let i = 0; i < 28; i++) { const a = i / 28 * PI * 2; const x = Math.cos(a) * 22, z = Math.sin(a) * 22; if (z > 14 && Math.abs(x) < 8) continue; part(0.4, 2.2, 0.4, fence, [x, 1.1, z], 0.1, stable); part(5.0, 0.3, 0.25, fence, [x, 1.7, z], 0.08, stable, [0, -a + PI / 2, 0]); }
  for (let i = 0; i < 30; i++) { const a = hash(i + 70) * PI * 2, r = 5 + hash(i + 71) * 15; const x = Math.cos(a) * r, z = Math.sin(a) * r - 4; if (z > 2 && Math.abs(x) < 6) continue; horses.push(horse(x, 0, z, hash(i + 72) * 6, 0.95 + hash(i) * 0.15, stable, i)); }
  // stable roof shed at the back
  for (let i = 0; i < 5; i++) part(0.6, 7, 0.6, RED, [-12 + i * 6, 3.5, -20], 0.1, stable);
  part(30, 0.6, 8, plastic('#e8b84a', { metal: 0.5, rough: 0.35 }), [0, 7.4, -21], 0.1, stable, [0.25, 0, 0]);
  const sg = textTex('御马监', { bg: '#1a3a6a', color: '#ffd77a', size: 150, border: '#e0b040', bw: 12, w: 700, h: 240 }); part(7, 2.4, 0.3, plastic('#ffffff', { map: sg, rough: 0.4 }), [0, 9.2, -17.6], 0.08, stable);
}
// the fancy desk (in the stable yard, front)
export const desk = group([STB[0], STB[1], STB[2] + 8]);
{ part(4.2, 0.3, 2.0, P('#8a2a2a'), [0, 2.6, 0], 0.08, desk); for (const [x, z] of [[-1.8, -0.8], [1.8, -0.8], [-1.8, 0.8], [1.8, 0.8]]) part(0.25, 2.5, 0.25, GOLD, [x, 1.25, z], 0.06, desk);
  part(1.4, 0.12, 1.0, P('#f2e6c8'), [-0.6, 2.81, 0.1], 0.03, desk); mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.5, 12), P('#2a2a2a'), [1.3, 3.0, -0.3], desk);
  part(0.2, 1.2, 0.2, P('#8a5a2a'), [1.3, 3.5, -0.3], 0.05, desk); desk.userData.base = desk.position.clone(); }
// official's hat
export const hat = group([0, 0, 0]); { const bk = plastic('#151515', { rough: 0.4 }); mesh(new THREE.CylinderGeometry(0.75, 0.82, 0.7, 20), bk, [0, 0.3, 0], hat); mesh(new THREE.SphereGeometry(0.62, 16, 8, 0, PI * 2, 0, PI / 2), bk, [0, 0.6, -0.15], hat); for (const s of [-1, 1]) { const wg = part(1.5, 0.35, 0.06, bk, [s * 1.4, 0.55, -0.35], 0.04, hat); } mesh(new THREE.SphereGeometry(0.16, 10, 8), GOLD, [0, 0.35, 0.8], hat); hat.visible = false; }

// ---------- peach garden ----------
export const PG = [-300, 400, -600]; export const garden = group(PG); SETS.garden = garden;
export const gardenTrees = [];
{ cloudFloor(garden, 50, 34, 30);
  for (let i = 0; i < 22; i++) { const a = hash(i + 130) * PI * 2, r = 7 + hash(i + 131) * 22; const x = Math.cos(a) * r, z = Math.sin(a) * r - 6; if (z > 0 && Math.abs(x) < 6) continue; gardenTrees.push(peachTree(x, 0, z, 1.1 + hash(i) * 0.4, garden)); }
  const gate = group([0, 0, 14], garden); for (const x of [-4, 4]) mesh(new THREE.CylinderGeometry(0.4, 0.45, 8, 12), RED, [x, 4, 0], gate); part(11, 0.8, 1.2, GOLD, [0, 8.2, 0], 0.1, gate);
  const sg = textTex('蟠桃园', { bg: '#1a3a6a', color: '#ffd77a', size: 150, border: '#e0b040', bw: 12, w: 700, h: 240 }); part(6, 2.0, 0.3, plastic('#ffffff', { map: sg, rough: 0.4 }), [0, 7, 0.2], 0.08, gate);
}
export const PEACH_GOLD = plastic('#ffa07a', { rough: 0.35, emissive: '#ffb070', ei: 0.12 });
export function bigPeach(s = 1) { const g = group([0, 0, 0]); mesh(new THREE.SphereGeometry(0.5, 20, 16), PEACH_GOLD, [0, 0, 0], g).scale.set(1, 1.05, 0.95); mesh(new THREE.ConeGeometry(0.18, 0.3, 10), PEACH_GOLD, [0, 0.5, 0], g); const lf = part(0.5, 0.05, 0.22, P('#4fb046'), [0.25, 0.55, 0], 0.02, g, [0, 0, 0.4]); g.scale.setScalar(s); g.visible = false; return g; }
export const peach = bigPeach(1);
export const pits = group([0, 0, 0]); { const pm = plastic('#8a4a2a', { rough: 0.8 }); for (let i = 0; i < 40; i++) { const a = hash(i + 7) * PI * 2, r = 0.8 + hash(i + 8) * 3.2; mesh(new THREE.SphereGeometry(0.22, 8, 6), pm, [Math.cos(a) * r, 0.15 + hash(i) * 0.1, Math.sin(a) * r], pits).scale.set(1, 0.7, 1.3); } pits.visible = false; }

// ---------- banquet ----------
export const BQ = [0, 400, -1000]; export const banquet = group(BQ); SETS.banquet = banquet;
export const jug = group([0, 0, 0]); { const jm = plastic('#4fb89a', { rough: 0.25 }); mesh(new THREE.SphereGeometry(0.7, 16, 12), jm, [0, 0.7, 0], jug).scale.set(1, 1.1, 1); mesh(new THREE.CylinderGeometry(0.22, 0.32, 0.8, 12), jm, [0, 1.6, 0], jug); mesh(new THREE.TorusGeometry(0.28, 0.06, 6, 16), GOLD, [0, 2.0, 0], jug, [PI / 2, 0, 0]); jug.visible = false; }
export const bqDishes = [];
{ cloudFloor(banquet, 46, 30, 50);
  part(36, 0.5, 26, plastic('#cfc4b0', { rough: 0.35 }), [0, 0, -2], 0.1, banquet);
  for (let i = 0; i < 6; i++) for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(0.55, 0.6, 11, 14), RED, [s * 15, 5.7, -12 + i * 4.4], banquet);
  for (const s of [-1, 1]) part(1.6, 0.8, 26, GOLD, [s * 15, 11.4, -2], 0.1, banquet);
  const cloth = P('#d8a030'), dish = plastic('#f4f8ff', { rough: 0.2 }), food = [P('#ff9a6a'), P('#ffd060'), P('#8ad06a'), P('#e86a8a')];
  for (const s of [-1, 1]) { const tb = group([s * 6, 0, -2], banquet); part(3.2, 0.3, 20, cloth, [0, 2.4, 0], 0.08, tb); for (const z of [-8.5, 8.5]) for (const x of [-1.3, 1.3]) part(0.3, 2.3, 0.3, WOOD, [x, 1.15, z], 0.05, tb);
    for (let k = 0; k < 8; k++) { const z = -8.5 + k * 2.4; const d = group([0, 2.6, z], tb); mesh(new THREE.CylinderGeometry(0.6, 0.45, 0.15, 16), dish, [0, 0, 0], d); const f = mesh(new THREE.SphereGeometry(0.45, 12, 8), food[(k + (s > 0 ? 1 : 0)) % 4], [0, 0.25, 0], d); f.scale.y = 0.6; d.userData.food = f; bqDishes.push(d);
      if (k % 2) { const j = jug.clone(); j.visible = true; j.position.set(s > 0 ? -1.0 : 1.0, 2.55, z + 1.2); j.scale.setScalar(0.55); tb.add(j); } } }
  for (let i = 0; i < 6; i++) { const lt = group([(i % 2 ? 9 : -9), 9, -12 + i * 4.4], banquet); mesh(new THREE.SphereGeometry(0.9, 14, 10), glow('#ff6a3a', 1.6), [0, 0, 0], lt).scale.y = 1.2; }
  const sg = textTex('蟠桃会', { bg: '#1a3a6a', color: '#ffd77a', size: 150, border: '#e0b040', bw: 12, w: 700, h: 240 }); part(6, 2.0, 0.3, plastic('#ffffff', { map: sg, rough: 0.4 }), [0, 9.5, -14.5], 0.08, banquet);
  part(16, 10, 0.5, RED, [0, 5, -15], 0.1, banquet);
}

// ---------- Laozi's lab ----------
export const LAB = [0, 400, -200]; export const lab = group(LAB); SETS.lab = lab;
export const fireMat = glow('#ff7a2a', 3.0);
export const gourd = group([0, 0, 0]); { const gm = plastic('#e0a83a', { metal: 0.6, rough: 0.3 }); mesh(new THREE.SphereGeometry(0.55, 16, 12), gm, [0, 0.55, 0], gourd); mesh(new THREE.SphereGeometry(0.36, 16, 12), gm, [0, 1.25, 0], gourd); mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.3, 8), P('#8a3a1a'), [0, 1.65, 0], gourd); gourd.visible = false; }
{ part(30, 0.6, 30, plastic('#5a4a3e', { rough: 0.6 }), [0, -0.3, 0], 0.1, lab).castShadow = false;
  const wl = plastic('#6a5446', { rough: 0.8 }); part(30, 16, 0.6, wl, [0, 8, -12], 0.1, lab); part(0.6, 16, 30, wl, [-14, 8, 0], 0.1, lab); part(0.6, 16, 30, wl, [14, 8, 0], 0.1, lab);
  const br = plastic('#b07a3a', { metal: 0.8, rough: 0.35 });
  const fur = group([-4, 0, -6], lab); mesh(new THREE.CylinderGeometry(2.6, 3.0, 4.5, 8), br, [0, 3.2, 0], fur); mesh(new THREE.ConeGeometry(3.0, 2.0, 8), br, [0, 6.4, 0], fur); mesh(new THREE.SphereGeometry(0.5, 10, 8), br, [0, 7.6, 0], fur);
  for (let i = 0; i < 3; i++) { const a = i / 3 * PI * 2; part(0.6, 1.4, 0.6, br, [Math.cos(a) * 2.2, 0.7, Math.sin(a) * 2.2], 0.1, fur); }
  part(1.8, 1.4, 0.3, fireMat, [0, 2.8, 2.55], 0.1, fur); lab.userData.fur = fur;
  const bg = textTex('☯ 八卦炉', { bg: '#7a4a1a', color: '#ffd77a', size: 120, w: 700, h: 200 }); part(3.4, 1.0, 0.1, plastic('#ffffff', { map: bg, rough: 0.4 }), [0, 4.6, 2.72], 0.04, fur, [-0.1, 0, 0]);
  // shelves of gourds
  for (let s = 0; s < 3; s++) { part(9, 0.3, 1.6, WOOD, [7, 2 + s * 2.6, -11], 0.05, lab); for (let k = 0; k < 6; k++) { const gg = gourd.clone(); gg.visible = true; gg.position.set(3.4 + k * 1.45, 2.15 + s * 2.6, -11); gg.scale.setScalar(0.7 + hash(k + s) * 0.2); lab.add(gg); } }
  // table with a bowl of pills
  part(5, 0.3, 2.4, WOOD, [5, 2.4, -3], 0.06, lab); for (const [x, z] of [[-2.2, -1], [2.2, -1], [-2.2, 1], [2.2, 1]]) part(0.25, 2.3, 0.25, WOOD, [5 + x, 1.15, -3 + z], 0.05, lab);
  mesh(new THREE.CylinderGeometry(1.1, 0.7, 0.6, 16), plastic('#f4f8ff', { rough: 0.2 }), [5, 2.85, -3], lab);
  const pill = plastic('#ffd040', { metal: 0.5, rough: 0.2, emissive: '#ffb020', ei: 0.6 }); for (let i = 0; i < 18; i++) mesh(new THREE.SphereGeometry(0.17, 8, 6), pill, [5 + (hash(i) - 0.5) * 1.4, 3.15 + hash(i + 3) * 0.15, -3 + (hash(i + 1) - 0.5) * 1.2], lab);
  const sg = textTex('兜率宫', { bg: '#1a3a6a', color: '#ffd77a', size: 150, border: '#e0b040', bw: 12, w: 700, h: 240 }); part(6, 2.0, 0.3, plastic('#ffffff', { map: sg, rough: 0.4 }), [4, 11, -11.6], 0.08, lab);
  for (let i = 0; i < 4; i++) part(0.3, 2, 0.3, P('#4a3a2a'), [-12 + i * 2, 13, -11.5], 0.05, lab);
}
export const PILL = plastic('#ffd040', { metal: 0.5, rough: 0.2, emissive: '#ffb020', ei: 0.9 });

// ---------- the flag ----------
const flagTex = canvasTex(512, 1400, (c, w, h) => { c.fillStyle = '#c8222a'; c.fillRect(0, 0, w, h); c.strokeStyle = '#ffd040'; c.lineWidth = 26; c.strokeRect(20, 20, w - 40, h - 40); c.fillStyle = '#ffd040'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = 'bold 260px "Noto Sans CJK SC", sans-serif'; ['齐', '天', '大', '圣'].forEach((ch, i) => c.fillText(ch, w / 2, 200 + i * 320)); });
export const flag = group([0, 0, 0]); { part(0.35, 22, 0.35, P('#5a3a1a'), [0, 11, 0], 0.1, flag); mesh(new THREE.SphereGeometry(0.5, 10, 8), GOLD, [0, 22.2, 0], flag); const cloth = mesh(new THREE.PlaneGeometry(5.5, 15, 10, 1), plastic('#ffffff', { map: flagTex, rough: 0.7, side: THREE.DoubleSide }), [2.95, 13.8, 0], flag); flag.userData.cloth = cloth; flag.userData.base = cloth.geometry.attributes.position.array.slice(); flag.visible = false; }
export function waveFlag(t, amp = 1) { const c = flag.userData.cloth, p = c.geometry.attributes.position, b = flag.userData.base; for (let i = 0; i < p.count; i++) { const x = b[i * 3]; const u = (x + 2.75) / 5.5; p.setZ(i, Math.sin(x * 1.2 - t * 6) * 0.45 * u * amp); } p.needsUpdate = true; c.geometry.computeVertexNormals(); }

// ---------- heavenly army (instanced) ----------
const armorM = plastic('#e0b040', { metal: 0.7, rough: 0.3 }), robeM = P('#b8222a'), skinM = P('#f0c8a8'), spearM = P('#c9ced8'), plumeM = P('#ff3a2a');
const G = { legs: new THREE.BoxGeometry(1.2, 2.6, 0.7), body: new THREE.BoxGeometry(1.7, 2.3, 1.0), head: new THREE.SphereGeometry(0.72, 10, 8), helm: new THREE.SphereGeometry(0.8, 10, 6, 0, PI * 2, 0, PI / 2), plume: new THREE.ConeGeometry(0.22, 0.9, 6), spear: new THREE.CylinderGeometry(0.07, 0.07, 9, 5), tip: new THREE.ConeGeometry(0.2, 0.7, 6) };
const PARTS = [['legs', robeM, [0, 1.3, 0]], ['body', armorM, [0, 3.7, 0]], ['head', skinM, [0, 5.5, 0]], ['helm', armorM, [0, 5.75, 0]], ['plume', plumeM, [0, 6.7, 0]], ['spear', P('#6a4a2a'), [1.15, 4.5, 0.2]], ['tip', spearM, [1.15, 9.3, 0.2]]];
export function army(list, parent = scene) { // list: [x,y,z,yaw,s]
  const g = group([0, 0, 0], parent); const n = list.length; const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), Sv = new THREE.Vector3(), Pv = new THREE.Vector3(), O = new THREE.Vector3();
  for (const [k, m, off] of PARTS) { const im = new THREE.InstancedMesh(G[k], m, n); im.castShadow = n < 200; im.receiveShadow = false; im.frustumCulled = false;
    list.forEach(([x, y, z, yaw, s = 1], i) => { Q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw); O.set(...off).multiplyScalar(s).applyQuaternion(Q); Pv.set(x + O.x, y + O.y, z + O.z); Sv.setScalar(s); M.compose(Pv, Q, Sv); im.setMatrixAt(i, M); }); g.add(im); }
  g.userData.n = n; return g;
}
// ring around Flower Fruit Mountain (island at origin, plateau y=30, radius 70)
const ring = []; { let i = 0; for (let row = 0; row < 14; row++) { const r = 36 + row * 5.5; const cnt = Math.floor(2 * PI * r / 3.2); for (let k = 0; k < cnt; k++) { const a = k / cnt * PI * 2 + row * 0.13; const x = Math.cos(a) * r, z = Math.sin(a) * r; const y = r < 68 ? 30 : 30 + (r - 68) * 0.55 + Math.sin(a * 3) * 1.5; ring.push([x + (hash(i) - 0.5) * 1.2, y, z + (hash(i + 1) - 0.5) * 1.2, Math.atan2(-x, -z), 1.0]); i++; } } }
export const armyRing = army(ring); armyRing.visible = false; SETS.armyRing = armyRing;
export const ringClouds = group([0, 0, 0]); { for (let i = 0; i < 60; i++) { const a = i / 60 * PI * 2, r = 80 + hash(i) * 24; cloudPuff(Math.cos(a) * r, 34 + (r - 68) * 0.55 - 4, Math.sin(a) * r, 4 + hash(i + 2) * 2.5, ringClouds, CL); } ringClouds.visible = false; SETS.ringClouds = ringClouds; }
// marching squad on a cloud road
export const MAR = [600, 400, 0]; export const march = group(MAR); SETS.march = march;
{ cloudFloor(march, 60, 40, 90); const sq = []; for (let r = 0; r < 18; r++) for (let c = 0; c < 9; c++) sq.push([(c - 4) * 2.6, 0, -6 - r * 3.0, 0, 1]); const a = army(sq, march); march.userData.squad = a;
  for (const x of [-14, 14]) { const b = group([x, 0, -20], march); part(0.3, 14, 0.3, P('#5a3a1a'), [0, 7, 0], 0.05, b); part(3, 6, 0.1, P('#e0b040'), [1.6, 11, 0], 0.05, b); } }
export function hideSets() { for (const k in SETS) SETS[k].visible = false; }
hideSets();
