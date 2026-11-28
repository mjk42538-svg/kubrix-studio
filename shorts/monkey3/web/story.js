// THE MONKEY KING — Part 3: Heaven's Worst Job
import { THREE, scene, camera, PI, clamp, lerp, ss, S, easeOut, easeIn, back, spring, noise, hash, lerp3, part, P, plastic, glow, group, mesh, canvasTex } from './core.js';
import * as WD from "./mworld.js";
import * as W2 from "./mworld2.js";
import * as W3 from "./mworld3.js";
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
const at = (B) => (x, y, z) => [B[0] + x, B[1] + y, B[2] + z];
const hv = at(WD.HEAV), sb = at(W3.STB), pg = at(W3.PG), bq = at(W3.BQ), lb = at(W3.LAB), mr = at(W3.MAR);

// ---------- setup ----------
export async function setupStory() {
  T = await (await fetch('../work/' + (Q.get('timing') || 'timing_v2.json'))).json();
  try { setEnv(await (await fetch('../work/' + (Q.get('env') || 'env_v2.json'))).json()); } catch (e) { }
  wS = (i) => T.words[Math.min(i, T.words.length - 1)].s; wE = (i) => T.words[Math.min(i, T.words.length - 1)].e; NW = T.words.length;
  C = makeCast();
  C.staff = W2.staff(9); C.staff.visible = false;
  C.needle = W2.staff(9); C.needle.visible = false;
  C.brush = group([0, 0, 0]); { part(0.2, 3.2, 0.2, P('#8a5a2a'), [0, 1.6, 0], 0.06, C.brush); mesh(new THREE.ConeGeometry(0.3, 0.9, 8), P('#c8222a'), [0, -0.35, 0], C.brush, [PI, 0, 0]); C.brush.visible = false; }
  C.offer = group([0, 0, 0]); { mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.8, 10), P('#e0b040'), [0, 0.8, 0], C.offer, [0, 0, PI / 2]); mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.8, 10), P('#e0b040'), [0, -0.8, 0], C.offer, [0, 0, PI / 2]); mesh(new THREE.PlaneGeometry(1.6, 1.6), plastic('#f2e6c8', { map: WD.textTex('JOB OFFER', { bg: '#f2e6c8', color: '#b8222a', size: 120, w: 700, h: 700 }), side: THREE.DoubleSide }), [0, 0, 0], C.offer); C.offer.visible = false; }
  C.peach2 = W3.bigPeach(1);
  C.peachMeshes = []; for (const tr of W3.gardenTrees) tr.traverse(o => { if (o.isMesh && o.geometry.parameters && o.geometry.parameters.radius === 0.28) C.peachMeshes.push(o); });
  C.cup = WD.teacup;
  C.spear = W2.spear(7); C.spear.visible = false;
  buildShots();
  window.shotList = () => SH.map((s, i) => [i, s.name, s.i0, +start(i).toFixed(2)]);
}
function start(i) { return i === 0 ? 0 : wS(SH[i].i0) - 0.07; }
function shot(i0, name, fn) { SH.push({ i0, name, fn }); }
const PROPS = () => [C.spear, C.staff, C.needle, C.brush, C.offer, C.peach2, W3.hat, W3.peach, W3.pits, W3.jug, W3.gourd, W3.flag, WD.nimbus, WD.teacup];
function hideAll() { for (const r of C.all) r.hide(); for (const o of PROPS()) { o.visible = false; if (o.parent !== scene) scene.attach(o); o.scale.setScalar(1); o.rotation.set(0, 0, 0); } W3.hideSets(); W3.desk.visible = false; W3.desk.position.copy(W3.desk.userData.base); W3.desk.rotation.set(0, 0, 0); for (const m of C.peachMeshes) m.visible = true; for (const d of W3.bqDishes) d.userData.food.scale.set(1, 0.6, 1); }
function hold(obj, rig, side = 'R', pos = [0, 0, 0], rot = [0, 0, 0], s = 1) { const g = (side === 'R' ? rig.R : rig.L).grip; if (obj.parent !== g) g.add(obj); obj.position.set(...pos); obj.rotation.set(...rot); obj.scale.setScalar(s / rig.sc); obj.visible = true; }
function onHead(obj, rig, pos = [0, 0.85, 0], rot = [0, 0, 0], s = 1) { if (obj.parent !== rig.head) rig.head.add(obj); obj.position.set(...pos); obj.rotation.set(...rot); obj.scale.setScalar(s); obj.visible = true; }
function free(obj, pos, rot = [0, 0, 0], s = 1) { if (obj.parent !== scene) scene.attach(obj); obj.position.set(...pos); obj.rotation.set(...rot); obj.scale.setScalar(s); obj.visible = true; }
function nimbusUnder(rig, t, s = 1.25) { const n = WD.nimbus; n.visible = true; n.position.set(...add(rig.root.position.toArray(), [0, 0.2, 0])); n.rotation.set(0, rig.root.rotation.y + PI / 2, Math.sin(t * 3) * 0.05); n.scale.setScalar(s); }
function troupe(t, center, faces = 'happy', pose = 'idle', o = {}) { C.mk.forEach((m, i) => { const a = (o.a0 ?? 0) + i / C.mk.length * (o.arc ?? PI) - (o.arc ?? PI) / 2; const r = (o.r ?? 5) + (i % 2) * 1.2; const pos = [center[0] + Math.sin(a) * r, center[1], center[2] + Math.cos(a) * r]; const yaw = Math.atan2(center[0] - pos[0], center[2] - pos[2]) + (o.yawOff || 0); act(m, t, { pos, yaw, keys: typeof pose === 'function' ? pose(i) : [[0, pose]], faces: typeof faces === 'function' ? faces(i) : [[0, faces]], extra: o.extra ? (tt, p) => o.extra(tt, p, i) : null }); }); }
const bob = (amp = 0.3, sp = 9) => (tt, p, i = 0) => ({ ...p, hy: (p.hy || 0) + Math.abs(Math.sin(tt * sp + i)) * amp, shL: add(p.shL || [0, 0, 0], [0, 0, Math.abs(Math.sin(tt * sp + i)) * 1.2]), shR: add(p.shR || [0, 0, 0], [0, 0, -Math.abs(Math.sin(tt * sp + i + 1)) * 1.2]) });
function bubbles(t, c, n = 40, R = 6, H = 10, seed = 0) { for (let i = 0; i < n; i++) { const y = ((t * (1.2 + hash(i + seed) * 1.5) + hash(i + seed + 3) * H) % H); FX.sprite(FX.TEX.puff, [c[0] + (hash(i + seed + 1) - 0.5) * R * 2 + Math.sin(t * 2 + i) * 0.2, c[1] + y, c[2] + (hash(i + seed + 2) - 0.5) * R * 2], 0.12 + hash(i) * 0.2, 0.55 * (1 - y / H), 0, '#dffcff', false, 1.3); } }

