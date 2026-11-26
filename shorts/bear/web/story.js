// VIDEO 5 — "The November 2026 Polar Bear Finally Came"
import { THREE, scene, camera, PI, clamp, lerp, ss, S, ramp, easeOut, easeIn, back, spring, noise, hash, lerp3, part, P, plastic, glow, group, mesh, PRE } from './core.js';
import * as WD from './world.js';
import { Rig } from './rig.js';
import { Bear, BPOSE, bmix } from './bear.js';
import { act, setEnv, env, blinkAt } from './anim.js';
import * as FX from './fx.js';

let T, wS, wE, NW; const SH = []; let C = {}; let st = {};
const Q = new URLSearchParams(location.search);
const yawTo = (f, t) => Math.atan2(t[0] - f[0], t[2] - f[2]);
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const PLAZA = [0, 0, -20], BEARP = [0, 0, -34];
let PRE_PHOTO = null;
PRE.push(() => { if (PRE_PHOTO) PRE_PHOTO(); });

// ---------- camera ----------
let shake = 0, hits = [];
function cam(t, keys, o = {}) {
  let i = 0; while (i < keys.length - 2 && t > keys[i + 1][0]) i++;
  const a = keys[i], b = keys[Math.min(i + 1, keys.length - 1)];
  const k = b[0] === a[0] ? 0 : clamp((t - a[0]) / (b[0] - a[0]));
  const e = b[5] === 'out' ? easeOut(k) : b[5] === 'lin' ? k : b[5] === 'in' ? easeIn(k) : ss(k);
  const pos = lerp3(a[1], b[1], e), tg = lerp3(a[2], b[2], e); let fov = lerp(a[3], b[3], e); const roll = lerp(a[4] || 0, b[4] || 0, e);
  let ca = 0, desat = 0;
  for (const h of hits) { const d = t - h.t; if (d >= 0 && d < 0.9) { const z = h.z ?? 0.22; fov *= 1 - z * easeOut(d / 0.07) * (h.hold ? 1 : (1 - S(0.45, 0.9, d))); ca = Math.max(ca, (h.ca ?? 1) * (1 - d / 0.5)); desat = Math.max(desat, (h.ds ?? 0.6) * (1 - S(0, 0.35, d))); shake = Math.max(shake, (h.sh ?? 0.8) * Math.pow(1 - clamp(d / 0.45), 2)); } }
  const hh = o.hand ?? 0.05; pos[0] += noise(t * 0.9, 1) * hh; pos[1] += noise(t * 0.8, 2) * hh; pos[2] += noise(t * 0.7, 3) * hh;
  camera.position.set(...pos); camera.fov = fov; camera.up.set(0, 1, 0); camera.lookAt(...tg); camera.rotateZ(roll + noise(t * 0.6, 7) * 0.006);
  if (shake > 0) { camera.rotateX(noise(t * 41, 4) * shake * 0.035); camera.rotateY(noise(t * 37, 8) * shake * 0.035); camera.rotateZ(noise(t * 33, 9) * shake * 0.03); }
  st.ca = Math.max(st.ca || 0, ca); st.desat = Math.max(st.desat || 0, desat);
  st.focus = o.focus ?? camera.position.distanceTo(new THREE.Vector3(...tg)); st.aperture = o.ap ?? 0.55;
}
const hit = (t, o = {}) => hits.push({ t, ...o });
const kick = (t, t0, amp = 0.6, dur = 0.4) => { const d = t - t0; if (d >= 0 && d < dur) shake = Math.max(shake, amp * Math.pow(1 - d / dur, 2)); };
const freezeK = (t, t0, dur = 0.32) => t < t0 ? 0 : clamp((t - t0) / dur);
// lights
const LAMPS = []; for (let x = -100; x <= 100; x += 14) { LAMPS.push([x, 7.0, -7.6]); LAMPS.push([x + 7, 7.0, 7.6]); }
function night(center, o = {}) {
  WD.setLight(o.dark ? 'night2' : 'night', center, o.mdir);
  const near = LAMPS.map(p => [p, Math.hypot(p[0] - center[0], p[2] - center[2])]).sort((a, b) => a[1] - b[1]);
  for (let i = 0; i < 2; i++) WD.lamp(i, near[i][0], '#ffb35c', o.li ?? 70, 30);
  if (o.key) WD.lamp(2, o.key, o.keyC || '#9fb8ff', o.ki ?? 25, 18);
  if (o.rim) WD.lamp(3, o.rim, o.rimC || '#ffb35c', o.ri ?? 30, 16);
}
function warm(center, lamps) { WD.setLight('warm', center); WD.sky.visible = false; WD.stars.visible = false; lamps.forEach((l, i) => WD.lamp(i, l[0], l[1] || '#ffd9a8', l[2] ?? 40, l[3] ?? 30)); }

