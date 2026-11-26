import { THREE, scene, renderer, plastic, P, glow, part, mesh, group, canvasTex, rgeo, clamp, lerp, hash, noise, PI, easeOut, back, spring, S } from './core.js';

// ---------- ice ----------
const crackTex = canvasTex(256, 512, (c, w, h) => { c.fillStyle = '#000'; c.fillRect(0, 0, w, h); c.strokeStyle = '#fff'; c.lineCap = 'round';
  for (let i = 0; i < 26; i++) { c.lineWidth = 1 + hash(i) * 3; let x = hash(i * 3) * w, y = hash(i * 5) * h; c.beginPath(); c.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (hash(i * 7 + k) - 0.5) * 90; y += (hash(i * 11 + k) - 0.5) * 120; c.lineTo(x, y); } c.stroke(); }
  for (let i = 0; i < 60; i++) { c.fillStyle = `rgba(255,255,255,${0.3 + hash(i) * 0.7})`; c.fillRect(hash(i + 3) * w, hash(i + 9) * h, 3, 3); } }, false);
export const ICE = new THREE.MeshStandardMaterial({ color: '#bfe8ff', roughness: 0.06, metalness: 0.1, transparent: true, opacity: 0.32, emissive: '#bfeaff', emissiveMap: crackTex, emissiveIntensity: 0.45, envMapIntensity: 3, depthWrite: false, side: THREE.DoubleSide });
const ICE_SOLID = new THREE.MeshStandardMaterial({ color: '#d8f2ff', roughness: 0.1, metalness: 0.1, envMapIntensity: 2.5, emissive: '#4aa0d0', emissiveIntensity: 0.15 });
export class IceBlock {
  // attaches to a rig root (local coords), size in rig units
  constructor(parent, w = 2.9, h = 6.9, d = 2.0) {
    this.g = group([0, 0, 0], parent); this.inner = group([0, 0, 0], this.g);
    const m = new THREE.Mesh(rgeo(w, h, d, 0.35), ICE); m.position.y = h / 2; m.renderOrder = 5; m.castShadow = false; this.inner.add(m); this.m = m;
    this.shardsBase = []; for (let i = 0; i < 9; i++) { const a = i / 9 * PI * 2 + hash(i) * 0.5; const s = mesh(new THREE.ConeGeometry(0.35 + hash(i) * 0.3, 1.4 + hash(i + 4) * 1.6, 5), ICE_SOLID, [Math.cos(a) * (w * 0.55), 0.5, Math.sin(a) * (d * 0.6)], this.inner, [Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35]); this.shardsBase.push(s); }
    this.h = h; this.g.visible = false;
  }
  // k: 0..1 freeze growth (with overshoot), shatter: 0..1
  update(k, t = 0) {
    if (k <= 0.001) { this.g.visible = false; return; } this.g.visible = true;
    const g = clamp(k); const y = back(g); this.inner.scale.set(1 + 0.08 * Math.sin(g * PI), Math.max(0.01, y), 1 + 0.08 * Math.sin(g * PI));
    this.inner.position.x = g < 1 ? (hash(Math.floor(t * 60)) - 0.5) * 0.06 * (1 - g) : 0;
  }
}
// ice shards burst (shatter)
const shards = []; for (let i = 0; i < 90; i++) { const s = new THREE.Mesh(rgeo(0.5, 0.5, 0.5, 0.05), ICE_SOLID); s.visible = false; s.castShadow = false; scene.add(s); shards.push(s); }
let shI = 0; export function resetFx() { shI = 0; for (const s of shards) s.visible = false; spI = 0; for (const s of sprites) s.visible = false; }
export function shatter(center, t, t0, n = 14, R = 1, seed = 0, size = 1) { const k = t - t0; if (k < 0 || k > 1.6) return; for (let i = 0; i < n && shI < shards.length; i++) { const s = shards[shI++]; const a = hash(i + seed) * PI * 2; const sp = (3 + hash(i + seed + 5) * 6) * R; const vy = 4 + hash(i + seed + 9) * 7;
  s.visible = true; s.position.set(center[0] + Math.cos(a) * sp * k, Math.max(0.2, center[1] + hash(i + 3) * 4 + vy * k - 9.8 * k * k), center[2] + Math.sin(a) * sp * k); s.rotation.set(k * 9 + i, k * 7, i); s.scale.setScalar(size * (0.5 + hash(i + seed + 2)) * (1 - S(1.0, 1.6, k))); } }
