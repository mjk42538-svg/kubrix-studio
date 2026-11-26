// keyframe acting + procedural layers
import { THREE, clamp, lerp, ss, easeOut, back, spring, noise, hash, PI, S } from './core.js';
import { faceParams } from './rig.js';

// root-local IK targets: {ikL:{t:[x,y,z],k,pole}, ikR:...}
export const POSE = {
  idle: { shL: [0.04, 0, 0.07], shR: [0.04, 0, -0.07], elL: [-0.12, 0, 0], elR: [-0.12, 0, 0] },
  hips: { ikL: { t: [1.25, 2.95, 0.15], k: 1, pole: [1, 0.1, -0.4] }, ikR: { t: [-1.25, 2.95, 0.15], k: 1, pole: [1, 0.1, -0.4] } },
  cross: { ikL: { t: [-0.55, 3.75, 0.85], k: 1, pole: [1, -0.6, 0.2] }, ikR: { t: [0.55, 3.55, 0.9], k: 1, pole: [1, -0.6, 0.2] } },
  headHands: { ikL: { t: [0.62, 6.25, 0.25], k: 1, pole: [1, 0.6, 0] }, ikR: { t: [-0.62, 6.25, 0.25], k: 1, pole: [1, 0.6, 0] } },
  cheeks: { ikL: { t: [0.72, 5.25, 0.75], k: 1, pole: [1, -0.5, 0] }, ikR: { t: [-0.72, 5.25, 0.75], k: 1, pole: [1, -0.5, 0] } },
  facepalm: { ikR: { t: [-0.05, 5.6, 0.95], k: 1, pole: [1, -0.6, 0] }, neck: [0.25, 0, 0] },
  chin: { ikR: { t: [-0.1, 4.95, 0.95], k: 1, pole: [1, -0.8, 0] }, ikL: { t: [-0.3, 3.7, 0.85], k: 1, pole: [1, -0.6, 0] } },
  point: { shR: [-1.55, 0, -0.08], elR: [-0.05, 0, 0] },
  pointUp: { shR: [-2.7, 0, -0.15], elR: [-0.1, 0, 0] },
  shrug: { shL: [0.1, 0, 0.35], shR: [0.1, 0, -0.35], elL: [-1.5, 0.6, 0], elR: [-1.5, -0.6, 0], neck: [0, 0, 0.18], waist: [0, 0, 0] },
  cheer: { shL: [-0.3, 0, 2.6], shR: [-0.3, 0, -2.6], elL: [-0.3, 0, 0], elR: [-0.3, 0, 0] },
  recoil: { shL: [-0.9, 0, 0.7], shR: [-0.9, 0, -0.7], elL: [-1.3, 0, 0], elR: [-1.3, 0, 0], waist: [-0.18, 0, 0], neck: [-0.12, 0, 0], hips: [0.05, 0, 0] },
  stop: { shL: [-1.4, 0, 0.25], shR: [-1.4, 0, -0.25], elL: [-0.5, 0, 0], elR: [-0.5, 0, 0], wrL: [-1.2, 0, 0], wrR: [-1.2, 0, 0] },
  present: { shR: [-1.2, 0, -0.75], elR: [-0.35, 0, 0], wrR: [-0.5, 0, 0], shL: [0.04, 0, 0.07] },
  thumb: { shR: [-1.0, 0.3, -0.15], elR: [-1.6, 0, 0] },
  phone: { ikR: { t: [-0.35, 4.35, 1.55], k: 1, pole: [1, -0.8, 0] }, neck: [0.32, 0, 0], ikL: { t: [0.2, 4.2, 1.55], k: 1, pole: [1, -0.8, 0] } },
  phone1: { ikR: { t: [-0.3, 4.4, 1.6], k: 1, pole: [1, -0.8, 0] }, neck: [0.32, 0, 0] },
  podium: { ikL: { t: [0.95, 4.05, 1.55], k: 1, pole: [1, -0.5, -0.3] }, ikR: { t: [-0.95, 4.05, 1.55], k: 1, pole: [1, -0.5, -0.3] } },
  shovel: { ikR: { t: [-0.5, 3.4, 1.4], k: 1, pole: [1, -0.6, 0] }, ikL: { t: [0.35, 4.3, 1.2], k: 1, pole: [1, -0.6, 0] } },
  sit: { hy: -1.05, hipL: [-1.55, 0, 0.05], hipR: [-1.55, 0, -0.05], knL: [1.55, 0, 0], knR: [1.55, 0, 0], shL: [-0.35, 0, 0.1], shR: [-0.35, 0, -0.1], elL: [-0.9, 0, 0], elR: [-0.9, 0, 0] },
  shout: { shL: [0.25, 0, 0.35], shR: [0.25, 0, -0.35], elL: [-0.2, 0, 0], elR: [-0.2, 0, 0], waist: [0.18, 0, 0], neck: [-0.35, 0, 0], hy: -0.12 },
  freezePose: { shL: [-0.5, 0, 0.6], shR: [-0.5, 0, -0.6], elL: [-0.8, 0, 0], elR: [-0.8, 0, 0], neck: [-0.1, 0, 0] },
  crouch: { hy: -0.55, hipL: [-0.75, 0, 0.05], hipR: [-0.75, 0, -0.05], knL: [1.45, 0, 0], knR: [1.45, 0, 0], anL: [-0.7, 0, 0], anR: [-0.7, 0, 0], waist: [0.45, 0, 0], neck: [-0.35, 0, 0] },
  lean: { waist: [0.25, 0, 0], neck: [-0.15, 0, 0] },
};
const JOINTS = ['hips', 'waist', 'neck', 'shL', 'elL', 'wrL', 'shR', 'elR', 'wrR', 'hipL', 'knL', 'anL', 'hipR', 'knR', 'anR'];
const EASE = { io: ss, out: easeOut, back: back, lin: (k) => k, snap: (k) => spring(k * 1.4, 14, 7), in: (k) => k * k * k, hold: (k) => (k >= 1 ? 1 : 0) };
function resolve(p) { if (!p) return {}; if (typeof p === 'string') return { ...POSE[p] }; if (p.from) return { ...POSE[p.from], ...p, from: undefined }; return p; }
export function mixPose(A, B, k) {
  const o = { ...A };
  for (const key of new Set([...Object.keys(A), ...Object.keys(B)])) {
    const a = A[key], b = B[key];
    if (key === 'ikL' || key === 'ikR') { const za = a || { t: (b && b.t) || [0, 0, 0], k: 0, pole: b && b.pole }, zb = b || { t: za.t, k: 0, pole: za.pole }; o[key] = { t: [0, 1, 2].map(i => lerp(za.t[i], zb.t[i], k)), k: lerp(za.k ?? 1, zb.k ?? 1, k), pole: (k < 0.5 ? za.pole : zb.pole) || zb.pole || za.pole }; continue; }
    if (Array.isArray(a) || Array.isArray(b)) { const za = a || [0, 0, 0], zb = b || [0, 0, 0]; o[key] = [0, 1, 2].map(i => lerp(za[i] || 0, zb[i] || 0, k)); continue; }
    if (typeof a === 'number' || typeof b === 'number') { o[key] = lerp(a || 0, b || 0, k); continue; }
    o[key] = k < 0.5 ? (a ?? b) : (b ?? a);
  }
  return o;
}
// keys: [[t, pose, ease='io', dur=0.35]] — pose blends in over dur ending at t+dur? No: transition starts at t, lasts dur.
export function evalKeys(keys, t) {
  let cur = resolve(keys[0][1]);
  for (let i = 1; i < keys.length; i++) {
    const [tk, pk, e = 'io', dur = 0.32] = keys[i]; if (t < tk) break;
    const k = clamp((t - tk) / dur); const target = { ...cur, ...resolve(pk) };
    // keys not mentioned in new pose stay; mentioned ones blend
    cur = mixPose(cur, target, EASE[e](k));
  }
  return cur;
}
export function evalFace(faces, t, dur = 0.12) {
  if (!faces || !faces.length) return faceParams('neutral', 'neutral', 0);
  let prev = faces[0][1], i = 0; while (i + 1 < faces.length && t >= faces[i + 1][0]) i++;
  if (i === 0) return faceParams(faces[0][1], faces[0][1], 0);
  const [tk, f, d] = faces[i]; return faceParams(faces[i - 1][1], f, ss((t - tk) / (d || dur)));
}
export function walkLayer(ph, a = 1, run = false) {
  const s = Math.sin(ph), c = Math.cos(ph); const A = run ? 0.85 : 0.48; const KB = run ? 1.5 : 0.85;
  return { hipL: [-s * A * a, 0, 0.02], hipR: [s * A * a, 0, -0.02], knL: [(0.08 + KB * Math.max(0, c)) * a, 0, 0], knR: [(0.08 + KB * Math.max(0, -c)) * a, 0, 0],
    anL: [-0.2 * Math.max(0, c) * a, 0, 0], anR: [-0.2 * Math.max(0, -c) * a, 0, 0],
    shL: [s * (run ? 1.0 : 0.42) * a, 0, 0.07], shR: [-s * (run ? 1.0 : 0.42) * a, 0, -0.07], elL: [-(run ? 1.4 : 0.3) * a, 0, 0], elR: [-(run ? 1.4 : 0.3) * a, 0, 0],
    waist: [(run ? 0.22 : 0.03) * a, s * 0.08 * a, 0], hy: ((run ? 0.25 : 0.09) * (1 - Math.abs(c)) - (run ? 0.2 : 0.05)) * a };
}
function addPose(base, add) { const o = { ...base }; for (const k in add) { if (Array.isArray(add[k])) { const b = o[k] || [0, 0, 0]; o[k] = [b[0] + add[k][0], b[1] + add[k][1], b[2] + add[k][2]]; } else if (typeof add[k] === 'number') o[k] = (o[k] || 0) + add[k]; } return o; }
// voice envelope for lip-sync
export let ENV = null; export function setEnv(e) { ENV = e; }
export function env(t) { if (!ENV) return 0; const f = t * ENV.fps; const i = Math.floor(f); const a = ENV.v[i] || 0, b = ENV.v[i + 1] || 0; return lerp(a, b, f - i); }
export function blinkAt(t, seed) { const per = 2.6 + hash(seed) * 2.2; const x = ((t + hash(seed + 3) * 9) % per); return x < 0.07 ? x / 0.07 : x < 0.14 ? 1 - (x - 0.07) / 0.07 : 0; }
function saccade(t, seed) { const seg = Math.floor(t / 0.9 + hash(seed) * 3); return [(hash(seg * 3.1 + seed) - 0.5) * 0.5, (hash(seg * 7.7 + seed) - 0.5) * 0.3]; }

