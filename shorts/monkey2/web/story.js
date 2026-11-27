// THE MONKEY KING — Part 2: The Staff
import { THREE, scene, camera, PI, clamp, lerp, ss, S, easeOut, easeIn, back, spring, noise, hash, lerp3, part, P, plastic, glow, group, mesh, canvasTex } from './core.js';
import * as WD from "./mworld.js";
import * as W2 from "./mworld2.js";
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
const lr = at(W2.LAIR), dr = at(W2.DRG), pl = at(W2.PIL), uw = at(W2.UW), cv = at(WD.CAVE);
let bookKey = '';
function book(cr, hl) { const k = cr.toFixed(2) + hl; if (k !== bookKey) { bookKey = k; W2.drawBook(cr, hl); } }

// ---------- setup ----------
export async function setupStory() {
  T = await (await fetch('../work/' + (Q.get('timing') || 'timing_v2.json'))).json();
  try { setEnv(await (await fetch('../work/' + (Q.get('env') || 'env_v2.json'))).json()); } catch (e) { }
  wS = (i) => T.words[Math.min(i, T.words.length - 1)].s; wE = (i) => T.words[Math.min(i, T.words.length - 1)].e; NW = T.words.length;
  C = makeCast();
  const bone = plastic('#ece2cc', { rough: 0.5 });
  const horns = (m, len = 1.0) => { const g = group([0, 0, 0]); for (const s of [-1, 1]) { const h = group([s * 0.45, 0.55, 0.05], g, [0, 0, -s * 0.5]); mesh(new THREE.ConeGeometry(0.2, len, 8), m, [0, len / 2, 0], h); const h2 = group([0, len * 0.9, 0], h, [0, 0, s * 0.7]); mesh(new THREE.ConeGeometry(0.1, len * 0.5, 8), m, [0, len * 0.22, 0], h2); } g.visible = false; return g; };
  C.hornD = horns(bone, 1.1); C.hornG = horns(plastic('#e0b040', { metal: 0.7, rough: 0.3 }), 0.8);
  C.dsword = W2.sword(4.2, '#b8c0cc'); C.dsword.visible = false;
  C.gsword = W2.sword(2.6, '#e8eef8'); C.gsword.visible = false;
  C.spear = W2.spear(6); C.spear.visible = false;
  C.forkLo = group([0, 0, 0]); { const wd = P('#6a4a2a'); mesh(new THREE.CylinderGeometry(0.11, 0.11, 4, 8), wd, [0, 0, 0], C.forkLo); C.forkHi = group([0, 2, 0], C.forkLo); mesh(new THREE.CylinderGeometry(0.11, 0.11, 3, 8), wd, [0, 1.5, 0], C.forkHi); const mt = plastic('#c9ced8', { metal: 0.9, rough: 0.2 }); part(1.6, 0.2, 0.2, mt, [0, 3.05, 0], 0.05, C.forkHi); for (const x of [-0.7, 0, 0.7]) mesh(new THREE.ConeGeometry(0.13, 1.4, 6), mt, [x, 3.8, 0], C.forkHi); C.forkLo.visible = false; }
  C.staff = W2.staff(9); C.staff.visible = false;
  C.needle = W2.staff(9); C.needle.visible = false;
  C.chain = W2.chain(18); C.chain.visible = false; C.chain2 = W2.chain(14); C.chain2.visible = false;
  C.brush = group([0, 0, 0]); { part(0.12, 1.6, 0.12, P('#8a5a2a'), [0, 0.8, 0], 0.04, C.brush); mesh(new THREE.ConeGeometry(0.13, 0.45, 8), P('#111'), [0, -0.2, 0], C.brush, [PI, 0, 0]); C.brush.visible = false; }
  C.peanut = group([0, 0, 0]); { const pm = plastic('#c8955a', { rough: 0.8 }); mesh(new THREE.SphereGeometry(0.22, 12, 8), pm, [0, 0.16, 0], C.peanut); mesh(new THREE.SphereGeometry(0.2, 12, 8), pm, [0, -0.16, 0], C.peanut); C.peanut.visible = false; }
  C.prints = group([0, Y, 0]); { const fm = plastic('#2a1e18', { rough: 0.9 }); for (let i = 0; i < 7; i++) { const g = group([(i % 2 ? 2.8 : -2.8), 0.05, 6 + i * 6.8], C.prints, [0, (i % 2 ? -0.12 : 0.12), 0]); part(4.0, 0.08, 4.4, fm, [0, 0, 0], 0.04, g); for (let k = -1; k <= 1; k++) { part(0.9, 0.08, 2.8, fm, [k * 1.35, 0, 3.4], 0.04, g, [0, -k * 0.28, 0]); mesh(new THREE.ConeGeometry(0.35, 1.2, 4), fm, [k * 1.75, 0.05, 5.3], g, [PI / 2, 0, 0]); } } C.prints.visible = false; }
  W2.pillarStaff.scale.set(8, 1, 8);
  C.cup = WD.teacup;
  buildShots();
  window.shotList = () => SH.map((s, i) => [i, s.name, s.i0, +start(i).toFixed(2)]);
}
function start(i) { return i === 0 ? 0 : wS(SH[i].i0) - 0.07; }
function shot(i0, name, fn) { SH.push({ i0, name, fn }); }
const PROPS = () => [C.hornD, C.hornG, C.dsword, C.gsword, C.spear, C.forkLo, C.staff, C.needle, C.chain, C.chain2, C.brush, C.peanut, C.prints, WD.nimbus, WD.teacup];
function hideAll() { for (const r of C.all) r.hide(); for (const o of PROPS()) { o.visible = false; if (o.parent !== scene) scene.attach(o); o.scale.setScalar(1); o.rotation.set(0, 0, 0); } C.forkHi.rotation.set(0, 0, 0); C.forkHi.position.set(0, 2, 0); W2.pillarStaff.position.y = 20; W2.pillarGlow.material.opacity = 0; W2.pillarGlow.position.y = 20; }
function hold(obj, rig, side = 'R', pos = [0, 0, 0], rot = [0, 0, 0], s = 1) { const g = (side === 'R' ? rig.R : rig.L).grip; if (obj.parent !== g) g.add(obj); obj.position.set(...pos); obj.rotation.set(...rot); obj.scale.setScalar(s / rig.sc); obj.visible = true; }
function onHead(obj, rig, pos = [0, 0.85, 0], rot = [0, 0, 0], s = 1) { if (obj.parent !== rig.head) rig.head.add(obj); obj.position.set(...pos); obj.rotation.set(...rot); obj.scale.setScalar(s); obj.visible = true; }
function free(obj, pos, rot = [0, 0, 0], s = 1) { if (obj.parent !== scene) scene.attach(obj); obj.position.set(...pos); obj.rotation.set(...rot); obj.scale.setScalar(s); obj.visible = true; }
function nimbusUnder(rig, t, s = 1.25) { const n = WD.nimbus; n.visible = true; n.position.set(...add(rig.root.position.toArray(), [0, 0.2, 0])); n.rotation.set(0, rig.root.rotation.y + PI / 2, Math.sin(t * 3) * 0.05); n.scale.setScalar(s); }
function troupe(t, center, faces = 'happy', pose = 'idle', o = {}) { C.mk.forEach((m, i) => { const a = (o.a0 ?? 0) + i / C.mk.length * (o.arc ?? PI) - (o.arc ?? PI) / 2; const r = (o.r ?? 5) + (i % 2) * 1.2; const pos = [center[0] + Math.sin(a) * r, center[1], center[2] + Math.cos(a) * r]; const yaw = Math.atan2(center[0] - pos[0], center[2] - pos[2]) + (o.yawOff || 0); act(m, t, { pos, yaw, keys: typeof pose === 'function' ? pose(i) : [[0, pose]], faces: typeof faces === 'function' ? faces(i) : [[0, faces]], extra: o.extra ? (tt, p) => o.extra(tt, p, i) : null }); }); }
const bob = (amp = 0.3, sp = 9) => (tt, p, i = 0) => ({ ...p, hy: (p.hy || 0) + Math.abs(Math.sin(tt * sp + i)) * amp, shL: add(p.shL || [0, 0, 0], [0, 0, Math.abs(Math.sin(tt * sp + i)) * 1.2]), shR: add(p.shR || [0, 0, 0], [0, 0, -Math.abs(Math.sin(tt * sp + i + 1)) * 1.2]) });
function bubbles(t, c, n = 40, R = 6, H = 10, seed = 0) { for (let i = 0; i < n; i++) { const y = ((t * (1.2 + hash(i + seed) * 1.5) + hash(i + seed + 3) * H) % H); FX.sprite(FX.TEX.puff, [c[0] + (hash(i + seed + 1) - 0.5) * R * 2 + Math.sin(t * 2 + i) * 0.2, c[1] + y, c[2] + (hash(i + seed + 2) - 0.5) * R * 2], 0.12 + hash(i) * 0.2, 0.55 * (1 - y / H), 0, '#dffcff', false, 1.3); } }