// ---------- setup ----------
export async function setupStory() {
  T = await (await fetch('../work/' + (Q.get('timing') || 'timing.json'))).json();
  try { setEnv(await (await fetch('../work/' + (Q.get('env') || 'env.json'))).json()); } catch (e) { }
  wS = (i) => T.words[Math.min(i, T.words.length - 1)].s; wE = (i) => T.words[Math.min(i, T.words.length - 1)].e; NW = T.words.length;
  C.benny = new Rig({ skin: '#F2C9A0', shirt: '#3FA7D6', pants: '#2F3B57', shoes: '#E0453A', soles: '#ffffff', hair: 'messy', hairColor: '#6B3A22', streak: '#2EE6C9', scarf: '#E0453A', stripe: '#ffffff', badge: '#FFD23F', freckles: true, blush: 0.45, scale: 0.92, seed: 1 });
  C.hen = new Rig({ skin: '#E8B796', shirt: '#2f7a46', sweater: '#c42b2b', pants: '#5a4632', shoes: '#3a2a20', hair: 'bald', hairColor: '#9a9aa0', mustache: '#9a9aa0', longSleeves: true, scale: 1.05, seed: 2, browCol: '#8a8a90' });
  C.mayor = new Rig({ skin: '#F0C8A8', shirt: '#ffffff', jacket: '#2a2350', tie: '#c42b2b', pants: '#2a2350', shoes: '#111', hair: 'toupee', hairColor: '#e0b040', sideColor: '#c9c9cf', sash: '#d4a017', longSleeves: true, cuffs: '#2a2350', scale: 1.12, seed: 3, mustache: '#c9c9cf' });
  C.teach = new Rig({ skin: '#C68E6A', shirt: '#b06ab3', pants: '#3a3550', shoes: '#222', hair: 'bun', hairColor: '#2b1d14', glasses: '#2b2b33', longSleeves: true, seed: 4 });
  C.dad = new Rig({ skin: '#F2C9A0', shirt: '#7a7f8a', hoodie: true, pocket: '#6a6f7a', pants: '#3a4a6a', shoes: '#eeeeee', hair: 'cap', capColor: '#2e5a8a', hairColor: '#6B3A22', stubble: true, longSleeves: true, scale: 1.08, seed: 5 });
  const SK = ['#F2C9A0', '#C68E6A', '#8D5A3B', '#F5D3B8', '#E2B48C', '#A86F4C', '#F0C8A8', '#7a4a30'], SHC = ['#f2b630', '#e94f4f', '#7cc24a', '#c3aed6', '#ff8fa3', '#5dade2', '#f39c4a', '#48c9b0'];
  const HAIR = ['bob', 'cap', 'beanie', 'buzz', 'bun', 'messy', 'beanie', 'cap'], HC = ['#2b1d14', '#7a4a28', '#e3b04b', '#1a1a1a'];
  C.folk = []; for (let i = 0; i < 8; i++) C.folk.push(new Rig({ skin: SK[i], shirt: SHC[i], pants: ['#2f3b57', '#4b3a2a', '#3d5a80', '#5a4a6a'][i % 4], shoes: '#2a2a2a', hair: HAIR[i], hairColor: HC[i % 4], capColor: ['#e0453a', '#3f6e9e', '#7b2fbe', '#2e8b57'][i % 4], longSleeves: i % 2 === 0, scarf: i % 3 === 0 ? ['#ffd23f', '#e0453a', '#5dade2'][i % 3] : null, glasses: i === 3 ? '#222' : null, scale: i >= 6 ? 0.9 : 1, seed: 10 + i }));
  for (const r of [C.benny, C.hen, C.mayor, C.teach, C.dad, ...C.folk]) r.ice = new FX.IceBlock(r.root);
  C.mayor.ice.g.scale.set(1.18, 1.12, 1.25);
  C.bear = new Bear({ scale: 1.0 });
  C.shovel = group([0, 0, 0]); { const wood = P('#8a5a3c'); part(0.16, 3.6, 0.16, wood, [0, 0.4, 0], 0.05, C.shovel); part(0.9, 0.12, 0.16, P('#222'), [0, 2.2, 0], 0.04, C.shovel); part(1.3, 0.1, 1.2, plastic('#c0c4cc', { metal: 0.7, rough: 0.3 }), [0, -1.5, 0.35], 0.03, C.shovel, [0.35, 0, 0]); }
  C.dadPhone = part(0.5, 0.95, 0.07, plastic('#15161c', { rough: 0.25 }), [0, 0, 0], 0.05); mesh(new THREE.PlaneGeometry(0.44, 0.86), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.2, 1.5, 2.2) }), [0, 0, 0.04], C.dadPhone);
  C.phone = new FX.Phone(); C.bphone = new FX.Phone();
  buildShots();
  window.shotList = () => SH.map((s, i) => [i, s.name, s.i0, +start(i).toFixed(2)]);
}
function start(i) { return i === 0 ? 0 : wS(SH[i].i0) - 0.07; }
function shot(i0, name, fn) { SH.push({ i0, name, fn }); }
const hideAll = () => { for (const r of [C.benny, C.hen, C.mayor, C.teach, C.dad, ...C.folk]) r.hide(); C.bear.hide(); for (const o of [C.shovel, C.dadPhone, C.phone.g, C.bphone.g]) { o.visible = false; if (o.parent !== scene) scene.attach(o); } C.bphone.g.scale.setScalar(1); };
function hold(obj, rig, side = 'R', pos = [0, 0, 0], rot = [0, 0, 0]) { const g = (side === 'R' ? rig.R : rig.L).grip; if (obj.parent !== g) g.add(obj); obj.position.set(...pos); obj.rotation.set(...rot); obj.scale.setScalar(1 / rig.sc); obj.visible = true; }
function bearPose(name, extra = {}) { return { ...BPOSE[name], ...extra }; }
function bearAct(t, p) { const bl = p.noBlink ? 0 : blinkAt(t, 77); C.bear.apply({ ...p, blink: Math.max(bl, p.blink || 0), neck: add(p.neck || [0, 0, 0], [noise(t * 0.5, 3) * 0.02, noise(t * 0.4, 4) * 0.03, 0]), pitch: (p.pitch || 0) + Math.sin(t * 1.6) * 0.012 }); }
const FROZEN = [[-7, -24, 0.4, 'recoil', 'shock'], [6.5, -26, -0.5, 'headHands', 'panic'], [-4, -15, 0.2, 'chin', 'confused'], [9, -17, -0.9, 'shrug', 'confused'], [-10, -18, 0.8, 'cheeks', 'scared'], [3.5, -21, 0.1, 'point', 'shock']];
function frozenCrowd(t, iceAmt = 1, unfreeze = null) {
  FROZEN.forEach(([x, z, yaw, pose, face], i) => {
    const r = C.folk[i]; let ice = iceAmt; let keys = [[0, pose]], faces = [[0, face]]; let fr = 0;
    if (unfreeze != null) { const u = unfreeze + Math.hypot(x, z - BEARP[2]) * 0.02; if (t > u) { ice = 0; fr = null; FX.shatter([x, 0, z], t, u, 8, 0.6, i * 13); faces = [[0, face], [u + 0.3, 'joy']]; keys = [[0, pose], [u + 0.1, 'cheer', 'back', 0.4]]; } }
    act(r, t, { pos: [x, 0, z], yaw, keys, faces, freeze: fr, ice: () => ice, noIdle: ice > 0 });
  });
}

