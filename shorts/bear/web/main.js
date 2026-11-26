import { THREE, renderer, draw, W, H } from './core.js';
import { setupStory, frameState, captionChunk, overlayFx } from './story.js';
window.CAPTIONS = new URLSearchParams(location.search).get('captions') === '1';
let lastSt = {};
window.renderFrame = function (f) { const st = frameState(f); lastSt = st; draw(st); return st.shot; };
function capDraw(ctx, f) {
  const c = captionChunk(f / 30); if (!c) return;
  const solo = c.words.length === 1; let size = Math.round(W * (c.big ? 0.15 : solo ? 0.125 : 0.088)); ctx.font = `${size}px Lucky`;
  let widths = c.words.map(w => ctx.measureText(w).width); let gap = size * 0.26; let tot = widths.reduce((a, b) => a + b, 0) + gap * (c.words.length - 1);
  if (tot > W * 0.88) { size = Math.floor(size * W * 0.88 / tot); ctx.font = `${size}px Lucky`; widths = c.words.map(w => ctx.measureText(w).width); gap = size * 0.26; tot = widths.reduce((a, b) => a + b, 0) + gap * (c.words.length - 1); }
  const enter = Math.min(1, c.k0 / 0.08); const y = H * (c.y || 0.665);
  ctx.save(); ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; let x = W / 2 - tot / 2;
  c.words.forEach((w, i) => {
    const active = i === c.act; const pop = active ? 1 + 0.2 * Math.max(0, 1 - c.k / 0.09) : 1; const s = (0.7 + 0.3 * (1 - Math.pow(1 - enter, 3))) * pop;
    ctx.save(); ctx.translate(x + widths[i] / 2, y); ctx.scale(s, s); ctx.rotate(c.big ? -0.05 : solo ? -0.03 : 0);
    ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowOffsetY = size * 0.09; ctx.lineWidth = size * 0.24; ctx.strokeStyle = '#0b0710'; ctx.strokeText(w, -widths[i] / 2, 0);
    ctx.shadowColor = 'transparent';
    const col = c.color ? c.color : c.big ? '#FF3B3B' : solo ? '#7FE3FF' : (active ? '#FFE53E' : '#FFFFFF'); ctx.fillStyle = col; ctx.fillText(w, -widths[i] / 2, 0); ctx.restore();
    x += widths[i] + gap; });
  ctx.restore();
}
window.overlay = function (ctx, f, W, H) { const fx = overlayFx(f / 30); for (const d of fx) d(ctx, W, H); if (window.CAPTIONS) capDraw(ctx, f); };
const oc = document.createElement('canvas'); oc.width = W; oc.height = H; const octx = oc.getContext('2d');
window.grab = function (type = 'image/jpeg', q = 0.93, f = 0) { octx.drawImage(renderer.domElement, 0, 0); window.overlay(octx, f, W, H); return oc.toDataURL(type, q); };
window.ready = (async () => { try { const ff = new FontFace('Lucky', 'url(/node_modules/@fontsource/luckiest-guy/files/luckiest-guy-latin-400-normal.woff2)'); await ff.load(); document.fonts.add(ff); } catch (e) { console.log('font fail', e); } await setupStory(); window.renderFrame(0); return true; })();
