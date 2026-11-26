// R15-style blocky rig with layered face + IK
import { THREE, scene, plastic, P, part, mesh, group, canvasTex, clamp, lerp, hash, noise, PI, S, glow } from './core.js';

// ---------- face ----------
export const EXPR = {
  neutral: { open: 1, smile: 0.35 },
  happy: { open: 0.9, smile: 1, mouthOpen: 0.35, teeth: 1, browH: 0.3, happy: 0.0 },
  joy: { happy: 1, smile: 1, mouthOpen: 0.6, teeth: 1, browH: 0.5, blush: 1 },
  smug: { open: 0.62, smile: 0.7, smirk: 1, browH: 0.2, browA: 0.35, lookY: 0 },
  shock: { open: 1.3, pupil: 1, mouthOpen: 0.85, mouthO: 0.9, browH: 1.2, browA: -0.4 },
  scared: { open: 1.2, pupil: 1, mouthOpen: 0.35, mouthW: 1.2, smile: -0.6, browH: 0.9, browA: -0.8, wobble: 1, sweat: 1 },
  panic: { open: 1.3, pupil: 1, mouthOpen: 0.95, mouthW: 1.25, smile: -0.5, teeth: 1, browH: 1.1, browA: -0.9, sweat: 1, gloom: 1 },
  worried: { open: 1, smile: -0.5, browH: 0.6, browA: -0.7, wobble: 0.6 },
  deadpan: { open: 0.52, smile: 0, browH: -0.1 },
  bored: { open: 0.42, smile: -0.15, browH: -0.2, lookY: -0.1 },
  sleep: { open: 0.0, smile: 0, mouthOpen: 0.2, mouthO: 1, browH: -0.2 },
  angry: { open: 0.85, smile: -0.6, mouthOpen: 0.3, teeth: 1, browH: -0.2, browA: 1 },
  shout: { open: 1.1, smile: -0.2, mouthOpen: 1, mouthO: 0.4, mouthW: 1.25, teeth: 1, browH: 0.5, browA: 0.6 },
  confused: { open: 1, smile: -0.2, smirk: -0.7, browH: 0.6, browA: 0.0, browTilt: 1 },
  think: { open: 0.75, smile: 0, smirk: 0.5, browH: 0.4, browTilt: 1, lookX: 0.5, lookY: 0.4 },
  sad: { open: 0.85, smile: -0.8, browH: 0.5, browA: -0.9, lookY: -0.2 },
  hopeful: { open: 1.1, pupil: 1, smile: -0.2, mouthOpen: 0.15, browH: 0.8, browA: -0.7 },
  proud: { open: 0.6, smile: 1, mouthOpen: 0.25, teeth: 1, browH: 0.4, browA: 0.2 },
  creepy: { open: 1.05, pupil: 0, smile: 0, browH: 0, stare: 1 },
  whisper: { open: 0.8, smile: -0.1, mouthOpen: 0.15, mouthO: 0.7, browH: 0.4, browA: -0.5 },
  suspicious: { open: 0.5, smile: -0.2, smirk: 0.4, browH: 0.0, browA: 0.6, lookX: 0.4 },
  terror: { open: 1.35, pupil: 1, pupilS: 0.5, mouthOpen: 0.55, mouthW: 0.9, mouthO: 0.6, smile: -0.4, browH: 1.2, browA: -1, gloom: 1, sweat: 1 },
  frozen: { open: 1.2, pupil: 1, mouthOpen: 0.4, mouthO: 0.8, browH: 1, browA: -0.3 },
};
const DEF = { open: 1, pupil: 0, pupilS: 1, lookX: 0, lookY: 0, smile: 0.3, smirk: 0, mouthOpen: 0, mouthO: 0, mouthW: 1, teeth: 0, browH: 0, browA: 0, browTilt: 0, happy: 0, blush: 0, sweat: 0, tear: 0, gloom: 0, wobble: 0, stare: 0 };
export function faceParams(a, b, k) { const A = { ...DEF, ...(typeof a === 'string' ? EXPR[a] : a) }, B = { ...DEF, ...(typeof b === 'string' ? EXPR[b] : b) }; const o = {}; for (const key in DEF) o[key] = lerp(A[key], B[key], k); return o; }
const INK = '#1b1418';
function ell(c, x, y, rx, ry, col, rot = 0) { c.beginPath(); c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, PI * 2); c.fillStyle = col; c.fill(); }
export function drawFace(c, f, opt = {}) {
  c.clearRect(0, 0, 512, 512);
  const cx = 256, ey = 214 + (opt.eyeY || 0), sep = opt.sep || 100, my = 352;
  c.lineCap = 'round'; c.lineJoin = 'round';
  if (opt.mask) { c.fillStyle = opt.mask; c.beginPath(); c.ellipse(cx - sep, ey + 4, 78, 86, 0, 0, PI * 2); c.ellipse(cx + sep, ey + 4, 78, 86, 0, 0, PI * 2); c.fill(); c.beginPath(); c.ellipse(cx, 352, 150, 112, 0, 0, PI * 2); c.fill(); c.beginPath(); c.moveTo(cx - 40, 200); c.lineTo(cx + 40, 200); c.lineTo(cx + 120, 300); c.lineTo(cx - 120, 300); c.fill();
    c.fillStyle = 'rgba(60,30,20,0.7)'; ell(c, cx - 14, 300, 7, 5, 'rgba(60,30,20,0.7)'); ell(c, cx + 14, 300, 7, 5, 'rgba(60,30,20,0.7)'); }
  if (opt.wrinkles) { c.strokeStyle = 'rgba(90,60,50,0.55)'; c.lineWidth = 5; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(cx - 90, 90 + i * 16); c.quadraticCurveTo(cx, 80 + i * 16, cx + 90, 90 + i * 16); c.stroke(); } }
  if (f.gloom > 0.01) { const g = c.createLinearGradient(0, 40, 0, 230); g.addColorStop(0, `rgba(70,60,160,${0.75 * f.gloom})`); g.addColorStop(1, 'rgba(70,60,160,0)'); c.fillStyle = g; c.fillRect(70, 30, 372, 200); c.strokeStyle = `rgba(40,30,110,${0.7 * f.gloom})`; c.lineWidth = 7; for (let i = 0; i < 6; i++) { const x = 120 + i * 55; c.beginPath(); c.moveTo(x, 40); c.lineTo(x, 110 + (i % 2) * 30); c.stroke(); } }
  if (f.blush > 0.01 || opt.blush) { const a = Math.max(f.blush, opt.blush || 0) * 0.5; ell(c, cx - 150, ey + 85, 42, 22, `rgba(255,110,120,${a})`); ell(c, cx + 150, ey + 85, 42, 22, `rgba(255,110,120,${a})`); }
  if (opt.freckles) { c.fillStyle = 'rgba(150,85,55,0.6)'; for (const [x, y] of [[-150, 70], [-128, 86], [-160, 95], [150, 70], [128, 86], [160, 95]]) { c.beginPath(); c.arc(cx + x, ey + y, 6, 0, 7); c.fill(); } }
  if (opt.stubble) { c.fillStyle = 'rgba(60,45,40,0.35)'; for (let i = 0; i < 160; i++) { const a = PI * (0.05 + 0.9 * hash(i)); const r = 150 + 40 * hash(i + 7); c.fillRect(cx + Math.cos(a) * r * 1.1 - 3, 300 + Math.sin(a) * r * 0.75 - 3, 6, 6); } }
  // eyes
  for (let k = 0; k < 2; k++) {
    const s = k === 0 ? -1 : 1; const x = cx + s * sep, lx = f.lookX * 16, ly = -f.lookY * 14;
    const open = clamp(f.open * (opt.blink ? 1 - opt.blink : 1), 0, 1.5);
    if (f.happy > 0.5) { c.strokeStyle = INK; c.lineWidth = 15; c.beginPath(); c.arc(x, ey + 22, 34, PI * 1.12, PI * 1.88); c.stroke(); continue; }
    if (open < 0.12) { c.strokeStyle = INK; c.lineWidth = 13; c.beginPath(); c.moveTo(x - 32, ey + 6); c.quadraticCurveTo(x, ey + 18, x + 32, ey + 6); c.stroke(); continue; }
    const rx = 31 * (0.9 + 0.1 * open), ry = 46 * open;
    if (f.pupil > 0.5) {
      ell(c, x, ey, rx * 1.18, ry * 1.08, INK); ell(c, x, ey, rx * 1.0, ry * 0.92, '#ffffff');
      const pr = 17 * f.pupilS; ell(c, x + lx * 0.8, ey + ly * 0.6, pr, pr * 1.15, INK); ell(c, x + lx * 0.8 - pr * 0.35, ey + ly * 0.6 - pr * 0.4, pr * 0.32, pr * 0.32, '#ffffff');
    } else {
      ell(c, x + lx * 0.4, ey + ly * 0.4, rx, ry, INK);
      if (!f.stare) { ell(c, x + lx * 0.4 - rx * 0.3, ey + ly * 0.4 - ry * 0.42, rx * 0.36, rx * 0.36, '#ffffff'); ell(c, x + lx * 0.4 + rx * 0.32, ey + ly * 0.4 + ry * 0.3, rx * 0.15, rx * 0.15, 'rgba(255,255,255,0.8)'); }
      else ell(c, x + lx * 0.4 - rx * 0.25, ey + ly * 0.4 - ry * 0.4, rx * 0.12, rx * 0.12, 'rgba(255,255,255,0.9)');
    }
    // upper lid for half-open look
    if (open < 0.8 && opt.skin) { c.fillStyle = opt.skin; c.fillRect(x - 50, ey - 90, 100, 90 - ry * 0.25 - 46 * (open - 0.12)); c.strokeStyle = INK; c.lineWidth = 9; c.beginPath(); c.moveTo(x - 36, ey - ry * 0.25 - 46 * (open - 0.12) + 2); c.lineTo(x + 36, ey - ry * 0.25 - 46 * (open - 0.12) + 2); c.stroke(); }
  }
  // brows
  c.strokeStyle = opt.browCol || INK; c.lineWidth = 14;
  for (let k = 0; k < 2; k++) {
    const s = k === 0 ? -1 : 1; const x = cx + s * sep; const tilt = f.browTilt * (k === 0 ? 0.9 : -0.3);
    const by = ey - 60 - f.browH * 13 - tilt * 10 - (f.pupil > 0.5 ? 4 : 0); const a = f.browA * 16;
    c.beginPath(); c.moveTo(x + s * 36, by - a * 0.6); c.quadraticCurveTo(x, by - 8 - (f.browA < 0 ? f.browA * -3 : 0), x - s * 34, by + a); c.stroke();
  }
  // mouth
  const mo = f.mouthOpen, w = 50 * f.mouthW * (1 - 0.42 * f.mouthO), corner = -f.smile * 16, sk = f.smirk * 14;
  if (opt.mustache) { /* drawn after */ }
  if (mo < 0.07) {
    c.strokeStyle = INK; c.lineWidth = 11; c.beginPath(); c.moveTo(cx - w, my + corner + sk);
    if (f.wobble > 0.3) { for (let i = 1; i <= 6; i++) c.lineTo(cx - w + i * w / 3, my + (i % 2 ? -7 : 5) * f.wobble + (i === 6 ? corner - sk : 0)); }
    else c.quadraticCurveTo(cx, my + f.smile * 26, cx + w, my + corner - sk);
    c.stroke();
  } else {
    const fr = Math.max(0, -f.smile), sm = Math.max(0, f.smile);
    const top = my + corner * 0.4 - mo * (12 + 70 * fr) * (1 - f.mouthO * 0.6) - mo * 14 * f.mouthO + sm * 6, bot = my + corner * 0.4 + mo * (66 - 44 * fr) + sm * 16 + mo * 12 * f.mouthO;
    c.save(); c.beginPath(); c.moveTo(cx - w, my + corner + sk);
    c.quadraticCurveTo(cx, top - (f.mouthO * mo * 24), cx + w, my + corner - sk);
    c.quadraticCurveTo(cx + w * 0.9, bot, cx, bot); c.quadraticCurveTo(cx - w * 0.9, bot, cx - w, my + corner + sk); c.closePath();
    c.fillStyle = '#3a0d16'; c.fill(); c.clip();
    ell(c, cx, bot + 6, w * 0.7, 22 + mo * 12, '#e25b72');
    if (f.teeth > 0.5) { c.fillStyle = '#ffffff'; c.fillRect(cx - w, top - 30, w * 2, 30 + 14 + mo * 4); }
    c.restore();
    c.strokeStyle = INK; c.lineWidth = 8; c.beginPath(); c.moveTo(cx - w, my + corner + sk); c.quadraticCurveTo(cx, top - (f.mouthO * mo * 24), cx + w, my + corner - sk); c.quadraticCurveTo(cx + w * 0.9, bot, cx, bot); c.quadraticCurveTo(cx - w * 0.9, bot, cx - w, my + corner + sk); c.closePath(); c.stroke();
  }
  if (opt.mustache) { c.fillStyle = opt.mustache; c.beginPath(); c.ellipse(cx - 40, my - 34, 48, 19, -0.25, 0, PI * 2); c.ellipse(cx + 40, my - 34, 48, 19, 0.25, 0, PI * 2); c.fill(); }
  if (f.sweat > 0.01) { const a = f.sweat; c.fillStyle = `rgba(120,200,255,${0.95 * a})`; c.beginPath(); const sx = cx + 190, sy = 120; c.moveTo(sx, sy - 34); c.quadraticCurveTo(sx + 24, sy + 6, sx, sy + 22); c.quadraticCurveTo(sx - 24, sy + 6, sx, sy - 34); c.fill(); c.fillStyle = `rgba(255,255,255,${0.8 * a})`; ell(c, sx - 6, sy + 4, 5, 8, `rgba(255,255,255,${0.8 * a})`); }
  if (f.tear > 0.01) { ell(c, cx + sep + 18, ey + 64 + f.tear * 40, 10, 15, `rgba(120,200,255,${f.tear})`); }
}

