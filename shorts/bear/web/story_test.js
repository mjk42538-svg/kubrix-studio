// look test
import { THREE, scene, camera, PI, lerp } from './core.js';
import * as WD from './world.js';
import { Rig } from './rig.js';
import { Bear, BPOSE } from './bear.js';
import { act } from './anim.js';
import * as FX from './fx.js';
let C = {};
export async function setupStory() {
  C.benny = new Rig({ skin: '#F2C9A0', shirt: '#3FA7D6', pants: '#2F3B57', shoes: '#E0453A', soles: '#ffffff', hair: 'messy', hairColor: '#6B3A22', streak: '#2EE6C9', scarf: '#E0453A', stripe: '#ffffff', badge: '#FFD23F', freckles: true, blush: 0.5 });
  C.hen = new Rig({ skin: '#E8B796', shirt: '#2f7a46', sweater: '#c42b2b', pants: '#5a4632', shoes: '#3a2a20', hair: 'bald', hairColor: '#8a8a90', mustache: '#8a8a90', longSleeves: true, scale: 1.05 });
  C.mayor = new Rig({ skin: '#F0C8A8', shirt: '#ffffff', jacket: '#2a2350', tie: '#c42b2b', pants: '#2a2350', shoes: '#111', hair: 'toupee', hairColor: '#e0b040', sideColor: '#c9c9cf', sash: '#d4a017', longSleeves: true, cuffs: '#2a2350', scale: 1.12 });
  C.teach = new Rig({ skin: '#C68E6A', shirt: '#b06ab3', pants: '#3a3550', shoes: '#222', hair: 'bun', hairColor: '#2b1d14', glasses: '#2b2b33', longSleeves: true });
  C.dad = new Rig({ skin: '#F2C9A0', shirt: '#7a7f8a', hoodie: true, pocket: '#6a6f7a', pants: '#3a4a6a', shoes: '#eeeeee', hair: 'cap', capColor: '#2e5a8a', hairColor: '#6B3A22', stubble: true, longSleeves: true, scale: 1.08 });
  C.bear = new Bear({ scale: 1.0 });
}
export function frameState(f) {
  const t = f / 30; FX.resetFx();
  WD.setLight('night', [0, 0, -10]);
  WD.lamp(0, [-8, 7, -8], '#ffb35c', 60, 30); WD.lamp(1, [8, 7, -4], '#ffb35c', 60, 30);
  const xs = [-6, -3, 0, 3, 6];
  act(C.hen, t, { pos: [-6, 0, -10], yaw: 0.3, keys: [[0, 'hips']], faces: [[0, 'smug']] });
  act(C.mayor, t, { pos: [-3, 0, -11], yaw: 0.15, keys: [[0, 'point']], faces: [[0, 'proud']] });
  act(C.benny, t, { pos: [0, 0, -8], yaw: 0, keys: [[0, 'headHands']], faces: [[0, 'panic']] });
  act(C.teach, t, { pos: [3, 0, -11], yaw: -0.15, keys: [[0, 'present']], faces: [[0, 'happy']] });
  act(C.dad, t, { pos: [6, 0, -10], yaw: -0.3, keys: [[0, 'phone']], faces: [[0, 'deadpan']] });
  C.bear.apply({ ...BPOSE.prop, pos: [0, 0, -24], yaw: 0, blink: 0 });
  const v = Math.floor(f / 30);
  if (v === 0) { camera.position.set(10, 14, 22); camera.fov = 50; camera.lookAt(0, 3, -15); }
  else if (v === 1) { camera.position.set(3, 7, -10); camera.fov = 40; camera.lookAt(0, 6, -24); }
  else if (v === 2) { camera.position.set(0, 4.8, -4.5); camera.fov = 30; camera.lookAt(0, 5.5, -8); }
  else if (v === 3) { WD.setLight('warm', [300, 0, 0]); WD.lamp(0, [300, 13, 0], '#ffe2b8', 120, 40); C.teach.apply({ pos: [303, 0, -8], yaw: 0.3 }); camera.position.set(306, 7, 12); camera.fov = 50; camera.lookAt(300, 6, -8); }
  else { WD.setLight('warm', [400, 0, 0]); WD.lamp(0, [392, 7, -8], '#ffcf8a', 80, 30); act(C.dad, t, { pos: [400, 0, -7.2], yaw: 0, keys: [[0, 'sit'], [0, 'phone']], faces: [[0, 'deadpan']] }); C.bear.apply({ ...BPOSE.sit, pos: [409, -3, -17], yaw: 0 }); camera.position.set(403, 6, 6); camera.fov = 50; camera.lookAt(402, 5, -8); }
  WD.updateSnow(t);
  return { time: t, aperture: 1.2, focus: 16, bloom: 0.6 };
}
export function captionChunk() { return null; }
export function overlayFx() { return []; }