function buildShots() {
  const w = wS, e = wE;
  const H = WD.HEAV;
  const HOME = su(0, 9);
  // ---------- lights ----------
  const goldSky = (t) => { L('golden', su(0, 0), [[su(0, 9, 8), '#ffd9a8', 60, 30]]); st.tint = '#ffe2b8'; st.bloom = 0.75; W3.armyRing.visible = true; W3.ringClouds.visible = true; };
  const dayHome = () => { L('day', su(0, 0)); };
  const heavL = (c = H) => { L('heaven', c); };
  const stableL = () => { heavL(W3.STB); W3.stable.visible = true; W3.desk.visible = true; };
  const flagUp = (t) => { free(W3.flag, su(-5, 3), [0, 0.5, 0], 1); W3.waveFlag(t); };
  const ohat = (s = 0.8) => onHead(W3.hat, C.wkR, [0, 0.95, -0.05], [0, 0, 0], s);
  const guard = (t, o = {}) => { act(C.sold[0], t, { pos: o.pos || sb(-5, 0, 10.5), yaw: o.yaw ?? 1.2, keys: o.keys || [[0, 'idle']], faces: o.faces || [[0, 'neutral']], talk: o.talk, extra: o.extra }); hold(C.spear, C.sold[0], 'L', [0, 0, 0], [0, 0, 0]); };
  const laugh = (tt, p) => ({ ...p, waist: add(p.waist || [0, 0, 0], [0.15 + 0.12 * Math.abs(Math.sin(tt * 13)), 0, 0]), neck: [-0.35, 0, 0] });
  const laughF = { happy: 1, smile: 1, mouthOpen: 0.95, teeth: 1, browH: 0.5, browA: 0.4 };
  const jadeSit = (t, keys = [], faces = [[0, 'neutral']], talk = null) => act(C.jade, t, { pos: [H[0], H[1] + 1.0, H[2] - 10.6], yaw: 0, keys: [[0, { from: 'sit', ikR: { t: [-0.4, 4.6, 1.7], k: 1, pole: [1, -0.7, 0] } }], ...keys], faces, talk });
  const fat = (t, t0) => -0.32 * S(t0, t0 + 0.5, t);

  // ===== HOOK: 100,000 soldiers around my house =====
  shot(0, 'HOOK army around the mountain', (t) => {
    goldSky(t); flagUp(t);
    act(C.wkR, t, { pos: HOME, yaw: 0.15, keys: [[0, { from: 'recoil', shL: [-0.6, 0, 0.5] }]], faces: [[0, 'scared']], extra: (tt, p) => ({ ...p, hips: add(p.hips || [0, 0, 0], [0, Math.sin(tt * 5) * 0.12, 0]) }) });
    hold(W3.peach, C.wkR, 'R', [0, 0.1, 0.2], [0, 0, 0], 0.9);
    cam(t, [[0, su(3.0, 20, 5.2), su(0, 5.5, 4.8), 54, -0.05], [w(8), su(2.4, 17, 4.8), su(0, 5.5, 4.8), 54, -0.03, 'out']], { ap: 0.12 });
  });
  shot(8, 'And honestly? I deserve it (sheepish)', (t) => {
    goldSky(t); flagUp(t);
    act(C.wkR, t, { pos: HOME, yaw: 0.15, keys: [[0, 'idle'], [w(10), 'shrug', 'back', 0.3]], faces: [[0, { open: 0.7, smile: 0.2, smirk: 0.8, browH: 0.6, browTilt: 1, blush: 0.6 }], [w(11), { ...{ happy: 0.6, smile: 1, mouthOpen: 0.45, teeth: 1, browH: 0.5, blush: 0.8 } }]], talk: [[w(10), e(12), 0.5]] });
    hold(W3.peach, C.wkR, 'R', [0, 0.1, 0.2], [0, 0, 0], 0.9);
    const [cp, h] = headCam(C.wkR, [1.6, 0.2, 7.4]); cam(t, [[w(8) - 0.1, cp, add(h, [0, -0.6, 0]), 40], [w(13), add(cp, [0, 0, -0.8]), add(h, [0, -0.6, 0]), 40]], { ap: 0.6 });
  });
  // ===== FLASHBACK: the job offer =====
  shot(13, 'It started with a job offer (summit, day)', (t) => {
    dayHome();
    act(C.off[0], t, { pos: su(0, 15.5, 0.2), yaw: PI, keys: [[0, 'present']], faces: [[0, 'happy']] }); nimbusUnder(C.off[0], t, 1.3);
    act(C.wkR, t, { pos: su(0, 11), yaw: 0, keys: [[0, 'idle'], [w(17), { from: 'idle', shR: [-1.3, 0, -0.2], elR: [-0.4, 0, 0] }, 'out', 0.3]], faces: [[0, 'confused'], [w(18), 'shock']] });
    if (t < w(17) + 0.15) hold(C.offer, C.off[0], 'R', [0, 0, 0.3], [0, PI / 2, 0], 1); else hold(C.offer, C.wkR, 'R', [0, 0, 0.3], [0, PI / 2, 0], 1);
    FX.sparkBurst(su(0, 13.2, 5), t, w(17) + 0.15, 14, 1.4, 0.6, 3, '#ffe07a');
    cam(t, [[w(13) - 0.1, su(-8, 10, 6.0), su(0, 13.2, 4.5), 46], [w(19), su(-7.2, 10.5, 5.8), su(0, 13.2, 4.5), 46]], { ap: 0.3 });
  });
  shot(19, 'From heaven (palace crane)', (t) => {
    heavL(); WD.updatePetals(t, true, 'spark');
    jadeSit(t, [], [[0, 'neutral']]);
    cam(t, [[w(19) - 0.1, hv(6, 4, 30), hv(0, 8, -8), 50], [w(21), hv(4, 9, 24), hv(0, 8, -8), 50, 0, 'out']], { ap: 0.0 });
    st.bloom = 0.8;
  });
  shot(21, 'To me, the monkey who erased his own death', (t) => {
    dayHome();
    act(C.wkR, t, { pos: su(0, 11), yaw: 0, keys: [[0, 'thumb'], [w(26), { from: 'hips' }, 'back', 0.3]], faces: [[0, 'shock'], [w(23), 'smug']], talk: [[w(21), e(22), 0.6]] });
    hold(C.offer, C.wkR, 'L', [0, 0, 0.3], [0, PI / 2, 0], 1);
    const [cp, h] = headCam(C.wkR, [-2.0, -0.4, 7.8]); cam(t, [[w(21) - 0.1, cp, add(h, [0, -0.8, 0]), 40], [w(30), add(cp, [0.2, 0, -0.8]), add(h, [0, -0.8, 0]), 40]], { ap: 0.6 });
  });
  // ===== THRONE HALL =====
  const WKH = hv(0, 0.4, 1.5);
  shot(30, 'The Jade Emperor smiled', (t) => {
    heavL(); WD.updatePetals(t, true, 'spark');
    jadeSit(t, [], [[0, 'neutral'], [w(32), 'happy']]);
    act(C.wkR, t, { pos: WKH, yaw: PI, keys: [[0, 'idle']], faces: [[0, 'hopeful']] });
    cam(t, [[w(30) - 0.1, hv(-3.8, 9.5, 4.5), hv(0, 4.6, -10.4), 42], [w(34), hv(-3.2, 9.0, 3.0), hv(0, 4.8, -10.4), 42]], { ap: 0.3 });
  });
  shot(34, '"Welcome!"', (t) => {
    heavL(); WD.updatePetals(t, true, 'spark');
    jadeSit(t, [[0, { from: 'sit', ikR: { t: [0, 0, 0], k: 0 }, shL: [-0.5, 0, 1.2], shR: [-0.5, 0, -1.2], elL: [-0.3, 0, 0], elR: [-0.3, 0, 0] }]], [[0, 'joy']], [[w(34), e(34), 1]]);
    const [cp, h] = headCam(C.jade, [1.2, -0.8, 8.5]); cam(t, [[w(34) - 0.1, cp, add(h, [0, -0.8, 0]), 42], [w(35), add(cp, [0, 0, -0.6]), add(h, [0, -0.8, 0]), 42]], { ap: 0.5 });
    FX.sparkBurst(hv(0, 6, -9), t, w(34), 24, 3, 0.8, 4, '#ffe07a');
  });
  shot(35, '"You will be... Keeper of the Heavenly Horses"', (t) => {
    heavL(); WD.updatePetals(t, true, 'spark');
    jadeSit(t, [[0, { from: 'sit', ikR: { t: [0, 0, 0], k: 0 }, shR: [-1.3, 0, -0.3], elR: [-0.2, 0, 0] }]], [[0, 'happy']], [[w(35), e(41), 0.8]]);
    act(C.wkR, t, { pos: WKH, yaw: PI, keys: [[0, 'idle'], [w(37), 'cheer', 'back', 0.35]], faces: [[0, 'hopeful'], [w(37), 'joy']], extra: (tt, p) => tt > w(37) ? bob(0.35, 10)(tt, p) : p });
    FX.sparkBurst(C.wkR.headWorld([0, 1, 0]), t, w(37), 20, 2.2, 0.8, 2, '#ffe07a');
    cam(t, [[w(35) - 0.1, hv(-1.8, 7.2, -8.4), hv(0, 3.6, 1.5), 44], [w(42), hv(-1.4, 6.8, -7.4), hv(0, 3.6, 1.5), 44]], { ap: 0.35 });
  });
  // ===== STABLE =====
  const WKS = sb(0, 0, 5.6);
  const horseIdle = (t) => W3.horses.forEach((hh, i) => { hh.userData.neck.rotation.x = -0.6 + 0.18 * Math.sin(t * 1.3 + i * 1.7); hh.position.y = 0.05 * Math.abs(Math.sin(t * 2 + i)); });
  shot(42, 'I got a fancy hat', (t) => {
    stableL(); horseIdle(t);
    act(C.wkR, t, { pos: WKS, yaw: 0, keys: [[0, 'idle'], [w(45), { from: 'idle', ikL: { t: [0.7, 7.0, 0.2], k: 1, pole: [1, 0.5, 0] } }, 'out', 0.2], [w(46) + 0.3, 'hips', 'io', 0.3]], faces: [[0, 'hopeful'], [w(45) + 0.1, 'proud']] });
    const k = clamp((t - w(45) + 0.05) / 0.3); if (k > 0) { ohat(0.8 * Math.max(0.01, back(k))); FX.sparkBurst(C.wkR.headWorld([0, 1.2, 0]), t, w(45), 16, 1.4, 0.6, 5, '#ffe07a'); }
    const [cp, h] = headCam(C.wkR, [1.2, 0.4, 8.0]); cam(t, [[w(42) - 0.1, cp, add(h, [0, 0.2, 0]), 42], [w(47), add(cp, [0, 0, -0.8]), add(h, [0, 0.2, 0]), 42]], { ap: 0.6 });
  });
  shot(47, 'A fancy desk', (t) => {
    stableL(); horseIdle(t);
    act(C.wkR, t, { pos: WKS, yaw: 0, keys: [[0, 'podium']], faces: [[0, 'proud']], extra: (tt, p) => ({ ...p, hy: (p.hy || 0) + 0.06 * Math.sin(tt * 8) }) }); ohat();
    FX.sparkBurst(sb(0, 3.2, 8), t, w(48), 18, 2.4, 0.7, 7, '#ffe07a');
    cam(t, [[w(47) - 0.1, sb(4.5, 7.5, 19), sb(0, 3.8, 6.5), 46], [w(50), sb(3.8, 7.2, 17.5), sb(0, 3.8, 6.5), 46]], { ap: 0.25 });
  });
  shot(50, 'A thousand horses (crane)', (t) => {
    stableL(); horseIdle(t);
    act(C.wkR, t, { pos: WKS, yaw: 0, keys: [[0, 'cheer']], faces: [[0, 'joy']], extra: bob(0.3, 9) }); ohat();
    cam(t, [[w(50) - 0.1, sb(0, 6, 22), sb(0, 3, 2), 50], [w(53), sb(0, 26, 34), sb(0, 0, -4), 54, 0, 'out']], { ap: 0.0 });
  });
  shot(53, 'I was so proud (low angle)', (t) => {
    stableL(); horseIdle(t);
    act(C.wkR, t, { pos: WKS, yaw: 0, keys: [[0, 'hips']], faces: [[0, 'proud']], extra: (tt, p) => ({ ...p, neck: [-0.25, 0, 0] }) }); ohat();
    for (let i = 0; i < 6; i++) { const a = t * 2 + i; FX.sprite(FX.TEX.spark, C.wkR.headWorld([Math.cos(a) * 1.5, 0.6 + Math.sin(a * 1.3) * 0.5, Math.sin(a) * 1.5]), 0.5, 1, a, '#ffe07a', true, 2.5); }
    cam(t, [[w(53) - 0.1, sb(2.0, 3.4, 15), sb(0, 5.8, 5.6), 46, 0.05], [w(57), sb(1.6, 3.4, 13.8), sb(0, 6.0, 5.6), 46, 0.05]], { ap: 0.25 });
    st.bloom = 0.8;
  });
  shot(57, 'Then a guard laughed', (t) => {
    stableL(); horseIdle(t);
    guard(t, { faces: [[0, 'neutral'], [w(60), laughF]], extra: (tt, p) => tt > w(60) ? laugh(tt, p) : p });
    act(C.wkR, t, { pos: WKS, yaw: 0, keys: [[0, 'hips']], faces: [[0, 'proud'], [w(60) + 0.2, 'confused']], look: [-0.5, 0] }); ohat();
    kick(t, w(60), 0.3, 0.4);
    cam(t, [[w(57) - 0.1, sb(5.5, 6.5, 22), sb(-2.5, 4, 8), 44], [w(61), sb(5.0, 6.2, 20.5), sb(-2.5, 4.2, 8.5), 44]], { ap: 0.25 });
  });
  shot(61, '"lowest job in heaven. You are a stable boy"', (t) => {
    stableL(); horseIdle(t);
    guard(t, { keys: [[0, 'point']], faces: [[0, laughF]], talk: [[w(61), e(70), 1]], extra: laugh });
    act(C.wkR, t, { pos: WKS, yaw: -0.9, keys: [[0, 'idle']], faces: [[0, 'confused'], [w(67), 'deadpan']] }); ohat();
    const [cp, h] = headCam(C.sold[0], [5.0, -0.2, 6.0]); cam(t, [[w(61) - 0.1, cp, add(h, [0, -0.6, 0]), 42], [w(71), add(cp, [-0.4, 0, -0.7]), add(h, [0, -0.6, 0]), 42]], { ap: 0.4 });
  });
  shot(71, 'Stable. (deadpan twitch)', (t) => {
    stableL();
    act(C.wkR, t, { pos: WKS, yaw: -0.4, keys: [[0, 'idle']], faces: [[0, { open: 0.45, smile: -0.1, browH: -0.15, browTilt: 1 }]], noSacc: true, extra: (tt, p) => ({ ...p, neck: [0, 0, Math.sin(tt * 40) * 0.015] }) }); ohat();
    const [cp, h] = headCam(C.wkR, [1.2, 0.0, 5.0]); cam(t, [[w(71) - 0.1, cp, h, 36], [w(72), add(cp, [-0.1, 0, -0.4]), h, 36, 0, 'lin']], { ap: 0.8, hand: 0.01 });
    st.vign = 0.5;
  });
  shot(72, 'Boy. (crash zoom, steam)', (t) => {
    stableL();
    act(C.wkR, t, { pos: WKS, yaw: -0.4, keys: [[0, { from: 'idle', shL: [0.2, 0, 0.3], shR: [0.2, 0, -0.3] }]], faces: [[0, 'angry']], noSacc: true, extra: (tt, p) => ({ ...p, hips: [0, 0, Math.sin(tt * 50) * 0.02] }) }); ohat();
    hit(w(72), { z: 0.25, sh: 1.0, ds: 0.3, ca: 1.6, hold: true }); st.tint = '#ffb0a0';
    for (let i = 0; i < 6; i++) FX.poof(C.wkR.headWorld([(i % 2 ? 0.8 : -0.8), 1.6, 0]), t, w(72) + 0.1 + i * 0.12, 0.6, i, 0.6);
    const [cp, h] = headCam(C.wkR, [0.9, 0.2, 3.4]); cam(t, [[w(72) - 0.1, cp, add(h, [0, 0.3, 0]), 38], [w(73), add(cp, [0, 0, -0.6]), add(h, [0, 0.3, 0]), 38, 0, 'in']], { ap: 0.6 });
  });
  shot(73, 'I kicked over the desk', (t) => {
    stableL(); horseIdle(t);
    const kk = w(74) + 0.15;
    act(C.wkR, t, { pos: WKS, yaw: 0, keys: [[0, 'idle'], [kk - 0.15, { from: 'recoil', hipR: [-1.5, 0, 0], knR: [0.1, 0, 0], waist: [-0.25, 0, 0] }, 'snap', 0.15], [kk + 0.4, 'shout', 'io', 0.3]], faces: [[0, 'angry'], [kk, 'shout']] }); ohat();
    const k = Math.max(0, t - kk); if (k > 0) { W3.desk.position.set(W3.STB[0] + 1.5 * k, W3.STB[1] + 7 * k - 9 * k * k, W3.STB[2] + 8 + 9 * k); W3.desk.rotation.set(k * 7, 0, k * 3); }
    FX.sparkBurst(sb(0, 2.6, 7.5), t, kk, 22, 2.5, 0.6, 9, '#ffffff'); hit(kk, { z: 0.16, sh: 0.9, ds: 0.2, ca: 1.2 });
    cam(t, [[w(73) - 0.1, sb(8, 7.5, 15), sb(0, 3, 7), 48], [w(78), sb(7.4, 7.6, 14), sb(0.5, 3.5, 8), 48]], { ap: 0.15 });
  });
  shot(78, 'flew home (nimbus across the sky)', (t) => {
    L('day', su(0, 0));
    const k = clamp((t - w(78) + 0.1) / (w(80) - w(78) + 0.3));
    const p = [lerp(-60, 10, k), lerp(62, 40, k), lerp(-40, 0, k)];
    act(C.wkR, t, { pos: p, yaw: PI / 2 + 0.4, keys: [[0, { from: 'hips', shL: [-0.3, 0, 0.6] }]], faces: [[0, 'angry']], extra: (tt, pp) => ({ ...pp, waist: [0.2, 0, 0] }) }); ohat(); nimbusUnder(C.wkR, t, 1.3);
    for (let i = 0; i < 14; i++) FX.sprite(FX.TEX.spark, add(p, [-1.5 - i * 0.9, 0.3 + Math.sin(i + t * 9) * 0.2, -i * 0.5]), 0.5 * (1 - i / 14), 1 - i / 14, i, '#ffffff', true, 1.5);
    cam(t, [[w(78) - 0.1, add(p, [3, 3, 15]), add(p, [0, 2, 0]), 46], [w(80), add(p, [3, 3, 15]), add(p, [0, 2, 0]), 46]], { ap: 0.1, hand: 0.15 });
  });
  shot(80, 'and painted a giant flag', (t) => {
    dayHome();
    const pk = clamp((t - w(81)) / 1.3);
    act(C.wkR, t, { pos: su(-1.5, 6), yaw: -2.2, keys: [[0, { from: 'idle', shR: [-2.2, 0, -0.4], elR: [-0.3, 0, 0] }]], faces: [[0, 'angry'], [w(84), 'proud']], extra: (tt, p) => ({ ...p, shR: [-2.2 + Math.sin(tt * 14) * 0.5, 0, -0.4] }) }); ohat();
    hold(C.brush, C.wkR, 'R', [0, 0, 0], [PI, 0, 0], 1.3);
    free(W3.flag, su(-5, 3), [0, 0.5, 0], 1); W3.waveFlag(t, 0.4); W3.flag.userData.cloth.scale.y = Math.max(0.01, pk); W3.flag.userData.cloth.position.y = 21.3 - 7.5 * pk;
    troupe(t, su(-3, 5), 'joy', 'cheer', { r: 7, arc: PI * 0.9, a0: 0.4, extra: bob(0.4, 10) });
    cam(t, [[w(80) - 0.1, su(6, 17, 5), su(-3, 4, 9), 54], [w(85), su(5.5, 15.5, 6), su(-3, 4, 11), 54]], { ap: 0.1 });
  });
  shot(85, '"Great Sage, Equal to Heaven" (low angle flag)', (t) => {
    dayHome(); flagUp(t);
    act(C.wkR, t, { pos: su(-1.5, 6), yaw: 0.3, keys: [[0, 'hips']], faces: [[0, 'smug']] }); ohat();
    troupe(t, su(-1.5, 6), 'joy', 'cheer', { r: 6, arc: PI * 1.2, a0: 0, extra: bob(0.4, 10) });
    cam(t, [[w(85) - 0.1, su(6, 19, 1.5), su(-3, 3, 11), 56, 0.06], [w(90), su(5.4, 18, 1.6), su(-3, 3, 13), 56, 0.06]], { ap: 0.1 });
    st.bloom = 0.7;
  });
  // ===== ARMY =====
  shot(90, 'Heaven sent an army (march)', (t) => {
    heavL(W3.MAR); W3.march.visible = true;
    const sq = W3.march.userData.squad; sq.position.z = (t - w(90)) * 3.2; sq.position.y = Math.abs(Math.sin(t * 6)) * 0.12;
    act(C.sold[0], t, { keys: [[0, 'idle']], faces: [[0, 'angry']], walk: { path: [[W3.MAR[0], W3.MAR[2] - 2 + (w(90) - w(90))], [W3.MAR[0], W3.MAR[2] + 10]], t0: w(90) - 0.2, t1: w(90) + 4, y: W3.MAR[1] } });
    hold(C.spear, C.sold[0], 'L', [0, 0, 0], [0, 0, 0]);
    cam(t, [[w(90) - 0.1, mr(4, 1.6, 16), mr(0, 6, -10), 50, 0.04], [w(94), mr(3, 1.8, 15), mr(0, 6.5, -10), 50, 0.04]], { ap: 0.0 });
  });
  shot(94, 'I sent them back... upside down', (t) => {
    heavL(W3.MAR); W3.march.visible = true;
    const sq = W3.march.userData.squad; sq.position.z = -16;
    act(C.wkR, t, { pos: mr(0, 0, 6), yaw: PI, keys: [[0, { from: 'cheer', shL: [0.04, 0, 0.3] }]], faces: [[0, 'smug'], [w(98), 'joy']] }); ohat();
    hold(C.staff, C.wkR, 'R', [0, 0, 0], [PI / 2, t * 14, 0]);
    C.sold.forEach((s, i) => { const t0 = w(94) + i * 0.18; const k = Math.max(0, t - t0); const x = (i - 1.5) * 3.5; act(s, t, { pos: mr(x * (1 + k), 0.5 + 12 * k - 4 * k * k, 2 - 9 * k), yaw: 0, pitch: Math.min(PI, k * 6), keys: [[0, 'recoil']], faces: [[0, 'panic']], extra: (tt, p) => ({ ...p, shL: [-2.6, 0, 0.8], shR: [-2.6, 0, -0.8] }) }); FX.sparkBurst(mr(x, 3, 2), t, t0, 12, 1.5, 0.5, i, '#ffffff'); });
    hit(w(94) + 0.05, { z: 0.12, sh: 0.6, ds: 0, ca: 0.8 }); hit(w(98), { z: 0.12, sh: 0.5, ds: 0, ca: 0.8 });
    cam(t, [[w(94) - 0.1, mr(10, 4.5, 17), mr(0, 5.5, 1), 54], [w(100), mr(11, 5.5, 18), mr(0, 7.5, -2), 56]], { ap: 0.0 });
  });
  shot(100, 'So the Emperor tried again (facepalm)', (t) => {
    heavL(); WD.updatePetals(t, true, 'spark');
    jadeSit(t, [[0, { from: 'sit', ikR: { t: [-0.05, 5.6, 0.95], k: 1, pole: [1, -0.6, 0] }, neck: [0.25, 0, 0] }]], [[0, 'sad']]);
    cam(t, [[w(100) - 0.1, hv(2.2, 6.4, -0.5), hv(0, 4.8, -10.4), 42], [w(105), hv(1.8, 6.2, -1.8), hv(0, 4.8, -10.4), 42]], { ap: 0.4 });
  });
  shot(105, '"Fine! Guard my Peach Garden."', (t) => {
    heavL();
    jadeSit(t, [[0, { from: 'sit', ikR: { t: [0, 0, 0], k: 0 }, shR: [-1.5, 0, -0.1], elR: [-0.1, 0, 0], waist: [0.2, 0, 0] }]], [[0, 'angry']], [[w(105), e(109), 1]]);
    hit(w(105), { z: 0.1, sh: 0.4, ds: 0.1, ca: 0.6 });
    const [cp, h] = headCam(C.jade, [-1.6, -0.6, 8.0]); cam(t, [[w(105) - 0.1, cp, add(h, [0, -0.8, 0]), 40], [w(110), add(cp, [0, 0, -0.8]), add(h, [0, -0.8, 0]), 40]], { ap: 0.6 });
  });
  // ===== PEACH GARDEN =====
  const gardenL = (t) => { heavL(W3.PG); W3.garden.visible = true; WD.updatePetals(t, true); st.bloom = 0.6; st.exposure = 0.85; };
  shot(110, 'These peaches grow once every 3000 years', (t) => {
    gardenL(t);
    act(C.wkR, t, { keys: [[0, 'idle']], faces: [[0, 'hopeful']], walk: { path: [[W3.PG[0], W3.PG[2] + 16], [W3.PG[0], W3.PG[2] + 6]], t0: w(110) - 0.1, t1: w(116), y: W3.PG[1] } }); ohat();
    cam(t, [[w(110) - 0.1, pg(5, 6.5, -2), pg(0, 4, 12), 52], [w(118), pg(4, 6, 0), pg(0, 4, 9), 52]], { ap: 0.0 });
  });
  shot(118, 'Eat one... and you live forever (golden peach)', (t) => {
    gardenL(t);
    act(C.wkR, t, { pos: pg(0, 0, 6), yaw: PI, keys: [[0, { from: 'idle', ikR: { t: [-0.7, 4.0, 1.9], k: 1, pole: [1, -0.4, 0] } }]], faces: [[0, 'whisper'], [w(121), { open: 1.2, pupil: 1, smile: 0.4, mouthOpen: 0.3, browH: 0.8, blush: 0.6 }]], talk: [[w(118), e(123), 0.4]] }); ohat();
    hold(C.peach2, C.wkR, 'R', [0, 0.15, 0.3], [0, t, 0], 1.1);
    const g = C.wkR.gripWorld('R'); for (let i = 0; i < 8; i++) { const a = t * 1.5 + i * 0.8; FX.sprite(FX.TEX.spark, [g[0] + Math.cos(a) * 0.9, g[1] + 0.2 + Math.sin(a * 2) * 0.3, g[2] + Math.sin(a) * 0.9], 0.35, 1, a, '#ffe0a0', true, 2.5); }
    cam(t, [[w(118) - 0.1, add(g, [1.6, 1.6, -5.4]), add(g, [0.3, 1.0, 0.6]), 38], [w(124), add(g, [1.3, 1.6, -4.6]), add(g, [0.3, 1.1, 0.6]), 38]], { ap: 0.7 });
  });
  const bite = (t, t0) => { const k = clamp((t - t0) / 0.45); return k; };
  shot(124, 'I ate one. Then another.', (t) => {
    gardenL(t);
    const b1 = w(125), b2 = w(128);
    const munch = (tt) => (tt > b1 && tt < b1 + 0.6) || (tt > b2 && tt < b2 + 0.6);
    act(C.wkR, t, { pos: pg(0, 0, 6), yaw: PI, keys: [[0, { from: 'idle', ikR: { t: [-0.8, 4.0, 1.8], k: 1, pole: [1, -0.4, 0] } }], [b1 - 0.15, { from: 'idle', ikR: { t: [-0.15, 4.9, 1.0], k: 1, pole: [1, -0.4, 0] } }, 'io', 0.15], [b1 + 0.45, { from: 'idle', ikR: { t: [-0.8, 4.0, 1.8], k: 1, pole: [1, -0.4, 0] } }, 'io', 0.2], [b2 - 0.15, { from: 'idle', ikR: { t: [-0.15, 4.9, 1.0], k: 1, pole: [1, -0.4, 0] } }, 'io', 0.15], [b2 + 0.45, { from: 'idle', ikR: { t: [-0.8, 4.0, 1.8], k: 1, pole: [1, -0.4, 0] } }, 'io', 0.2]], faces: [[0, 'happy'], [b1, { happy: 1, smile: 0.6, mouthOpen: 0.7, mouthO: 0.6, blush: 1, open: 0.3 }]], extra: (tt, p) => munch(tt) ? { ...p, neck: [0.1 * Math.sin(tt * 30), 0, 0] } : p, talk: [[b1, b1 + 0.6, 0.8], [b2, b2 + 0.6, 0.8]] }); ohat();
    const which = t < b2 - 0.1 ? b1 : b2; const s = 1 - 0.7 * bite(t, which);
    hold(C.peach2, C.wkR, 'R', [0, 0.15, 0.3], [0, 0, 0], 1.1 * s);
    FX.sparkBurst(C.wkR.headWorld([0, -0.4, 0.8]), t, b1, 10, 0.8, 0.4, 3, '#ffb48a'); FX.sparkBurst(C.wkR.headWorld([0, -0.4, 0.8]), t, b2, 10, 0.8, 0.4, 5, '#ffb48a');
    const [cp, h] = headCam(C.wkR, [2.6, 0.2, -6.0]); cam(t, [[w(124) - 0.1, cp, add(h, [0, -0.6, 0]), 40], [w(129), add(cp, [-0.3, 0, 0.6]), add(h, [0, -0.6, 0]), 40]], { ap: 0.6 });
  });
  shot(129, 'Then... all of them (bare trees, fat monkey)', (t) => {
    gardenL(t); for (const m of C.peachMeshes) m.visible = t < w(130);
    free(W3.pits, pg(0, 0, 4), [0, 0, 0], t < w(130) ? 0.01 : 1);
    act(C.wkR, t, { pos: pg(0, 0, 4), yaw: 0.3, sq: t < w(130) ? 0 : -0.32, keys: [[0, 'cross']], faces: [[0, 'smug'], [w(130), { happy: 1, smile: 1, mouthOpen: 0.2, blush: 1, open: 0.35 }]], extra: (tt, p) => ({ ...p, waist: [-0.15, 0, 0] }) }); ohat();
    hit(w(130), { z: 0.15, sh: 0.6, ds: 0, ca: 1.0 }); FX.poof(pg(0, 1, 4), t, w(130), 1.0, 4, 0.5);
    cam(t, [[w(129) - 0.1, pg(3, 4.5, 12), pg(0, 2.5, 4), 48], [w(133), pg(3.5, 9, 12.5), pg(0, 2.5, 0), 54, 0, 'out']], { ap: 0.1 });
  });
  // ===== BANQUET =====
  const bqL = () => { L('heaven', W3.BQ, [[bq(-9, 9, -6), '#ff8a4a', 40, 20], [bq(9, 9, 2), '#ff8a4a', 40, 20]]); W3.banquet.visible = true; };
  shot(133, 'a party nobody invited me to (peek)', (t) => {
    bqL();
    act(C.wkR, t, { keys: [[0, 'idle']], faces: [[0, 'suspicious'], [w(138), 'smug']], walk: { path: [[W3.BQ[0] - 0.5, W3.BQ[2] + 14], [W3.BQ[0], W3.BQ[2] + 4]], t0: w(133) - 0.2, t1: w(141), y: W3.BQ[1] + 0.25 }, sq: -0.2, extra: (tt, p) => ({ ...p, hy: (p.hy || 0) - 0.4, waist: [0.25, 0, 0] }) }); ohat();
    cam(t, [[w(133) - 0.1, bq(2.5, 5.5, -10), bq(0, 3, 6), 48], [w(142), bq(2.0, 5.0, -8), bq(0, 3, 4), 48]], { ap: 0.2 });
  });
  shot(142, 'So I drank all their juice', (t) => {
    bqL();
    const dk = w(144);
    act(C.wkR, t, { pos: bq(0, 0.25, 4), yaw: PI, sq: -0.2 - 0.12 * S(dk, e(147), t), keys: [[0, { from: 'idle', ikR: { t: [-0.2, 6.3, 0.9], k: 1, pole: [1, -0.3, 0] }, ikL: { t: [0.4, 6.0, 0.9], k: 1, pole: [1, -0.3, 0] }, neck: [-0.5, 0, 0], waist: [-0.15, 0, 0] }]], faces: [[0, { open: 0.0, happy: 1, smile: 0.5, mouthOpen: 0.4, mouthO: 1, blush: 1 }]], extra: (tt, p) => ({ ...p, neck: [-0.5 + 0.05 * Math.sin(tt * 18), 0, 0] }) }); ohat();
    hold(W3.jug, C.wkR, 'R', [0, 0, 0.2], [PI * 0.85, 0, 0], 0.6);
    for (const d of W3.bqDishes) d.userData.food.scale.set(1 - S(dk, e(147), t) * 0.95 + 0.05, 0.6 * (1 - S(dk, e(147), t) * 0.95) + 0.03, 1 - S(dk, e(147), t) * 0.95 + 0.05);
    for (let i = 0; i < 8; i++) FX.sprite(FX.TEX.spark, C.wkR.headWorld([0, 1.2 + ((t * 3 + i * 0.4) % 2), 0.8]), 0.25, 0.8, i, '#8affd0', true, 1.5);
    cam(t, [[w(142) - 0.1, bq(-3.5, 4.6, -3), bq(0, 5.2, 4), 46], [w(148), bq(-3.0, 4.6, -2.2), bq(0, 5.4, 4), 46]], { ap: 0.3 });
  });
  // ===== LAOZI'S LAB =====
  const labL = (t) => { L('lair', W3.LAB, [[lb(-4, 3, -3), '#ff8a3a', 90 + 20 * Math.sin(t * 13), 25], [lb(4, 9, 3), '#ffd8a8', 70, 30], [lb(5, 5, -1), '#ffe0a0', 40, 12]]); W3.lab.visible = true; st.exposure = 1.15; W3.fireMat.emissiveIntensity = 2.6 + 0.6 * Math.sin(t * 17); };
  shot(148, 'walked into Laozi lab', (t) => {
    labL(t);
    act(C.wkR, t, { keys: [[0, 'idle']], faces: [[0, 'suspicious'], [w(152), 'joy']], walk: { path: [[W3.LAB[0] + 1, W3.LAB[2] + 10], [W3.LAB[0] + 3.5, W3.LAB[2] - 0.8]], t0: w(148) - 0.2, t1: w(154) + 0.2, y: W3.LAB[1] } }); ohat();
    cam(t, [[w(148) - 0.1, lb(-6, 7, 12), lb(1, 3, -3), 50], [w(154), lb(-5, 6.5, 10), lb(2, 3, -3), 50]], { ap: 0.1 });
  });
  shot(154, 'ate his pills of immortality', (t) => {
    labL(t);
    const p0 = w(155);
    act(C.wkR, t, { pos: lb(3.5, 0, -0.8), yaw: PI - 0.3, keys: [[0, { from: 'idle', ikR: { t: [-0.1, 6.5, 0.7], k: 1, pole: [1, -0.3, 0] }, neck: [-0.55, 0, 0] }]], faces: [[0, { happy: 1, smile: 0.6, mouthOpen: 0.95, mouthO: 0.6, teeth: 1, open: 0.5, blush: 0.8 }]] }); ohat();
    hold(W3.gourd, C.wkR, 'R', [0, 0, 0.1], [PI * 0.8, 0, 0], 0.7);
    const m = C.wkR.headWorld([0, -0.3, 0.6]);
    for (let i = 0; i < 18; i++) { const k = ((t - p0) * 2.2 + i / 18) % 1; if (t < p0) break; FX.sprite(FX.TEX.spark, [m[0] + Math.sin(i) * 0.15, m[1] + 1.6 * (1 - k), m[2] + Math.cos(i) * 0.15], 0.3, 1, i, '#ffd040', true, 3); }
    cam(t, [[w(154) - 0.1, lb(0.5, 5.2, -7.5), lb(3.4, 5.4, -0.8), 44], [w(160), lb(0.9, 5.2, -6.6), lb(3.4, 5.6, -0.8), 44]], { ap: 0.35 });
    st.bloom = 0.8;
  });
  shot(160, 'Like candy (crunch close-up)', (t) => {
    labL(t);
    act(C.wkR, t, { pos: lb(3.5, 0, -0.8), yaw: PI - 0.3, keys: [[0, 'thumb']], faces: [[0, { happy: 1, smile: 1, mouthOpen: 0.3, teeth: 1, blush: 1, open: 0.2 }]], talk: [[w(160), e(161) + 0.4, 0.8]], extra: (tt, p) => ({ ...p, neck: [0.06 * Math.sin(tt * 28), 0, 0] }) }); ohat();
    for (let i = 0; i < 6; i++) { const a = t * 3 + i; FX.sprite(FX.TEX.spark, C.wkR.headWorld([Math.cos(a) * 1.3, 0.4 + Math.sin(a * 2) * 0.4, Math.sin(a) * 1.3]), 0.45, 1, a, '#ffd040', true, 2.5); }
    const [cp, h] = headCam(C.wkR, [-2.4, -0.3, -6.2]); cam(t, [[w(160) - 0.1, cp, add(h, [0, -0.6, 0]), 40], [w(162), add(cp, [0, 0, 0.6]), add(h, [0, -0.6, 0]), 40]], { ap: 0.7 });
  });
  // ===== WAKE UP =====
  const SEAT = su(0, 5.4, -0.4);
  const slump = { from: 'sit', neck: [0.6, 0, 0], waist: [0.3, 0, 0], shL: [0, 0, 0.3], shR: [0, 0, -0.3] };
  shot(162, 'I woke up', (t) => {
    L('morning', su(0, 0)); flagUp(t);
    act(C.wkR, t, { pos: SEAT, yaw: 0, sq: -0.15, keys: [[0, slump], [w(163) + 0.1, 'sit', 'io', 0.5]], faces: [[0, 'sleep'], [w(163) + 0.3, { open: 0.35, smile: 0, mouthOpen: 0.3, mouthO: 1, browH: -0.2 }]], noSacc: true, noBlink: true });
    cam(t, [[w(162) - 0.1, su(1.6, 13.5, 4.4), su(0, 5.4, 3.2), 44], [w(165), su(1.3, 12.5, 4.3), su(0, 5.4, 3.4), 44]], { ap: 0.4 });
  });
  shot(165, 'Burped.', (t) => {
    L('morning', su(0, 0)); flagUp(t);
    const bp = w(165) + 0.1;
    act(C.wkR, t, { pos: SEAT, yaw: 0, keys: [[0, 'sit'], [bp, { from: 'sit', waist: [-0.25, 0, 0], neck: [-0.4, 0, 0] }, 'snap', 0.12]], faces: [[0, { open: 0.4, smile: 0.2, browH: 0 }], [bp, { open: 0.3, mouthOpen: 1, mouthO: 1, browH: 0.7, blush: 0.6 }]], sq: -0.15 });
    const m = C.wkR.headWorld([0, -0.3, 1.0]); FX.sparkBurst(add(m, [0, 0.2, 1.2]), t, bp, 16, 1.8, 0.6, 4, '#ffd040');
    kick(t, bp, 0.6, 0.4); hit(bp, { z: 0.12, sh: 0.5, ds: 0, ca: 0.8 });
    cam(t, [[w(165) - 0.1, su(1.0, 11.5, 4.3), su(0, 5.4, 3.6), 42], [w(166), su(0.9, 11.0, 4.3), su(0, 5.4, 3.6), 42]], { ap: 0.5 });
  });
  shot(166, 'And the sky turned gold (tilt up to army)', (t) => {
    const g = S(w(168), w(170), t);
    if (g < 0.5) { L('morning', su(0, 0)); st.tint = '#fff0d8'; } else goldSky(t);
    W3.armyRing.visible = true; W3.ringClouds.visible = true; flagUp(t);
    act(C.wkR, t, { pos: SEAT, yaw: 0, keys: [[0, 'sit']], faces: [[0, { open: 0.5, smile: 0, browH: 0 }], [w(169), 'shock']], sq: -0.15, look: [0, 0.6] });
    st.flash = 0.35 * Math.max(0, 1 - Math.abs(t - w(169) - 0.2) / 0.15);
    cam(t, [[w(166) - 0.1, su(2.5, 14, 4.5), su(0, 5.4, 3.4), 46], [w(171), su(2.5, 15, 5.0), su(0, -60, 24), 56, 0, 'io']], { ap: 0.1 });
  });
  shot(171, 'back to the hundred thousand soldiers (aerial)', (t) => {
    goldSky(t); flagUp(t);
    act(C.wkR, t, { pos: HOME, yaw: 0, keys: [[0, 'headHands']], faces: [[0, 'panic']] }); ohat();
    cam(t, [[w(171) - 0.1, [40, 150, 210], su(0, 0, 0), 46], [w(180), [20, 95, 130], su(0, 0, 0), 46, 0, 'out']], { ap: 0.0 });
    st.bloom = 0.8;
  });
  shot(180, 'Part four: me versus all of heaven', (t) => {
    goldSky(t); flagUp(t);
    const gr = w(182);
    act(C.wkR, t, { pos: HOME, yaw: 0.2, keys: [[0, { from: 'idle', ikR: { t: [-0.95, 5.3, 0.1], k: 1, pole: [1, 0.3, 0] } }], [gr, { from: 'cheer', shL: [0.04, 0, 0.3] }, 'back', 0.3]], faces: [[0, 'angry'], [gr, 'shout']], talk: [[w(182), e(186), 0.7]] }); ohat();
    const sk = easeOut(clamp((t - gr) / 0.4));
    if (t < gr) onHead(C.needle, C.wkR, [-0.72, 0.15, 0.05], [0.5, 0, 0.3], 0.07); else hold(C.staff, C.wkR, 'R', [0, 0, 0], [PI / 2, t * 12, 0], Math.max(0.05, sk));
    FX.sparkBurst(C.wkR.gripWorld('R'), t, gr, 26, 3, 0.8, 7, '#ffd46a'); hit(gr, { z: 0.15, sh: 0.8, ds: 0.2, ca: 1.2 });
    cam(t, [[w(180) - 0.1, su(2.5, 19, 4.5), su(0, 9, 5.0), 50], [T.duration, su(2, 16.5, 4.2), su(0, 9, 5.2), 50]], { ap: 0.15 });
    st.fade = S(T.duration - 0.25, T.duration, t);
  });
}