function faceMaterial(skin, tex, size) {
  const m = plastic(skin, { rough: 0.45 });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.faceMap = { value: tex };
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vLP; varying vec3 vLN;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvLP = position; vLN = normal;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D faceMap; varying vec3 vLP; varying vec3 vLN;')
      .replace('#include <map_fragment>', `#include <map_fragment>\n{ vec2 fuv = vLP.xy / ${size.toFixed(3)} + 0.5; if (vLN.z > 0.0 && vLP.z > 0.0 && fuv.x > 0. && fuv.x < 1. && fuv.y > 0. && fuv.y < 1.) { vec4 fc = texture2D(faceMap, fuv); diffuseColor.rgb = mix(diffuseColor.rgb, fc.rgb, fc.a * smoothstep(0.0, 0.35, vLN.z)); } }`);
  };
  m.customProgramCacheKey = () => 'face' + size.toFixed(3);
  return m;
}

// ---------- R15 rig ----------
export const ACTORS = [];
export class Rig {
  constructor(o) {
    this.o = o; this.seed = o.seed ?? ACTORS.length * 7.3;
    const root = this.root = group([0, 0, 0]); const sc = this.sc = o.scale || 1;
    const skin = P(o.skin), shirt = P(o.shirt), pants = P(o.pants), shoes = P(o.shoes || '#2b2b33'), sleeve = o.longSleeves ? shirt : skin;
    this.hips = group([0, 2.6, 0], root);
    part(2.0, 0.55, 1.0, P(o.belt || o.pants), [0, 0.25, 0], 0.1, this.hips);
    this.waist = group([0, 0.5, 0], this.hips);
    this.torso = part(2.0, 1.68, 1.0, shirt, [0, 0.83, 0], 0.14, this.waist);
    this.neck = group([0, 1.65, 0], this.waist);
    part(0.62, 0.3, 0.62, skin, [0, 0.08, 0], 0.08, this.neck);
    this.head = group([0, 0.72, 0], this.neck);
    const fc = document.createElement('canvas'); fc.width = fc.height = 512; this.fctx = fc.getContext('2d');
    this.ftex = new THREE.CanvasTexture(fc); this.ftex.colorSpace = THREE.SRGBColorSpace; this.ftex.anisotropy = 4;
    this.headMesh = part(1.32, 1.28, 1.24, faceMaterial(o.skin, this.ftex, 1.16), [0, 0, 0], 0.3, this.head);
    // arms
    const arm = (s) => {
      const sh = group([s * 1.5, 1.38, 0], this.waist);
      part(0.96, 1.12, 0.96, o.shortSleeves === false || o.longSleeves ? shirt : shirt, [0, -0.5, 0], 0.12, sh);
      const el = group([0, -1.05, 0], sh); part(0.94, 1.02, 0.94, o.longSleeves ? shirt : skin, [0, -0.47, 0], 0.12, el);
      if (o.cuffs) part(0.98, 0.18, 0.98, P(o.cuffs), [0, -0.9, 0], 0.05, el);
      const wr = group([0, -0.97, 0], el); part(0.92, 0.42, 0.92, P(o.gloves || o.skin), [0, -0.2, 0], 0.14, wr);
      const grip = group([0, -0.3, 0.05], wr);
      return { sh, el, wr, grip };
    };
    this.L = arm(1); this.R = arm(-1);
    const leg = (s) => {
      const hp = group([s * 0.5, 0, 0], this.hips);
      part(0.97, 1.17, 0.97, pants, [0, -0.56, 0], 0.12, hp);
      const kn = group([0, -1.15, 0], hp); part(0.95, 1.17, 0.95, pants, [0, -0.56, 0], 0.12, kn);
      const an = group([0, -1.15, 0], kn); part(0.98, 0.32, 1.12, shoes, [0, -0.14, 0.07], 0.12, an);
      if (o.soles) part(1.0, 0.08, 1.14, P(o.soles), [0, -0.27, 0.07], 0.03, an);
      return { hp, kn, an };
    };
    this.LL = leg(1); this.LR = leg(-1);
    root.scale.setScalar(sc);
    this.faceOpt = { mask: o.mask, wrinkles: o.wrinkles, skin: o.mask || o.skin, freckles: o.freckles, stubble: o.stubble, mustache: o.mustache, blush: o.blush, browCol: o.browCol, sep: o.eyeSep, eyeY: o.eyeY };
    buildAccessories(this, o);
    root.traverse(x => { if (x.isMesh) { x.castShadow = true; x.receiveShadow = true; } });
    ACTORS.push(this); this.hide();
  }
  hide() { this.root.visible = false; }
  // full pose apply. p: {pos,yaw,pitch,roll,s,hy,hips,waist,neck,shL,elL,wrL,shR,elR,wrR,hipL,knL,anL,hipR,knR,anR,face}
  apply(p) {
    const r = this.root; r.visible = true;
    r.position.set(...(p.pos || [0, 0, 0])); r.rotation.set(p.pitch || 0, p.yaw || 0, p.roll || 0, 'YXZ');
    const sq = p.sq || 0; r.scale.set(this.sc * (p.s || 1) * (1 - sq * 0.5), this.sc * (p.s || 1) * (1 + sq), this.sc * (p.s || 1) * (1 - sq * 0.5));
    this.hips.position.y = 2.6 + (p.hy || 0); this.hips.position.z = p.hz || 0;
    const set = (g, v) => { if (v) g.rotation.set(v[0] || 0, v[1] || 0, v[2] || 0); else g.rotation.set(0, 0, 0); };
    set(this.hips, p.hips); set(this.waist, p.waist); set(this.neck, p.neck);
    set(this.L.sh, p.shL); set(this.L.el, p.elL); set(this.L.wr, p.wrL); set(this.R.sh, p.shR); set(this.R.el, p.elR); set(this.R.wr, p.wrR);
    set(this.LL.hp, p.hipL); set(this.LL.kn, p.knL); set(this.LL.an, p.anL); set(this.LR.hp, p.hipR); set(this.LR.kn, p.knR); set(this.LR.an, p.anR);
    if (this.acc?.update) this.acc.update(p);
    const f = p.faceP || faceParams(p.face || 'neutral', p.face || 'neutral', 0);
    const key = JSON.stringify(f, (k, v) => typeof v === 'number' ? Math.round(v * 100) / 100 : v) + (p.blink || 0);
    if (key !== this.fkey) { this.fkey = key; drawFace(this.fctx, f, { ...this.faceOpt, blink: p.blink || 0 }); this.ftex.needsUpdate = true; }
    if (this.ice) this.ice.update(p.ice || 0, p.t || 0);
    this.root.updateMatrixWorld(true);
  }
  // 2-bone IK: point arm side ('L'|'R') grip at world target; k blend; pole in torso space
  reach(side, target, k = 1, pole = [0, -0.4, -1]) {
    if (k <= 0.001) return;
    const A = side === 'L' ? this.L : this.R; const s = side === 'L' ? 1 : -1;
    this.root.updateMatrixWorld(true);
    const par = A.sh.parent; const inv = new THREE.Matrix4().copy(par.matrixWorld).invert();
    const T = new THREE.Vector3(...target).applyMatrix4(inv).sub(A.sh.position);
    const L1 = 1.05, L2 = 0.97 + 0.3; const d = clamp(T.length(), 0.3, (L1 + L2) * 0.995);
    const dir = T.clone().normalize();
    const Pv = new THREE.Vector3(pole[0] * s, pole[1], pole[2]).normalize();
    const perp = Pv.clone().sub(dir.clone().multiplyScalar(Pv.dot(dir))).normalize();
    const a = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
    const E = dir.clone().multiplyScalar(Math.cos(a) * L1).add(perp.clone().multiplyScalar(Math.sin(a) * L1));
    const down = new THREE.Vector3(0, -1, 0);
    const q1 = new THREE.Quaternion().setFromUnitVectors(down, E.clone().normalize());
    const tl = dir.clone().multiplyScalar(d).sub(E).applyQuaternion(q1.clone().invert()).normalize();
    const q2 = new THREE.Quaternion().setFromUnitVectors(down, tl);
    A.sh.quaternion.slerp(q1, k); A.el.quaternion.slerp(q2, k);
    this.root.updateMatrixWorld(true);
  }
  gripWorld(side = 'R') { this.root.updateMatrixWorld(true); const v = new THREE.Vector3(); (side === 'L' ? this.L : this.R).grip.getWorldPosition(v); return [v.x, v.y, v.z]; }
  headWorld(off = [0, 0, 0]) { this.root.updateMatrixWorld(true); const v = new THREE.Vector3(...off); this.head.localToWorld(v); return [v.x, v.y, v.z]; }
}