// sprites: sparkles, question marks, icons
const sparkTex = canvasTex(128, 128, (c) => { c.translate(64, 64); const g = c.createRadialGradient(0, 0, 0, 0, 0, 40); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(180,230,255,0)'); c.fillStyle = g; c.fillRect(-64, -64, 128, 128); c.fillStyle = '#fff'; c.beginPath(); for (let i = 0; i < 8; i++) { const r = i % 2 ? 8 : 60; const a = i / 8 * PI * 2; c.lineTo(Math.sin(a) * r, -Math.cos(a) * r); } c.fill(); });
const qTex = canvasTex(256, 256, (c) => { c.font = '900 220px "DejaVu Sans"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 22; c.strokeStyle = '#1b1418'; c.strokeText('?', 128, 138); c.fillStyle = '#ffd23f'; c.fillText('?', 128, 138); });
export const TEX = { spark: sparkTex, q: qTex };
const sprites = []; for (let i = 0; i < 200; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: sparkTex, transparent: true, depthWrite: false, fog: false })); s.visible = false; scene.add(s); sprites.push(s); }
let spI = 0;
export function sprite(tex, pos, size, op = 1, rot = 0, color = '#ffffff', add = false, gain = 1) { if (spI >= sprites.length) return; const s = sprites[spI++]; s.material.map = tex; s.material.blending = add ? THREE.AdditiveBlending : THREE.NormalBlending; s.material.color.set(color).multiplyScalar(gain); s.material.opacity = op; s.material.rotation = rot; s.position.set(...pos); s.scale.setScalar(size); s.visible = op > 0.01; s.material.needsUpdate = true; }
export function sparkBurst(c, t, t0, n = 20, R = 3, dur = 1.0, seed = 0, color = '#cfefff') { const k = (t - t0) / dur; if (k < 0 || k > 1) return; for (let i = 0; i < n; i++) { const a = hash(i + seed) * PI * 2, b = (hash(i + seed + 40) - 0.2) * 1.8; const r = R * easeOut(k) * (0.4 + hash(i + seed + 7) * 0.6); sprite(sparkTex, [c[0] + Math.cos(a) * r, c[1] + b * r * 0.7, c[2] + Math.sin(a) * r], 0.6 * (1 - k * 0.5), 1 - k, k * 4 + i, color, true, 2.5); } }
export function qmark(pos, t, t0, s = 1.3, seed = 0) { const k = t - t0; if (k < 0) return; const pop = back(clamp(k / 0.3)); sprite(qTex, [pos[0], pos[1] + Math.sin(t * 3 + seed) * 0.12, pos[2]], s * pop, 1, Math.sin(t * 2.5 + seed) * 0.2, '#ffffff', false, 1.4); }
// ---------- phone ----------
export class Phone {
  constructor() {
    this.g = group([0, 0, 0]); this.g.visible = false;
    part(0.82, 1.62, 0.1, plastic('#15161c', { rough: 0.25, metal: 0.3 }), [0, 0, 0], 0.08, this.g);
    this.tex = canvasTex(540, 1080, () => {});
    this.screen = mesh(new THREE.PlaneGeometry(0.74, 1.5), new THREE.MeshBasicMaterial({ map: this.tex, color: new THREE.Color(1.5, 1.5, 1.5), toneMapped: false }), [0, 0, 0.056], this.g); this.screen.castShadow = false;
    this.photoRT = new THREE.WebGLRenderTarget(512, 512, { type: THREE.HalfFloatType });
    this.photo = mesh(new THREE.PlaneGeometry(0.66, 0.66), new THREE.MeshBasicMaterial({ map: this.photoRT.texture, color: new THREE.Color(1.15, 1.15, 1.15) }), [0, -0.12, 0.058], this.g); this.photo.castShadow = false;
    this.photoCam = new THREE.PerspectiveCamera(45, 1, 0.1, 1500);
  }
  drawPost(o) { // o: {user, time, text, likes, buzz, glitch}
    const c = this.tex.userData.ctx, w = 540, h = 1080;
    c.fillStyle = '#0d0f14'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#fff'; c.font = '600 26px "DejaVu Sans"'; c.textAlign = 'left'; c.fillText('9:41', 30, 40); c.textAlign = 'right'; c.fillText('▮▮▮ 12%', w - 30, 40);
    c.fillStyle = '#2b2f3a'; c.beginPath(); c.arc(68, 120, 36, 0, 7); c.fill(); c.fillStyle = '#e8eef8'; c.beginPath(); c.arc(68, 112, 16, 0, 7); c.fill(); c.beginPath(); c.arc(68, 148, 26, PI, 2 * PI); c.fill();
    c.textAlign = 'left'; c.fillStyle = '#fff'; c.font = '700 30px "DejaVu Sans"'; c.fillText(o.user || '@unknown', 120, 112); c.fillStyle = '#8b93a5'; c.font = '500 24px "DejaVu Sans"'; c.fillText(o.time || '', 120, 146);
    c.fillStyle = '#fff'; c.font = '600 33px "DejaVu Sans"'; const words = (o.text || '').split(' '); let line = '', y = 222; for (const wd of words) { const tl = line + wd + ' '; if (c.measureText(tl).width > w - 60) { c.fillText(line, 30, y); line = wd + ' '; y += 44; } else line = tl; } c.fillText(line, 30, y);
    c.fillStyle = '#ff4d6d'; c.font = '700 30px "DejaVu Sans"'; c.fillText('♥ ' + (o.likes || '3.1M'), 30, h - 150); c.fillStyle = '#8b93a5'; c.fillText('💬 ' + (o.comments || '371K'), 230, h - 150);
    if (o.banner) { c.fillStyle = '#ff3b3b'; c.beginPath(); c.roundRect(30, h - 110, w - 60, 70, 18); c.fill(); c.fillStyle = '#fff'; c.font = '800 30px "DejaVu Sans"'; c.textAlign = 'center'; c.fillText(o.banner, w / 2, h - 64); }
    this.tex.needsUpdate = true;
  }
  shoot(cam) { const old = renderer.getRenderTarget(); renderer.setRenderTarget(this.photoRT); renderer.setClearColor('#000'); renderer.clear(); renderer.render(scene, cam); renderer.setRenderTarget(old); }
}
// poof cloud (transformations)
const puffTex = canvasTex(128, 128, (c) => { const g = c.createRadialGradient(64, 64, 4, 64, 64, 62); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.6, 'rgba(250,250,255,0.9)'); g.addColorStop(1, 'rgba(240,240,255,0)'); c.fillStyle = g; c.beginPath(); c.arc(64, 64, 62, 0, 7); c.fill(); });
TEX.puff = puffTex;
export function poof(c, t, t0, s = 1, seed = 0, dur = 0.7) { const k = (t - t0) / dur; if (k < 0 || k > 1) return; for (let i = 0; i < 16; i++) { const a = hash(i + seed) * PI * 2, b = (hash(i + seed + 9) - 0.4) * 1.6; const r = s * (0.4 + 2.2 * easeOut(k)) * (0.5 + hash(i + seed + 3) * 0.6); sprite(puffTex, [c[0] + Math.cos(a) * r, c[1] + b * r * 0.6, c[2] + Math.sin(a) * r], s * (1.2 + 1.6 * easeOut(k)) * (0.6 + hash(i) * 0.6), 1 - k * k, 0, '#ffffff', false, 1.6); } }