// spec: {keys, faces, pos, yaw, walk:{path:[[x,z],...],t0,t1,run}, talk:[[t0,t1,amp]], freeze:t, ice:fn, look:[dx,dy], extra:(t,pose)=>pose, noIdle}
export function act(rig, t, spec) {
  const ft = spec.freeze != null && t > spec.freeze ? spec.freeze : t;
  let p = { ...POSE.idle, ...evalKeys(spec.keys || [[0, 'idle']], ft) };
  if (spec.pos) p.pos = spec.pos; if (spec.yaw != null) p.yaw = spec.yaw; for (const k of ['pitch', 'roll', 's', 'sq']) if (spec[k] != null) p[k] = spec[k];
  if (spec.walk) { const w = spec.walk; const k = clamp((ft - w.t0) / (w.t1 - w.t0)); const path = w.path; const segs = []; let L = 0; for (let i = 1; i < path.length; i++) { const d = Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]); segs.push(d); L += d; }
    const ek = w.ease === 'lin' ? k : (w.ease === 'out' ? easeOut(k) : ss(k)); let dist = ek * L, i = 0; while (i < segs.length - 1 && dist > segs[i]) { dist -= segs[i]; i++; }
    const a = path[i], b = path[i + 1] || a; const u = segs[i] ? dist / segs[i] : 0; const y = w.y ?? (p.pos ? p.pos[1] : 0);
    p.pos = [lerp(a[0], b[0], u), y, lerp(a[1], b[1], u)]; if (!w.noYaw) p.yaw = Math.atan2(b[0] - a[0], b[1] - a[1]) + (w.yawOff || 0);
    const moving = ft > w.t0 && ft < w.t1 ? 1 : 0; const amp = moving * Math.min(1, (ft - w.t0) / 0.15, (w.t1 - ft) / 0.15);
    const stride = (w.run ? 7.5 : 5.0) * rig.sc; p = addPose(p, walkLayer(ek * L / stride * 2 * PI, amp * (w.amp || 1), w.run)); }
  if (!spec.noIdle) {
    const s = rig.seed; const br = Math.sin(ft * 2.0 + s);
    p = addPose(p, { waist: [0.018 * br, noise(ft * 0.5, s) * 0.03, noise(ft * 0.4, s + 2) * 0.015], neck: [noise(ft * 0.8, s + 4) * 0.035, noise(ft * 0.6, s + 5) * 0.06, noise(ft * 0.5, s + 6) * 0.025], shL: [0, 0, 0.02 * br], shR: [0, 0, -0.02 * br], hips: [0, noise(ft * 0.3, s + 8) * 0.02, 0] });
  }
  if (spec.extra) p = spec.extra(ft, p) || p;
  // face
  let f = spec.faceP || evalFace(spec.faces || [[0, 'neutral']], ft);
  if (!spec.freezeFace || t <= spec.freeze) {
    const [sx, sy] = saccade(ft, rig.seed); f.lookX += (spec.look?.[0] || 0) + sx * (spec.noSacc ? 0 : 0.6); f.lookY += (spec.look?.[1] || 0) + sy * (spec.noSacc ? 0 : 0.6);
    if (spec.talk) for (const [a, b, amp = 1] of spec.talk) if (ft >= a && ft <= b) { const v = clamp(env(ft) * 1.25) * amp; f.mouthOpen = Math.max(f.mouthOpen, v * 0.85); f.mouthO = lerp(f.mouthO, 0.35 + 0.35 * Math.sin(ft * 23 + rig.seed), v); f.teeth = v > 0.3 ? Math.max(f.teeth, 0.6) : f.teeth; }
  }
  p.faceP = f; p.blink = (spec.freeze != null && t > spec.freeze) || spec.noBlink ? 0 : blinkAt(ft, rig.seed);
  p.t = ft; p.ice = spec.ice ? spec.ice(t) : 0;
  rig.apply(p);
  for (const side of ['L', 'R']) { const ik = p['ik' + side]; if (ik && ik.k > 0.001) { const tw = new THREE.Vector3(...ik.t).applyMatrix4(rig.root.matrixWorld); rig.reach(side, [tw.x, tw.y, tw.z], ik.k, ik.pole || [1, -0.5, -0.2]); } }
  if (spec.world) for (const [side, tw, k, pole] of spec.world) rig.reach(side, tw, k, pole);
  if (spec.post) spec.post(ft, rig);
  return p;
}
