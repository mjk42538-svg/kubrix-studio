import { THREE, scene, camera, PI } from './core.js';
import * as WD from './mworld.js';
import { makeCast } from './cast.js';
import { act } from './anim.js';
let C;
export async function setupStory() { C = makeCast(); }
export function frameState(f) {
  for (const r of C.all) r.hide(); const t = f / 30; const v = Math.floor(f / 30);
  WD.updateSea(t); WD.updateWater(t);
  if (v === 0) { WD.setLight('morning', [0, 30, 0]); act(C.wk, t, { pos: [3, 30.6, 4], yaw: -0.4, keys: [[0, 'cheer']], faces: [[0, 'joy']] }); act(C.wkS, t, { pos: [-2, 30.6, 6], yaw: 0.3, faces: [[0, 'shock']] }); C.mk.forEach((m, i) => act(m, t, { pos: [-6 + i * 2.5, 30.3, 9], yaw: 0, faces: [[0, 'happy']] })); camera.position.set(0, 35, 22); camera.fov = 46; camera.lookAt(0, 33, 0); }
  else if (v === 1) { WD.setLight('day', [0, 0, 98]); camera.position.set(6, 6, 135); camera.fov = 50; camera.lookAt(0, 12, 95); }
  else if (v === 2) { WD.setLight('cave', [200, 0, 0]); WD.lamp(0, [200, 8, 14], '#cfefff', 60, 40); act(C.wk, t, { pos: [200, 0, 2], yaw: 0, keys: [[0, 'cheer']], faces: [[0, 'joy']] }); camera.position.set(203, 7, 14); camera.fov = 50; camera.lookAt(200, 6, -6); }
  else if (v === 3) { const H = WD.HEAV; WD.setLight('heaven', H); act(C.jade, t, { pos: [H[0], H[1] + 1.0, H[2] - 10.6], yaw: 0, keys: [[0, 'sit']], faces: [[0, 'neutral']] }); act(C.off[0], t, { pos: [H[0] - 5, H[1] + 1.0, H[2] - 6], yaw: 0.4 }); camera.position.set(H[0] + 4, H[1] + 7, H[2] + 6); camera.fov = 46; camera.lookAt(H[0], H[1] + 5, H[2] - 10); }
  else { const T = WD.TEM; WD.setLight('misty', T); act(C.sub, t, { pos: [T[0], 1, T[2] - 9], yaw: 0, faces: [[0, 'neutral']] }); act(C.wkR, t, { pos: [T[0] + 2, 0, T[2] - 3], yaw: PI + 0.3, faces: [[0, 'happy']] }); C.stu.forEach((s, i) => act(s, t, { pos: [T[0] - 4 + i * 2.5, 0, T[2] - 1], yaw: PI })); camera.position.set(T[0] + 3, 6, T[2] + 8); camera.fov = 46; camera.lookAt(T[0], 4.5, T[2] - 6); }
  WD.updatePetals(t, v === 0 || v === 1);
  return { time: t, aperture: 0.3, focus: 14, bloom: 0.5 };
}
export function captionChunk() { return null; }
export function overlayFx() { return []; }
