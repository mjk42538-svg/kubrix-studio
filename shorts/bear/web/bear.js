// blocky polar bear rig
import { THREE, scene, plastic, P, part, mesh, group, clamp, lerp, PI, noise, hash } from './core.js';
const FUR = plastic('#EEF2F8', { rough: 0.62 }), FUR2 = plastic('#DCE3EE', { rough: 0.65 }), DARK = plastic('#15141a', { rough: 0.15, env: 2.5 }), PINK = P('#E9A6B4');
export class Bear {
  constructor(o = {}) {
    this.root = group([0, 0, 0]); this.sc = o.scale || 1; this.root.scale.setScalar(this.sc);
    this.pelvis = group([0, 3.2, 0], this.root);
    this.body = group([0, 0, 0], this.pelvis);
    part(3.5, 3.1, 5.4, FUR, [0, 0.2, 2.1], 0.6, this.body);
    part(3.1, 2.4, 1.2, FUR2, [0, 0.0, -0.55], 0.45, this.body);
    mesh(new THREE.SphereGeometry(0.42, 12, 8), FUR, [0, 0.6, -1.15], this.body); // tail
    this.chest = group([0, 0.35, 4.3], this.body);
    this.neck = group([0, 0.55, 0.45], this.chest);
    part(2.4, 2.3, 1.6, FUR, [0, 0.2, 0.25], 0.55, this.neck);
    this.head = group([0, 0.75, 1.25], this.neck);
    part(2.5, 2.2, 2.3, FUR, [0, 0, 0], 0.62, this.head);
    part(1.35, 0.9, 1.15, FUR2, [0, -0.38, 1.35], 0.32, this.head); // snout upper
    part(0.42, 0.24, 0.2, plastic('#1d1a22', { rough: 0.5 }), [0, -0.02, 1.93], 0.11, this.head); // nose
    part(0.06, 0.32, 0.04, DARK, [0, -0.38, 1.93], 0.02, this.head);
    this.jaw = group([0, -0.72, 0.85], this.head);
    part(1.15, 0.32, 1.0, FUR2, [0, -0.08, 0.45], 0.12, this.jaw);
    this.mouthIn = part(0.95, 0.12, 0.85, plastic('#3a1018'), [0, 0.1, 0.42], 0.04, this.jaw);
    for (const s of [-1, 1]) { const e = group([s * 0.92, 1.05, -0.25], this.head); mesh(new THREE.SphereGeometry(0.46, 16, 10), FUR, [0, 0, 0], e).scale.set(1, 1, 0.55); mesh(new THREE.SphereGeometry(0.26, 12, 8), PINK, [0, 0, 0.16], e).scale.set(1, 1, 0.4); }
    this.eyes = []; for (const s of [-1, 1]) { const g = group([s * 0.62, 0.32, 1.12], this.head); const e = mesh(new THREE.SphereGeometry(0.2, 18, 12), DARK, [0, 0, 0], g); e.scale.set(1, 1.15, 0.6); const hl = mesh(new THREE.SphereGeometry(0.05, 8, 6), plastic('#ffffff', { emissive: '#ffffff', ei: 1.5 }), [-0.06, 0.07, 0.11], g); hl.castShadow = false; this.eyes.push({ g, hl }); }
    this.brows = []; for (const s of [-1, 1]) { const b = group([s * 0.62, 0.68, 1.13], this.head); part(0.48, 0.1, 0.1, plastic('#A9B3C4'), [0, 0, 0], 0.04, b); this.brows.push(b); }
    const leg = (x, y, z, par, front) => {
      const sh = group([x, y, z], par);
      part(front ? 1.3 : 1.6, front ? 2.3 : 2.3, front ? 1.3 : 2.0, FUR, [0, front ? -1.0 : -0.85, 0], 0.4, sh);
      const kn = group([0, -2.0, 0], sh); part(1.15, 1.9, 1.15, FUR, [0, -0.85, 0], 0.35, kn);
      const pw = group([0, -1.75, 0], kn); part(1.4, 0.5, 1.7, FUR2, [0, -0.15, 0.25], 0.22, pw);
      for (let i = -1; i <= 1; i++) mesh(new THREE.SphereGeometry(0.09, 6, 4), DARK, [i * 0.38, -0.25, 1.1], pw);
      return { sh, kn, pw };
    };
    this.FL = leg(1.15, -0.4, 0.1, this.chest, true); this.FR = leg(-1.15, -0.4, 0.1, this.chest, true);
    this.RL = leg(1.3, -0.3, 0.1, this.body, false); this.RR = leg(-1.3, -0.3, 0.1, this.body, false);
    this.root.traverse(x => { if (x.isMesh) { x.castShadow = true; x.receiveShadow = true; } });
    this.root.visible = false;
  }
  hide() { this.root.visible = false; }
  // p: pos,yaw,hy,pitch(body), neck[], head[], jaw, FL{sh,kn,pw}, FR, RL, RR, blink, look[x,y], brow (-1 sad..1 angry)
  apply(p) {
    const r = this.root; r.visible = true; r.position.set(...(p.pos || [0, 0, 0])); r.rotation.set(0, p.yaw || 0, p.roll || 0, 'YXZ');
    const s = this.sc * (p.s || 1); r.scale.set(s * (1 - (p.sq || 0) * 0.4), s * (1 + (p.sq || 0)), s * (1 - (p.sq || 0) * 0.4));
    this.pelvis.position.set(0, 3.2 + (p.hy || 0), p.hz || 0); this.body.rotation.set(p.pitch || 0, p.twist || 0, p.bank || 0);
    const set = (g, v) => g.rotation.set(...(v || [0, 0, 0]));
    set(this.chest, p.chest); set(this.neck, p.neck); set(this.head, p.head); this.jaw.rotation.x = p.jaw || 0;
    for (const [L, k] of [[this.FL, 'FL'], [this.FR, 'FR'], [this.RL, 'RL'], [this.RR, 'RR']]) { const v = p[k] || {}; set(L.sh, v.sh); set(L.kn, v.kn); set(L.pw, v.pw); }
    const bl = p.blink || 0; const lk = p.look || [0, 0];
    this.eyes.forEach((e, i) => { e.g.scale.set(1, Math.max(0.08, 1 - bl) * (p.eyeS || 1), 1); e.g.position.x = (i ? 1 : -1) * 0.62 + lk[0] * 0.06; e.g.position.y = 0.32 + lk[1] * 0.05; e.hl.visible = !p.dead; });
    const br = p.brow || 0; this.brows.forEach((b, i) => { const s = i ? 1 : -1; b.rotation.z = s * br * 0.45; b.position.y = 0.68 + (p.browH || 0) * 0.12; });
    r.updateMatrixWorld(true);
  }
  headWorld(off = [0, 0, 0]) { this.root.updateMatrixWorld(true); const v = new THREE.Vector3(...off); this.head.localToWorld(v); return [v.x, v.y, v.z]; }
  pawWorld(side = 'R') { this.root.updateMatrixWorld(true); const v = new THREE.Vector3(0, -0.2, 0.4); (side === 'R' ? this.FR : this.FL).pw.localToWorld(v); return [v.x, v.y, v.z]; }
}
// named bear poses (body pitch negative = front up)
export const BPOSE = {
  stand: { hy: 0.9, pitch: 0, neck: [0.1, 0, 0], head: [0.05, 0, 0], FL: { sh: [0, 0, 0], kn: [0, 0, 0] }, FR: { sh: [0, 0, 0], kn: [0, 0, 0] }, RL: { sh: [0, 0, 0], kn: [0, 0, 0] }, RR: { sh: [0, 0, 0], kn: [0, 0, 0] } },
  // the meme: lying back half, chest propped up on straight front legs, staring
  prop: { hy: -1.55, pitch: -0.62, neck: [0.32, 0, 0], head: [0.28, 0, 0], FL: { sh: [0.62, 0, 0.02], kn: [0, 0, 0], pw: [0, 0, 0] }, FR: { sh: [0.62, 0, -0.02], kn: [0, 0, 0], pw: [0, 0, 0] }, RL: { sh: [-1.45, 0, 0.25], kn: [0.2, 0, 0], pw: [1.4, 0, 0] }, RR: { sh: [-1.45, 0, -0.25], kn: [0.2, 0, 0], pw: [1.4, 0, 0] } },
  sit: { hy: -1.25, pitch: -1.22, neck: [0.55, 0, 0], head: [0.55, 0, 0], FL: { sh: [0.9, 0, 0.25], kn: [-0.6, 0, 0], pw: [0.3, 0, 0] }, FR: { sh: [0.9, 0, -0.25], kn: [-0.6, 0, 0], pw: [0.3, 0, 0] }, RL: { sh: [-0.4, 0, 0.45], kn: [-1.0, 0, 0], pw: [1.0, 0, 0] }, RR: { sh: [-0.4, 0, -0.45], kn: [-1.0, 0, 0], pw: [1.0, 0, 0] } },
  sitLean: { hy: -1.25, pitch: -0.85, neck: [0.55, 0, 0], head: [0.4, 0, 0], FL: { sh: [0.5, 0, 0.3], kn: [-0.8, 0, 0], pw: [0.3, 0, 0] }, FR: { sh: [0.5, 0, -0.3], kn: [-0.8, 0, 0], pw: [0.3, 0, 0] }, RL: { sh: [-0.4, 0, 0.45], kn: [-1.0, 0, 0], pw: [1.0, 0, 0] }, RR: { sh: [-0.4, 0, -0.45], kn: [-1.0, 0, 0], pw: [1.0, 0, 0] } },
  shrug: { hy: -1.25, pitch: -1.22, neck: [0.55, 0, 0.15], head: [0.5, 0, 0.12], FL: { sh: [-0.2, 0, 1.1], kn: [-1.5, 0, 0], pw: [0, 0, 0] }, FR: { sh: [-0.2, 0, -1.1], kn: [-1.5, 0, 0], pw: [0, 0, 0] }, RL: { sh: [-0.4, 0, 0.45], kn: [-1.0, 0, 0], pw: [1.0, 0, 0] }, RR: { sh: [-0.4, 0, -0.45], kn: [-1.0, 0, 0], pw: [1.0, 0, 0] } },
  wave: { hy: -1.25, pitch: -1.22, neck: [0.55, 0, 0], head: [0.55, 0, 0], FL: { sh: [0.9, 0, 0.25], kn: [-0.6, 0, 0], pw: [0.3, 0, 0] }, FR: { sh: [-1.5, 0, -0.6], kn: [-0.9, 0, 0], pw: [0, 0, 0] }, RL: { sh: [-0.4, 0, 0.45], kn: [-1.0, 0, 0], pw: [1.0, 0, 0] }, RR: { sh: [-0.4, 0, -0.45], kn: [-1.0, 0, 0], pw: [1.0, 0, 0] } },
  thumb: { hy: -1.25, pitch: -1.22, neck: [0.55, 0, 0], head: [0.5, 0, -0.1], FL: { sh: [0.9, 0, 0.25], kn: [-0.6, 0, 0], pw: [0.3, 0, 0] }, FR: { sh: [-0.4, 0, -0.2], kn: [-1.7, 0, 0], pw: [0, 0, 0] }, RL: { sh: [-0.4, 0, 0.45], kn: [-1.0, 0, 0], pw: [1.0, 0, 0] }, RR: { sh: [-0.4, 0, -0.45], kn: [-1.0, 0, 0], pw: [1.0, 0, 0] } },
};
export function bmix(A, B, k) {
  const o = { ...A };
  for (const key of new Set([...Object.keys(A), ...Object.keys(B)])) {
    const a = A[key], b = B[key];
    if (typeof a === 'number' || typeof b === 'number') o[key] = lerp(a || 0, b || 0, k);
    else if (Array.isArray(a) || Array.isArray(b)) { const za = a || [0, 0, 0], zb = b || [0, 0, 0]; o[key] = za.map((v, i) => lerp(v, zb[i], k)); }
    else if (a && typeof a === 'object' || b && typeof b === 'object') { const za = a || {}, zb = b || {}; o[key] = {}; for (const j of new Set([...Object.keys(za), ...Object.keys(zb)])) { const x = za[j] || [0, 0, 0], y = zb[j] || [0, 0, 0]; o[key][j] = x.map((v, i) => lerp(v, y[i], k)); } }
    else o[key] = k < 0.5 ? (a ?? b) : (b ?? a);
  }
  return o;
}