export function frameState(f) {
  const t = f / 30; st = { time: t }; hits = []; shake = 0; FX.resetFx(); hideAll();
  WD.egg.visible = false;
  let k = 0; while (k < SH.length - 1 && t >= start(k + 1)) k++;
  WD.updatePetals(t, false);
  SH[k].fn(t);
  WD.sky.position.copy(camera.position); WD.stars.position.copy(camera.position);
  WD.updateSea(t); WD.updateWater(t);
  st.shot = k; st.bloom = st.bloom ?? 0.55; st.grain = st.grain ?? 0.03;
  return st;
}
// ---------- captions ----------
const SOLO = new Set([20, 71, 119, 129, 161, 165]);
const BIG = new Set([72, 130]);
let CH = null;
function chunks() { if (CH) return CH; CH = []; let cur = []; const flush = () => { if (cur.length) CH.push(cur); cur = []; };
  for (let i = 0; i < NW; i++) { if (SOLO.has(i) || BIG.has(i)) { flush(); CH.push([i]); continue; } cur.push(i); const w = T.words[i].w; if (/[.,!?:;]["”]?$|\.\.\.$/.test(w) || cur.length >= 3) flush(); } flush(); return CH; }
const clean = (w) => w.replace(/["“”]/g, '').toUpperCase().replace(/[.,:;]+$/, '');
export function captionChunk(t) {
  if (t < wS(3) - 0.05) return null;
  const L2 = chunks(); let c = null;
  for (const ch of L2) { const s = wS(ch[0]) - 0.05; const e2 = Math.max(wE(ch[ch.length - 1]) + 0.12, s + 0.35); if (t >= s && t < e2) c = ch; }
  if (!c) return null; let a = 0; c.forEach((i, j) => { if (t >= wS(i) - 0.03) a = j; });
  return { words: c.map(i => clean(T.words[i].w)), act: a, k: t - wS(c[a]), k0: t - wS(c[0]) + 0.05, big: BIG.has(c[0]) && c.length === 1, color: (c[0] === 72 || c[0] === 130) ? '#FF3B3B' : null };
}
// ---------- overlays ----------
function badge(ctx, txt, sub, x, y, s = 1, rot = -0.04, bg = '#FFD23F') { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.font = '64px Lucky'; let w = ctx.measureText(txt).width; if (sub) { ctx.font = '40px "Noto Sans CJK SC"'; w = Math.max(w, ctx.measureText(sub).width); } w += 60; ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(0, 0, w, 100 + (sub ? 52 : 0), 18); ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = '#0b0710'; ctx.stroke(); ctx.fillStyle = '#0b0710'; ctx.textBaseline = 'middle'; ctx.font = '64px Lucky'; ctx.fillText(txt, 30, 56); if (sub) { ctx.font = '700 40px "Noto Sans CJK SC"'; ctx.fillStyle = '#B0302A'; ctx.fillText(sub, 30, 120); } ctx.restore(); }
function bigText(ctx, W, H, lines, y, size, colors, rot = -0.05, s = 1) { ctx.save(); ctx.translate(W / 2, y); ctx.rotate(rot); ctx.scale(s, s); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; lines.forEach((l, i) => { const sz = size[i]; ctx.font = `${sz}px Lucky`; const yy = i ? size.slice(0, i).reduce((a, b) => a + b * 1.0, 0) : 0; ctx.lineWidth = sz * 0.17; ctx.strokeStyle = '#0b0710'; ctx.strokeText(l, 0, yy); ctx.fillStyle = colors[i]; ctx.fillText(l, 0, yy); }); ctx.restore(); }
export function overlayFx(t) {
  const out = [];
  if (t < wS(8)) { const pop = 1 + 0.04 * Math.sin(t * 12); out.push((ctx, W, H) => bigText(ctx, W, H, ['100,000', 'VS ME'], H * 0.2, [200, 210], ['#FFE53E', '#FFFFFF'], -0.05, pop)); out.push((ctx, W, H) => badge(ctx, 'MONKEY KING · PART 3', null, 40, H * 0.06, 0.6, -0.03)); }
  else out.push((ctx, W, H) => badge(ctx, 'MONKEY KING · PART 3', null, 40, 120, 0.6, -0.03));
  const slide = (i0, i1, a, b, col) => { if (t >= wS(i0) && t < wS(i1)) { const k = t - wS(i0); out.push((ctx, W, H) => badge(ctx, a, b, -900 + 960 * easeOut(clamp(k / 0.25)), H * 0.19, 0.95, -0.04, col)); } };
  slide(30, 34, 'THE JADE EMPEROR', '玉皇大帝 · RULER OF HEAVEN', '#FFD23F');
  slide(37, 42, 'KEEPER OF THE HEAVENLY HORSES', '弼马温', '#8AF0E0');
  if (t >= wS(50) && t < wS(53)) { const n = Math.floor(1000 * easeOut(clamp((t - wS(50)) / 1.0))); out.push((ctx, W, H) => bigText(ctx, W, H, ['×' + n, 'HORSES'], H * 0.24, [150, 70], ['#FFE53E', '#FFFFFF'], 0.05)); }
  slide(63, 71, 'LOWEST JOB IN HEAVEN', null, '#FF8A8A');
  slide(85, 90, 'GREAT SAGE, EQUAL TO HEAVEN', '齐天大圣', '#FFD23F');
  if (t >= wS(115) && t < wS(118)) { const s = Math.max(0.01, back(clamp((t - wS(115)) / 0.3))); out.push((ctx, W, H) => bigText(ctx, W, H, ['3,000', 'YEARS'], H * 0.22, [170, 90], ['#FFE53E', '#FFFFFF'], -0.04, s)); }
  slide(148, 154, "LAOZI'S LAB", '太上老君 · MAKER OF IMMORTAL PILLS', '#E8DCC0');
  if (t >= wS(176) && t < wS(180)) { const n = Math.floor(100000 * easeOut(clamp((t - wS(176)) / 1.2))); out.push((ctx, W, H) => bigText(ctx, W, H, [n.toLocaleString('en-US'), 'SOLDIERS'], H * 0.24, [170, 80], ['#FFE53E', '#FFFFFF'], 0.04)); }
  if (t >= wS(182)) { const k = t - wS(182); out.push((ctx, W, H) => { const s = Math.max(0.01, back(clamp(k / 0.35))); bigText(ctx, W, H, ['PART 4', 'WAR WITH HEAVEN'], H * 0.33, [210, 80], ['#FFD23F', '#FFFFFF'], -0.06, s); }); }
  return out;
}