function buildShots() {
  const w = wS, e = wE;
  // ===== HOOK =====
  shot(0, 'hook frozen plaza rush', (t) => {
    night(PLAZA, { key: [0, 9, -26], ki: 40, keyC: '#cfe0ff' });
    frozenCrowd(t);
    bearAct(t, bearPose('prop', { pos: BEARP, yaw: 0, head: [0.28, 0, 0.12 + S(w(2), w(3), t) * 0.15], noBlink: true, look: [0, -0.3] }));
    const hb = C.bear.headWorld();
    cam(t, [[0, [1.5, 6.5, 6], [0, 6, -26], 48, -0.06], [w(4), [0.5, 5.2, -9], hb, 40, 0.03, 'out']], { ap: 0.45 });
  });
  shot(4, 'bear here CU', (t) => {
    night(BEARP, { key: [3, 10, -24], ki: 50, keyC: '#d0e2ff', rim: [-6, 9, -44], rimC: '#7fa8ff', ri: 80 });
    const snap = S(w(8) - 0.1, w(8) + 0.05, t);
    bearAct(t, bearPose('prop', { pos: BEARP, yaw: 0, head: [0.28 - 0.05 * snap, 0, 0.32 * snap], noBlink: true, look: [0, -0.3], eyeS: 1 + 0.12 * snap }));
    hit(w(8), { z: 0.25, sh: 1.0, ds: 0.8, ca: 1.5, hold: true });
    const hb = C.bear.headWorld([0, -0.1, 0]);
    cam(t, [[w(4) - 0.1, add(hb, [0.8, 0.3, 9.5]), hb, 34], [w(9), add(hb, [0.3, 0.1, 6.0]), hb, 34, 0, 'lin']], { ap: 0.8 });
  });
  shot(9, 'benny whisper + gary', (t) => {
    night([2, 0, -12], { key: [5, 6, -6], ki: 30, keyC: '#ffe0c0' });
    act(C.benny, t, { pos: [1.2, 0, -12], yaw: -0.25, keys: [[0, 'idle'], [w(10), { from: 'cheeks', ikL: { t: [0.5, 5.0, 0.95], k: 1, pole: [1, -0.5, 0] }, ikR: { t: [-0.2, 4.4, 1.5], k: 0 } }, 'out', 0.25]], faces: [[0, 'worried'], [w(12), 'whisper']], talk: [[w(9), e(15), 0.6]], look: [0.3, 0] });
    act(C.folk[7], t, { pos: [-1.6, 0, -13.2], yaw: 0.35, keys: [[0, { from: 'idle', ikR: { t: [-0.5, 6.0, 0.6], k: 1, pole: [1, 0.5, 0] } }]], faces: [[0, 'confused']], extra: (tt, p) => ({ ...p, neck: add(p.neck || [0, 0, 0], [0, 0, Math.sin(tt * 9) * 0.04]) }) });
    FX.qmark(C.folk[7].headWorld([0, 1.6, 0]), t, w(13), 1.0);
    cam(t, [[w(9) - 0.1, [0.6, 5.0, -3.2], [-0.1, 5.0, -12.5], 40], [w(16), [0.4, 5.0, -4.6], [-0.1, 5.0, -12.5], 40]], { ap: 0.6 });
  });
  shot(16, 'gary freezes', (t) => {
    night([0, 0, -12], { key: [3, 6, -6], ki: 30, keyC: '#d0e6ff' });
    const tf = w(17);
    act(C.folk[7], t, { pos: [-1.6, 0, -13.2], yaw: 0.35, keys: [[0, { from: 'idle', ikR: { t: [-0.5, 6.0, 0.6], k: 1, pole: [1, 0.5, 0] } }], [tf - 0.15, { from: 'recoil', ikR: { t: [-0.5, 6.0, 0.6], k: 0 } }, 'snap', 0.2]], faces: [[0, 'confused'], [tf - 0.15, 'shock']], freeze: tf, ice: (tt) => freezeK(tt, tf) });
    FX.sparkBurst(C.folk[7].headWorld([0, -1, 0]), t, tf, 26, 3.5, 0.9, 3);
    act(C.benny, t, { pos: [1.2, 0, -12], yaw: -0.5, keys: [[0, 'cheeks'], [tf, 'recoil', 'snap', 0.25]], faces: [[0, 'whisper'], [tf, 'terror']] });
    hit(tf, { z: 0.18, sh: 0.9, ds: 0.4, ca: 1.0 });
    cam(t, [[w(16) - 0.1, [-0.5, 4.6, -5.5], [-1.0, 4.4, -13.2], 42], [w(18), [-0.8, 4.4, -6.5], [-1.0, 4.0, -13.2], 44]], { ap: 0.5 });
  });
  // ===== BACKSTORY =====
  const postShot = (t, o) => {
    night([2, 0, -12], { li: 40, key: [2, 6, -6], ki: 6 });
    const ph = C.phone; ph.g.visible = true; ph.g.position.set(2, 4.6, -10); ph.g.rotation.set(-0.08, 0.12, 0.04 * Math.sin(t));
    ph.drawPost(o.post); ph.photo.visible = true;
    ph.photoCam.position.set(...o.photoCam[0]); ph.photoCam.lookAt(...o.photoCam[1]); ph.photoCam.fov = 40; ph.photoCam.updateProjectionMatrix();
    bearAct(t, bearPose('prop', { pos: [0, 0, -212], yaw: 0, head: [0.28, 0, 0.18], noBlink: true }));
    { const hb = C.bear.headWorld([0, -0.6, 0]); ph.photoCam.position.set(hb[0] + 1.2, hb[1] - 0.8, hb[2] + 9); ph.photoCam.lookAt(...hb); }
    PRE_PHOTO = () => { ph.g.visible = false; ph.shoot(ph.photoCam); ph.g.visible = true; };
    const tgt = [2, 4.6 + (o.ty || 0), -10];
    cam(t, [[o.t0, add(tgt, [0.15, 0.05, o.d0 || 2.6]), tgt, 40, -0.03], [o.t1, add(tgt, [0.05, 0, o.d1 || 2.2]), tgt, 40, 0.02, 'lin']], { ap: 1.0, hand: 0.02 });
  };
  const OLD = { photoCam: [[0, 3.4, -200.5], [0, 4.6, -211]] };
  shot(18, 'old post', (t) => postShot(t, { ...OLD, t0: w(18) - 0.1, t1: w(28), post: { user: '@user_2023', time: '3 years ago', text: '', likes: '3.1M', comments: '371K' }, ty: -0.12 }));
  shot(28, 'old post text', (t) => postShot(t, { ...OLD, t0: w(28) - 0.1, t1: w(35), post: { user: '@user_2023', time: '3 years ago', text: '"This is a November 2026 meme. You won\'t understand yet."', likes: '3.1M', comments: '371K' }, ty: 0.3, d0: 2.2, d1: 1.9 }));
  shot(35, 'clearing bear blink', (t) => {
    night(WD.CLEAR, { dark: true, key: [3, 7, -200], ki: 30, keyC: '#b8ccff' });
    bearAct(t, bearPose('prop', { pos: [0, 0, -212], yaw: 0, head: [0.28, 0, 0.18 + S(w(37), w(38), t) * 0.12], noBlink: true, blink: S(w(36), w(36) + 0.08, t) * (1 - S(w(36) + 0.16, w(36) + 0.24, t)) }));
    const hb = C.bear.headWorld();
    cam(t, [[w(35) - 0.1, add(hb, [0, -0.6, 13]), hb, 36], [w(39), add(hb, [0, -0.4, 9]), hb, 36, 0, 'lin']], { ap: 0.6, hand: 0.03 });
    st.vign = 0.55; st.grain = 0.06;
  });
  shot(39, 'well its november', (t) => {
    night([0, 0, -8], { key: [2, 5, -2], ki: 25, keyC: '#ffe0c0' });
    act(C.benny, t, { pos: [0.5, 0, -2.5], yaw: 0.1, keys: [[0, 'hips']], faces: [[0, 'deadpan']], talk: [[w(39), e(41), 0.5]], look: [0, 0.6] });
    cam(t, [[w(39) - 0.1, [1.6, 1.4, 4.5], [0.2, 6.2, -5], 46, 0.05], [w(42), [1.3, 1.6, 3.6], [0.2, 6.0, -5], 46, 0.02]], { ap: 0.3 });
  });
  shot(42, 'nobody understands', (t) => {
    night(PLAZA, { key: [0, 8, -6], ki: 30, keyC: '#ffe0c0' });
    const G = [[-4.5, -16, 0.35, 'chin', 'think'], [-1.5, -17.5, 0.1, 'shrug', 'confused'], [1.5, -17, -0.15, { from: 'idle', ikR: { t: [-0.5, 6.0, 0.6], k: 1, pole: [1, 0.5, 0] } }, 'confused'], [4.5, -16, -0.35, 'headHands', 'worried']];
    G.forEach(([x, z, yaw, pose, face], i) => { act(C.folk[i], t, { pos: [x, 0, z], yaw, keys: [[0, 'idle'], [w(42) + i * 0.07, pose, 'back', 0.35]], faces: [[0, face]] }); FX.qmark(C.folk[i].headWorld([0, 1.7, 0]), t, w(43) + i * 0.09, 1.1, i); });
    cam(t, [[w(42) - 0.1, [0, 5.5, -2.0], [0, 4.6, -16.5], 44], [w(45), [0, 5.2, -4.5], [0, 4.6, -16.5], 44]], { ap: 0.4 });
  });
  // ===== HENDERSON =====
  const HEN = WD.HEN;
  const henBase = (t) => { night(HEN, { key: [HEN[0] + 5, 6, HEN[2] + 7], ki: 35, keyC: '#ffd9b0', rim: [HEN[0] - 3, 7, HEN[2] - 4], ri: 40 }); WD.lamp(1, [HEN[0] + 4, 3.6, -32.6], '#ffb35c', 30, 14); };
  shot(45, 'henderson shoveling', (t) => {
    henBase(t);
    act(C.hen, t, { pos: HEN, yaw: lerp(1.2, 0.35, S(w(47) - 0.3, w(47), t)), keys: [[0, 'shovel']], faces: [[0, 'neutral'], [w(47), 'smug']], extra: (tt, p) => ({ ...p, waist: [0.2 + 0.15 * Math.max(0, Math.sin((tt - w(45)) * 7)) * (1 - S(w(47) - 0.3, w(47), tt)), 0, 0] }) });
    hold(C.shovel, C.hen, 'R', [0, -0.2, 0], [1.2, 0, 0]);
    cam(t, [[w(45) - 0.1, add(HEN, [6, 4, 8]), add(HEN, [0, 3.6, 0]), 44], [w(48), add(HEN, [4.5, 4.2, 7.5]), add(HEN, [0, 4.0, 0]), 44]], { ap: 0.45 });
  });
  shot(48, 'henderson I get it', (t) => {
    henBase(t);
    act(C.hen, t, { pos: HEN, yaw: 0.35, keys: [[0, 'idle'], [w(48), 'hips', 'back', 0.35]], faces: [[0, 'smug'], [w(49), 'proud']], talk: [[w(48), e(51), 1]], extra: (tt, p) => ({ ...p, neck: add(p.neck || [0, 0, 0], [-0.08, 0, 0.1]) }) });
    cam(t, [[w(48) - 0.1, add(HEN, [1.9, 5.7, 4.6]), add(HEN, [0, 5.4, 0]), 40], [w(52), add(HEN, [1.4, 5.6, 3.6]), add(HEN, [0, 5.5, 0]), 40]], { ap: 0.7 });
  });
  shot(52, 'henderson FROZEN', (t) => {
    henBase(t); const tf = w(52);
    act(C.hen, t, { pos: HEN, yaw: 0.35, keys: [[0, 'hips']], faces: [[0, 'proud']], freeze: tf, ice: (tt) => freezeK(tt, tf) });
    FX.sparkBurst(add(HEN, [0, 4, 0]), t, tf, 30, 4, 1.0, 7);
    hit(tf, { z: 0.2, sh: 1.0, ds: 0.5, ca: 1.2 });
    cam(t, [[w(52) - 0.1, add(HEN, [2.6, 5.0, 6.5]), add(HEN, [0, 4.6, 0]), 42], [w(53), add(HEN, [2.2, 5.0, 5.8]), add(HEN, [0, 4.6, 0]), 42]], { ap: 0.5 });
  });
  shot(53, 'lie detected bear peeks', (t) => {
    henBase(t);
    act(C.hen, t, { pos: HEN, yaw: 0.35, keys: [[0, 'hips']], faces: [[0, 'proud']], freeze: 0, ice: () => 1, noIdle: true });
    const up = S(w(53), w(53) + 0.35, t), nod = Math.sin(clamp((t - w(54)) / 0.5) * PI * 2) * 0.25;
    bearAct(t, bearPose('stand', { pos: [HEN[0] + 9.5, -6.2 + up * 3.4, -37.5], yaw: -0.9, neck: [0.4 + nod, 0, 0], head: [0, 0, 0.15], look: [-0.5, 0] }));
    cam(t, [[w(53) - 0.1, add(HEN, [14, 6.5, 13]), add(HEN, [4.5, 4.5, -3]), 50], [w(55), add(HEN, [13, 6.6, 12]), add(HEN, [4.5, 4.7, -3]), 50]], { ap: 0.25 });
  });
  // ===== TEACHER =====
  const CL = WD.CLS; const cls = (x, y, z) => [CL[0] + x, y, CL[2] + z];
  const SITP = { from: 'sit', shL: [-0.6, 0, 0.2], shR: [-0.6, 0, -0.2], elL: [-1.3, 0, 0], elR: [-1.3, 0, 0] };
  const classBase = (t, slide) => {
    warm(CL, [[cls(0, 14, 2), '#ffe6c4', 30, 40], [cls(-8, 12, 10), '#ffe0b8', 15, 30], [cls(0, 8, -8), '#bcd2ff', 12, 20]]); st.exposure = 0.85;
    WD.drawSlide(slide);
    [[-7.5, 1.3, 0], [7.5, 1.3, 1], [-7.5, 8.3, 2], [7.5, 8.3, 3], [-7.5, 15.3, 4], [0, 15.3, 5]].forEach(([x, z, i]) => { const sleepy = i === 1 && t > w(60); act(C.folk[i], t, { pos: cls(x, 0.45, z), yaw: PI, keys: [[0, { ...SITP, waist: [sleepy ? 0.55 : 0.1, 0, 0], neck: [sleepy ? 0.5 : 0, 0, 0] }]], faces: [[0, sleepy ? 'sleep' : 'bored']], look: [0, 0.3] }); });
  };
  const slideAt = (t) => t < w(59) ? 1 : t < w(62) ? Math.min(39, 2 + Math.floor((t - w(59)) / (w(62) - w(59)) * 37)) : t < e(62) + 0.25 ? 39 : 40;
  shot(55, 'classroom powerpoint', (t) => {
    classBase(t, slideAt(t));
    act(C.teach, t, { pos: cls(5.5, 0, -8.5), yaw: -0.55, keys: [[0, 'present'], [w(59), { from: 'present', shR: [-1.5, 0, -0.9] }, 'back', 0.3], [w(61), 'present', 'io', 0.3]], faces: [[0, 'happy'], [w(61), 'joy']], talk: [[w(55), e(62), 0.7]] });
    act(C.benny, t, { pos: cls(0, 0.45, 8.3), yaw: PI, keys: [[0, SITP]], faces: [[0, 'bored']] });
    cam(t, [[w(55) - 0.1, cls(1.5, 7.5, 21), cls(1, 7.0, -6), 50], [w(63), cls(1.0, 7.3, 16), cls(1.5, 7.0, -8), 46]], { ap: 0.25, hand: 0.03 });
  });
  shot(63, 'teacher FROZEN', (t) => {
    classBase(t, 40); const tf = w(63);
    act(C.teach, t, { pos: cls(5.5, 0, -8.5), yaw: -0.55, keys: [[0, 'present']], faces: [[0, 'joy']], freeze: tf, ice: (tt) => freezeK(tt, tf) });
    FX.sparkBurst(cls(5.5, 4, -8.5), t, tf, 26, 3.5, 0.9, 9);
    hit(tf, { z: 0.2, sh: 0.9, ds: 0.5, ca: 1.2 });
    cam(t, [[tf - 0.1, cls(9.5, 6.0, -1.5), cls(4.8, 5.0, -8.5), 42], [w(64), cls(9.0, 6.0, -2.5), cls(4.8, 5.0, -8.5), 42]], { ap: 0.45 });
  });
  shot(64, 'benny deserved', (t) => {
    classBase(t, 40);
    act(C.teach, t, { pos: cls(5.5, 0, -8.5), yaw: -0.55, keys: [[0, 'present']], faces: [[0, 'joy']], freeze: 0, ice: () => 1, noIdle: true });
    const turn = S(w(64), w(64) + 0.3, t);
    act(C.benny, t, { pos: cls(0, 0.45, 8.3), yaw: PI + 2.6 * turn, keys: [[0, SITP], [w(65), { ...SITP, shR: [-0.9, 0, -0.2], elR: [-1.6, 0, 0] }, 'back', 0.3]], faces: [[0, 'deadpan'], [w(65), 'smug']], talk: [[w(64), e(65), 0.6]], look: [0, 0] });
    cam(t, [[w(64) - 0.1, cls(-1.2, 4.4, 13.2), cls(0, 4.6, 8.3), 40], [w(66), cls(-1.0, 4.5, 12.2), cls(0, 4.6, 8.3), 40]], { ap: 0.6 });
  });
  // ===== MAYOR =====
  const H = WD.HALL;
  const POINTCH = { from: 'podium', ikR: { t: [-1.2, 5.6, 0.6], k: 0 }, shR: [-1.45, -0.6, -0.75], elR: [-0.1, 0, 0] };
  const hallBase = (t) => { night([H[0], 0, H[2] + 6], { key: [H[0] - 4, 9, H[2] + 9], ki: 70, keyC: '#ffe6c8', rim: [H[0] + 5, 8, H[2] - 5], ri: 50, rimC: '#9fb8ff' }); };
  const crowd = (t, react = null) => { [[-6, 9, 0], [-2.5, 10.5, 1], [2.5, 10, 2], [6.5, 9.5, 3], [-4, 13.5, 4], [4.5, 13.5, 5]].forEach(([x, z, i]) => { const pos = [H[0] + x, 0, H[2] + z]; const yaw = yawTo(pos, H); const r = react != null && t > react; act(C.folk[i], t, { pos, yaw, keys: [[0, i % 2 ? 'cross' : 'idle'], ...(r ? [[react + i * 0.04, 'recoil', 'snap', 0.25]] : [])], faces: [[0, i % 3 === 0 ? 'bored' : 'neutral'], ...(r ? [[react, 'shock']] : [])] }); }); };
  shot(66, 'mayor economy', (t) => {
    hallBase(t); crowd(t);
    act(C.mayor, t, { pos: H, yaw: 0, keys: [[0, 'podium'], [w(70), POINTCH, 'back', 0.3]], faces: [[0, 'proud'], [w(71), 'happy']], talk: [[w(68), e(72), 1]], look: [0.5, 0] });
    cam(t, [[w(66) - 0.1, [H[0] - 1.5, 9.5, H[2] + 7], [H[0] + 2, 5.8, H[2]], 46], [w(73), [H[0] - 1.2, 9.2, H[2] + 6.2], [H[0] + 2, 6.0, H[2]], 46]], { ap: 0.35 });
  });
  shot(73, 'mayor froze so hard', (t) => {
    hallBase(t); const tf = w(74); crowd(t, tf + 0.1);
    act(C.mayor, t, { pos: H, yaw: 0, keys: [[0, POINTCH]], faces: [[0, 'happy']], freeze: tf, ice: (tt) => freezeK(tt, tf, 0.25) });
    FX.sparkBurst(add(H, [0, 5, 0]), t, tf, 40, 5, 1.0, 11); kick(t, tf, 1.3, 0.6);
    hit(tf, { z: 0.28, sh: 1.4, ds: 0.6, ca: 1.8 });
    cam(t, [[w(73) - 0.1, [H[0] + 1.5, 6.5, H[2] + 8], [H[0], 6.0, H[2]], 42], [w(77), [H[0] + 1.2, 6.8, H[2] + 7], [H[0], 6.3, H[2]], 42]], { ap: 0.45 });
  });
  shot(77, 'toupee flies off', (t) => {
    hallBase(t);
    const k = clamp((t - w(77) + 0.05) / 1.1); const y = 0.75 + 4.2 * k - 9.4 * k * k; const landed = y < -5.2;
    const toupee = { pos: [3.2 * Math.min(k, 0.93), Math.max(-5.15, y), 1.4 * k], rot: [landed ? 0 : k * 9, 0, landed ? 0 : k * 6] };
    act(C.mayor, t, { pos: H, yaw: 0, keys: [[0, POINTCH]], faces: [[0, 'happy']], freeze: 0, ice: () => 1, noIdle: true, extra: (tt, p) => ({ ...p, toupee }) });
    crowd(t, 0);
    const tw = C.mayor.headWorld(toupee.pos);
    if (landed) FX.sparkBurst(tw, t, w(77) + 0.95, 12, 1.5, 0.6, 5, '#ffffff');
    cam(t, [[w(77) - 0.1, [H[0] + 2, 7.6, H[2] + 6], C.mayor.headWorld([0, 0.8, 0]), 40], [w(79), [H[0] + 4, 5.5, H[2] + 6.5], C.mayor.headWorld([2.5, 0.6, 1]), 40], [w(81), [H[0] + 5.5, 2.6, H[2] + 6], tw, 36, 0, 'out']], { ap: 0.45 });
  });
  // ===== DAD =====
  const LV = WD.LIV; const lv = (x, y, z) => [LV[0] + x, y, LV[2] + z];
  const livBase = (t) => { WD.sky.visible = true; WD.stars.visible = true; warm(LV, [[lv(-8, 6.5, -8), '#ffcf8a', 30, 25], [lv(0, 5, 9), '#7fb2ff', 22, 20], [lv(4, 12, 2), '#ffe6c4', 14, 30]]); st.exposure = 0.85; };
  const DADSIT = { from: 'sit', ikR: { t: [-0.3, 4.2, 1.6], k: 1, pole: [1, -0.8, 0] }, neck: [0.3, 0, 0] };
  const dadAct = (t, o = {}) => { act(C.dad, t, { pos: lv(1.5, 1.55, -7.0), yaw: 0, keys: [[0, DADSIT], ...(o.keys || [])], faces: o.faces || [[0, 'deadpan']], talk: o.talk, look: o.look || [0, -0.5] }); hold(C.dadPhone, C.dad, 'R', [0, 0.05, 0.05], [-1.2, PI, 0]); };
  shot(81, 'dad on couch', (t) => {
    livBase(t); dadAct(t, { faces: [[0, 'bored']] });
    act(C.benny, t, { keys: [[0, 'idle']], faces: [[0, 'hopeful']], walk: { path: [[LV[0] - 13, 3], [LV[0] - 9, 1]], t0: w(81) - 0.3, t1: w(84) } });
    cam(t, [[w(81) - 0.1, lv(4, 6.5, 5), lv(0, 4, -7), 48], [w(85), lv(3, 6.2, 3.5), lv(1, 4.2, -7), 46]], { ap: 0.35 });
  });
  shot(85, 'dad bruh', (t) => {
    livBase(t); dadAct(t, { faces: [[0, 'deadpan']], talk: [[w(85), e(85), 1]], look: [0, 0.2], keys: [[w(85) - 0.15, { neck: [0.0, 0.25, 0] }, 'io', 0.2]] });
    hit(w(85), { z: 0.15, sh: 0.4, ds: 0.3, ca: 0.6 });
    const dh = C.dad.headWorld(); cam(t, [[w(85) - 0.1, add(dh, [1.0, 0.1, 3.6]), dh, 36], [w(86), add(dh, [0.9, 0.1, 3.2]), dh, 36]], { ap: 0.6 });
  });
  const bearHeadAt = (t, p, target) => { bearAct(t, { ...p, pos: [0, 0, 0] }); const h = C.bear.headWorld(); bearAct(t, { ...p, pos: [target[0] - h[0], target[1] - h[1], target[2] - h[2]] }); };
  shot(86, 'survived? bear at window', (t) => {
    livBase(t); dadAct(t, { faces: [[0, 'bored']] });
    act(C.benny, t, { pos: lv(-1.2, 0, 1.2), yaw: 0.5, keys: [[0, 'idle'], [w(86), 'cheeks', 'back', 0.3]], faces: [[0, 'shock']], talk: [[w(86), e(88), 0.7]] });
    const rise = S(w(87), w(88), t);
    bearHeadAt(t, bearPose('sit', { yaw: 0, neck: [0.55, 0, 0], head: [0.45, 0, 0.1], look: [-0.6, -0.4], noBlink: true }), lv(9, lerp(3.8, 7.9, rise), -13.2));
    cam(t, [[w(86) - 0.1, lv(-3.4, 5.6, 7.5), lv(3.5, 6.4, -5), 50], [w(89), lv(-3.0, 5.7, 6.6), lv(3.5, 6.6, -5), 50]], { ap: 0.3 });
  });
  shot(89, 'bruh counts thumbs up', (t) => {
    livBase(t); dadAct(t, { faces: [[0, 'bored']] });
    const th = S(w(90), w(90) + 0.3, t);
    const p = bmix(bearPose('sit', { neck: [0.55, 0, 0], head: [0.45, 0, 0.1] }), bearPose('thumb', { neck: [0.55, 0, 0], head: [0.45, 0, -0.15] }), back(th));
    bearHeadAt(t, { ...p, yaw: -0.25, look: [0, 0], brow: 0.2 }, lv(9.6, 8.2, -13.2));
    cam(t, [[w(89) - 0.1, lv(6.5, 7.6, 0.5), lv(9, 7.6, -10), 44], [w(93), lv(7.2, 7.7, -1.5), lv(9, 7.7, -10), 44]], { ap: 0.4 });
  });
  // ===== THE BEAR LOOKS AT BENNY =====
  shot(93, 'bear looked at me (dolly zoom)', (t) => {
    night([-40, 0, 0], { key: [-36, 5, 4], ki: 30, keyC: '#ffe0c0' });
    act(C.benny, t, { pos: [-40, 0, 1], yaw: -PI / 2 + 0.25, keys: [[0, 'idle']], faces: [[0, 'neutral'], [w(96), 'scared']], look: [0.3, 0] });
    bearAct(t, bearPose('stand', { pos: [-72, 0, 0], yaw: PI / 2, neck: [0.1, 0, 0], head: [0, -0.9 * (1 - S(w(95), w(96) + 0.2, t)), 0], noBlink: true }));
    const k = S(w(93), w(99), t);
    const hb = C.benny.headWorld();
    const d = lerp(4.0, 11.0, k); const fov = 2 * Math.atan(Math.tan(36 * PI / 360) * 4.0 / d) * 180 / PI;
    const cp = [hb[0] + d * 0.97, hb[1] + 0.1, hb[2] + d * 0.24];
    cam(t, [[w(93) - 0.1, cp, hb, fov], [w(99), cp, hb, fov]], { ap: 0.4, hand: 0.02, focus: d });
  });
  shot(99, 'Im Benny Im eleven', (t) => {
    night([0, 0, -12], { key: [3, 6, -5], ki: 35, keyC: '#ffe0c0', rim: [-3, 7, -16], ri: 40, rimC: '#7fa8ff' });
    act(C.benny, t, { pos: [0, 0, -12], yaw: 0.05, keys: [[0, 'idle'], [w(100), { shR: [-0.2, 0, -2.4], elR: [-0.6, 0, 0] }, 'back', 0.3], [w(102) + 0.25, 'idle', 'io', 0.3]], faces: [[0, 'hopeful'], [w(100), 'happy'], [w(102), 'worried']], talk: [[w(99), e(102), 0.8]], extra: (tt, p) => (tt > w(100) && tt < w(102) + 0.25 ? { ...p, elR: [-0.5 + Math.sin(tt * 14) * 0.3, 0, 0] } : p) });
    cam(t, [[w(99) - 0.1, [0.3, 4.8, -6.5], [0, 4.6, -12], 40], [w(103), [0.2, 4.8, -7.2], [0, 4.6, -12], 40]], { ap: 0.5 });
  });
  shot(103, 'no idea panic + ice creeping', (t) => {
    night([0, 0, -12], { key: [3, 6, -5], ki: 35, keyC: '#d8e6ff', rim: [-3, 7, -16], ri: 40, rimC: '#7fa8ff' });
    act(C.benny, t, { pos: [0, 0, -12], yaw: 0.05, keys: [[0, 'idle'], [w(103), 'headHands', 'back', 0.3]], faces: [[0, 'scared'], [w(106), 'panic']], talk: [[w(103), e(111), 0.9]], ice: (tt) => 0.08 + 0.14 * S(w(106), w(112), tt), extra: (tt, p) => ({ ...p, hips: add(p.hips || [0, 0, 0], [0, 0, Math.sin(tt * 22) * 0.025]) }) });
    hit(w(106), { z: 0.18, sh: 0.6, ds: 0.3, ca: 0.8 });
    cam(t, [[w(103) - 0.1, [0.4, 3.8, -4.2], [0, 4.2, -12], 46, 0.04], [w(112), [0.2, 4.3, -5.8], [0, 4.6, -12], 44, -0.04]], { ap: 0.45 });
  });
  // ===== CONFRONTATION in plaza =====
  const bearBase = (t, extra = {}) => bearAct(t, bearPose('prop', { pos: BEARP, yaw: 0, head: [0.28, 0, 0.1], look: [0, -0.6], ...extra }));
  shot(112, 'dumbest thing walk', (t) => {
    night([0, 0, -24], { key: [6, 8, -14], ki: 30, keyC: '#d0e2ff' });
    frozenCrowd(t);
    act(C.benny, t, { keys: [[0, { from: 'idle', shL: [-0.3, 0, 0.3], shR: [-0.3, 0, -0.3] }]], faces: [[0, 'worried']], walk: { path: [[0, -16], [0, -22]], t0: w(112), t1: w(119) + 0.3, amp: 0.8, ease: 'lin' }, extra: (tt, p) => ({ ...p, knL: add(p.knL || [0, 0, 0], [0.15 + Math.sin(tt * 30) * 0.05, 0, 0]), knR: add(p.knR || [0, 0, 0], [0.15 + Math.cos(tt * 30) * 0.05, 0, 0]) }) });
    bearBase(t);
    cam(t, [[w(112) - 0.1, [7, 3, -10], [0, 5, -24], 44], [w(119), [5, 3.5, -14], [0, 5.5, -26], 44]], { ap: 0.3 });
  });
  shot(119, 'i asked the bear low two-shot', (t) => {
    night([0, 0, -26], { key: [-6, 6, -18], ki: 40, keyC: '#ffe0c0', rim: [4, 9, -40], ri: 90, rimC: '#7fa8ff' });
    frozenCrowd(t);
    act(C.benny, t, { pos: [0, 0, -22], yaw: PI, keys: [[0, 'idle'], [w(120), { from: 'idle', shR: [-0.6, 0, -0.1] }, 'io', 0.3]], faces: [[0, 'worried']] });
    bearBase(t, { head: [0.45, 0, 0.1] });
    cam(t, [[w(119) - 0.1, [3.5, 1.0, -15], [0, 6.5, -28], 50, 0.06], [w(123), [3.0, 1.0, -16], [0, 7.0, -28], 50, 0.06]], { ap: 0.25 });
  });
  shot(123, 'WHAT DOES IT MEAN', (t) => {
    night([0, 0, -22], { key: [3, 4, -17], ki: 40, keyC: '#ffe0c0', rim: [0, 10, -32], ri: 90, rimC: '#7fa8ff' });
    act(C.benny, t, { pos: [0, 0, -22], yaw: PI, keys: [[0, 'idle'], [w(123), 'shout', 'back', 0.25]], faces: [[0, 'shout']], talk: [[w(123), e(126), 1.2]] });
    bearBase(t, { head: [0.45, 0, 0.1] });
    hit(w(126), { z: 0.25, sh: 1.3, ds: 0.5, ca: 1.5 });
    const hb = C.benny.headWorld();
    cam(t, [[w(123) - 0.1, add(hb, [0.6, -1.2, -3.2]), add(hb, [0, 0.3, 0]), 42], [w(127), add(hb, [0.5, -1.4, -2.7]), add(hb, [0, 0.3, 0]), 42]], { ap: 0.6 });
  });
  const sitK = (t) => S(w(130) - 0.05, w(130) + 0.55, t);
  shot(127, 'bear sat down THUD', (t) => {
    night([0, 0, -26], { key: [-6, 7, -18], ki: 40, keyC: '#d0e2ff' });
    frozenCrowd(t);
    const k = sitK(t); const p = bmix(bearPose('prop', { head: [0.45, 0, 0.1] }), bearPose('sit', { head: [0.5, 0, 0.05] }), k);
    bearAct(t, { ...p, pos: BEARP, yaw: 0, sq: -0.06 * Math.sin(clamp((t - w(130) - 0.5) / 0.25) * PI), look: [0, -0.8] });
    act(C.benny, t, { pos: [0, 0, -22], yaw: PI, keys: [[0, 'idle'], [w(130) + 0.5, 'recoil', 'snap', 0.25]], faces: [[0, 'scared']] });
    kick(t, w(130) + 0.5, 1.2, 0.5); FX.sparkBurst([0, 0.5, -31], t, w(130) + 0.5, 30, 6, 0.9, 21, '#ffffff');
    cam(t, [[w(127) - 0.1, [-9, 4, -10], [0, 7, -30], 44], [w(132), [-8, 4.5, -12], [0, 7.5, -30], 44]], { ap: 0.25 });
  });
  shot(132, 'bear leans whisper', (t) => {
    night([0, 0, -26], { key: [-5, 6, -20], ki: 40, keyC: '#ffe0c0', rim: [4, 9, -40], ri: 80, rimC: '#7fa8ff' });
    const k = S(w(132) - 0.1, w(133) + 0.2, t);
    bearAct(t, { ...bmix(bearPose('sit', { head: [0.5, 0, 0.05] }), bearPose('sitLean', { neck: [0.9, 0, 0], head: [0.3, 0, 0.12] }), k), pos: BEARP, yaw: 0, look: [0, -0.7], brow: -0.6 * k, browH: 0.5 * k });
    act(C.benny, t, { pos: [0, 0, -22], yaw: PI, keys: [[0, 'recoil'], [w(133), { from: 'lean', waist: [0.2, 0, 0], neck: [-0.4, 0, 0] }, 'io', 0.4]], faces: [[0, 'scared'], [w(133), 'hopeful']] });
    cam(t, [[w(132) - 0.1, [6.5, 3.2, -18], [0, 6.5, -27], 42], [w(134), [6, 3.5, -19], [0, 6.8, -27], 42]], { ap: 0.35 });
  });
  shot(134, 'I was hoping YOU knew', (t) => {
    night([0, 0, -26], { key: [2, 8, -20], ki: 50, keyC: '#ffe0c0', rim: [-4, 9, -40], ri: 80, rimC: '#7fa8ff' });
    const v = clamp(env(t) * 1.3);
    bearAct(t, { ...bearPose('sitLean', { neck: [0.9, 0, 0], head: [0.3, 0, 0.12 + 0.05 * Math.sin(t * 1.5)] }), pos: BEARP, yaw: 0, jaw: 0.35 * v * (t < e(138) ? 1 : 0), look: [0, -0.4], brow: -0.8, browH: 0.6, eyeS: 1.08 });
    const hb = C.bear.headWorld([0, -0.3, 0]);
    cam(t, [[w(134) - 0.1, add(hb, [-0.8, -1.2, 7.5]), hb, 36], [w(139), add(hb, [-0.5, -1.0, 6.0]), hb, 36]], { ap: 0.6 });
    st.lift = '#101822';
  });
  shot(139, 'benny deadpan either', (t) => {
    night([0, 0, -22], { key: [3, 4, -17], ki: 40, keyC: '#ffe0c0', rim: [0, 10, -32], ri: 90, rimC: '#7fa8ff' });
    act(C.benny, t, { pos: [0, 0, -22], yaw: PI + 0.35, keys: [[0, 'idle']], faces: [[0, 'deadpan']], talk: [[w(139), e(143), 0.5]], look: [0.6, 0] });
    const hb = C.benny.headWorld();
    cam(t, [[w(139) - 0.1, add(hb, [1.6, 0.0, -4.0]), hb, 40], [w(144), add(hb, [1.5, 0.0, -3.6]), hb, 40]], { ap: 0.55 });
  });
  shot(144, 'NOBODY ever got it crane', (t) => {
    night(PLAZA, { key: [0, 12, -10], ki: 50, keyC: '#d0e2ff' });
    frozenCrowd(t);
    FROZEN.forEach(([x, z], i) => FX.qmark([x, 8.0, z], t, w(144) + i * 0.06, 1.4, i));
    bearAct(t, { ...bearPose('sit', { head: [0.5, 0, 0.05] }), pos: BEARP, yaw: 0, look: [0, 0] });
    act(C.benny, t, { pos: [0, 0, -22], yaw: PI, keys: [[0, 'shrug']], faces: [[0, 'confused']] });
    FX.qmark(C.benny.headWorld([0, 1.6, 0]), t, w(144), 1.2, 9);
    hit(w(144), { z: 0.12, sh: 0.5, ds: 0.2, ca: 0.6 });
    cam(t, [[w(144) - 0.1, [0, 6, -4], [0, 3, -22], 52], [w(148), [0, 22, 2], [0, 0, -22], 52, 0, 'out']], { ap: 0.15 });
  });
  shot(148, 'unfroze everyone', (t) => {
    night(PLAZA, { key: [0, 12, -10], ki: 50, keyC: '#d0e2ff' });
    const tu = w(150);
    frozenCrowd(t, 1, tu);
    const clap = Math.abs(Math.sin(clamp((t - w(149)) / 0.5) * PI * 2));
    bearAct(t, { ...bearPose('sit', { head: [0.5, 0, 0.05] }), FL: { sh: [-0.6, 0, -0.1 + 0.5 * clap], kn: [-1.2, 0, 0] }, FR: { sh: [-0.6, 0, 0.1 - 0.5 * clap], kn: [-1.2, 0, 0] }, pos: BEARP, yaw: 0, look: [0, 0] });
    act(C.benny, t, { pos: [0, 0, -22], yaw: PI - 0.6 * S(tu, tu + 0.4, t), keys: [[0, 'idle'], [tu + 0.2, 'cheer', 'back', 0.3]], faces: [[0, 'confused'], [tu, 'joy']] });
    FX.sparkBurst([0, 6, -30], t, tu - 0.1, 60, 18, 1.2, 33);
    hit(tu, { z: 0.1, sh: 0.6, ds: 0, ca: 0.6 }); st.flash = 0.6 * Math.max(0, 1 - Math.abs(t - tu) / 0.12);
    cam(t, [[w(148) - 0.1, [10, 9, -6], [0, 4, -24], 48], [w(152), [7, 7, -8], [0, 4, -24], 48]], { ap: 0.2 });
  });
  shot(152, 'everyone shrugs: means nothing', (t) => {
    night(PLAZA, { key: [0, 9, -10], ki: 60, keyC: '#ffe0c0' });
    const sh = (i) => [[0, 'idle'], [w(156) + i * 0.05, 'shrug', 'back', 0.35]];
    const L = [[C.hen, [-6, 0, -24], 'happy'], [C.mayor, [-3, 0, -25.5], 'happy'], [C.benny, [0, 0, -22.5], 'joy'], [C.teach, [3, 0, -25.5], 'happy'], [C.dad, [6, 0, -24], 'deadpan']];
    L.forEach(([r, pos, face], i) => act(r, t, { pos, yaw: -pos[0] * 0.04, keys: sh(i), faces: [[0, 'neutral'], [w(157), face]], extra: r === C.mayor ? (tt, p) => ({ ...p, toupee: { pos: [0.25, 0.68, 0.0], rot: [0, 0.5, 0.35] } }) : null }));
    bearAct(t, { ...bmix(bearPose('sit', { head: [0.5, 0, 0.05] }), bearPose('shrug'), back(S(w(156) + 0.2, w(156) + 0.6, t))), pos: [0, 0, -33], yaw: 0, look: [0, -0.2] });
    cam(t, [[w(152) - 0.1, [0, 6.0, -10.5], [0, 6.2, -27], 54], [w(159), [0, 6.0, -12], [0, 6.4, -27], 54]], { ap: 0.2 });
  });
  // ===== TWIST =====
  const BENP = [0, 0, -20];
  shot(159, 'phone buzzed', (t) => {
    night([0, 0, -18], { key: [2, 5, -12], ki: 20, keyC: '#ffe0c0' });
    act(C.benny, t, { pos: BENP, yaw: 0, keys: [[0, 'idle'], [w(161) - 0.1, 'phone1', 'back', 0.35]], faces: [[0, 'happy'], [w(162), 'suspicious']], look: [0, -0.8] });
    hold(C.phone.g, C.benny, 'R', [0, 0.05, 0.2], [-1.35, PI, 0]);
    if (t > w(161)) C.phone.g.position.x += Math.sin(t * 90) * 0.03 * (1 - S(w(161), w(163), t));
    C.phone.photo.visible = false; C.phone.drawPost({ user: '@user_2023', time: 'just now', text: '1 new post', likes: '0', comments: '0' });
    WD.lamp(3, C.benny.headWorld([0, -1.2, 1.5]), '#9cc8ff', 8 * S(w(161), w(161) + 0.3, t), 4);
    cam(t, [[w(159) - 0.1, [0.6, 4.8, -14.5], [0, 4.7, -20], 40], [w(163), [0.4, 4.6, -16.0], [0, 4.5, -20], 40]], { ap: 0.55 });
  });
  const newPost = (t, txt, ph) => {
    night([0, 0, -18], { li: 40, key: [2, 6, -12], ki: 6 });
    act(C.benny, t, { pos: BENP, yaw: 0, keys: [[0, 'phone1']], faces: [[0, 'suspicious']], look: [0, -0.8] });
    bearAct(t, { ...bearPose('stand'), pos: [0, 0, -40], yaw: 0, look: [0, 0] });
    const p2 = C.phone; p2.g.visible = true; p2.g.position.set(2, 4.6, -10); p2.g.rotation.set(-0.08, 0.12, 0.03 * Math.sin(t)); p2.g.scale.setScalar(1);
    p2.drawPost({ user: '@user_2023', time: 'just now', text: txt, likes: '0', comments: '0' });
    const pc = p2.photoCam; pc.position.set(0.5, 5.5, -29); pc.lookAt(0, 4.4, -20); pc.fov = 40; pc.updateProjectionMatrix();
    p2.photo.visible = !!ph; PRE_PHOTO = ph ? () => { p2.g.visible = false; p2.shoot(pc); p2.g.visible = true; } : null;
  };
  shot(163, 'new post appears', (t) => {
    newPost(t, '"This is a December 2026 meme..."', false);
    const tgt = [2, 4.6, -10]; C.phone.g.position.y = 4.6 - 0.6 * (1 - easeOut(clamp((t - w(163)) / 0.3)));
    cam(t, [[w(163) - 0.1, add(tgt, [0.1, 0.25, 2.3]), add(tgt, [0, 0.25, 0]), 40], [w(166), add(tgt, [0.05, 0.25, 1.9]), add(tgt, [0, 0.25, 0]), 40]], { ap: 1.0, hand: 0.02 });
  });
  shot(166, 'december text', (t) => {
    newPost(t, '"This is a December 2026 meme. You won\'t understand yet."', false);
    const tgt = [2, 4.85, -10];
    cam(t, [[w(166) - 0.1, add(tgt, [0.1, 0, 2.2]), tgt, 40], [w(177), add(tgt, [0.0, 0, 1.9]), tgt, 40, 0, 'lin']], { ap: 1.0, hand: 0.015 });
    st.vign = 0.5;
  });
  shot(177, 'picture of me', (t) => {
    newPost(t, '"This is a December 2026 meme. You won\'t understand yet."', true);
    const tgt = [2, 4.48, -10];
    cam(t, [[w(177) - 0.1, add(tgt, [0.05, 0, 2.0]), tgt, 40], [w(181), add(tgt, [0.02, 0, 1.6]), tgt, 40], [w(184), add(tgt, [0, -0.12, 0.75]), add(tgt, [0, -0.12, 0]), 40, 0, 'in']], { ap: 1.0, hand: 0.015 });
    hit(w(183), { z: 0.12, sh: 0.5, ds: 0.7, ca: 1.2, hold: true });
    st.vign = 0.6;
  });
  shot(184, 'do YOU understand (bear behind)', (t) => {
    night([0, 0, -22], { dark: true, key: [1.5, 5, -15], ki: 18, keyC: '#9cc8ff', rim: [0, 6, -30], ri: 40, rimC: '#7fa8ff' });
    act(C.benny, t, { pos: BENP, yaw: 0, keys: [[0, 'phone1'], [w(184) + 0.1, { from: 'idle', ikR: { t: [-0.3, 4.4, 1.6], k: 0 } }, 'io', 0.3]], faces: [[0, 'terror'], [w(185), 'whisper']], talk: [[w(184), e(187), 0.6]], look: [0, 0] });
    hold(C.phone.g, C.benny, 'R', [0, 0.05, 0.2], [-1.35, PI, 0]); C.phone.photo.visible = false;
    const appear = S(w(186), w(187) + 0.3, t);
    bearAct(t, { ...bearPose('stand', { neck: [0.25, 0, 0], head: [0.1, 0, 0.15] }), FR: { sh: [-1.3, 0, 0.2], kn: [-0.6, 0, 0] }, pos: [0.5, 0, lerp(-36, -30.5, appear)], yaw: 0, noBlink: true, look: [0, -0.3] });
    C.bphone.g.visible = true; const pw = C.bear.pawWorld('R'); C.bphone.g.position.set(pw[0], pw[1] + 0.9, pw[2] + 0.6); C.bphone.g.rotation.set(0, PI, 0); C.bphone.g.scale.setScalar(1.6); C.bphone.photo.visible = false; C.bphone.drawPost({ text: '' });
    const fl = Math.max(0, 1 - Math.abs(t - (w(187) + 0.15)) / 0.08); if (fl > 0) { WD.lamp(3, [pw[0], pw[1] + 1, pw[2] + 1.2], '#ffffff', 600 * fl, 30); st.flash = 0.35 * fl; }
    cam(t, [[w(184) - 0.1, [0.3, 4.7, -15.2], [0.1, 4.8, -22], 40], [w(188), [0.2, 4.8, -15.8], [0.1, 5.0, -22], 40]], { ap: 0.5 });
    st.vign = 0.6;
  });
  shot(188, 'bear lunges + frost', (t) => {
    night([0, 0, -26], { dark: true, key: [2, 7, -18], ki: 40, keyC: '#9cc8ff', rim: [0, 8, -38], ri: 60, rimC: '#7fa8ff' });
    const k = S(w(188), T.duration - 0.3, t);
    bearAct(t, { ...bearPose('stand', { neck: [0.25, 0, 0], head: [0.1, 0, 0.2] }), pos: [0, 0, lerp(-31, -27.5, k)], yaw: 0, noBlink: true, look: [0, 0], eyeS: 1 + 0.15 * k, jaw: 0.25 * S(w(192), w(194), t) });
    const hb = C.bear.headWorld([0, -0.2, 0]);
    cam(t, [[w(188) - 0.1, add(hb, [0, -0.3, 9]), hb, 38], [T.duration, add(hb, [0, -0.1, 3.4]), hb, 38, 0, 'in']], { ap: 0.6 });
    st.frost = S(w(190), T.duration - 0.1, t) * 1.05; st.vign = 0.6; st.fade = S(T.duration - 0.12, T.duration, t);
  });
}