// ---------- accessories ----------
function buildAccessories(R, o) {
  const h = R.head, H = (c) => P(c || o.hairColor || '#3b2a20');
  const hc = H();
  const acc = R.acc = {};
  switch (o.hair) {
    case 'messy': { // Benny
      part(1.46, 0.46, 1.38, hc, [0, 0.58, -0.04], 0.18, h); part(1.46, 0.95, 0.36, hc, [0, 0.16, -0.5], 0.14, h);
      part(0.34, 0.66, 1.2, hc, [0.65, 0.24, -0.06], 0.12, h); part(0.34, 0.66, 1.2, hc, [-0.65, 0.24, -0.06], 0.12, h);
      part(0.78, 0.32, 0.34, hc, [-0.24, 0.46, 0.55], 0.12, h, [0, 0, 0.28]); part(0.56, 0.28, 0.34, hc, [0.36, 0.5, 0.55], 0.12, h, [0, 0, -0.32]);
      for (let i = 0; i < 6; i++) part(0.44, 0.42, 0.44, hc, [-0.55 + i * 0.22, 0.84 + 0.07 * Math.sin(i * 2), -0.2 + 0.24 * Math.cos(i * 3)], 0.14, h, [0.4 * Math.sin(i), i, 0.5 * Math.cos(i * 1.7)]);
      if (o.streak) { const st = P(o.streak); part(0.44, 0.34, 0.36, st, [-0.44, 0.47, 0.57], 0.12, h, [0, 0, 0.35]); part(0.38, 0.44, 0.38, st, [-0.46, 0.9, 0.04], 0.12, h, [0.3, 0.6, 0.4]); }
      break; }
    case 'buzz': part(1.38, 0.24, 1.3, hc, [0, 0.58, -0.02], 0.12, h); part(1.38, 0.6, 0.2, hc, [0, 0.25, -0.58], 0.08, h); break;
    case 'bun': part(1.44, 0.4, 1.36, hc, [0, 0.56, -0.02], 0.16, h); part(1.44, 0.8, 0.3, hc, [0, 0.18, -0.54], 0.12, h); part(0.3, 0.6, 1.2, hc, [0.64, 0.26, -0.06], 0.1, h); part(0.3, 0.6, 1.2, hc, [-0.64, 0.26, -0.06], 0.1, h); mesh(new THREE.SphereGeometry(0.42, 16, 12), hc, [0, 1.0, -0.3], h); break;
    case 'cap': { const cc = P(o.capColor || '#E0453A'); part(1.46, 0.5, 1.4, cc, [0, 0.6, -0.02], 0.2, h); part(1.25, 0.1, 0.7, cc, [0, 0.4, 0.85], 0.04, h); part(0.3, 0.42, 1.0, hc, [0.64, 0.2, -0.1], 0.08, h); part(0.3, 0.42, 1.0, hc, [-0.64, 0.2, -0.1], 0.08, h); part(1.4, 0.4, 0.25, hc, [0, 0.2, -0.56], 0.08, h); break; }
    case 'beanie': { const cc = P(o.capColor || '#3F6E9E'); part(1.48, 0.62, 1.42, cc, [0, 0.52, -0.02], 0.25, h); part(1.52, 0.2, 1.46, P('#ffffff'), [0, 0.26, -0.02], 0.08, h); mesh(new THREE.SphereGeometry(0.26, 12, 8), P('#ffffff'), [0, 0.95, 0], h); break; }
    case 'bald': part(0.3, 0.45, 0.9, hc, [0.66, 0.1, -0.15], 0.1, h); part(0.3, 0.45, 0.9, hc, [-0.66, 0.1, -0.15], 0.1, h); part(1.36, 0.45, 0.25, hc, [0, 0.1, -0.58], 0.08, h); break;
    case 'toupee': { // mayor: grey sides + detachable toupee
      const g = P(o.sideColor || '#C9C9CF'); part(0.3, 0.5, 1.0, g, [0.66, 0.12, -0.12], 0.1, h); part(0.3, 0.5, 1.0, g, [-0.66, 0.12, -0.12], 0.1, h); part(1.36, 0.5, 0.25, g, [0, 0.12, -0.58], 0.08, h);
      acc.toupee = group([0, 0.66, 0.02], h); part(1.42, 0.3, 1.34, hc, [0, 0.0, 0], 0.15, acc.toupee); part(0.9, 0.32, 0.5, hc, [0.2, 0.1, 0.45], 0.15, acc.toupee, [0, 0, -0.25]);
      acc.toupeeHome = { pos: acc.toupee.position.clone(), rot: acc.toupee.rotation.clone() }; break; }
    case 'bob': part(1.48, 0.44, 1.4, hc, [0, 0.56, -0.02], 0.18, h); part(1.52, 1.2, 0.42, hc, [0, -0.02, -0.5], 0.16, h); part(0.36, 1.1, 1.2, hc, [0.68, 0.0, -0.06], 0.14, h); part(0.36, 1.1, 1.2, hc, [-0.68, 0.0, -0.06], 0.14, h); part(1.0, 0.3, 0.3, hc, [-0.15, 0.45, 0.56], 0.12, h, [0, 0, 0.12]); break;
  }
  if (o.monkey) { const fur = P(o.skin), inner = P(o.mask || '#f3d2a2');
    for (const s of [-1, 1]) { const e = group([s * 0.74, 0.12, -0.05], h); mesh(new THREE.SphereGeometry(0.34, 16, 10), fur, [0, 0, 0], e).scale.set(0.5, 1, 1); mesh(new THREE.SphereGeometry(0.22, 12, 8), inner, [s * 0.1, 0, 0.02], e).scale.set(0.4, 1, 1); }
    if (o.tuft !== false) { part(1.4, 0.34, 1.32, fur, [0, 0.58, -0.04], 0.16, h); for (let i = 0; i < 3; i++) part(0.32, 0.34, 0.32, fur, [-0.3 + i * 0.3, 0.8, 0.25 - i * 0.1], 0.12, h, [0.3, i * 0.6, 0.4 - i * 0.4]); }
    acc.tail = []; let par = group([0, 0.35, -0.5], R.hips); for (let i = 0; i < 6; i++) { const g = group(i ? [0, 0.42, 0] : [0, 0, 0], par); part(0.22, 0.48, 0.22, fur, [0, 0.21, 0], 0.1, g); acc.tail.push(g); par = g; }
    if (o.muzzle !== false) part(0.82, 0.48, 0.2, P(o.mask || '#f3d2a2'), [0, -0.3, 0.6], 0.18, h).visible = false; }
  if (o.jadeCrown) { const gm = plastic('#d9a520', { metal: 0.7, rough: 0.3 }); part(1.1, 0.7, 1.1, gm, [0, 0.9, 0], 0.15, h); part(2.1, 0.12, 1.3, P('#1a1a22'), [0, 1.3, 0], 0.03, h, [0.12, 0, 0]); for (const z of [-0.6, 0.6]) for (let i = 0; i < 7; i++) { const x = -0.95 + i * 0.317; for (let k = 0; k < 4; k++) mesh(new THREE.SphereGeometry(0.06, 6, 4), glow(['#ff4a4a', '#4aff9a', '#ffd84a', '#4ab8ff'][k], 0.6), [x, 1.15 - k * 0.15 - (z > 0 ? 0.08 : 0), z * 1.12], h); } }
  if (o.topknot) { part(0.5, 0.4, 0.5, H(o.topknot), [0, 0.85, -0.05], 0.18, h); part(0.12, 0.7, 0.12, P('#d4af37'), [0, 0.9, -0.05], 0.04, h, [0, 0, PI / 2]); }
  if (o.longBeard) { part(0.9, 1.3, 0.3, H(o.longBeard), [0, -0.95, 0.5], 0.14, h); part(0.6, 0.6, 0.3, H(o.longBeard), [0, -1.75, 0.5], 0.14, h); }
  if (o.robe) { const rm = P(o.robe); acc.robe = []; for (const s of [-1, 1]) { const g = group([s * 0.5, 0, 0], R.hips); part(1.05, 2.3, 1.12, rm, [0, -1.05, 0], 0.1, g); acc.robe.push([g, s]); } if (o.robeTrim) part(2.1, 0.3, 1.1, P(o.robeTrim), [0, 0.05, 0], 0.06, R.hips); }
  if (o.belt2) part(2.06, 0.26, 1.06, P(o.belt2), [0, 0.12, 0], 0.06, R.waist);
  if (o.glasses) { const gm = P(o.glasses); for (const s of [-1, 1]) { part(0.46, 0.06, 0.06, gm, [s * 0.29, 0.29, 0.66], 0.02, h); part(0.46, 0.06, 0.06, gm, [s * 0.29, -0.06, 0.66], 0.02, h); part(0.06, 0.4, 0.06, gm, [s * 0.52, 0.115, 0.66], 0.02, h); part(0.06, 0.4, 0.06, gm, [s * 0.06, 0.115, 0.66], 0.02, h); part(0.06, 0.06, 0.6, gm, [s * 0.66, 0.2, 0.36], 0.02, h); } part(0.14, 0.05, 0.05, gm, [0, 0.2, 0.66], 0.02, h);
    const lens = plastic('#cfe8ff', { transparent: true, opacity: 0.18, rough: 0.05, env: 2 }); for (const s of [-1, 1]) { const l = part(0.42, 0.34, 0.02, lens, [s * 0.29, 0.115, 0.655], 0.01, h); l.castShadow = false; } }
  if (o.beard) part(1.2, 0.5, 0.3, H(o.beard), [0, -0.5, 0.55], 0.15, h);
  const t = R.waist;
  if (o.scarf) { const sm = P(o.scarf); part(1.75, 0.38, 1.35, sm, [0, 1.72, 0], 0.16, t); acc.scarfTail = group([0.45, 1.6, 0.62], t); part(0.45, 1.05, 0.2, sm, [0, -0.5, 0], 0.08, acc.scarfTail); }
  if (o.tie) { const tm = P(o.tie); part(0.3, 0.2, 0.12, tm, [0, 1.52, 0.52], 0.04, t); part(0.36, 1.05, 0.1, tm, [0, 0.95, 0.52], 0.06, t, [0, 0, 0]); }
  if (o.collar) { const cm = P(o.collar); part(0.5, 0.35, 0.1, cm, [-0.28, 1.5, 0.52], 0.04, t, [0, 0, 0.5]); part(0.5, 0.35, 0.1, cm, [0.28, 1.5, 0.52], 0.04, t, [0, 0, -0.5]); }
  if (o.jacket) { const jm = P(o.jacket); part(0.7, 1.6, 0.12, jm, [0.68, 0.82, 0.52], 0.06, t); part(0.7, 1.6, 0.12, jm, [-0.68, 0.82, 0.52], 0.06, t); }
  if (o.sash) { const s = P(o.sash); part(0.4, 2.3, 0.1, s, [0, 0.85, 0.53], 0.04, t, [0, 0, 0.75]); }
  if (o.badge) { const bm = glow(o.badge, 0.4); part(0.42, 0.42, 0.08, bm, [0.55, 1.15, 0.53], 0.12, t); }
  if (o.pendant) { mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.08, 20), plastic('#F4C430', { metal: 0.7, rough: 0.25 }), [0, 1.18, 0.55], t, [PI / 2, 0, 0]); }
  if (o.hoodie) { const hm = P(o.shirt); part(1.6, 0.55, 0.7, hm, [0, 1.75, -0.55], 0.2, t); part(0.1, 0.8, 0.1, P('#eeeeee'), [0.3, 1.25, 0.53], 0.03, t); part(0.1, 0.8, 0.1, P('#eeeeee'), [-0.3, 1.25, 0.53], 0.03, t); part(1.3, 0.5, 0.08, P(o.pocket || '#333'), [0, 0.42, 0.52], 0.04, t); }
  if (o.sweater) { // knit pattern decal
    const tex = canvasTex(512, 420, (c, w, hh) => { c.fillStyle = o.shirt; c.fillRect(0, 0, w, hh); c.fillStyle = o.sweater; for (let y = 40; y < hh; y += 150) { c.fillRect(0, y, w, 26); for (let x = 0; x < w; x += 64) { c.beginPath(); c.moveTo(x + 32, y + 46); c.lineTo(x + 52, y + 80); c.lineTo(x + 32, y + 114); c.lineTo(x + 12, y + 80); c.fill(); } } c.fillStyle = '#ffffff'; for (let i = 0; i < 40; i++) { c.fillRect(hash(i) * w, hash(i + 4) * hh, 10, 10); } });
    const d = new THREE.Mesh(new THREE.PlaneGeometry(1.78, 1.45), plastic('#ffffff', { map: tex, rough: 0.8 })); d.position.set(0, 0.82, 0.505); t.add(d); }
  if (o.logo) { const tex = canvasTex(256, 256, o.logo); const d = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), plastic('#ffffff', { map: tex, transparent: true })); d.position.set(0, 0.95, 0.505); t.add(d); }
  if (o.stripe) part(2.02, 0.3, 1.02, P(o.stripe), [0, 1.15, 0], 0.05, t);
  if (o.apron) part(1.6, 1.9, 0.08, P(o.apron), [0, 0.1, 0.52], 0.05, t);
  acc.update = (p) => {
    if (acc.tail) { const tt = p.t || 0; acc.tail.forEach((g, i) => g.rotation.set((i === 0 ? -1.1 : 0.32) + Math.sin(tt * 2.2 - i * 0.6) * 0.12 * (p.tailWag || 1), Math.sin(tt * 1.7 - i * 0.5) * 0.18 * (p.tailWag || 1), 0)); }
    if (acc.robe) for (const [g, s] of acc.robe) { const hp = s > 0 ? R.LL.hp : R.LR.hp; g.rotation.set(hp.rotation.x * 0.8, 0, hp.rotation.z); }
    if (acc.scarfTail) acc.scarfTail.rotation.set(-0.12 - (p.wind || 0) + Math.sin((p.t || 0) * 3) * 0.05, 0, 0.08 * Math.sin((p.t || 0) * 2.3));
    if (acc.toupee) { const tp = p.toupee; if (tp) { acc.toupee.position.set(...tp.pos); acc.toupee.rotation.set(...tp.rot); } else { acc.toupee.position.copy(acc.toupeeHome.pos); acc.toupee.rotation.copy(acc.toupeeHome.rot); } }
  };
}