function buildShots() {
  const w = wS, e = wE;
  // ---- lair helpers ----
  const lairL = () => { L('lair', W2.LAIR, [[lr(-12, 5, 3), '#ff7a2a', 90, 34], [lr(12, 5, 3), '#ff7a2a', 90, 34], [lr(0, 12, 10), '#c8a8ff', 90, 45], [lr(0, 10, 2), '#ffd0b0', 50, 18]]); st.exposure = 1.2; };
  const DP = lr(0, 0, -2), WP = lr(0, 0, 7.5);
  const caged = (t, face = 'scared') => { C.mk.forEach((m, i) => { const c = Math.floor(i / 2), s = i % 2 ? 1 : -1; act(m, t, { pos: lr(-8 + c * 8 + s * 0.9, 0.2, -9 + 0.5), yaw: 0, keys: [[0, i % 3 ? 'headHands' : 'idle']], faces: [[0, face]], extra: (tt, p) => ({ ...p, hips: add(p.hips || [0, 0, 0], [0, 0, Math.sin(tt * 25 + i) * 0.03]) }) }); }); };
  const demon = (t, o = {}) => { act(C.demon, t, { pos: o.pos || DP, yaw: o.yaw ?? 0, pitch: o.pitch, roll: o.roll, keys: o.keys || [[0, 'hips']], faces: o.faces || [[0, 'smug']], talk: o.talk, extra: o.extra, look: o.look }); onHead(C.hornD, C.demon); };
  const flail = (tt, p) => ({ ...p, shL: [-1.2 + Math.sin(tt * 13) * 0.9, 0, 0.9 + Math.sin(tt * 9) * 0.5], shR: [-1.2 + Math.sin(tt * 11 + 1) * 0.9, 0, -0.9 - Math.sin(tt * 8) * 0.5], elL: [-0.8, 0, 0], elR: [-0.8, 0, 0], waist: [0, Math.sin(tt * 7) * 0.25, Math.sin(tt * 5) * 0.08] });
  const swarm = (t, n0 = 0) => { const D = C.demon; const spots = [D.headWorld([0.35, 0.62, 0.1]), D.headWorld([-0.5, 0.6, -0.1]), D.gripWorld('L'), D.gripWorld('R'), D.headWorld([0.75, -0.75, 0.2]), D.headWorld([-0.75, -0.75, 0.2]), D.headWorld([0, -1.6, 0.7]), D.headWorld([0.5, -2.6, 0.75])];
    spots.forEach((sp, i) => act(C.mini[i], t, { pos: add(sp, [0, -0.3, 0]), yaw: (i % 2 ? 0.6 : -0.6), pitch: i > 5 ? -0.5 : 0, keys: [[0, i % 2 ? 'cheer' : 'point']], faces: [[0, i % 3 ? 'joy' : 'angry']], extra: (tt, p) => ({ ...p, shR: add(p.shR || [0, 0, 0], [Math.sin(tt * 18 + i) * 0.6, 0, 0]) }) }));
    for (let i = 8; i < 14; i++) { const a = (i - 8) / 6 * PI * 1.6 - PI * 0.8; act(C.mini[i], t, { pos: lr(Math.sin(a) * 3.2, 0, -2 + Math.cos(a) * 3.2 + 1), yaw: Math.atan2(-Math.sin(a), -Math.cos(a)), keys: [[0, 'cheer']], faces: [[0, 'joy']], extra: (tt, p) => bob(0.5, 12)(tt, p, i) }); } };
  // ===== HOOK (flash-forward) =====
  shot(0, 'HOOK clone swarm on demon', (t) => {
    lairL(); caged(t, 'shock');
    demon(t, { keys: [[0, 'recoil']], faces: [[0, 'panic']], extra: flail, roll: Math.sin(t * 6) * 0.06 });
    swarm(t);
    act(C.wkR, t, { pos: lr(-3.2, 0, 4.5), yaw: PI - 0.5, keys: [[0, { from: 'hips' }]], faces: [[0, 'smug']] });
    cam(t, [[0, lr(2.5, 3.2, 11.5), lr(0, 6.0, -1), 54, -0.06], [w(3), lr(2.0, 3.4, 10.0), lr(0, 6.4, -1), 54, -0.03, 'out']], { ap: 0.2 });
    st.bloom = 0.7;
  });
  // ===== STORM MOUNTAIN =====
  const storm = () => { L('storm', su(0, 22), [[su(2, 26, 8), '#c8b8ff', 45, 30]]); st.exposure = 1.25; st.flash = 0.25 * Math.max(0, 1 - Math.abs(((st.time * 0.37) % 1) - 0.5) / 0.03); C.prints.visible = true; };
  shot(3, 'every monkey was gone (empty mountain)', (t) => {
    storm(); act(C.wkR, t, { pos: su(-6, 22), yaw: PI - 0.4 + Math.sin(t * 1.5) * 0.4, keys: [[0, 'idle']], faces: [[0, 'worried']] });
    cam(t, [[w(3) - 0.1, su(4, 44, 13), su(-3, 22), 50], [w(6), su(3, 47, 15), su(-3, 22), 50]], { ap: 0.0 });
    st.sat = 0.7; if (t < w(3) + 0.3) { st.desat = 0.8; st.ca = 1.6; }
  });
  shot(6, 'claw prints (low skim)', (t) => {
    storm(); act(C.wkR, t, { pos: su(-6.5, 33), yaw: PI, keys: [[0, 'idle']], faces: [[0, 'worried']] });
    cam(t, [[w(6) - 0.1, su(0, 0, 2.2), su(0, 26, 0.4), 46], [w(12), su(0, 7, 2.6), su(0, 30, 0.4), 46, 0, 'lin']], { ap: 0.2 });
  });
  shot(12, 'bigger than my whole body (lies in print)', (t) => {
    storm();
    act(C.wkR, t, { pos: su(-2.8, 5.0, 0.7), yaw: PI, pitch: -PI / 2, keys: [[0, { hy: -0.5, shL: [0, 0, 1.4], shR: [0, 0, -1.4], hipL: [0, 0, 0.35], hipR: [0, 0, -0.35] }]], faces: [[0, 'deadpan'], [w(15), 'bored']] });
    cam(t, [[w(12) - 0.1, su(-2.8, 16, 12), su(-2.8, 8.2, 0), 46], [w(17), su(-2.8, 15, 10), su(-2.8, 8.2, 0), 46]], { ap: 0.2, hand: 0.03 });
  });
  shot(17, 'followed them to a cave', (t) => {
    storm();
    act(C.wkR, t, { keys: [[0, 'idle']], faces: [[0, 'angry']], walk: { path: [[0, 6], [0, 40]], t0: w(17) - 0.2, t1: w(23) + 0.5, y: Y, ease: 'lin', run: true } });
    const wp = C.wkR.root.position.toArray();
    cam(t, [[w(17) - 0.1, add(wp, [3, 6, -14]), add(wp, [0, 2.5, 8]), 50], [w(23), add(wp, [3, 6, -14]), add(wp, [0, 2.5, 8]), 50]], { ap: 0.2, hand: 0.12 });
  });
  // ===== LAIR =====
  shot(23, 'Inside: (lair wide)', (t) => {
    lairL(); caged(t);
    demon(t, { keys: [[0, 'cross']], faces: [[0, 'neutral']] });
    act(C.wkR, t, { keys: [[0, 'idle']], faces: [[0, 'angry']], walk: { path: [[W2.LAIR[0] - 3.5, 12], [W2.LAIR[0] - 3, 8]], t0: w(23) - 0.1, t1: w(24) + 0.2, y: 0 } });
    cam(t, [[w(23) - 0.1, lr(1, 6, 13), lr(0, 4.5, -5), 50], [w(24), lr(1, 5.8, 12), lr(0, 4.5, -5), 50]], { ap: 0.15 });
  });
  shot(24, 'the Demon King of Havoc (low angle)', (t) => {
    lairL(); caged(t);
    demon(t, { keys: [[0, 'cross'], [w(25), 'hips', 'back', 0.35]], faces: [[0, 'neutral'], [w(25), 'smug']] });
    hit(w(25), { z: 0.15, sh: 0.6, ds: 0.3, ca: 1.0 });
    cam(t, [[w(24) - 0.1, lr(2.2, 1.6, 7.5), lr(0, 8.5, -2), 52, 0.06], [w(29), lr(1.6, 1.8, 6.2), lr(0, 9, -2), 52, 0.06]], { ap: 0.2 });
  });
  shot(29, 'He laughed', (t) => {
    lairL();
    demon(t, { keys: [[0, 'hips']], faces: [[0, { happy: 1, smile: 1, mouthOpen: 0.95, teeth: 1, browH: 0.4, browA: 0.6 }]], extra: (tt, p) => ({ ...p, waist: add(p.waist || [0, 0, 0], [-0.2 + 0.1 * Math.abs(Math.sin(tt * 14)), 0, 0]), neck: [-0.3, 0, 0] }) });
    kick(t, w(30), 0.5, 0.5);
    const [cp, h] = headCam(C.demon, [1.2, -0.8, 6.5]); cam(t, [[w(29) - 0.1, cp, h, 42], [w(31), add(cp, [0, 0, -0.6]), h, 42]], { ap: 0.5 });
  });
  shot(31, '"You are the Monkey King?" (OTS down)', (t) => {
    lairL();
    demon(t, { keys: [[0, { from: 'point', waist: [0.35, 0, 0], neck: [0.35, 0, 0], shR: [-1.0, 0, -0.1] }]], faces: [[0, 'smug']], talk: [[w(31), e(34), 1]] });
    act(C.wkR, t, { pos: WP, yaw: PI, keys: [[0, 'cross']], faces: [[0, 'deadpan']], look: [0, 0.5] });
    cam(t, [[w(31) - 0.1, lr(-2.2, 12.5, -5.5), lr(0, 2.5, 7.5), 46], [w(35), lr(-2, 12, -4.8), lr(0, 2.5, 7.5), 46]], { ap: 0.3 });
  });
  shot(35, '"size of a peanut!"', (t) => {
    lairL();
    act(C.wkR, t, { pos: WP, yaw: PI, keys: [[0, 'cross']], faces: [[0, 'deadpan'], [w(40), 'angry']], look: [0, 0.4] });
    const pk = clamp((t - w(40)) / 0.3); if (pk > 0) { free(C.peanut, C.wkR.headWorld([1.4, 0.3, 0]), [0, 0, 0.4 + t], Math.max(0.01, back(pk)) * 1.8); FX.sparkBurst(C.wkR.headWorld([1.4, 0.3, 0]), t, w(40), 10, 1.0, 0.5, 4, '#ffe07a'); }
    hit(w(40), { z: 0.15, sh: 0.5, ds: 0.2, ca: 0.8 });
    const [cp, h] = headCam(C.wkR, [0.6, 0.6, -4.0]); cam(t, [[w(35) - 0.1, cp, h, 40], [w(41), add(cp, [0, 0, 0.4]), h, 40]], { ap: 0.6 });
  });
  shot(41, 'pulled out my own hair', (t) => {
    lairL();
    const pull = w(44);
    act(C.wkR, t, { pos: WP, yaw: PI, keys: [[0, 'idle'], [w(42), { from: 'idle', ikR: { t: [-0.2, 6.6, 0.3], k: 1, pole: [1, 0.5, 0] } }, 'out', 0.3], [pull + 0.4, { ikR: { t: [-0.5, 7.6, 0.6], k: 1, pole: [1, 0.5, 0] } }, 'back', 0.25]], faces: [[0, 'smug'], [pull + 0.4, { open: 0.3, smile: -0.2, mouthOpen: 0.3, browH: 0.8 }]] });
    FX.sparkBurst(C.wkR.gripWorld('R'), t, pull + 0.4, 10, 0.6, 0.6, 3, '#ffe07a');
    const [cp, h] = headCam(C.wkR, [0.9, 0.2, -4.2]); cam(t, [[w(41) - 0.1, cp, h, 40], [w(48), add(cp, [0, 0, 0.5]), h, 40]], { ap: 0.6 });
  });
  shot(48, 'and blew', (t) => {
    lairL();
    const bl = w(49);
    act(C.wkR, t, { pos: WP, yaw: PI, keys: [[0, { from: 'idle', ikR: { t: [-0.1, 4.8, 1.3], k: 1, pole: [1, -0.5, 0] } }]], faces: [[0, { open: 0.7, smile: 0, mouthOpen: 0.1, browH: 0.4 }], [bl, { open: 0.5, mouthOpen: 0.45, mouthO: 1, browH: 0.6, blush: 0.6 }]], noSacc: true });
    const hp = C.wkR.gripWorld('R');
    for (let i = 0; i < 26; i++) { const k = clamp((t - bl - hash(i) * 0.25) / 0.9); if (k <= 0) continue; FX.sprite(FX.TEX.spark, [hp[0] + (hash(i + 1) - 0.5) * 4 * k, hp[1] + (hash(i + 2) - 0.4) * 2 * k, hp[2] - 7 * easeOut(k)], 0.35, 1 - k, i, '#ffd46a', true, 2.5); }
    kick(t, bl, 0.4, 0.3);
    const h = C.wkR.headWorld(); cam(t, [[w(48) - 0.1, add(h, [-2.4, 0.4, -3.4]), add(h, [0, -0.3, -0.6]), 40], [w(50), add(h, [-2.2, 0.4, -3.0]), add(h, [0, -0.3, -0.6]), 40]], { ap: 0.6 });
  });
  const miniArc = (i) => { const a = (i / 13 - 0.5) * PI * 1.1; return lr(Math.sin(a) * 4.2, 0, 3.6 - Math.cos(a) * 1.2 + (i % 2) * 1.0); };
  shot(50, 'every hair turned into a tiny me', (t) => {
    lairL();
    act(C.wkR, t, { pos: WP, yaw: PI, keys: [[0, 'hips']], faces: [[0, 'smug']] });
    C.mini.forEach((m, i) => { const tp = w(51) + i * 0.07; FX.sparkBurst(add(miniArc(i), [0, 1, 0]), t, tp - 0.05, 8, 0.8, 0.4, i * 3, '#ffe07a'); if (t < tp) return; act(m, t, { pos: miniArc(i), yaw: PI + (hash(i) - 0.5) * 0.8, keys: [[0, 'cheer']], faces: [[0, i % 3 ? 'joy' : 'smug']], s: Math.max(0.01, back(clamp((t - tp) / 0.25))), extra: (tt, p) => bob(0.35, 11)(tt, p, i) }); });
    cam(t, [[w(50) - 0.1, lr(2.0, 1.5, -0.6), lr(0, 1.4, 4.2), 52], [w(57), lr(1.6, 1.4, 0.4), lr(0, 1.4, 4.2), 52]], { ap: 0.3 });
  });
  shot(57, 'Hundreds of them (charge)', (t) => {
    lairL(); caged(t, 'shock');
    demon(t, { keys: [[0, 'recoil']], faces: [[0, 'shock']] });
    act(C.wkR, t, { pos: WP, yaw: PI, keys: [[0, 'point']], faces: [[0, 'shout']], talk: [[w(57), e(59), 0.7]] });
    C.mini.forEach((m, i) => { const p0 = miniArc(i); const p1 = lr((i - 6.5) * 0.4, 0, 0.5); act(m, t, { keys: [[0, 'idle']], faces: [[0, 'angry']], walk: { path: [[p0[0], p0[2]], [p1[0], p1[2]]], t0: w(57) + (i % 4) * 0.05, t1: w(60) + 0.3, run: true, y: 0 } }); });
    cam(t, [[w(57) - 0.1, lr(7, 17, 17), lr(0, 0, 1.5), 50], [w(60), lr(6, 16, 15), lr(0, 0.5, 1), 50]], { ap: 0.0 });
  });
  shot(60, 'pinched him, poked him', (t) => {
    lairL(); caged(t, 'shock');
    demon(t, { keys: [[0, 'recoil']], faces: [[0, 'panic'], [w(63), { open: 1.3, pupil: 1, mouthOpen: 1, mouthO: 1, browH: 1.3, sweat: 1 }]], extra: flail, roll: Math.sin(t * 6) * 0.07 });
    swarm(t);
    hit(w(61) + 0.1, { z: 0.08, sh: 0.4, ds: 0, ca: 0.6 }); hit(w(63) + 0.1, { z: 0.12, sh: 0.6, ds: 0, ca: 0.8 });
    cam(t, [[w(60) - 0.1, lr(3.5, 6.5, 12), lr(0, 7.5, -2), 48], [w(65), lr(3, 7, 10.5), lr(0, 8, -2), 48]], { ap: 0.3 });
  });
  shot(65, 'bonked him with his own sword', (t) => {
    lairL(); caged(t, 'shock');
    const bk = w(67) + 0.08, j0 = w(65) - 0.05, k = clamp((t - j0) / (bk - j0));
    const ko = clamp((t - bk) / 0.6);
    demon(t, { keys: [[0, 'recoil'], [bk, { from: 'idle', neck: [0.3, 0, 0.3], waist: [-0.2, 0, 0.1] }, 'snap', 0.3]], faces: [[0, 'panic'], [bk, { open: 0.25, mouthOpen: 0.5, smile: -0.3, browH: -0.3, browTilt: 1 }]], extra: t < bk ? flail : null, roll: t > bk ? 0.15 * Math.sin(ko * PI * 3) * (1 - ko) : 0 });
    const ap = [lerp(WP[0], DP[0] + 0.3, k), Math.sin(k * PI * 0.92) * 7 + k * 2.5, lerp(WP[2], DP[2] + 2.2, k)];
    act(C.wkR, t, { pos: t < bk ? ap : add(ap, [0, -9 * Math.pow(clamp((t - bk) / 0.8), 2), 1.5 * clamp((t - bk) / 0.8)]), yaw: PI, keys: [[0, 'cheer'], [bk - 0.12, { from: 'point', shR: [-2.0, 0, -0.2] }, 'snap', 0.12]], faces: [[0, 'angry'], [bk, 'joy']] });
    hold(C.dsword, C.wkR, 'R', [0, 0, 0], [PI, 0, 0]);
    for (let i = 0; i < 5; i++) { const a = t * 5 + i * 1.25; if (t > bk) FX.sprite(FX.TEX.spark, add(C.demon.headWorld([0, 0.9, 0]), [Math.cos(a) * 1.6, 0.3, Math.sin(a) * 1.6]), 0.6, 1, a, '#ffe07a', true, 2.5); }
    FX.sparkBurst(C.demon.headWorld([0, 0.7, 0]), t, bk, 24, 2.5, 0.6, 5, '#ffffff'); hit(bk, { z: 0.22, sh: 1.2, ds: 0.4, ca: 1.6 }); st.flash = 0.5 * Math.max(0, 1 - Math.abs(t - bk) / 0.1);
    cam(t, [[w(65) - 0.1, lr(13, 7, 8), lr(0, 6, 1.5), 52], [w(73), lr(12, 7.5, 7), lr(0, 6.5, 1), 52]], { ap: 0.1 });
  });
  shot(73, 'I saved every monkey', (t) => {
    lairL();
    demon(t, { pos: lr(0, 0.6, -5), pitch: -PI / 2 + 0.1, keys: [[0, { shL: [0, 0, 1.4], shR: [0, 0, -1.4] }]], faces: [[0, { open: 0.15, mouthOpen: 0.5, smile: -0.3, browTilt: 1 }]] });
    act(C.wkR, t, { pos: lr(0, 0, 5), yaw: 0, keys: [[0, 'cheer']], faces: [[0, 'joy']], extra: bob(0.3, 9) });
    troupe(t, lr(0, 0, 5), 'joy', (i) => [[0, 'idle'], [w(74) + i * 0.05, 'cheer', 'back', 0.3]], { r: 3.4, arc: PI * 1.6, a0: 0, extra: bob(0.45, 10) });
    C.mini.forEach((m, i) => { const k = clamp((t - w(73) - i * 0.05) / 0.3); if (k >= 1) return; act(m, t, { pos: add(lr(0, 0, 5), [Math.sin(i) * 2.6, 0, Math.cos(i) * 2.6]), yaw: 0, keys: [[0, 'cheer']], faces: [[0, 'joy']], s: 1 - k }); FX.poof(add(lr(0, 0, 5), [Math.sin(i) * 2.6, 1, Math.cos(i) * 2.6]), t, w(73) + i * 0.05, 0.4, i, 0.4); });
    cam(t, [[w(73) - 0.1, lr(0.5, 10, 12.5), lr(0, 1.5, 2.5), 55], [w(77), lr(0.4, 9.5, 12), lr(0, 1.8, 2.5), 55]], { ap: 0.2 });
  });
  shot(77, 'But I needed a real weapon', (t) => {
    lairL();
    const bend = w(81);
    act(C.wkR, t, { pos: lr(0, 0, 5), yaw: 0.2, keys: [[0, { from: 'idle', ikR: { t: [-0.6, 4.2, 1.4], k: 1, pole: [1, -0.5, 0] } }]], faces: [[0, 'think'], [bend + 0.2, 'deadpan']] });
    hold(C.dsword, C.wkR, 'R', [0, 0, 0], [PI / 2 + 0.3, 0, 0]);
    if (t > bend) { C.dsword.children[0].rotation.x = 0; C.dsword.rotation.z = 0; }
    const sn = clamp((t - bend) / 0.25); C.dsword.children[0].scale.y = 1 - 0.55 * sn; C.dsword.children[0].position.y = (4.2 / 2 + 0.6) * (1 - 0.55 * sn) + 0.6 * 0.55 * sn * 0;
    FX.sparkBurst(C.wkR.gripWorld('R'), t, bend, 10, 1.2, 0.4, 7, '#ffffff'); kick(t, bend, 0.4, 0.3);
    const [cp, h] = headCam(C.wkR, [1.4, -0.6, 4.4], [0, -0.6, 0]); cam(t, [[w(77) - 0.1, cp, h, 42], [w(83), add(cp, [0, 0, -0.5]), h, 42]], { ap: 0.5 });
  });
  // ===== DRAGON PALACE =====
  const deep = (t, ex = []) => { L('deep', W2.DRG, [[dr(0, 16, 0), '#9ff0ff', 70, 70], ...ex]); W2.updateCaustics(t); st.tint = '#d8f4ff'; };
  const drgSit = (t, o = {}) => { act(C.drg, t, { pos: dr(0, 1.0, -12.6), yaw: 0, keys: o.keys || [[0, 'sit']], faces: o.faces || [[0, 'neutral']], talk: o.talk }); onHead(C.hornG, C.drg, [0, 0.4, 0]); };
  shot(83, 'Under the ocean (dive)', (t) => {
    deep(t); drgSit(t);
    const k = clamp((t - w(83) + 0.1) / (w(86) - w(83) + 0.3));
    const p = [dr(0, 0, 0)[0] + lerp(-6, 0, k), dr(0, lerp(24, 6, easeOut(k)), 0)[1], dr(0, 0, lerp(30, 12, easeOut(k)))[2]];
    act(C.wkR, t, { pos: p, yaw: PI, pitch: 1.1 * (1 - k * 0.6), keys: [[0, { from: 'cheer', shL: [-0.2, 0, 2.9], shR: [-0.2, 0, -2.9] }]], faces: [[0, 'joy']] });
    bubbles(t, add(p, [0, 1, 2]), 30, 1.5, 8, 3); bubbles(t, dr(0, 0, 8), 40, 18, 25, 11);
    cam(t, [[w(83) - 0.1, dr(10, 16, 44), add(p, [0, 0, -3]), 50], [w(86), dr(8, 10, 38), add(p, [0, 0, -3]), 50]], { ap: 0.0 });
  });
  shot(86, 'the Dragon King (throne)', (t) => {
    deep(t); drgSit(t, { faces: [[0, 'smug']] });
    bubbles(t, dr(0, 0, -8), 30, 10, 16, 21);
    cam(t, [[w(86) - 0.1, dr(3.5, 5.5, 0), dr(0, 5.2, -12.6), 42], [w(91), dr(2.5, 5.6, -3), dr(0, 5.4, -12.6), 42]], { ap: 0.4 });
  });
  shot(91, 'a treasure no one could lift (pillar tease)', (t) => {
    deep(t, [[pl(0, 10, 6), '#ffc860', 40 * S(w(91), w(93), t), 30]]); W2.pillarGlow.material.opacity = 0.15 + 0.05 * Math.sin(t * 6);
    bubbles(t, pl(0, 0, 3), 30, 8, 20, 31);
    cam(t, [[w(91) - 0.1, pl(4, 2, 22), pl(0, 14, 0), 50], [w(96), pl(3, 3, 17), pl(0, 16, 0), 50]], { ap: 0.1 });
    st.bloom = 0.8;
  });
  const DGp = dr(-1.8, 0, -5), WKp = dr(1.8, 0, -5);
  const drgStand = (t, keys = [[0, 'idle']], faces = [[0, 'proud']]) => { act(C.drg, t, { pos: DGp, yaw: PI / 2 - 0.25, keys, faces }); onHead(C.hornG, C.drg, [0, 0.4, 0]); };
  const twoShot = (t, i0, i1) => cam(t, [[w(i0) - 0.1, dr(0.3, 4.4, 10.5), dr(0, 3.6, -5), 46], [w(i1), dr(0.3, 4.4, 9.5), dr(0, 3.6, -5), 46]], { ap: 0.3 });
  shot(96, 'He gave me a sword', (t) => {
    deep(t); drgStand(t, [[0, 'present']], [[0, 'proud']]);
    const tk = w(99);
    act(C.wkR, t, { pos: WKp, yaw: -PI / 2 + 0.25, keys: [[0, 'idle'], [tk, { from: 'idle', shR: [-1.3, 0, -0.2], elR: [-0.6, 0, 0] }, 'out', 0.25]], faces: [[0, 'hopeful']] });
    if (t < tk + 0.1) hold(C.gsword, C.drg, 'R', [0, 0, 0], [PI / 2, 0, 0]); else hold(C.gsword, C.wkR, 'R', [0, 0, 0], [PI, 0, 0]);
    bubbles(t, dr(0, 0, -5), 20, 8, 12, 41); twoShot(t, 96, 101);
  });
  const tossed = (obj, t, t0, from, s = 1) => { const k = t - t0; free(obj, [from[0] + 9 * k, from[1] + 6 * k - 4 * k * k, from[2] - 2 * k], [k * 12, 0, k * 9], s); };
  shot(101, 'Too light (toss sword)', (t) => {
    deep(t); drgStand(t, [[0, 'present']], [[0, 'proud'], [w(102), 'shock']]);
    const fl = w(101) + 0.15;
    act(C.wkR, t, { pos: WKp, yaw: -PI / 2 + 0.25, keys: [[0, { from: 'idle', shR: [-1.3, 0, -0.2], elR: [-0.6, 0, 0] }], [fl, { from: 'shrug' }, 'snap', 0.2]], faces: [[0, 'bored']], talk: [[w(101), e(102), 0.6]] });
    if (t < fl) hold(C.gsword, C.wkR, 'R', [0, 0, 0], [PI, 0, 0]); else tossed(C.gsword, t, fl, add(WKp, [0, 4, 0]));
    const [cp, h] = headCam(C.wkR, [-3.6, -0.2, 2.2]); cam(t, [[w(101) - 0.1, cp, h, 42], [w(103), add(cp, [0.3, 0, -0.2]), h, 42]], { ap: 0.5 });
  });
  shot(103, 'A spear', (t) => {
    deep(t); drgStand(t, [[0, 'present']]);
    act(C.wkR, t, { pos: WKp, yaw: -PI / 2 + 0.25, keys: [[0, { from: 'idle', shR: [-0.9, 0, -0.3], elR: [-0.9, 0, 0] }]], faces: [[0, { open: 0.8, smile: 0.1, browH: 0.6, browTilt: 1 }]] });
    hold(C.spear, C.wkR, 'R', [0, 0, 0], [PI + 0.3, 0, 0]); FX.sparkBurst(C.wkR.gripWorld('R'), t, w(103), 10, 1, 0.4, 2, '#cfefff');
    twoShot(t, 103, 105);
  });
  shot(105, 'Too light (toss spear)', (t) => {
    deep(t); drgStand(t, [[0, 'present']], [[0, 'shock']]);
    const fl = w(105) + 0.2;
    act(C.wkR, t, { pos: WKp, yaw: -PI / 2 + 0.25, keys: [[0, { from: 'idle', shR: [-0.9, 0, -0.3], elR: [-0.9, 0, 0] }], [fl, 'shrug', 'snap', 0.2]], faces: [[0, 'bored']], talk: [[w(105), e(106), 0.6]] });
    if (t < fl) hold(C.spear, C.wkR, 'R', [0, 0, 0], [PI + 0.3, 0, 0]); else tossed(C.spear, t, fl, add(WKp, [0, 4, 0]));
    const [cp, h] = headCam(C.wkR, [-3.2, 0.4, -2.0]); cam(t, [[w(105) - 0.1, cp, h, 42], [w(107), add(cp, [0.3, 0, 0.2]), h, 42]], { ap: 0.5 });
  });
  shot(107, 'A giant fork', (t) => {
    deep(t); drgStand(t, [[0, 'hips']], [[0, 'proud']]);
    act(C.wkR, t, { pos: WKp, yaw: -PI / 2 + 0.6, keys: [[0, { from: 'idle', shR: [-0.7, 0, -0.35], elR: [-1.0, 0, 0] }]], faces: [[0, 'hopeful']] });
    hold(C.forkLo, C.wkR, 'R', [0, 0, 0], [PI, 0, 0]);
    FX.sparkBurst(C.wkR.gripWorld('R'), t, w(107), 12, 1.4, 0.4, 2, '#cfefff');
    cam(t, [[w(107) - 0.1, dr(4.5, 3.0, 3.5), dr(2.4, 6.2, -5), 46], [w(110), dr(4.2, 3.0, 2.8), dr(2.4, 6.4, -5), 46]], { ap: 0.3 });
  });
  shot(110, 'Snapped it like a breadstick', (t) => {
    deep(t);
    const sn = w(110) + 0.12; const k = clamp((t - sn) / 0.3);
    drgStand(t, [[0, 'hips'], [sn + 0.1, 'headHands', 'snap', 0.25]], [[0, 'proud'], [sn + 0.1, 'panic']]);
    act(C.wkR, t, { pos: WKp, yaw: -PI / 2 + 0.6, keys: [[0, { from: 'idle', shR: [-0.7, 0, -0.35], elR: [-1.0, 0, 0] }], [sn - 0.1, { ikL: { t: [0.6, 4.4, 1.6], k: 1, pole: [1, -0.5, 0] } }, 'out', 0.1]], faces: [[0, 'hopeful'], [sn, 'deadpan']] });
    hold(C.forkLo, C.wkR, 'R', [0, 0, 0], [PI, 0, 0]); C.forkHi.rotation.z = -1.7 * easeOut(k); C.forkHi.position.y = 2 - 0.3 * k;
    if (t > sn) FX.sparkBurst(C.forkHi.getWorldPosition(new THREE.Vector3()).toArray(), t, sn, 16, 1.2, 0.5, 9, '#f4d8a0');
    kick(t, sn, 0.6, 0.3); hit(sn, { z: 0.12, sh: 0.4, ds: 0.2, ca: 0.8 });
    twoShot(t, 110, 115);
  });
  shot(115, 'the palace started shaking', (t) => {
    deep(t, [[pl(0, 10, 6), '#ffc860', 30, 40]]);
    drgStand(t, [[0, 'recoil']], [[0, 'terror']]);
    act(C.wkR, t, { pos: WKp, yaw: -PI / 2 + 0.6, keys: [[0, 'crouch']], faces: [[0, 'shock']], look: [0.6, 0] });
    shake = Math.max(shake, 0.55 + 0.25 * Math.sin(t * 9)); bubbles(t, dr(0, 0, -6), 60, 14, 16, 51);
    for (let i = 0; i < 8; i++) FX.sparkBurst(dr((hash(i) - 0.5) * 24, 12, -12 + hash(i + 1) * 8), t, w(115) + i * 0.25, 6, 1.2, 0.8, i, '#c8b890');
    cam(t, [[w(115) - 0.1, dr(7, 7, 16), dr(0, 5, -7), 48], [w(120), dr(6, 7.5, 14), dr(0, 5, -7), 48]], { ap: 0.1 });
  });
  shot(120, 'A golden iron pillar (low angle)', (t) => {
    deep(t, [[pl(0, 6, 6), '#ffc860', 40, 40]]); W2.pillarGlow.material.opacity = 0.12;
    bubbles(t, pl(0, 0, 4), 40, 8, 30, 61); shake = Math.max(shake, 0.2);
    cam(t, [[w(120) - 0.1, pl(3, 1.5, 13), pl(0, 22, 0), 56, 0.05], [w(124), pl(2.4, 1.6, 11), pl(0, 26, 0), 56, 0.05]], { ap: 0.0 });
  });
  shot(124, 'Glowing.', (t) => {
    const g = S(w(124), w(124) + 0.35, t);
    deep(t, [[pl(0, 6, 5), '#ffc860', 30 + 40 * g, 40]]); W2.pillarGlow.material.opacity = 0.1 + 0.15 * g;
    st.flash = 0.25 * Math.max(0, 1 - Math.abs(t - w(124) - 0.15) / 0.15); st.bloom = 0.7;
    FX.sparkBurst(pl(0, 10, 1.5), t, w(124) + 0.1, 30, 6, 1.4, 4, '#ffd46a');
    cam(t, [[w(124) - 0.1, pl(1.5, 6, 9), pl(0, 12, 0), 46], [w(125), pl(1.3, 6.5, 8), pl(0, 13, 0), 46]], { ap: 0.2 });
  });
  shot(125, 'Waiting for me', (t) => {
    deep(t, [[pl(0, 5, 3), '#ffc860', 25, 30]]); W2.pillarGlow.material.opacity = 0.2;
    act(C.wkR, t, { pos: pl(0, 0, 6), yaw: PI, keys: [[0, 'idle'], [w(127), { from: 'idle', ikR: { t: [-0.4, 5, 1.6], k: 1, pole: [1, -0.4, 0] } }, 'io', 0.5]], faces: [[0, 'hopeful'], [w(127), 'joy']], look: [0, 0.3] });
    st.bloom = 0.6;
    const [cp, h] = headCam(C.wkR, [1.2, -0.3, -3.8]); cam(t, [[w(125) - 0.1, cp, h, 40], [w(128), add(cp, [0, 0, 0.5]), h, 40]], { ap: 0.6 });
  });
  shot(128, 'Eight tons (lift)', (t) => {
    deep(t, [[pl(0, 5, 3), '#ffc860', 35, 30]]); W2.pillarGlow.material.opacity = 0.35;
    const lk = S(w(129), w(130), t); W2.pillarStaff.position.y = 20 + 3 * lk; W2.pillarGlow.position.y = 20 + 3 * lk;
    act(C.wkR, t, { pos: pl(0, 0, 1.9), yaw: PI, keys: [[0, { from: 'crouch', hy: -0.3 }], [w(129), { from: 'idle', hy: 0, waist: [-0.15, 0, 0] }, 'io', 0.5]], faces: [[0, { open: 0.3, smile: -0.4, mouthOpen: 0.4, teeth: 1, browA: 1, sweat: 1 }], [w(130), 'joy']], world: [['L', pl(1.0, 3.2 + 3 * lk, 0.9), 1, [1, -0.3, 0]], ['R', pl(-1.0, 3.2 + 3 * lk, 0.9), 1, [1, -0.3, 0]]] });
    kick(t, w(128), 0.35, 0.4); shake = Math.max(shake, 0.25 * (1 - lk));
    FX.poof(pl(0, 0.6, 1.5), t, w(129), 1.4, 7, 0.9);
    cam(t, [[w(128) - 0.1, pl(6.5, 3.5, 9), pl(0, 4, 1), 46], [w(130), pl(5.5, 3.8, 8), pl(0, 5, 1), 46]], { ap: 0.2 });
  });
  shot(130, 'it could change size (twirl)', (t) => {
    deep(t, [[pl(0, 6, 6), '#ffc860', 25, 30]]); W2.pillarStaff.visible = false;
    act(C.wkR, t, { pos: pl(0, 0, 3), yaw: 0.3, keys: [[0, { from: 'cheer', shL: [0.04, 0, 0.3] }]], faces: [[0, 'joy']] });
    hold(C.staff, C.wkR, 'R', [0, 0, 0], [PI / 2, t * 14, 0]);
    for (let i = 0; i < 10; i++) { const a = t * 14 - i * 0.12; const g = C.wkR.gripWorld('R'); FX.sprite(FX.TEX.spark, [g[0] + Math.cos(a) * 4.3, g[1], g[2] + Math.sin(a) * 4.3], 0.7 * (1 - i / 10), 1 - i / 10, i, '#ffd46a', true, 2); }
    const h = C.wkR.headWorld(); cam(t, [[w(130) - 0.1, add(h, [2, 1.5, 9]), add(h, [0, 1.2, 0]), 46], [w(135), add(h, [1.5, 1.5, 8]), add(h, [0, 1.2, 0]), 46]], { ap: 0.2 });
  });
  shot(135, '"Smaller!" A needle', (t) => {
    deep(t); W2.pillarStaff.visible = false;
    act(C.wkR, t, { pos: pl(0, 0, 3), yaw: 0, keys: [[0, { from: 'idle', ikR: { t: [-0.3, 4.6, 1.5], k: 1, pole: [1, -0.5, 0] } }]], faces: [[0, 'shout'], [w(136), { open: 1.2, smile: 0.6, browH: 0.8, browTilt: 1 }]], talk: [[w(135), e(135), 1]] });
    const sk = lerp(1, 0.05, easeOut(clamp((t - w(135) - 0.1) / 0.3)));
    hold(C.staff, C.wkR, 'R', [0, 0, 0], [0, 0, PI / 2], sk);
    FX.sparkBurst(C.wkR.gripWorld('R'), t, w(135) + 0.2, 12, 1.0, 0.5, 5, '#ffd46a');
    const g = C.wkR.gripWorld('R'); cam(t, [[w(135) - 0.1, add(g, [0.8, 0.6, 4.2]), add(g, [-0.3, 0.6, 0]), 38], [w(138), add(g, [0.6, 0.5, 3.2]), add(g, [-0.3, 0.6, 0]), 38]], { ap: 0.6 });
  });
  shot(138, '"Bigger!" touched the ocean floor', (t) => {
    deep(t, [[pl(0, 20, 8), '#ffc860', 80, 60]]); W2.pillarStaff.visible = false;
    const g0 = w(138) + 0.1, gk = easeOut(clamp((t - g0) / 0.6)); const sc = lerp(0.05, 7, gk);
    const hY = 3.6 + 30 * gk;
    act(C.wkR, t, { pos: pl(0, hY - 3.6, 3), yaw: 0, keys: [[0, { from: 'idle', ikR: { t: [-0.3, 4.6, 1.5], k: 1, pole: [1, -0.5, 0] } }], [g0, { from: 'cheer', shL: [-0.3, 0, 1.4] }, 'snap', 0.25]], faces: [[0, 'shout'], [g0 + 0.3, 'joy']], talk: [[w(138), e(138), 1]] });
    free(C.staff, add(C.wkR.gripWorld('R'), [0, -31.5 * gk + 0.1 * 0, 0]), [0, 0, 0], sc);
    kick(t, g0 + 0.55, 1.1, 0.6); FX.poof(pl(0, 0.5, 3), t, g0 + 0.5, 3.5, 9, 1.0); hit(g0 + 0.55, { z: 0.15, sh: 1.0, ds: 0.2, ca: 1.2 });
    bubbles(t, pl(0, 0, 3), 50, 10, 40, 71);
    cam(t, [[w(138) - 0.1, pl(16, 8, 38), pl(0, 10, 3), 50], [w(144), pl(20, 14, 52), pl(0, 16, 3), 54]], { ap: 0.0 });
    st.bloom = 0.8;
  });
  shot(144, 'tucked it behind my ear', (t) => {
    deep(t); W2.pillarStaff.visible = false;
    const tk = w(147);
    act(C.wkR, t, { pos: pl(0, 0, 3), yaw: 0.2, keys: [[0, { from: 'idle', ikR: { t: [-0.4, 4.6, 1.4], k: 1, pole: [1, -0.5, 0] } }], [w(145), { ikR: { t: [-0.95, 5.3, 0.1], k: 1, pole: [1, 0.3, 0] } }, 'io', 0.4], [tk + 0.4, { from: 'hips' }, 'io', 0.4]], faces: [[0, 'smug']], extra: (tt, p) => ({ ...p, neck: add(p.neck || [0, 0, 0], [0, 0, 0.15]) }) });
    if (t < tk + 0.2) hold(C.staff, C.wkR, 'R', [0, 0, 0], [0, 0, PI / 2], 0.05); else onHead(C.needle, C.wkR, [-0.72, 0.15, 0.05], [0.5, 0, 0.3], 0.07 / 1);
    const [cp, h] = headCam(C.wkR, [-2.4, 0.2, 2.6]); cam(t, [[w(144) - 0.1, cp, h, 38], [w(150), add(cp, [0.2, 0, -0.3]), h, 38]], { ap: 0.6 });
  });
  shot(150, '"Thanks. I will take it."', (t) => {
    deep(t);
    drgStand(t, [[0, 'idle'], [w(151), 'facepalm', 'io', 0.3]], [[0, 'shock'], [w(151), 'sad']]);
    act(C.wkR, t, { pos: WKp, yaw: -PI / 2 - 0.5, keys: [[0, 'thumb']], faces: [[0, 'smug']], talk: [[w(150), e(153), 0.7]] });
    onHead(C.needle, C.wkR, [-0.72, 0.15, 0.05], [0.5, 0, 0.3], 0.07);
    bubbles(t, dr(0, 0, -5), 20, 8, 12, 81);
    cam(t, [[w(150) - 0.1, dr(4, 4.5, 6), dr(0, 4.2, -5), 44], [w(154), dr(3.4, 4.5, 5), dr(0, 4.2, -5), 44]], { ap: 0.3 });
  });
  // ===== NIGHT CAVE + UNDERWORLD =====
  const nightCave = () => { L('cave', WD.CAVE, [[cv(0, 9, 4), '#7f9fff', 90, 40], [cv(-2, 6, -8), '#b8c8ff', 60, 18]]); st.exposure = 1.15; st.tint = '#c8d4ff'; };
  const bedP = cv(1.0, 1.75, -12);
  shot(154, 'That night, men in black chain me', (t) => {
    nightCave();
    act(C.wkR, t, { pos: bedP, yaw: -PI / 2, pitch: -PI / 2, keys: [[0, { shL: [0, 0, 0.3], shR: [0, 0, -0.3] }]], faces: [[0, 'sleep'], [w(160) + 0.2, 'shock']], noSacc: true, noBlink: true, extra: (tt, p) => ({ ...p, waist: [0.03 * Math.sin(tt * 2), 0, 0] }) });
    const sneak = clamp((t - w(154)) / (w(160) - w(154)));
    C.blk.forEach((b, i) => { act(b, t, { pos: cv(1.6 + i * 3.4, 0, lerp(-17, -14.4, ss(sneak))), yaw: 0, keys: [[0, { from: 'lean', shR: [-1.0, 0, -0.1], elR: [-0.4, 0, 0] }], [w(160), { from: 'idle', shR: [-1.4, 0, -0.1], shL: [-1.4, 0, 0.1] }, 'snap', 0.25]], faces: [[0, 'creepy']] }); });
    hold(C.chain, C.blk[0], 'R', [0, 0, 0]);
    if (t > w(160)) free(C.chain2, add(C.wkR.headWorld(), [2.2, 0.4, 0]), [0, 0, PI / 2], 1);
    kick(t, w(160), 0.5, 0.3); if (t > w(160)) st.tint = '#c8d0ff';
    cam(t, [[w(154) - 0.1, cv(-4, 5.5, -4.5), cv(3.4, 2.4, -11), 48], [w(163), cv(-3.4, 5.2, -5.5), cv(3.4, 2.4, -11), 48]], { ap: 0.3 });
    st.vign = 0.5;
  });
  const uwL = () => { L('under', W2.UW, [[uw(-8, 6, -4), '#6affb0', 80, 30], [uw(8, 6, -4), '#6affb0', 80, 30], [uw(0, 10, 6), '#ff9a9a', 60, 40]]); st.exposure = 1.15; };
  shot(163, 'dragged me to the Underworld', (t) => {
    uwL();
    const a = w(163) - 0.1, b = w(168);
    C.blk.forEach((bk, i) => act(bk, t, { keys: [[0, { from: 'idle', shR: [-0.6 + 0.3 * i, 0, -0.1], shL: [-0.6, 0, 0.1] }]], faces: [[0, 'creepy']], walk: { path: [[W2.UW[0] - 1.6 + i * 3.2, W2.UW[2] + 16], [W2.UW[0] - 1.6 + i * 3.2, W2.UW[2] - 2]], t0: a, t1: b, y: 0 } }));
    const k = ss(clamp((t - a) / (b - a))); const z = lerp(W2.UW[2] + 22, W2.UW[2] + 4, k);
    act(C.wkR, t, { pos: [W2.UW[0], 0.6, z], yaw: PI, pitch: -1.35, keys: [[0, { shL: [-2.9, 0, 0.3], shR: [-2.9, 0, -0.3] }]], faces: [[0, 'panic']] });
    free(C.chain2, [W2.UW[0], 1.0, z - 3.2], [PI / 2, 0, 0], 1);
    cam(t, [[a, uw(9, 5, 26), uw(0, 3, 4), 46], [b, uw(7, 6, 18), uw(0, 3, -2), 46]], { ap: 0.1 });
  });
  const bookOpen = (t, cr, hl) => { book(cr, hl); };
  shot(168, 'opened the Book of Life and Death', (t) => {
    uwL(); bookOpen(t, 0, false);
    C.blk.forEach((bk, i) => act(bk, t, { pos: uw(-3.8 + i * 7.6, 0, -5.5), yaw: (i ? -PI / 2 : PI / 2), keys: [[0, 'present']], faces: [[0, 'creepy']] }));
    FX.sparkBurst(uw(0, 4.2, -6), t, w(169), 24, 2.5, 1.0, 3, '#7affb8');
    cam(t, [[w(168) - 0.1, uw(0, 8.5, 1.5), uw(0, 3.6, -6), 44], [w(176), uw(0, 7.5, -1), uw(0, 3.6, -6), 44]], { ap: 0.2 });
    st.bloom = 0.8;
  });
  shot(176, 'My name: Sun Wukong. Dies...', (t) => {
    uwL(); bookOpen(t, 0, t > w(178));
    cam(t, [[w(176) - 0.1, uw(1.0, 6.6, -3.6), uw(1.0, 3.6, -6.1), 40], [w(180), uw(1.0, 6.2, -4.2), uw(1.0, 3.6, -6.1), 40]], { ap: 0.4 });
  });
  shot(180, 'Dies... tonight (terror)', (t) => {
    uwL();
    act(C.wkR, t, { pos: uw(0, 0, -2.5), yaw: PI, keys: [[0, 'recoil']], faces: [[0, 'terror']], noSacc: true });
    WD.lamp(3, C.wkR.headWorld([0, -0.8, -2.5]), '#ff6060', 25, 8);
    const [cp, h] = headCam(C.wkR, [0, -0.1, -2.8]); cam(t, [[w(180) - 0.1, cp, h, 36], [w(182), add(cp, [0, 0, 0.6]), h, 36, 0, 'in']], { ap: 0.6 });
    hit(w(180), { z: 0.12, sh: 0.5, ds: 0.8, ca: 1.3, hold: true }); hit(w(181), { z: 0.18, sh: 0.8, ds: 1.0, ca: 1.6, hold: true }); st.vign = 0.75; st.tint = '#ffc8c8';
  });
  shot(182, 'So I grabbed their brush', (t) => {
    uwL(); bookOpen(t, 0, true);
    const gr = w(184) + 0.1;
    act(C.blk[0], t, { pos: uw(2.4, 0, -4.4), yaw: -PI / 2 - 0.3, keys: [[0, { from: 'idle', shR: [-1.2, 0, -0.1], elR: [-0.4, 0, 0] }], [gr, 'recoil', 'snap', 0.25]], faces: [[0, 'creepy'], [gr, 'shock']] });
    act(C.blk[1], t, { pos: uw(-2.6, 0, -4.6), yaw: PI / 2, keys: [[0, 'idle']], faces: [[0, 'creepy']] });
    act(C.wkR, t, { pos: uw(0, 0, -2.6), yaw: PI + 0.4, keys: [[0, 'idle'], [gr - 0.2, { from: 'idle', shR: [-1.4, -0.5, -0.4], elR: [-0.3, 0, 0] }, 'snap', 0.2]], faces: [[0, 'angry']] });
    if (t < gr) hold(C.brush, C.blk[0], 'R', [0, 0, 0], [PI, 0, 0]); else hold(C.brush, C.wkR, 'R', [0, 0, 0], [PI, 0, 0]);
    kick(t, gr, 0.4, 0.3);
    cam(t, [[w(182) - 0.1, uw(-1.2, 6.3, -8.6), uw(0.4, 4.4, -3), 44], [w(187), uw(-1, 6.2, -8.2), uw(0.4, 4.4, -3), 44]], { ap: 0.3 });
  });
  shot(187, 'and crossed it out', (t) => {
    uwL(); const k = S(w(188), e(190), t); bookOpen(t, k, false);
    kick(t, e(190), 0.4, 0.3);
    cam(t, [[w(187) - 0.1, uw(1.0, 6.4, -3.9), uw(1.0, 3.6, -6.1), 40], [w(191), uw(1.0, 6.2, -4.1), uw(1.0, 3.6, -6.1), 40]], { ap: 0.4 });
  });
  shot(191, "Mine, and every monkey's. Forever.", (t) => {
    uwL(); bookOpen(t, 1 + S(w(192), e(194), t), false);
    C.blk.forEach((bk, i) => act(bk, t, { pos: uw(-3 + i * 6, 0, -4.4), yaw: PI + (i ? 0.6 : -0.6), keys: [[0, 'headHands']], faces: [[0, 'panic']] }));
    act(C.wkR, t, { pos: uw(0, 0, -2.6), yaw: PI, keys: [[0, { from: 'idle', ikR: { t: [-0.2, 3.8, 2.2], k: 1, pole: [1, -0.5, 0] } }], [w(195), { from: 'cheer' }, 'back', 0.3]], faces: [[0, { happy: 1, smile: 1, mouthOpen: 0.8, teeth: 1, browA: 0.5 }]], extra: (tt, p) => (p.ikR && tt < w(195) ? { ...p, ikR: { ...p.ikR, t: [-0.2 + Math.sin(tt * 16) * 0.6, 3.8, 2.2] } } : p) });
    hold(C.brush, C.wkR, 'R', [0, 0, 0], [PI, 0, 0]);
    hit(w(195), { z: 0.15, sh: 0.7, ds: 0, ca: 1.0 }); FX.sparkBurst(uw(0, 4.2, -6), t, w(195), 30, 3, 0.8, 8, '#ff6a6a');
    cam(t, [[w(191) - 0.1, uw(-1.2, 6.0, -8.8), uw(0, 4.4, -3), 44], [w(196), uw(-1.0, 5.8, -8.2), uw(0, 4.6, -3), 44]], { ap: 0.3 });
  });
  // ===== HEAVEN =====
  const H = WD.HEAV;
  const jadeSit = (t, keys = [], faces = [[0, 'neutral']], talk = null) => act(C.jade, t, { pos: [H[0], H[1] + 1.0, H[2] - 10.6], yaw: 0, keys: [[0, { from: 'sit', ikR: { t: [-0.4, 4.6, 1.7], k: 1, pole: [1, -0.7, 0] } }], ...keys], faces, talk });
  shot(196, 'Jade Emperor slammed down his tea', (t) => {
    L('heaven', H); WD.updatePetals(t, true, 'spark');
    const sl = w(202) + 0.15;
    jadeSit(t, [[w(201), { from: 'sit', ikR: { t: [-1.4, 6.2, 1.2], k: 1, pole: [1, -0.7, 0] } }, 'io', 0.3], [sl - 0.08, { from: 'sit', ikR: { t: [-2.4, 3.6, 1.0], k: 1, pole: [1, -0.4, 0] }, waist: [0.2, 0, 0] }, 'snap', 0.12]], [[0, 'neutral'], [w(200), 'angry']]);
    if (t < sl) hold(WD.teacup, C.jade, 'R', [0, -0.05, 0.15]); else free(WD.teacup, add(H, [2.6, 2.75, -9.4]), [0, 0, 0], 1);
    FX.sparkBurst(add(H, [2.6, 3.0, -9.4]), t, sl, 26, 1.8, 0.7, 9, '#c8a040'); kick(t, sl, 1.0, 0.5); hit(sl, { z: 0.2, sh: 1.0, ds: 0.4, ca: 1.4 }); st.flash = 0.4 * Math.max(0, 1 - Math.abs(t - sl) / 0.1);
    cam(t, [[w(196) - 0.1, add(H, [0.5, 6.4, -2.8]), add(H, [0.9, 4.8, -10.2]), 46], [w(206), add(H, [0.4, 6.2, -4.0]), add(H, [0.9, 4.8, -10.2]), 46]], { ap: 0.4 });
  });
  shot(206, '"Bring me... that monkey."', (t) => {
    L('heaven', H);
    jadeSit(t, [[0, { from: 'sit', shR: [-1.5, 0, -0.1], elR: [-0.1, 0, 0], ikR: { t: [0, 0, 0], k: 0 }, waist: [0.25, 0, 0] }]], [[0, 'angry']], [[w(206), e(209), 1]]);
    const [cp, h] = headCam(C.jade, [0.8, -0.5, 4.2]); cam(t, [[w(206) - 0.1, cp, h, 40], [w(210), add(cp, [0, 0, -0.8]), h, 40, 0, 'in']], { ap: 0.6 });
    st.tint = '#ffd0c0'; st.vign = 0.6; hit(w(208), { z: 0.15, sh: 0.6, ds: 0.3, ca: 1.0, hold: true });
  });
  shot(210, 'PART 3 end card', (t) => {
    L('golden', [0, 60, 0]);
    const p = [lerp(-6, 6, (t - w(210)) / 3), 60, 0];
    act(C.wkR, t, { pos: p, yaw: PI / 2 - 0.5, keys: [[0, { from: 'hips', ikL: { t: [0, 0, 0], k: 0 }, shL: [-2.6, 0, 0.3] }]], faces: [[0, 'smug']], extra: (tt, pp) => ({ ...pp, tailWag: 2 }) }); nimbusUnder(C.wkR, t);
    hold(C.staff, C.wkR, 'L', [0, 0, 0], [PI / 2, 0, 0], 0.8);
    cam(t, [[w(210) - 0.1, add(p, [1, 4, 14]), add(p, [0, 4, 0]), 46], [T.duration, add(p, [1, 4, 12]), add(p, [0, 4, 0]), 46]], { ap: 0.0 });
    st.fade = S(T.duration - 0.25, T.duration, t);
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
const SOLO = new Set([23, 49, 57, 67, 124, 135, 137, 195]);
const BIG = new Set([138, 180, 181]);
let CH = null;
function chunks() { if (CH) return CH; CH = []; let cur = []; const flush = () => { if (cur.length) CH.push(cur); cur = []; };
  for (let i = 0; i < NW; i++) { if (SOLO.has(i) || BIG.has(i)) { flush(); CH.push([i]); continue; } cur.push(i); const w = T.words[i].w; if (/[.,!?:;]["”]?$|\.\.\.$/.test(w) || cur.length >= 3) flush(); } flush(); return CH; }
const clean = (w) => w.replace(/["“”]/g, '').toUpperCase().replace(/[.,:;]+$/, '');
export function captionChunk(t) {
  if (t < wS(3) - 0.05) return null;
  const L2 = chunks(); let c = null;
  for (const ch of L2) { const s = wS(ch[0]) - 0.05; const e2 = Math.max(wE(ch[ch.length - 1]) + 0.12, s + 0.35); if (t >= s && t < e2) c = ch; }
  if (!c) return null; let a = 0; c.forEach((i, j) => { if (t >= wS(i) - 0.03) a = j; });
  return { words: c.map(i => clean(T.words[i].w)), act: a, k: t - wS(c[a]), k0: t - wS(c[0]) + 0.05, big: BIG.has(c[0]) && c.length === 1, color: (c[0] === 180 || c[0] === 181) ? '#FF3B3B' : null };
}
// ---------- overlays ----------
function badge(ctx, txt, sub, x, y, s = 1, rot = -0.04, bg = '#FFD23F') { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.font = '64px Lucky'; let w = ctx.measureText(txt).width; if (sub) { ctx.font = '40px "Noto Sans CJK SC"'; w = Math.max(w, ctx.measureText(sub).width); } w += 60; ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(0, 0, w, 100 + (sub ? 52 : 0), 18); ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = '#0b0710'; ctx.stroke(); ctx.fillStyle = '#0b0710'; ctx.textBaseline = 'middle'; ctx.font = '64px Lucky'; ctx.fillText(txt, 30, 56); if (sub) { ctx.font = '700 40px "Noto Sans CJK SC"'; ctx.fillStyle = '#B0302A'; ctx.fillText(sub, 30, 120); } ctx.restore(); }
function bigText(ctx, W, H, lines, y, size, colors, rot = -0.05, s = 1) { ctx.save(); ctx.translate(W / 2, y); ctx.rotate(rot); ctx.scale(s, s); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; lines.forEach((l, i) => { const sz = size[i]; ctx.font = `${sz}px Lucky`; const yy = i ? size.slice(0, i).reduce((a, b) => a + b * 1.0, 0) : 0; ctx.lineWidth = sz * 0.17; ctx.strokeStyle = '#0b0710'; ctx.strokeText(l, 0, yy); ctx.fillStyle = colors[i]; ctx.fillText(l, 0, yy); }); ctx.restore(); }
export function overlayFx(t) {
  const out = [];
  if (t < wS(3)) { const pop = 1 + 0.04 * Math.sin(t * 12); out.push((ctx, W, H) => bigText(ctx, W, H, ['I CLONED', 'MYSELF'], H * 0.2, [190, 230], ['#FFFFFF', '#FFE53E'], -0.05, pop)); out.push((ctx, W, H) => badge(ctx, 'MONKEY KING · PART 2', null, 40, H * 0.06, 0.6, -0.03)); }
  else out.push((ctx, W, H) => badge(ctx, 'MONKEY KING · PART 2', null, 40, 120, 0.6, -0.03));
  if (t >= wS(25) && t < wS(29)) { const k = t - wS(25); out.push((ctx, W, H) => badge(ctx, 'DEMON KING OF HAVOC', '混世魔王', -900 + 960 * easeOut(clamp(k / 0.25)), H * 0.19, 0.95, -0.04, '#FF8A8A')); }
  if (t >= wS(57) && t < wS(60)) { const n = Math.floor(300 * easeOut(clamp((t - wS(57)) / 1.2))); out.push((ctx, W, H) => bigText(ctx, W, H, ['×' + n], H * 0.24, [150], ['#FFE53E'], 0.05)); }
  if (t >= wS(86) && t < wS(91)) { const k = t - wS(86); out.push((ctx, W, H) => badge(ctx, 'THE DRAGON KING', '东海龙王 · KING OF THE EAST SEA', -900 + 960 * easeOut(clamp(k / 0.25)), H * 0.19, 0.95, -0.04, '#8AF0E0')); }
  if (t >= wS(128) && t < wS(130) + 0.3) { const s = Math.max(0.01, back(clamp((t - wS(128)) / 0.3))); out.push((ctx, W, H) => bigText(ctx, W, H, ['8 TONS', '13,500 JIN'], H * 0.22, [170, 70], ['#FFE53E', '#FFFFFF'], -0.04, s)); }
  if (t >= wS(169) && t < wS(176)) { const k = t - wS(169); out.push((ctx, W, H) => badge(ctx, 'BOOK OF LIFE & DEATH', '生死簿', -900 + 960 * easeOut(clamp(k / 0.25)), H * 0.19, 0.95, -0.04, '#E8DCC0')); }
  if (t >= wS(210)) { const k = t - wS(210); out.push((ctx, W, H) => { const s = Math.max(0.01, back(clamp(k / 0.35))); bigText(ctx, W, H, ['PART 3', "HEAVEN'S WORST JOB"], H * 0.36, [210, 70], ['#FFD23F', '#FFFFFF'], -0.06, s); }); }
  return out;
}