export function frameState(f) {
  const t = f / 30; st = { time: t }; hits = []; shake = 0; PRE_PHOTO = null; FX.resetFx(); hideAll();
  let k = 0; while (k < SH.length - 1 && t >= start(k + 1)) k++;
  SH[k].fn(t);
  const indoor = /classroom|teacher|deserved|dad|bruh|survived|counts/.test(SH[k].name);
  WD.updateSnow(t, !indoor);
  st.shot = k; st.bloom = st.bloom ?? 0.6; st.grain = st.grain ?? 0.03;
  return st;
}
// ---------- captions ----------
const SOLO = new Set([8, 17, 52, 63, 65, 85, 126, 144, 183]);
const BIG = new Set([8, 17, 52, 63, 85, 126, 144]);
const ICEW = new Set([17, 52, 63]);
let CH = null;
function chunks() {
  if (CH) return CH; CH = []; let cur = [];
  const flush = () => { if (cur.length) CH.push(cur); cur = []; };
  for (let i = 0; i < NW; i++) {
    if (SOLO.has(i)) { flush(); CH.push([i]); continue; }
    cur.push(i); const w = T.words[i].w;
    if (/[.,!?:;]["”]?$|\.\.\.$/.test(w) || cur.length >= 3) flush();
  }
  flush(); return CH;
}
const clean = (w) => w.replace(/["“”]/g, '').toUpperCase().replace(/[.,:;]+$/, '');
export function captionChunk(t) {
  const L = chunks(); let c = null;
  for (const ch of L) { const s = wS(ch[0]) - 0.05; const e2 = Math.max(wE(ch[ch.length - 1]) + 0.12, s + 0.35); if (t >= s && t < e2) c = ch; }
  if (!c) return null;
  let a = 0; c.forEach((i, j) => { if (t >= wS(i) - 0.03) a = j; });
  const big = BIG.has(c[0]) && c.length === 1;
  return { words: c.map(i => clean(T.words[i].w)), act: a, k: t - wS(c[a]), k0: t - wS(c[0]) + 0.05, big, color: ICEW.has(c[0]) ? '#7FE3FF' : null };
}
// ---------- 2D overlay graphics ----------
export function overlayFx(t) {
  const out = [];
  if (t >= wS(53) && t < wS(55)) { const k = t - wS(53); out.push((ctx, W, H) => { const s = 1 + 1.2 * Math.max(0, 1 - k / 0.12); ctx.save(); ctx.translate(W / 2, H * 0.27); ctx.rotate(-0.12); ctx.scale(s, s); ctx.globalAlpha = Math.min(1, k / 0.06); ctx.strokeStyle = '#ff2d2d'; ctx.lineWidth = 16; ctx.strokeRect(-360, -95, 720, 190); ctx.fillStyle = '#ff2d2d'; ctx.font = '120px Lucky'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('LIE DETECTED', 0, 8); ctx.restore(); }); }
  if (t >= wS(99) && t < wS(103)) { const k = t - wS(99); out.push((ctx, W, H) => { const x = -700 + 760 * easeOut(clamp(k / 0.25)); ctx.save(); ctx.translate(x, H * 0.18); ctx.rotate(-0.04); ctx.fillStyle = '#FFD23F'; ctx.beginPath(); ctx.roundRect(0, 0, 640, 150, 20); ctx.fill(); ctx.lineWidth = 10; ctx.strokeStyle = '#0b0710'; ctx.stroke(); ctx.fillStyle = '#0b0710'; ctx.font = '96px Lucky'; ctx.textBaseline = 'middle'; ctx.fillText('BENNY', 40, 80); ctx.font = '56px Lucky'; ctx.fillStyle = '#E0453A'; ctx.fillText('AGE 11', 390, 84); ctx.restore(); }); }
  if (t >= wS(59) && t < wS(63)) { out.push((ctx, W, H) => { const n = t < wS(62) ? 2 + Math.floor((t - wS(59)) / Math.max(0.1, wS(62) - wS(59)) * 37) : 40; ctx.save(); ctx.translate(W * 0.73, H * 0.2); ctx.rotate(0.06); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.roundRect(-150, -70, 300, 140, 24); ctx.fill(); ctx.lineWidth = 10; ctx.strokeStyle = '#0b0710'; ctx.stroke(); ctx.fillStyle = '#2a4cc9'; ctx.font = '84px Lucky'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(`${Math.min(40, n)}/40`, 0, 6); ctx.restore(); }); }
  return out;
}
