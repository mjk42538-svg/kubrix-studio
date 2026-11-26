// THE MONKEY KING — Part 1: Born From a Rock
import { THREE, scene, camera, PI, clamp, lerp, ss, S, easeOut, easeIn, back, spring, noise, hash, lerp3, part, P, plastic, glow, group, mesh, canvasTex } from './core.js';
import * as WD from './mworld.js';
import { makeCast } from './cast.js';
import { act, setEnv } from './anim.js';
import { drawFace, faceParams } from './rig.js';
import * as FX from './fx.js';

let T, wS, wE, NW; const SH = []; let C = {}; let st = {};
const Q = new URLSearchParams(location.search);
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const Y = 30.2;
const su = (x, z, dy = 0) => [x, Y + dy, z];

// ---------- camera ----------
let shake = 0, hits = [];
function cam(t, keys, o = {}) {
  let i = 0; while (i < keys.length - 2 && t > keys[i + 1][0]) i++;
  const a = keys[i], b = keys[Math.min(i + 1, keys.length - 1)];
  const k = b[0] === a[0] ? 0 : clamp((t - a[0]) / (b[0] - a[0]));
  const e = b[5] === 'out' ? easeOut(k) : b[5] === 'lin' ? k : b[5] === 'in' ? easeIn(k) : ss(k);
  const pos = lerp3(a[1], b[1], e), tg = lerp3(a[2], b[2], e); let fov = lerp(a[3], b[3], e); const roll = lerp(a[4] || 0, b[4] || 0, e);
  let ca = 0, desat = 0;
  for (const h of hits) { const d = t - h.t; if (d >= 0 && d < 0.9) { const z = h.z ?? 0.22; fov *= 1 - z * easeOut(d / 0.07) * (h.hold ? 1 : (1 - S(0.45, 0.9, d))); ca = Math.max(ca, (h.ca ?? 1) * (1 - d / 0.5)); desat = Math.max(desat, (h.ds ?? 0.5) * (1 - S(0, 0.35, d))); shake = Math.max(shake, (h.sh ?? 0.8) * Math.pow(1 - clamp(d / 0.45), 2)); } }
  const hh = o.hand ?? 0.05; pos[0] += noise(t * 0.9, 1) * hh; pos[1] += noise(t * 0.8, 2) * hh; pos[2] += noise(t * 0.7, 3) * hh;
  camera.position.set(...pos); camera.fov = fov; camera.up.set(0, 1, 0); camera.lookAt(...tg); camera.rotateZ(roll + noise(t * 0.6, 7) * 0.006);
  if (shake > 0) { camera.rotateX(noise(t * 41, 4) * shake * 0.035); camera.rotateY(noise(t * 37, 8) * shake * 0.035); camera.rotateZ(noise(t * 33, 9) * shake * 0.03); }
  st.ca = Math.max(st.ca || 0, ca); st.desat = Math.max(st.desat || 0, desat);
  st.focus = o.focus ?? camera.position.distanceTo(new THREE.Vector3(...tg)); st.aperture = o.ap ?? 0.45;
}
const hit = (t, o = {}) => hits.push({ t, ...o });
const kick = (t, t0, amp = 0.6, dur = 0.4) => { const d = t - t0; if (d >= 0 && d < dur) shake = Math.max(shake, amp * Math.pow(1 - d / dur, 2)); };
const L = (name, c, lamps = []) => { WD.setLight(name, c); lamps.forEach((l, i) => WD.lamp(i, l[0], l[1] || '#ffd9a8', l[2] ?? 40, l[3] ?? 30)); };
const flipPos = (pos, yaw, p, r) => { const c = 3.2 * r.sc; return [pos[0] - c * Math.sin(p) * Math.sin(yaw), pos[1] + c * (1 - Math.cos(p)), pos[2] - c * Math.sin(p) * Math.cos(yaw)]; };
const headCam = (r, off, look = [0, 0, 0]) => { const h = r.headWorld(look); return [add(h, off), h]; };

// ---------- setup ----------
export async function setupStory() {
  T = await (await fetch('../work/' + (Q.get('timing') || 'timing_v2.json'))).json();
  try { setEnv(await (await fetch('../work/' + (Q.get('env') || 'env_v2.json'))).json()); } catch (e) { }
  wS = (i) => T.words[Math.min(i, T.words.length - 1)].s; wE = (i) => T.words[Math.min(i, T.words.length - 1)].e; NW = T.words.length;
  C = makeCast();
  const beamM = new THREE.MeshBasicMaterial({ color: new THREE.Color(6, 5, 2.5), transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  C.beams = [0, 1].map(() => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.6, 1, 12, 1, true), beamM); m.geometry.translate(0, 0.5, 0); m.visible = false; m.castShadow = false; scene.add(m); return m; });
  C.crown = group([0, 0, 0]); { const g = plastic('#f0c040', { metal: 0.8, rough: 0.25 }); part(1.1, 0.25, 1.1, g, [0, 0, 0], 0.05, C.crown); for (let i = 0; i < 4; i++) { const a = i / 4 * PI * 2 + PI / 4; mesh(new THREE.ConeGeometry(0.16, 0.45, 4), g, [Math.cos(a) * 0.45, 0.3, Math.sin(a) * 0.45], C.crown); } mesh(new THREE.SphereGeometry(0.1, 8, 6), glow('#ff3050', 1.5), [0, 0.05, 0.56], C.crown); C.crown.visible = false; }
  C.peachM = plastic('#ffa07a', { rough: 0.5 });
  C.peach = mesh(new THREE.SphereGeometry(0.38, 14, 10), C.peachM, [0, 0, 0]); C.peach.visible = false;
  C.cane = part(0.14, 2.4, 0.14, P('#7a5236'), [0, 0, 0], 0.04); C.cane.visible = false;
  C.hammer = group([0, 0, 0]); part(0.14, 1.4, 0.14, P('#7a5236'), [0, 0.3, 0], 0.04, C.hammer); part(0.5, 0.35, 0.35, P('#555'), [0, 1.0, 0], 0.05, C.hammer); C.hammer.visible = false;
  C.bigPeach = mesh(new THREE.SphereGeometry(2.2, 24, 16), plastic('#ffa07a', { rough: 0.45 }), [0, 0, 0]); C.bigPeach.visible = false;
  C.rock = mesh(new THREE.DodecahedronGeometry(2.0, 1), WD.STONE, [0, 0, 0]); C.rock.visible = false;
  C.bird = group([0, 0, 0]); { const bm = P('#c98a3a'); mesh(new THREE.SphereGeometry(0.9, 14, 10), bm, [0, 0, 0], C.bird).scale.set(1, 0.9, 1.3); mesh(new THREE.SphereGeometry(0.6, 12, 8), bm, [0, 0.6, 0.9], C.bird); mesh(new THREE.ConeGeometry(0.2, 0.6, 6), P('#f0b030'), [0, 0.5, 1.6], C.bird, [PI / 2, 0, 0]); C.wings = [-1, 1].map(s => { const g = group([s * 0.8, 0.2, 0], C.bird); part(2.0, 0.12, 0.9, bm, [s * 1.0, 0, 0], 0.05, g); return g; }); C.bird.visible = false; }
  C.treeMk = group([0, 0, 0]); { WD.pineTree(0, 0, 0, 0.9, C.treeMk); const fc = canvasTex(512, 512, (c) => drawFace(c, faceParams('smug', 'smug', 0), {})); const fp = mesh(new THREE.PlaneGeometry(1.6, 1.6), new THREE.MeshBasicMaterial({ map: fc, transparent: true }), [0, 3.6, 2.2], C.treeMk); fp.castShadow = false; C.treeTail = group([0.4, 1.0, -0.6], C.treeMk); let par = C.treeTail; for (let i = 0; i < 6; i++) { const g = group(i ? [0, 0.42, 0] : [0, 0, 0], par); part(0.22, 0.48, 0.22, P('#c98a3a'), [0, 0.21, 0], 0.1, g); g.rotation.set(i ? 0.35 : -2.0, 0, 0); par = g; } C.treeMk.visible = false; }
  C.mtn = group([0, 0, 0]); { mesh(new THREE.CylinderGeometry(9, 15, 26, 9, 3), WD.ROCK, [0, 13, 0], C.mtn); mesh(new THREE.SphereGeometry(8, 10, 8), WD.GRASS, [0, 26, 0], C.mtn).scale.y = 0.4; C.mtn.visible = false; }
  C.clues = group([0, 0, 0]); { const fm = plastic('#3a2a20', { rough: 0.9 }); for (let i = 0; i < 7; i++) { const g = group([(i % 2 ? 1.6 : -1.6), Y + 0.05, -i * 4.2 - 3], C.clues); part(1.8, 0.06, 2.6, fm, [0, 0, 0], 0.03, g); for (let k = -1; k <= 1; k++) part(0.4, 0.06, 1.1, fm, [k * 0.7, 0, -1.8], 0.03, g, [0, k * 0.3, 0]); } C.clues.visible = false; }
  C.scarf = part(1.8, 0.12, 0.5, P('#e0453a'), [0, 0, 0], 0.05); C.scarf.visible = false;
  C.lanterns = group([0, 0, 0]); { for (let i = 0; i < 16; i++) { const a = i / 16 * PI * 2; const x = Math.cos(a) * 11, z = 8 + Math.sin(a) * 9; mesh(new THREE.SphereGeometry(0.45, 12, 8), glow(i % 3 ? '#ff4040' : '#ffb030', 2.2), [x, Y + 7 + Math.sin(i * 2) * 0.6, z], C.lanterns).scale.y = 1.25; } C.lanterns.visible = false; }
  buildShots();
  window.shotList = () => SH.map((s, i) => [i, s.name, s.i0, +start(i).toFixed(2)]);
}
function start(i) { return i === 0 ? 0 : wS(SH[i].i0) - 0.07; }
function shot(i0, name, fn) { SH.push({ i0, name, fn }); }
const PROPS = () => [C.crown, C.peach, C.cane, C.hammer, C.bigPeach, C.rock, C.bird, C.treeMk, C.mtn, C.clues, C.scarf, C.lanterns, WD.nimbus, WD.teacup, ...C.beams];
function hideAll() { for (const r of C.all) r.hide(); for (const o of PROPS()) { o.visible = false; if (o.parent !== scene) scene.attach(o); o.scale.setScalar(1); } }
function hold(obj, rig, side = 'R', pos = [0, 0, 0], rot = [0, 0, 0]) { const g = (side === 'R' ? rig.R : rig.L).grip; if (obj.parent !== g) g.add(obj); obj.position.set(...pos); obj.rotation.set(...rot); obj.scale.setScalar(1 / rig.sc); obj.visible = true; }
function onHead(obj, rig, pos = [0, 0.85, 0], rot = [0, 0, 0]) { if (obj.parent !== rig.head) rig.head.add(obj); obj.position.set(...pos); obj.rotation.set(...rot); obj.visible = true; }
function nimbusUnder(rig, t, s = 1.25) { const n = WD.nimbus; n.visible = true; n.position.set(...add(rig.root.position.toArray(), [0, 0.2, 0])); n.rotation.set(0, rig.root.rotation.y + PI / 2, Math.sin(t * 3) * 0.05); n.scale.setScalar(s); }
function troupe(t, center, faces = 'happy', pose = 'idle', o = {}) { C.mk.forEach((m, i) => { const a = (o.a0 ?? 0) + i / C.mk.length * (o.arc ?? PI) - (o.arc ?? PI) / 2; const r = (o.r ?? 5) + (i % 2) * 1.2; const pos = [center[0] + Math.sin(a) * r, center[1], center[2] + Math.cos(a) * r]; const yaw = Math.atan2(center[0] - pos[0], center[2] - pos[2]) + (o.yawOff || 0); act(m, t, { pos, yaw, keys: typeof pose === 'function' ? pose(i) : [[0, pose]], faces: typeof faces === 'function' ? faces(i) : [[0, faces]], extra: o.extra ? (tt, p) => o.extra(tt, p, i) : null }); }); }
const bob = (amp = 0.3, sp = 9) => (tt, p, i = 0) => ({ ...p, hy: (p.hy || 0) + Math.abs(Math.sin(tt * sp + i)) * amp, shL: add(p.shL || [0, 0, 0], [0, 0, Math.abs(Math.sin(tt * sp + i)) * 1.2]), shR: add(p.shR || [0, 0, 0], [0, 0, -Math.abs(Math.sin(tt * sp + i + 1)) * 1.2]) });

function buildShots() {
  const w = wS, e = wE;
  const eggOpen = (k) => { WD.egg.visible = true; WD.eggHalves[0].position.set(-2.5 * easeOut(k), 3.2 * easeOut(k), 0); WD.eggHalves[0].rotation.set(0, 0, 1.4 * easeOut(k)); };
  const eggClosed = () => { WD.egg.visible = true; WD.eggHalves[0].position.set(0, 0, 0); WD.eggHalves[0].rotation.set(0, 0, 0); WD.eggCrackMat.emissiveIntensity = 0; };
  const EGG = [0, 31.0, 0];
  // ===== HOOK =====
  shot(0, 'HOOK egg explodes', (t) => {
    L('morning', EGG); eggOpen(0.6 + 0.4 * S(0, 0.5, t)); WD.eggCrackMat.emissiveIntensity = 1.5 * (1 - S(0, 1, t));
    act(C.wkS, t, { pos: EGG, yaw: 0, keys: [[0, 'cheer']], faces: [[0, 'joy']], extra: (tt, p) => ({ ...p, hy: (p.hy || 0) + 1.2 * (1 - easeOut(clamp(tt / 0.6))) }) });
    FX.sparkBurst([0, 34, 0], t, -0.2, 50, 7, 1.4, 1, '#fff0b0'); st.flash = 0.5 * (1 - S(0, 0.25, t));
    cam(t, [[0, [3, 33.5, 12], [0, 34.5, 0], 50, -0.08], [w(6), [1.2, 34.3, 7], [0, 34.8, 0], 42, 0.02, 'out']], { ap: 0.4 });
  });
  shot(6, 'Literally (bonk)', (t) => {
    L('morning', EGG); eggOpen(1);
    const bonk = w(6) + 0.25; const k = clamp((t - (w(6) - 0.1)) / 0.35);
    act(C.wkS, t, { pos: EGG, yaw: 0, keys: [[0, 'idle'], [bonk, { neck: [0.25, 0, 0.15] }, 'snap', 0.3]], faces: [[0, 'deadpan'], [bonk, { open: 0.15, smile: -0.2, browH: -0.4 }]], noSacc: true });
    C.rock.visible = true; C.rock.scale.setScalar(0.18); const hb = C.wkS.headWorld([0, 0.75, 0]);
    C.rock.position.set(hb[0] + (t > bonk ? 0.8 * clamp((t - bonk) / 0.4) : 0), lerp(hb[1] + 6, hb[1], easeIn(k)) + (t > bonk ? Math.sin(clamp((t - bonk) / 0.4) * PI) * 1.2 : 0), hb[2]);
    kick(t, bonk, 0.5, 0.3); FX.sparkBurst(hb, t, bonk, 8, 1.0, 0.4, 2, '#ffffff');
    const [cp, h] = headCam(C.wkS, [0, 0.3, 4.2]); cam(t, [[w(6) - 0.1, cp, h, 40], [w(7), add(cp, [0, 0, -0.4]), h, 40]], { ap: 0.6 });
  });
  shot(7, 'flash forward: flying over heaven', (t) => {
    const H = WD.HEAV; L('heaven', H);
    const k = clamp((t - w(7)) / (w(12) - w(7)));
    act(C.wkR, t, { pos: [lerp(-30, 6, k), H[1] + 12 - 4 * k, H[2] + lerp(10, -4, k)], yaw: PI / 2 - 0.4, keys: [[0, { from: 'idle', shR: [-0.4, 0, -1.2], shL: [0.3, 0, 0.5] }]], faces: [[0, 'smug']] }); nimbusUnder(C.wkR, t);
    C.off.forEach((o, i) => act(o, t, { keys: [[0, 'headHands']], faces: [[0, 'panic']], walk: { path: [[H[0] - 3 + i * 5, H[2] + 4], [H[0] - 10 + i * 20, H[2] + 14]], t0: w(7), t1: w(12) + 0.4, run: true, y: H[1] + 0.4 } }));
    WD.updatePetals(t, true, 'spark');
    const wp = C.wkR.root.position.toArray();
    cam(t, [[w(7) - 0.1, add(H, [-10, 9, 26]), add(wp, [0, 3, 0]), 50], [w(12), add(H, [6, 8, 22]), add(wp, [0, 3, 0]), 48]], { ap: 0.2 });
  });
  shot(12, 'I beat up heaven', (t) => {
    const H = WD.HEAV; L('heaven', H);
    const tl = w(13); const land = clamp((t - (w(12) - 0.1)) / 0.3);
    act(C.wkR, t, { pos: [H[0], H[1] + 0.4 + 6 * (1 - easeOut(land)), H[2] - 2], yaw: 0, keys: [[0, 'idle'], [tl, { from: 'cheer', shR: [-0.2, 0, -2.6], shL: [0.4, 0, 0.6] }, 'back', 0.3]], faces: [[0, 'smug'], [tl, 'joy']], talk: [[w(12), e(15), 0.4]] });
    act(C.jade, t, { pos: [H[0], H[1] + 1.0, H[2] - 10.6], yaw: 0, keys: [[0, 'sit'], [tl, { from: 'sit', shL: [-1.6, 0, 0.6], shR: [-1.6, 0, -0.6], elL: [-0.8, 0, 0], elR: [-0.8, 0, 0], waist: [-0.25, 0, 0] }, 'snap', 0.3]], faces: [[0, 'neutral'], [tl, 'terror']] });
    kick(t, w(12) + 0.15, 1.0, 0.4); hit(w(15), { z: 0.2, sh: 0.9, ds: 0.3, ca: 1 });
    FX.poof([H[0], H[1] + 0.6, H[2] - 2], t, w(12) + 0.12, 1.4, 3);
    cam(t, [[w(12) - 0.1, add(H, [3.5, 3.5, 9]), add(H, [0, 4.5, -5]), 48], [w(16), add(H, [3, 3.8, 7.5]), add(H, [0, 4.8, -5]), 48]], { ap: 0.3 });
    WD.updatePetals(t, true, 'spark');
  });
  // ===== BEGINNING =====
  shot(16, 'rewind -> island wide', (t) => {
    L('morning', [0, 20, 0]); eggClosed();
    cam(t, [[w(16) - 0.1, [80, 70, 230], [0, 28, 0], 40], [w(23), [40, 55, 170], [0, 32, 0], 40]], { ap: 0.0, hand: 0.1 });
    if (t < w(16) + 0.35) { st.desat = 0.8; st.ca = 2.0; st.grain = 0.1; }
  });
  shot(23, 'crane to summit stone', (t) => {
    L('morning', EGG); eggClosed();
    cam(t, [[w(23) - 0.1, [10, 49, 24], [0, 33, 0], 44], [w(33), [4, 34.8, 8.5], [0, 33.6, 0], 44, 0, 'out']], { ap: 0.3 });
    WD.updatePetals(t, true);
  });
  shot(33, 'one day... glowing crack', (t) => {
    L('morning', EGG); eggClosed(); WD.eggCrackMat.emissiveIntensity = 1.5 * S(w(33), w(35), t);
    WD.egg.position.x = Math.sin(t * 60) * 0.05 * S(w(33), w(35), t);
    cam(t, [[w(33) - 0.1, [1.5, 33.6, 7.5], [0, 33.6, 0], 40], [w(35), [1.0, 33.6, 6.2], [0, 33.6, 0], 40]], { ap: 0.6 });
  });
  shot(35, 'cracked open', (t) => {
    L('morning', EGG); const k = S(w(36), w(36) + 0.25, t); eggOpen(k); WD.eggCrackMat.emissiveIntensity = 1.5 * (1 - k * 0.5);
    st.flash = 0.6 * Math.max(0, 1 - Math.abs(t - w(36) - 0.12) / 0.15); kick(t, w(36) + 0.1, 0.9, 0.5); FX.sparkBurst([0, 34, 0], t, w(36) + 0.1, 40, 6, 1.2, 4, '#fff0b0');
    cam(t, [[w(35) - 0.1, [4, 32.5, 12], [0, 34, 0], 46], [w(38), [5, 32.5, 13.5], [0, 34, 0], 46]], { ap: 0.3 });
  });
  shot(38, 'out popped me', (t) => {
    L('morning', EGG); eggOpen(1); WD.eggCrackMat.emissiveIntensity = 0.4;
    act(C.wkS, t, { pos: EGG, yaw: 0, keys: [[0, { from: 'idle', hy: -2.5 }], [w(40), { from: 'cheer', hy: 0 }, 'back', 0.35]], faces: [[0, 'neutral'], [w(40), 'joy']], extra: (tt, p) => ({ ...p, sq: 0.15 * Math.sin(clamp((tt - w(40)) / 0.35) * PI) }) });
    cam(t, [[w(38) - 0.1, [2, 33.5, 9], [0, 34.2, 0], 44], [w(42), [1.5, 33.8, 8], [0, 34.6, 0], 44]], { ap: 0.4 });
  });
  shot(42, 'A monkey (CU blink)', (t) => {
    L('morning', EGG); eggOpen(1);
    act(C.wkS, t, { pos: EGG, yaw: 0, keys: [[0, 'idle']], faces: [[0, 'hopeful'], [w(43), 'happy']], extra: (tt, p) => ({ ...p, neck: add(p.neck || [0, 0, 0], [0, 0, 0.2 * Math.sin(tt * 2)]) }) });
    const [cp, h] = headCam(C.wkS, [0.2, 0.1, 3.4]); cam(t, [[w(42) - 0.1, cp, h, 38], [w(44), add(cp, [0, 0, -0.3]), h, 38]], { ap: 0.7 });
  });
  shot(44, 'made of stone (knock knock)', (t) => {
    L('morning', EGG); eggOpen(1);
    const kn = Math.max(0, Math.sin((t - w(45)) * 16)) * (t > w(45) && t < e(46) + 0.2 ? 1 : 0);
    act(C.wkS, t, { pos: EGG, yaw: 0, keys: [[0, 'idle'], [w(44), { from: 'idle', ikR: { t: [-0.2, 6.5, 0.5], k: 1, pole: [1, 0.5, 0] } }, 'out', 0.25]], faces: [[0, 'confused'], [e(46), 'shock']], extra: (tt, p) => (p.ikR ? { ...p, ikR: { ...p.ikR, t: [-0.2, 6.5 + 0.35 * kn, 0.5] } } : p) });
    if (kn > 0.9) FX.sparkBurst(C.wkS.headWorld([0, 0.8, 0]), t, t - 0.01, 4, 0.5, 0.3, Math.floor(t * 8), '#ffffff');
    const [cp, h] = headCam(C.wkS, [1.2, 0.2, 4.2], [0, 0.4, 0]); cam(t, [[w(44) - 0.1, cp, h, 40], [w(47), add(cp, [0, 0, -0.3]), h, 40]], { ap: 0.5 });
  });
  shot(47, 'eyes open ECU', (t) => {
    L('morning', EGG); eggOpen(1);
    act(C.wkS, t, { pos: EGG, yaw: 0, keys: [[0, 'idle']], faces: [[0, { open: 0.05, smile: 0 }], [w(49), { open: 1.25, pupil: 0, smile: 0.2 }]], noSacc: true, noBlink: true });
    const [cp, h] = headCam(C.wkS, [0, 0, 1.9], [0, 0.15, 0]); cam(t, [[w(47) - 0.1, cp, h, 34], [w(52), add(cp, [0, 0, -0.25]), h, 34]], { ap: 0.8 });
    WD.lamp(0, C.wkS.headWorld([0, 0.15, 1.2]), '#fff0b0', 40 * S(w(50), w(52), t), 6);
  });
  const beamsOn = (t, r, len, op = 1) => { C.beams.forEach((b, i) => { const s = i ? 1 : -1; const p0 = r.headWorld([s * 0.36, 0.15, 0.6]); b.visible = true; b.position.set(...p0); b.rotation.set(-0.25 + 0.05 * Math.sin(t * 30 + i), 0, s * 0.06); b.scale.set(1 + 0.15 * Math.sin(t * 40 + i), Math.max(0.01, len), 1); b.material.opacity = 0.85 * op; }); };
  shot(52, 'two beams shoot into the sky', (t) => {
    L('morning', EGG); eggOpen(1);
    act(C.wkS, t, { pos: EGG, yaw: 0, keys: [[0, { from: 'idle', neck: [-0.85, 0, 0], waist: [-0.15, 0, 0], shL: [0, 0, 0.6], shR: [0, 0, -0.6] }]], faces: [[0, { open: 1.3, pupil: 0, smile: 0.5, mouthOpen: 0.3, mouthO: 1 }]] });
    beamsOn(t, C.wkS, 500 * easeOut(clamp((t - w(53)) / 0.5)));
    kick(t, w(53), 0.7, 0.6); hit(w(56), { z: 0.12, sh: 0.6, ds: 0.2, ca: 0.8 });
    cam(t, [[w(52) - 0.1, [5, 32, 9], [0, 38, 0], 56, 0.08], [w(60), [6, 31.6, 10], [0, 45, -6], 56, 0.12]], { ap: 0.1 });
    st.bloom = 0.9;
  });
  shot(60, 'beams pierce heaven clouds', (t) => {
    const H = WD.HEAV; L('heaven', H);
    C.beams.forEach((b, i) => { b.visible = true; b.position.set(H[0] - 6 + i * 3, H[1] - 60, H[2] + 18); b.rotation.set(0, 0, 0); b.scale.set(4, 90, 4); b.material.opacity = 0.9; });
    act(C.off[0], t, { pos: [H[0] - 2, H[1] + 0.4, H[2] + 8], yaw: PI - 0.4, keys: [[0, 'idle'], [w(60), 'recoil', 'snap', 0.25]], faces: [[0, 'shock']] });
    kick(t, w(60), 0.8, 0.5); st.flash = 0.4 * (1 - S(w(60), w(60) + 0.3, t));
    cam(t, [[w(60) - 0.1, add(H, [6, 3, 26]), add(H, [-3, 10, 16]), 50], [w(62), add(H, [5, 3.2, 24]), add(H, [-3, 12, 16]), 50]], { ap: 0.2 });
    st.bloom = 0.9;
  });
  const jadeSit = (t, keys = [], faces = [[0, 'neutral']], talk = null) => { const H = WD.HEAV; act(C.jade, t, { pos: [H[0], H[1] + 1.0, H[2] - 10.6], yaw: 0, keys: [[0, { from: 'sit', ikR: { t: [-0.4, 4.6, 1.7], k: 1, pole: [1, -0.7, 0] } }], ...keys], faces, talk }); };
  shot(62, 'Jade Emperor sipping tea', (t) => {
    const H = WD.HEAV; L('heaven', H);
    jadeSit(t, [], [[0, 'neutral'], [w(64), { open: 0.6, smile: 0.5, browH: 0.2 }]]);
    hold(WD.teacup, C.jade, 'R', [0, -0.05, 0.15], [0, 0, 0]);
    WD.lamp(0, add(H, [3, 6, -6]), '#fff4c0', 40 * S(w(67), w(68), t), 20);
    cam(t, [[w(62) - 0.1, add(H, [2.5, 6.5, -3.5]), add(H, [0, 5.6, -10.6]), 40], [w(69), add(H, [2, 6.4, -4.8]), add(H, [0, 5.8, -10.6]), 40]], { ap: 0.5 });
  });
  shot(69, 'spilled his tea', (t) => {
    const H = WD.HEAV; L('heaven', H);
    const sp = w(69) + 0.1;
    jadeSit(t, [[sp, { from: 'sit', ikR: { t: [-1.2, 5.0, 1.2], k: 1, pole: [1, -0.7, 0] }, shL: [-1.2, 0, 0.5], elL: [-0.8, 0, 0], waist: [-0.2, 0, 0] }, 'snap', 0.25]], [[0, { open: 0.6, smile: 0.5 }], [sp, 'shock']]);
    hold(WD.teacup, C.jade, 'R', [0, -0.05, 0.15], [0, 0, t > sp ? -1.8 * clamp((t - sp) / 0.2) : 0]);
    FX.sparkBurst(C.jade.gripWorld('R'), t, sp + 0.1, 18, 1.6, 0.6, 9, '#c8a040');
    st.flash = 0.5 * Math.max(0, 1 - Math.abs(t - sp) / 0.12); hit(sp, { z: 0.2, sh: 0.8, ds: 0.4, ca: 1.2 });
    cam(t, [[w(69) - 0.1, add(H, [3, 5.6, -5]), add(H, [-0.3, 5.2, -10.4]), 42], [w(72), add(H, [2.6, 5.6, -5.6]), add(H, [-0.3, 5.2, -10.4]), 42]], { ap: 0.5 });
  });
  shot(72, 'he looked down', (t) => {
    const H = WD.HEAV; L('heaven', H);
    act(C.jade, t, { pos: [H[0], H[1] + 0.4, H[2] + 12], yaw: 0, keys: [[0, { from: 'hips', waist: [0.45, 0, 0], neck: [0.5, 0, 0] }]], faces: [[0, 'bored']], look: [0, -0.6] });
    cam(t, [[w(72) - 0.1, add(H, [1.5, -4, 22]), add(H, [0, 5, 12]), 44, 0.05], [w(77), add(H, [1.2, -3.5, 21]), add(H, [0, 5.4, 12]), 44, 0.05]], { ap: 0.25 });
  });
  shot(77, 'Eh. Just a monkey.', (t) => {
    const H = WD.HEAV; L('heaven', H);
    act(C.jade, t, { pos: [H[0], H[1] + 0.4, H[2] + 12], yaw: 0.3, keys: [[0, { from: 'idle', waist: [0.2, 0, 0], neck: [0.1, 0, 0] }], [w(79), { shR: [-0.9, 0.6, -0.4], elR: [-1.4, 0, 0] }, 'out', 0.2]], faces: [[0, 'bored'], [w(78), 'deadpan']], talk: [[w(77), e(81), 1]], extra: (tt, p) => ({ ...p, wrR: [Math.sin(tt * 12) * 0.5, 0, 0] }) });
    const [cp, h] = headCam(C.jade, [1.4, 0.2, 4.4]); cam(t, [[w(77) - 0.1, cp, h, 40], [w(82), add(cp, [0, 0, -0.4]), h, 40]], { ap: 0.6 });
  });
  shot(82, 'Big mistake (smirk)', (t) => {
    L('morning', EGG); eggOpen(1);
    act(C.wkS, t, { pos: EGG, yaw: 0, keys: [[0, 'hips']], faces: [[0, 'smug']], noSacc: true });
    const [cp, h] = headCam(C.wkS, [0, -0.3, 3.4]); cam(t, [[w(82) - 0.1, cp, h, 38], [w(84), add(cp, [0, 0.1, -0.8]), h, 38, 0, 'in']], { ap: 0.6 });
    hit(w(83), { z: 0.18, sh: 0.4, ds: 0.6, ca: 1.0, hold: true }); st.vign = 0.55;
  });
  // ===== WATERFALL =====
  const F = WD.FALL; const fz = (x, z, y = 0.2) => [F[0] + x, y, F[2] + z];
  const fallBase = () => L('day', F);
  shot(84, 'monkeys found a giant waterfall', (t) => {
    fallBase(); troupe(t, fz(0, 16), 'shock', (i) => [[0, i % 2 ? 'pointUp' : 'recoil']], { r: 5, arc: PI * 0.9, a0: PI });
    cam(t, [[w(84) - 0.1, fz(3, 34, 4), fz(0, 14, 9), 50], [w(91), fz(2, 30, 3.5), fz(0, 16, 8), 50]], { ap: 0.15 });
    WD.updatePetals(t, true);
  });
  shot(91, 'made a deal: whoever jumps', (t) => {
    fallBase();
    troupe(t, fz(0, 16), 'hopeful', 'idle', { r: 3.5, arc: PI * 1.3, a0: PI });
    act(C.mk[0], t, { pos: fz(0, 13), yaw: PI, keys: [[0, 'idle'], [w(95), 'point', 'back', 0.3]], faces: [[0, 'proud']], talk: [[w(95), e(98), 0.8]] });
    cam(t, [[w(91) - 0.1, fz(-4, 22, 4), fz(0, 14, 2.5), 46], [w(99), fz(-3, 21, 4), fz(0, 14.5, 2.5), 46]], { ap: 0.3 });
  });
  shot(99, 'becomes king', (t) => {
    fallBase();
    act(C.mk[0], t, { pos: fz(0, 13), yaw: 0.2, keys: [[0, 'pointUp']], faces: [[0, 'joy']], talk: [[w(99), e(100), 0.8]] });
    onHead(C.crown, C.mk[0], [0, 0.95 + 0.1 * Math.sin(t * 6), 0], [0, t, 0]); C.crown.scale.setScalar(Math.max(0.01, back(clamp((t - w(99)) / 0.3))));
    FX.sparkBurst(C.mk[0].headWorld([0, 1.2, 0]), t, w(99), 14, 1.6, 0.8, 5, '#ffe07a');
    const [cp, h] = headCam(C.mk[0], [0.6, 0.3, 4.2], [0, 0.4, 0]); cam(t, [[w(99) - 0.1, cp, h, 42], [w(101), add(cp, [0, 0, -0.4]), h, 42]], { ap: 0.5 });
  });
  shot(101, 'everyone was scared', (t) => {
    fallBase();
    troupe(t, fz(0, 16), 'scared', (i) => [[0, 'idle'], [w(101) + i * 0.05, i % 2 ? 'headHands' : 'recoil', 'snap', 0.25]], { r: 2.6, arc: PI * 0.8, a0: PI, extra: (tt, p, i) => ({ ...p, hips: add(p.hips || [0, 0, 0], [0, 0, Math.sin(tt * 30 + i) * 0.04]) }) });
    cam(t, [[w(101) - 0.1, fz(1.5, 25, 3.6), fz(0, 13.5, 2.4), 42], [w(104), fz(1.2, 24, 3.6), fz(0, 13.5, 2.4), 42]], { ap: 0.35 });
  });
  shot(104, 'so I JUMPED', (t) => {
    fallBase();
    const t0 = w(104) - 0.1, tj = w(106) - 0.15, k = clamp((t - tj) / 0.7);
    const pos = t < tj ? null : [F[0], 0.2 + 9 * Math.sin(k * PI * 0.9), F[2] + lerp(14, -1.5, k)];
    act(C.wk, t, { pos: pos || undefined, yaw: PI, keys: [[0, 'idle'], [tj, { from: 'cheer', hipL: [-1.2, 0, 0], knL: [1.4, 0, 0], hipR: [0.4, 0, 0], knR: [0.3, 0, 0] }, 'back', 0.25]], faces: [[0, 'smug'], [tj, 'joy']], walk: t < tj ? { path: [[F[0], F[2] + 24], [F[0], F[2] + 14]], t0, t1: tj, run: true, y: 0.2 } : null });
    troupe(t, fz(0, 18), 'shock', 'recoil', { r: 4, arc: PI * 0.7, a0: 0 });
    FX.sparkBurst([F[0], 6, F[2] - 1], t, tj + 0.65, 30, 5, 0.9, 7, '#ffffff');
    cam(t, [[w(104) - 0.1, fz(9, 30, 5), fz(0, 14, 4), 52], [w(107), fz(7, 26, 5), fz(0, 9, 6), 52]], { ap: 0.1 });
  });
  // ===== CAVE =====
  const CV = WD.CAVE; const cv = (x, y, z) => [CV[0] + x, y, CV[2] + z];
  const caveBase = () => L('cave', CV, [[cv(0, 8, 14), '#d8f4ff', 60, 40], [cv(-10, 10, -8), '#ffcf8a', 22, 25]]);
  shot(107, 'burst through into the cave', (t) => {
    caveBase();
    const k = clamp((t - w(107) + 0.1) / 0.6);
    act(C.wk, t, { pos: cv(0, 3 * Math.sin(k * PI) * (1 - k * 0.5), lerp(19, 9, easeOut(k))), yaw: PI, keys: [[0, 'cheer'], [w(107) + 0.5, 'crouch', 'snap', 0.2], [w(110), 'idle', 'io', 0.4]], faces: [[0, 'joy'], [w(110), 'shock']], look: [0.5, 0.3] });
    FX.sparkBurst(cv(0, 6, 18), t, w(107) - 0.05, 30, 4, 0.8, 3, '#e0f6ff');
    cam(t, [[w(107) - 0.1, cv(3, 4, -2), cv(0, 4, 12), 50], [w(114), cv(2.5, 4.2, -1), cv(0, 4, 9), 50]], { ap: 0.3 });
  });
  shot(114, 'stone beds', (t) => { caveBase(); cam(t, [[w(114) - 0.1, cv(-6, 4, -5), cv(-4, 1, -12), 46], [w(116), cv(-4, 4, -6), cv(-2, 1, -12), 46]], { ap: 0.3 }); });
  shot(116, 'stone bowls', (t) => { caveBase(); cam(t, [[w(116) - 0.1, cv(2, 4.0, 2), cv(0, 1.6, -3), 42], [w(118), cv(1, 3.6, 1.2), cv(0, 1.6, -3), 42]], { ap: 0.5 }); });
  shot(118, 'stone everything (bites stone peach)', (t) => {
    caveBase();
    const b = w(119);
    act(C.wk, t, { pos: cv(1, 0, 0), yaw: PI - 0.2, keys: [[0, { from: 'idle', ikR: { t: [-0.2, 4.9, 1.1], k: 1, pole: [1, -0.6, 0] } }]], faces: [[0, 'happy'], [b, { open: 1.2, pupil: 1, mouthOpen: 0.6, teeth: 1, smile: -0.3, browH: 1 }]], talk: [[w(118) - 0.1, b, 0.8]] });
    hold(C.peach, C.wk, 'R', [0, 0, 0.2]); C.peach.material = WD.STONE;
    kick(t, b, 0.6, 0.3); FX.sparkBurst(C.wk.gripWorld('R'), t, b, 8, 0.8, 0.4, 3, '#ffffff');
    const [cp, h] = headCam(C.wk, [0.8, 0.0, -3.4]); cam(t, [[w(118) - 0.1, cp, h, 40], [w(120), add(cp, [0, 0, 0.3]), h, 40]], { ap: 0.5 });
  });
  shot(120, 'and just like that... (walks to throne)', (t) => {
    caveBase();
    act(C.wk, t, { keys: [[0, 'idle']], faces: [[0, 'proud']], walk: { path: [[CV[0], CV[2] - 2], [CV[0], CV[2] - 12]], t0: w(120) - 0.1, t1: w(124) - 0.15, y: 0 } });
    troupe(t, cv(0, 0, 6), 'shock', 'idle', { r: 4, arc: PI * 0.8, a0: PI });
    cam(t, [[w(120) - 0.1, cv(0, 6, 14), cv(0, 4, -8), 48], [w(124), cv(0, 6.5, 11), cv(0, 4, -10), 48]], { ap: 0.2 });
  });
  shot(124, 'I was the MONKEY KING', (t) => {
    caveBase();
    act(C.wk, t, { pos: cv(0, 0.6, -14.2), yaw: 0, keys: [[0, 'sit'], [w(127), { from: 'sit', shR: [-0.2, 0, -2.4], elR: [-0.3, 0, 0] }, 'back', 0.3]], faces: [[0, 'proud'], [w(127), 'joy']] });
    onHead(C.crown, C.wk, [0, 0.95, 0], [0, 0, 0.12]); C.crown.scale.setScalar(Math.max(0.01, back(clamp((t - w(125)) / 0.3))));
    troupe(t, cv(0, 0, -14), 'joy', (i) => [[0, 'idle'], [w(126) + i * 0.05, 'cheer', 'back', 0.3]], { r: 6, arc: PI * 0.9, a0: 0, extra: bob(0.25, 8) });
    FX.sparkBurst(C.wk.headWorld([0, 1.2, 0]), t, w(125), 30, 3, 1.0, 9, '#ffe07a'); hit(w(127), { z: 0.15, sh: 0.5, ds: 0, ca: 0.6 });
    cam(t, [[w(124) - 0.1, cv(2, 4.5, -4), cv(0, 4, -14), 46], [w(129), cv(1.5, 4.8, -6), cv(0, 4.4, -14), 46]], { ap: 0.3 });
    st.bloom = 0.8;
  });
  // ===== PARTY =====
  const party = () => { L('golden', su(0, 8)); C.lanterns.visible = true; WD.lamp(0, su(-6, 4, 6), '#ff9a50', 40, 18); WD.lamp(1, su(0, 14, 6), '#ff9a50', 40, 18); WD.lamp(2, su(6, 10, 6), '#ff9a50', 40, 18); };
  shot(129, 'partied for 300 years', (t) => {
    party();
    troupe(t, su(0, 9), 'joy', 'cheer', { r: 4.5, arc: PI * 2, a0: t * 0.5, extra: bob(0.4, 10) });
    act(C.wk, t, { pos: su(0, 9), yaw: t * 2, keys: [[0, 'cheer']], faces: [[0, 'joy']], extra: bob(0.5, 10) }); onHead(C.crown, C.wk, [0, 0.95, 0], [0, 0, 0.12]);
    WD.updatePetals(t, true);
    cam(t, [[w(129) - 0.1, su(9, 21, 6), su(0, 9, 3), 52], [w(135), su(-6, 22, 6), su(0, 9, 3), 52]], { ap: 0.15 });
  });
  shot(135, 'peaches', (t) => {
    party();
    act(C.wk, t, { pos: su(0, 9), yaw: 0, keys: [[0, { from: 'idle', ikR: { t: [-0.15, 5.0, 1.0], k: 1, pole: [1, -0.6, 0] } }]], faces: [[0, { happy: 1, smile: 1, mouthOpen: 0.7 + 0.3 * Math.sin(t * 20), teeth: 1, blush: 1 }]] });
    onHead(C.crown, C.wk, [0, 0.95, 0], [0, 0, 0.12]); hold(C.peach, C.wk, 'R', [0, 0, 0.2]); C.peach.material = C.peachM;
    const [cp, h] = headCam(C.wk, [0.5, 0, 3.6]); cam(t, [[w(135) - 0.1, cp, h, 40], [w(136), add(cp, [0, 0, -0.3]), h, 40]], { ap: 0.6 });
  });
  shot(136, 'games (leapfrog)', (t) => {
    party();
    C.mk.slice(0, 4).forEach((m, i) => { const ph = (t * 1.6 + i * 0.5) % 2; const jump = ph < 0.5; act(m, t, { pos: su(-4 + i * 2.6 + (jump ? ph * 5.2 : 0), 10), yaw: PI / 2, keys: [[0, jump ? 'cheer' : 'crouch']], faces: [[0, 'joy']], extra: (tt, p) => ({ ...p, hy: (p.hy || 0) + (jump ? Math.sin(ph / 0.5 * PI) * 2.2 : 0) }) }); });
    cam(t, [[w(136) - 0.1, su(2, 19, 3), su(1, 10, 2), 44], [w(137), su(1, 18.5, 3), su(1, 10, 2), 44]], { ap: 0.25 });
  });
  shot(137, 'zero homework', (t) => {
    party();
    act(C.wk, t, { pos: su(0, 9, 0.6), yaw: 0, pitch: -1.35, keys: [[0, { hy: -1.6, shL: [-2.9, 0, 0.3], shR: [-2.9, 0, -0.3], elL: [-1.8, 0, 0], elR: [-1.8, 0, 0], hipL: [-0.3, 0, 0], knL: [0.8, 0, 0] }]], faces: [[0, { happy: 1, smile: 1, blush: 0.6 }]] });
    onHead(C.crown, C.wk, [0, 0.95, 0], [0, 0, 0.12]);
    const h = C.wk.headWorld(); cam(t, [[w(137) - 0.1, add(h, [1.5, 4.5, 1.2]), h, 44], [w(139), add(h, [1.2, 4.0, 1.0]), h, 44]], { ap: 0.4 });
    WD.updatePetals(t, true);
  });
  // ===== DEATH =====
  shot(139, 'my oldest friend getting old', (t) => {
    L('golden', su(4, 14));
    act(C.old, t, { keys: [[0, { from: 'idle', waist: [0.5, 0, 0], neck: [-0.3, 0, 0], ikR: { t: [-0.9, 2.2, 1.2], k: 1, pole: [1, -0.3, 0] } }]], faces: [[0, { open: 0.45, smile: -0.1, browH: 0.2 }]], walk: { path: [[5, 17], [2.5, 15]], t0: w(139) - 0.1, t1: w(149), amp: 0.35, y: Y } });
    hold(C.cane, C.old, 'R', [0, -0.9, 0.1]);
    act(C.wk, t, { pos: su(-0.5, 12.5), yaw: 0.9, keys: [[0, 'idle']], faces: [[0, 'neutral'], [w(145), 'worried'], [w(146), 'sad']], look: [0.6, 0] }); onHead(C.crown, C.wk, [0, 0.95, 0], [0, 0, 0.12]);
    cam(t, [[w(139) - 0.1, su(1, 27, 4), su(1.5, 14.5, 2.5), 44], [w(149), su(1, 25, 4), su(1.5, 14.5, 2.5), 44]], { ap: 0.3 });
    st.sat = 0.85;
  });
  shot(149, 'scariest word (night)', (t) => {
    L('night', su(0, 40)); WD.lamp(0, su(0, 44, 6), '#9fb8ff', 30, 20);
    act(C.wk, t, { pos: su(0, 40, 0.25), yaw: 0, keys: [[0, { from: 'sit', waist: [0.35, 0, 0], neck: [0.3, 0, 0] }]], faces: [[0, 'sad']] });
    cam(t, [[w(149) - 0.1, su(3, 49, 3), su(0, 40, 2.5), 50], [w(158), su(2, 46.5, 3.2), su(0, 40, 2.8), 50]], { ap: 0.2 });
    st.sat = 0.7;
  });
  shot(158, 'DEATH', (t) => {
    L('night', su(0, 40));
    act(C.wk, t, { pos: su(0, 40, 0.25), yaw: 0, keys: [[0, { from: 'sit', waist: [0.1, 0, 0] }]], faces: [[0, 'terror']], noSacc: true });
    WD.lamp(1, C.wk.headWorld([0, -0.6, 2.5]), '#ff8080', 14, 8);
    const [cp, h] = headCam(C.wk, [0, 0, 2.6]); cam(t, [[w(158) - 0.1, cp, h, 36], [w(159), add(cp, [0, 0, -0.5]), h, 36, 0, 'in']], { ap: 0.6 });
    hit(w(158), { z: 0.15, sh: 0.5, ds: 1.0, ca: 1.5, hold: true }); st.vign = 0.75; st.tint = '#ffd0d0';
  });
  shot(159, 'so I made a promise', (t) => {
    L('morning', su(0, 52));
    act(C.wk, t, { pos: su(0, 52), yaw: PI, keys: [[0, 'idle'], [w(161), { shR: [-0.2, 0, -2.0], elR: [-1.5, 0, 0] }, 'back', 0.3]], faces: [[0, 'angry']], extra: (tt, p) => ({ ...p, tailWag: 2 }) });
    const [cp, h] = headCam(C.wk, [-2.2, -1.0, -4.0]); cam(t, [[w(159) - 0.1, cp, h, 42], [w(164), add(cp, [0.3, 0, 0.4]), h, 42]], { ap: 0.4 });
  });
  shot(164, 'I would NEVER die (hero low angle)', (t) => {
    L('morning', su(0, 52));
    act(C.wk, t, { pos: su(0, 52), yaw: PI + 0.25, keys: [[0, { from: 'idle', shR: [-0.2, 0, -2.6], elR: [-0.2, 0, 0], shL: [0.2, 0, 0.3] }]], faces: [[0, 'angry']], talk: [[w(164), e(167), 0.8]] });
    hit(w(166), { z: 0.15, sh: 0.6, ds: 0, ca: 0.8 });
    cam(t, [[w(164) - 0.1, su(-2.5, 47.5, 1.2), su(0, 52, 5), 54, 0.08], [w(168), su(-2.2, 48.2, 1.2), su(0, 52, 5.4), 54, 0.08]], { ap: 0.2 });
  });
  // ===== RAFT / SEA =====
  const RB = [0, 0, 194];
  shot(168, 'I built a raft', (t) => {
    L('day', RB); WD.raft.position.set(RB[0], 0, RB[2]); WD.raft.rotation.set(0, 0, 0);
    const hm = Math.max(0, Math.sin((t - w(168)) * 12));
    act(C.wk, t, { pos: [RB[0] + 0.5, 0.65, RB[2] + 1], yaw: -PI / 2, keys: [[0, 'crouch']], faces: [[0, 'angry']], extra: (tt, p) => ({ ...p, shR: [-1.9 + 1.2 * Math.max(0, Math.sin((tt - w(168)) * 12)), 0, -0.2], elR: [-0.4, 0, 0] }) });
    hold(C.hammer, C.wk, 'R', [0, -0.1, 0.2], [PI / 2, 0, 0]);
    if (hm > 0.97) FX.sparkBurst([RB[0] - 1, 0.8, RB[2] + 1], t, t - 0.01, 5, 0.6, 0.2, Math.floor(t * 9), '#ffe0a0');
    cam(t, [[w(168) - 0.1, [RB[0] + 3, 4.5, RB[2] + 13], [RB[0], 1.8, RB[2]], 44], [w(172), [RB[0] + 2.5, 4.2, RB[2] + 12], [RB[0], 1.8, RB[2]], 44]], { ap: 0.3 });
  });
  const SEA = [-300, 0, 300];
  const raftScene = (t, light) => { L(light, SEA); WD.raft.position.set(SEA[0], 0.1 + Math.sin(t * 1.3) * 0.25, SEA[2]); WD.raft.rotation.set(Math.sin(t * 1.1) * 0.05, 0, Math.sin(t * 0.9) * 0.06); };
  shot(172, 'sailed for ten years', (t) => {
    const k = clamp((t - w(172)) / (w(177) - w(172)));
    raftScene(t, k < 0.33 ? 'day' : k < 0.66 ? 'golden' : 'night');
    act(C.wk, t, { pos: add(WD.raft.position.toArray(), [0.5, 0.6, 0.8]), yaw: 0.3, keys: [[0, 'cross']], faces: [[0, 'bored']] });
    cam(t, [[w(172) - 0.1, add(SEA, [14, 7, 18]), add(SEA, [0, 3, 0]), 48], [w(177), add(SEA, [-8, 9, 20]), add(SEA, [0, 3, 0]), 48, 0, 'lin']], { ap: 0.1, hand: 0.15 });
  });
  shot(177, 'find a master (spots misty mountain)', (t) => {
    raftScene(t, 'morning');
    act(C.wk, t, { pos: add(WD.raft.position.toArray(), [0.5, 0.6, 0.8]), yaw: PI * 0.75, keys: [[0, { from: 'idle', ikR: { t: [-0.3, 6.0, 0.9], k: 1, pole: [1, 0.4, 0] } }], [w(184), { from: 'point', ikR: { t: [0, 0, 0], k: 0 } }, 'back', 0.3]], faces: [[0, 'hopeful'], [w(184), 'joy']] });
    cam(t, [[w(177) - 0.1, add(SEA, [7, 4.0, -5]), add(SEA, [0.5, 4.4, 0.8]), 40], [w(188), add(SEA, [6.5, 3.8, -4.5]), add(SEA, [0.5, 4.6, 0.8]), 40]], { ap: 0.4 });
  });
  // ===== SUBODHI =====
  const TP = WD.TEM; const tp = (x, y, z) => [TP[0] + x, y, TP[2] + z];
  const misty = (night = false) => { L(night ? 'night' : 'misty', TP); if (night) { WD.lamp(0, tp(-6, 3, -4), '#ffb35c', 40, 18); WD.lamp(1, tp(6, 3, -4), '#ffb35c', 40, 18); } };
  const subP = tp(0, 1.0, -9.2);
  const subAct = (t, o = {}) => act(C.sub, t, { pos: subP, yaw: 0, keys: o.keys || [[0, 'idle']], faces: o.faces || [[0, { open: 0.45, smile: 0.25 }]], talk: o.talk, look: o.look, extra: o.extra });
  shot(188, 'misty mountain arrival', (t) => {
    misty();
    act(C.wkR, t, { keys: [[0, 'idle']], faces: [[0, 'hopeful']], walk: { path: [[TP[0], TP[2] + 16], [TP[0], TP[2] + 4]], t0: w(188) - 0.2, t1: w(195), y: 0 } });
    C.stu.forEach((s, i) => act(s, t, { pos: tp(-7 + i * 7, 0, 2 - (i % 2) * 2), yaw: i === 1 ? 0.2 : (i ? -0.8 : 0.8), keys: [[0, 'cross']], faces: [[0, 'neutral']] }));
    subAct(t);
    cam(t, [[w(188) - 0.1, tp(0, 9, 30), tp(0, 4, -6), 46], [w(195), tp(0, 7, 22), tp(0, 4, -6), 46]], { ap: 0.1 });
  });
  shot(195, 'Master Subodhi (eyes open)', (t) => {
    misty();
    subAct(t, { faces: [[0, { open: 0.05, smile: 0.2 }], [w(196), { open: 0.75, smile: 0.3, browH: 0.3 }]] });
    WD.lamp(1, tp(0, 6, -12), '#fff0c0', 60 * S(w(196), w(197), t), 12);
    const [cp, h] = headCam(C.sub, [0.4, -0.4, 4.6]); cam(t, [[w(195) - 0.1, add(cp, [0, -0.2, 1.4]), h, 40], [w(197), cp, h, 40]], { ap: 0.6 });
    FX.sparkBurst(C.sub.headWorld([0, 0.5, 0]), t, w(196), 20, 2.5, 1.0, 5, '#fff3c0');
  });
  shot(197, 'He named me Sun Wukong', (t) => {
    misty();
    subAct(t, { keys: [[0, 'idle'], [w(198), 'point', 'back', 0.3]], talk: [[w(197), e(201), 0.5]] });
    act(C.wkR, t, { pos: tp(0, 0, -4), yaw: PI, keys: [[0, 'idle'], [w(200), { from: 'idle', waist: [0.35, 0, 0], neck: [0.2, 0, 0] }, 'io', 0.3]], faces: [[0, 'hopeful'], [w(200), 'joy']] });
    cam(t, [[w(197) - 0.1, tp(5, 5, 2), tp(-0.5, 4.2, -7), 44], [w(202), tp(4.5, 5, 1), tp(-0.5, 4.2, -7), 44]], { ap: 0.3 });
  });
  shot(202, 'monkey who understands emptiness', (t) => {
    misty();
    subAct(t, { keys: [[0, { from: 'idle', shL: [-1.0, 0, 0.5], elL: [-0.8, 0, 0], shR: [-1.0, 0, -0.5], elR: [-0.8, 0, 0] }]], faces: [[0, { open: 0.4, smile: 0.4, browH: 0.4 }]], talk: [[w(202), e(208), 0.7]] });
    FX.sparkBurst(C.sub.gripWorld('L'), t, w(204), 20, 2, 1.5, 11, '#fff3c0');
    const [cp, h] = headCam(C.sub, [-1.2, -0.6, 4.6]); cam(t, [[w(202) - 0.1, cp, h, 40], [w(209), add(cp, [0.2, 0, -0.4]), h, 40]], { ap: 0.5 });
  });
  shot(209, 'I still dont understand it', (t) => {
    misty();
    act(C.wkR, t, { pos: tp(0, 0, -4), yaw: PI + 2.8, keys: [[0, { from: 'idle', ikR: { t: [-0.5, 6.3, 0.6], k: 1, pole: [1, 0.5, 0] } }]], faces: [[0, 'confused']], talk: [[w(209), e(213), 0.6]], extra: (tt, p) => ({ ...p, neck: add(p.neck || [0, 0, 0], [0, 0, Math.sin(tt * 10) * 0.04]) }) });
    FX.qmark(C.wkR.headWorld([0, 1.5, 0]), t, w(210), 1.0);
    const [cp, h] = headCam(C.wkR, [0.6, 0.1, 3.4]); cam(t, [[w(209) - 0.1, cp, h, 40], [w(214), add(cp, [0, 0, -0.3]), h, 40]], { ap: 0.6 });
  });
  shot(214, 'one night, secrets (whisper)', (t) => {
    misty(true);
    subAct(t, { keys: [[0, { from: 'lean', waist: [0.3, 0.2, 0], neck: [0.2, 0.3, 0] }]], faces: [[0, 'whisper']], talk: [[w(214), e(221), 0.4]] });
    act(C.wkR, t, { pos: tp(1.2, 0, -7.0), yaw: PI - 0.6, keys: [[0, { from: 'lean', waist: [0.2, -0.3, 0] }]], faces: [[0, 'hopeful']] });
    cam(t, [[w(214) - 0.1, tp(-3.5, 5.6, -2), tp(0.6, 5.2, -8), 42], [w(222), tp(-3, 5.6, -3), tp(0.6, 5.2, -8), 42]], { ap: 0.4 });
  });
  shot(222, 'seventy-two transformations', (t) => {
    misty(true);
    const P0 = tp(0, 0, -2); const seg = Math.max(0.2, (e(223) + 0.2 - w(222)) / 4); const i = clamp(Math.floor((t - w(222)) / seg), 0, 3); const ts = w(222) + i * seg;
    FX.poof(add(P0, [0, 2.5, 0]), t, ts, 0.7, i * 7, 0.4);
    if (i === 0) act(C.wkR, t, { pos: P0, yaw: PI * 0.9, keys: [[0, 'cheer']], faces: [[0, 'joy']] });
    if (i === 1) { C.bigPeach.visible = true; C.bigPeach.position.set(...add(P0, [0, 2.2, 0])); C.bigPeach.scale.setScalar(Math.max(0.01, back(clamp((t - ts) / 0.25)))); }
    if (i === 2) { C.rock.visible = true; C.rock.position.set(...add(P0, [0, 2.0, 0])); C.rock.scale.setScalar(Math.max(0.01, back(clamp((t - ts) / 0.25)))); }
    if (i === 3) { C.bird.visible = true; C.bird.position.set(...add(P0, [0, 3.0 + Math.sin(t * 6) * 0.3, 0])); C.bird.rotation.y = 0; C.wings.forEach((g, j) => g.rotation.z = (j ? -1 : 1) * Math.sin(t * 22) * 0.7); }
    kick(t, ts, 0.5, 0.2);
    cam(t, [[w(222) - 0.1, tp(0, 4.5, 11), add(P0, [0, 2.4, 0]), 44], [w(224), tp(0, 4.5, 9.5), add(P0, [0, 2.4, 0]), 44]], { ap: 0.25 });
  });
  shot(224, 'and the cloud somersault', (t) => {
    misty(true);
    const k = clamp((t - w(226)) / 0.6); const P0 = tp(0, 0, -2);
    act(C.wkR, t, { pos: flipPos(add(P0, [0, 6 * easeIn(k), 0]), PI, -k * PI * 2, C.wkR), yaw: PI, pitch: -k * PI * 2, keys: [[0, 'crouch'], [w(226), 'cheer', 'snap', 0.2]], faces: [[0, 'smug'], [w(226), 'joy']] });
    if (k > 0.3) nimbusUnder(C.wkR, t);
    FX.sparkBurst(add(P0, [0, 1, 0]), t, w(226), 20, 3, 0.7, 13, '#fff3c0');
    cam(t, [[w(224) - 0.1, tp(4, 3, 8), add(P0, [0, 3, 0]), 46], [w(228), tp(3, 3, 9), add(P0, [0, 6, 0]), 50]], { ap: 0.2 });
  });
  shot(228, 'one flip (sky)', (t) => {
    L('day', [0, 120, 0]);
    const k = clamp((t - w(228)) / Math.max(0.2, w(230) - w(228)));
    act(C.wkR, t, { pos: flipPos([lerp(-4, 4, k), 120 + Math.sin(k * PI) * 2, 0], PI / 2, -k * PI * 2, C.wkR), yaw: PI / 2, pitch: -k * PI * 2, keys: [[0, 'cheer']], faces: [[0, 'joy']] });
    nimbusUnder(C.wkR, t);
    cam(t, [[w(228) - 0.1, [0, 120, 16], [0, 122, 0], 50], [w(230), [0, 120.5, 15], [1, 122.5, 0], 50]], { ap: 0.0 });
  });
  shot(230, 'farther than around the whole world', (t) => {
    L('day', WD.GLOBE); WD.sky.visible = false; WD.stars.visible = true; scene.fog.density = 0;
    const k = clamp((t - w(230)) / (w(240) - w(230))); const G = WD.GLOBE; const a = -PI / 2 + k * PI * 2.2;
    const p = [G[0] + Math.cos(a) * 47, G[1] + Math.sin(a) * 10, G[2] + Math.sin(a) * 47];
    act(C.wkR, t, { pos: p, yaw: -a, keys: [[0, 'cheer']], faces: [[0, 'joy']], s: 1.8 }); nimbusUnder(C.wkR, t, 2.2);
    for (let i = 1; i < 14; i++) { const b = a - i * 0.06; FX.sprite(FX.TEX.spark, [G[0] + Math.cos(b) * 47, G[1] + Math.sin(b) * 10 + 1, G[2] + Math.sin(b) * 47], 3 * (1 - i / 14), 1 - i / 14, i, '#fff3b0', true, 3); }
    WD.globe.rotation.y = t * 0.1;
    cam(t, [[w(230) - 0.1, add(G, [0, 40, 130]), G, 48], [w(240), add(G, [20, 25, 120]), G, 48]], { ap: 0.0 });
    st.bloom = 0.8;
  });
  shot(240, 'so of course I showed off', (t) => {
    misty();
    act(C.wkR, t, { pos: tp(0, 0, -2), yaw: PI, keys: [[0, 'hips']], faces: [[0, 'smug']], talk: [[w(240), e(245), 0.6]], extra: (tt, p) => ({ ...p, tailWag: 2.5 }) });
    C.stu.forEach((s, i) => act(s, t, { pos: tp([-6.5, -3.4, 5.5][i], 0, [6, 8, 6.5][i]), yaw: PI + (i - 1) * 0.3, keys: [[0, 'cross']], faces: [[0, 'neutral']] }));
    const [cp, h] = headCam(C.wkR, [-1.5, -0.4, -4.4]); cam(t, [[w(240) - 0.1, cp, h, 42], [w(246), add(cp, [0, 0, 0.4]), h, 42]], { ap: 0.4 });
  });
  shot(246, 'turned into a pine tree', (t) => {
    misty();
    const tf = w(249); const P0 = tp(0, 0, -2);
    if (t < tf) act(C.wkR, t, { pos: P0, yaw: 0, keys: [[0, 'cheer']], faces: [[0, 'joy']] });
    else { C.treeMk.visible = true; C.treeMk.position.set(...P0); C.treeMk.scale.setScalar(Math.max(0.01, back(clamp((t - tf) / 0.3)))); C.treeTail.rotation.z = Math.sin(t * 5) * 0.3; }
    FX.poof(add(P0, [0, 3, 0]), t, tf - 0.05, 0.9, 21, 0.5);
    C.stu.forEach((s, i) => act(s, t, { pos: tp([-6.5, -3.4, 5.5][i], 0, [6, 8, 6.5][i]), yaw: PI + (i - 1) * 0.3, keys: [[0, 'cross'], [tf + 0.2 + i * 0.06, 'cheer', 'back', 0.3]], faces: [[0, 'neutral'], [tf + 0.2, 'joy']], extra: t > tf + 0.3 ? (tt, p) => bob(0.3, 10)(tt, p, i) : null }));
    cam(t, [[w(246) - 0.1, tp(0, 10, 20), tp(0, 3.6, -2), 46], [w(256), tp(1, 9.5, 18), tp(0, 3.8, -2), 46]], { ap: 0.15 });
  });
  shot(256, 'Master was furious', (t) => {
    misty();
    subAct(t, { keys: [[0, 'idle'], [w(257), { from: 'idle', shL: [0.1, 0, 0.5], shR: [0.1, 0, -0.5], elL: [-0.5, 0, 0], elR: [-0.5, 0, 0] }, 'snap', 0.25]], faces: [[0, 'angry']] });
    const [cp, h] = headCam(C.sub, [0, -0.8, 4.2]); cam(t, [[w(256) - 0.1, add(cp, [0, 0, 1.5]), h, 40], [w(259), cp, h, 40, 0, 'in']], { ap: 0.5 });
    st.tint = '#ffd8c8'; hit(w(258), { z: 0.12, sh: 0.5, ds: 0.2, ca: 0.6 });
  });
  shot(259, 'LEAVE!', (t) => {
    misty();
    subAct(t, { keys: [[0, 'point']], faces: [[0, 'shout']], talk: [[w(259), e(259), 1.3]] });
    act(C.wkR, t, { pos: tp(0, 0, -2), yaw: PI, keys: [[0, 'recoil']], faces: [[0, 'scared']], extra: (tt, p) => ({ ...p, tailWag: 0.2 }) });
    hit(w(259), { z: 0.25, sh: 1.2, ds: 0.4, ca: 1.6 });
    const [cp, h] = headCam(C.sub, [0.8, -1.4, 3.6]); cam(t, [[w(259) - 0.1, cp, h, 42], [w(260), cp, h, 42]], { ap: 0.5 });
  });
  shot(260, 'never tell anyone', (t) => {
    misty();
    subAct(t, { keys: [[0, 'point']], faces: [[0, 'angry']], talk: [[w(260), e(267), 1]] });
    act(C.wkR, t, { pos: tp(0, 0, -2), yaw: PI, keys: [[0, { from: 'idle', waist: [0.3, 0, 0], neck: [0.4, 0, 0] }]], faces: [[0, 'sad']] });
    cam(t, [[w(260) - 0.1, tp(-4, 4, 4), tp(0, 4.5, -5), 44], [w(268), tp(-3.5, 4.2, 3), tp(0, 4.5, -5), 44]], { ap: 0.3 });
  });
  shot(268, 'then he said one more thing', (t) => {
    misty();
    subAct(t, { faces: [[0, { open: 0.5, smile: -0.3, browH: -0.2, browA: 0.3 }]], talk: [[w(268), e(273), 0.6]] });
    const [cp, h] = headCam(C.sub, [0, -0.3, 3.4]); cam(t, [[w(268) - 0.1, cp, h, 38], [w(274), add(cp, [0, 0, -0.4]), h, 38]], { ap: 0.6 });
    st.vign = 0.5;
  });
  shot(274, 'vision: trapped under a mountain', (t) => {
    L('storm', [0, 0, 600]);
    const k = clamp((t - w(276)) / 0.4);
    act(C.wkR, t, { pos: [0, -3.2, 600], yaw: 0, keys: [[0, { from: 'idle', shL: [-2.7, 0, 0.3], shR: [-2.7, 0, -0.3] }]], faces: [[0, 'terror']] });
    C.mtn.visible = true; C.mtn.position.set(0, lerp(30, -5.5, easeIn(k)), 598.5); kick(t, w(276) + 0.4, 1.4, 0.7);
    FX.poof([0, 0.5, 599], t, w(276) + 0.4, 1.2, 3, 0.8);
    cam(t, [[w(274) - 0.1, [3, 3, 612], [0, 4, 600], 50], [w(284), [2, 2.2, 607], [0, 2.5, 600], 50]], { ap: 0.2 });
    st.desat = Math.max(st.desat || 0, 0.75); st.vign = 0.7; st.grain = 0.08;
  });
  shot(284, 'I laughed', (t) => {
    misty();
    act(C.wkR, t, { pos: tp(0, 0, -2), yaw: PI + 2.9, keys: [[0, { from: 'idle', waist: [0.3, 0, 0], ikR: { t: [-0.9, 3.4, 0.6], k: 1, pole: [1, 0, 0] } }]], faces: [[0, { happy: 1, smile: 1, mouthOpen: 0.8, teeth: 1, blush: 0.8 }]], extra: (tt, p) => ({ ...p, waist: add(p.waist, [0.1 * Math.abs(Math.sin(tt * 14)), 0, 0]), hy: 0.08 * Math.abs(Math.sin(tt * 14)) }) });
    const [cp, h] = headCam(C.wkR, [0.6, -0.3, 3.8]); cam(t, [[w(284) - 0.1, cp, h, 40], [w(286), add(cp, [0, 0, -0.3]), h, 40]], { ap: 0.5 });
  });
  shot(286, 'flew home in one somersault', (t) => {
    L('golden', [0, 60, 0]);
    const k = clamp((t - w(286)) / Math.max(0.3, w(292) - w(286)));
    const p = [lerp(-260, 0, easeOut(k)), lerp(70, 40, k), lerp(240, 20, easeOut(k))];
    act(C.wkR, t, { pos: p, yaw: Math.atan2(260, -220), keys: [[0, 'cheer']], faces: [[0, 'joy']] }); nimbusUnder(C.wkR, t);
    cam(t, [[w(286) - 0.1, add(p, [8, 3, 10]), add(p, [0, 3, 0]), 50], [w(292), add(p, [8, 3, 10]), add(p, [0, 3, 0]), 50]], { ap: 0.0, hand: 0.2 });
  });
  // ===== EMPTY MOUNTAIN =====
  const CL = [3, 0, 30];
  const storm = () => { L('storm', su(0, 28), [[su(2, 32, 8), '#c8b8ff', 45, 30]]); st.exposure = 1.25; st.flash = 0.25 * Math.max(0, 1 - Math.abs(((st.time * 0.37) % 1) - 0.5) / 0.03); C.clues.visible = true; C.clues.position.set(...CL); C.clues.rotation.set(0, -2.2, 0); C.clues.position.y = 0; };
  shot(292, 'but when I landed', (t) => {
    storm();
    const k = clamp((t - w(292) + 0.1) / 0.5);
    act(C.wkR, t, { pos: su(0, 26, 5 * (1 - easeOut(k))), yaw: PI, keys: [[0, 'cheer'], [w(292) + 0.4, 'crouch', 'snap', 0.2], [w(294), { from: 'idle', shR: [-0.3, 0, -2.4] }, 'back', 0.3]], faces: [[0, 'joy'], [w(294), 'happy']] });
    kick(t, w(292) + 0.4, 0.8, 0.4); FX.poof(su(0, 26), t, w(292) + 0.35, 1.2, 4);
    cam(t, [[w(292) - 0.1, su(2, 17, 3), su(0, 26, 4), 46], [w(296), su(1.5, 18, 3), su(0, 26, 4), 46]], { ap: 0.3 });
  });
  shot(296, 'my mountain was empty', (t) => {
    storm();
    act(C.wkR, t, { pos: su(0, 26), yaw: PI, keys: [[0, 'idle']], faces: [[0, 'worried']] });
    cam(t, [[w(296) - 0.1, su(6, 44, 12), su(0, 22), 50], [w(300), su(5, 47, 15), su(0, 22), 50]], { ap: 0.0 });
    st.sat = 0.7;
  });
  shot(300, 'every single monkey...', (t) => {
    storm();
    act(C.wkR, t, { pos: su(0, 26), yaw: PI - 0.7 + Math.sin(t * 2.2) * 0.35, keys: [[0, { from: 'idle', ikR: { t: [-0.3, 5.3, 1.0], k: 1, pole: [1, -0.5, 0] }, ikL: { t: [0.3, 5.3, 1.0], k: 1, pole: [1, -0.5, 0] } }]], faces: [[0, 'shout']], talk: [[w(300), e(302), 0.8]] });
    const [cp, h] = headCam(C.wkR, [0, 0.3, 0]); const fp = [h[0] + 3.2, h[1] + 0.6, h[2] - 3.8]; cam(t, [[w(300) - 0.1, fp, h, 40], [w(303), add(fp, [-0.3, 0, 0.4]), h, 40]], { ap: 0.5 });
  });
  shot(303, 'was gone (claw prints + scarf)', (t) => {
    storm();
    act(C.wkR, t, { pos: su(0, 26), yaw: 0.9, keys: [[0, { from: 'crouch', waist: [0.5, 0, 0], neck: [0.3, 0, 0] }]], faces: [[0, 'terror']] });
    hold(C.scarf, C.wkR, 'R', [0, -0.1, 0.1], [0, 0, 0]);
    const [cp, h] = headCam(C.wkR, [1.6, -0.3, 3.4], [0, -0.3, 0]); cam(t, [[w(303) - 0.1, cp, h, 42], [w(305), add(cp, [-0.6, -0.2, -0.8]), h, 42]], { ap: 0.4 }); WD.lamp(2, add(h, [1.5, 3, 3]), '#c8b8ff', 50, 18);
    hit(w(304), { z: 0.12, sh: 0.4, ds: 0.8, ca: 1.0, hold: true }); st.vign = 0.65;
  });
  shot(305, 'PART 2 end card', (t) => {
    storm();
    act(C.wkR, t, { pos: su(0, 26), yaw: 0, keys: [[0, { from: 'idle', ikR: { t: [-0.4, 4.4, 1.3], k: 1, pole: [1, -0.6, 0] } }]], faces: [[0, 'angry']] });
    hold(C.scarf, C.wkR, 'R', [0, -0.1, 0.1], [0, 0, Math.sin(t * 8) * 0.4]);
    const [cp, h] = headCam(C.wkR, [0.6, -0.4, 4.2]); cam(t, [[w(305) - 0.1, cp, h, 40], [T.duration, add(cp, [0, 0, -0.8]), h, 40, 0, 'in']], { ap: 0.5 });
    st.vign = 0.6; st.fade = S(T.duration - 0.25, T.duration, t);
  });
}

export function frameState(f) {
  const t = f / 30; st = { time: t }; hits = []; shake = 0; FX.resetFx(); hideAll();
  WD.egg.visible = false; WD.egg.position.x = 0;
  let k = 0; while (k < SH.length - 1 && t >= start(k + 1)) k++;
  WD.updatePetals(t, false);
  SH[k].fn(t);
  WD.sky.position.copy(camera.position); WD.stars.position.copy(camera.position);
  WD.updateSea(t); WD.updateWater(t);
  st.shot = k; st.bloom = st.bloom ?? 0.55; st.grain = st.grain ?? 0.03;
  return st;
}
// ---------- captions ----------
const SOLO = new Set([6, 106, 158, 259, 304]);
const BIG = new Set([158, 259]);
let CH = null;
function chunks() { if (CH) return CH; CH = []; let cur = []; const flush = () => { if (cur.length) CH.push(cur); cur = []; };
  for (let i = 0; i < NW; i++) { if (SOLO.has(i)) { flush(); CH.push([i]); continue; } cur.push(i); const w = T.words[i].w; if (/[.,!?:;]["”]?$|\.\.\.$/.test(w) || cur.length >= 3) flush(); } flush(); return CH; }
const clean = (w) => w.replace(/["“”]/g, '').toUpperCase().replace(/[.,:;]+$/, '');
export function captionChunk(t) {
  const L2 = chunks(); let c = null;
  for (const ch of L2) { const s = wS(ch[0]) - 0.05; const e2 = Math.max(wE(ch[ch.length - 1]) + 0.12, s + 0.35); if (t >= s && t < e2) c = ch; }
  if (!c) return null; let a = 0; c.forEach((i, j) => { if (t >= wS(i) - 0.03) a = j; });
  return { words: c.map(i => clean(T.words[i].w)), act: a, k: t - wS(c[a]), k0: t - wS(c[0]) + 0.05, big: BIG.has(c[0]) && c.length === 1, color: c[0] === 158 ? '#FF3B3B' : null };
}
// ---------- overlays ----------
function badge(ctx, txt, sub, x, y, s = 1, rot = -0.04, bg = '#FFD23F') { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.font = '64px Lucky'; let w = ctx.measureText(txt).width; if (sub) { ctx.font = '40px "Noto Sans CJK SC"'; w = Math.max(w, ctx.measureText(sub).width); } w += 60; ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(0, 0, w, 100 + (sub ? 52 : 0), 18); ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = '#0b0710'; ctx.stroke(); ctx.fillStyle = '#0b0710'; ctx.textBaseline = 'middle'; ctx.font = '64px Lucky'; ctx.fillText(txt, 30, 56); if (sub) { ctx.font = '700 40px "Noto Sans CJK SC"'; ctx.fillStyle = '#B0302A'; ctx.fillText(sub, 30, 120); } ctx.restore(); }
export function overlayFx(t) {
  const out = [];
  out.push((ctx, W, H) => badge(ctx, 'MONKEY KING · PART 1', null, -600 + 640 * easeOut(clamp(t / 0.35)), 120, 0.6, -0.03));
  if (t >= wS(62) && t < wS(69)) { const k = t - wS(62); out.push((ctx, W, H) => badge(ctx, 'THE JADE EMPEROR', '玉皇大帝 · RULER OF HEAVEN', -800 + 860 * easeOut(clamp(k / 0.25)), H * 0.19, 0.95, -0.04, '#FFE38A')); }
  if (t >= wS(195) && t < wS(197)) { const k = t - wS(195); out.push((ctx, W, H) => badge(ctx, 'MASTER SUBODHI', '须菩提祖师', -800 + 860 * easeOut(clamp(k / 0.25)), H * 0.19, 1, -0.04, '#E8DCC0')); }
  if (t >= wS(200) && t < wS(202) + 0.8) { const k = t - wS(200); out.push((ctx, W, H) => badge(ctx, 'SUN WUKONG', '孙悟空', -800 + 860 * easeOut(clamp(k / 0.25)), H * 0.19, 1.1, -0.04)); }
  if (t >= wS(172) && t < wS(177)) { const n = 1 + Math.floor(9.99 * clamp((t - wS(172)) / (wS(177) - wS(172)))); out.push((ctx, W, H) => { ctx.save(); ctx.translate(W / 2, H * 0.24); ctx.rotate(-0.05); ctx.font = '130px Lucky'; ctx.textAlign = 'center'; ctx.lineWidth = 22; ctx.strokeStyle = '#0b0710'; ctx.strokeText(`YEAR ${n}`, 0, 0); ctx.fillStyle = '#FFE53E'; ctx.fillText(`YEAR ${n}`, 0, 0); ctx.restore(); }); }
  if (t >= wS(230) && t < wS(240)) { out.push((ctx, W, H) => { ctx.save(); ctx.translate(W / 2, H * 0.22); ctx.rotate(0.04); ctx.font = '92px Lucky'; ctx.textAlign = 'center'; ctx.lineWidth = 18; ctx.strokeStyle = '#0b0710'; const n = Math.floor(108000 * easeOut(clamp((t - wS(230)) / 2.5))).toLocaleString('en-US'); ctx.strokeText(`${n} LI`, 0, 0); ctx.fillStyle = '#7FE3FF'; ctx.fillText(`${n} LI`, 0, 0); ctx.font = '48px Lucky'; ctx.lineWidth = 12; ctx.strokeText('= 54,000 KM IN ONE FLIP', 0, 80); ctx.fillStyle = '#fff'; ctx.fillText('= 54,000 KM IN ONE FLIP', 0, 80); ctx.restore(); }); }
  if (t >= wS(305)) { const k = t - wS(305); out.push((ctx, W, H) => { const s = Math.max(0.01, back(clamp(k / 0.35))); ctx.save(); ctx.translate(W / 2, H * 0.4); ctx.scale(s, s); ctx.rotate(-0.06); ctx.font = '210px Lucky'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 34; ctx.strokeStyle = '#0b0710'; ctx.strokeText('PART 2', 0, 0); ctx.fillStyle = '#FFD23F'; ctx.fillText('PART 2', 0, 0); ctx.font = '70px Lucky'; ctx.lineWidth = 16; ctx.strokeText('WHO TOOK THE MONKEYS?', 0, 150); ctx.fillStyle = '#ffffff'; ctx.fillText('WHO TOOK THE MONKEYS?', 0, 150); ctx.restore(); }); }
  return out;
}
