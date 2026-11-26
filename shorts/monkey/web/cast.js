import { THREE } from './core.js';
import { Rig } from './rig.js';
import * as FX from './fx.js';
export function makeCast() {
  const C = {};
  const MK = (o) => new Rig({ monkey: true, ...o });
  C.wkS = MK({ skin: '#a5a098', mask: '#c9c4bb', shirt: '#a5a098', pants: '#a5a098', shoes: '#a5a098', scale: 0.8, seed: 1, browCol: '#6a665f' });
  C.wk = MK({ skin: '#c98a3a', mask: '#f2d2a4', shirt: '#c98a3a', pants: '#c98a3a', shoes: '#b07a32', belt2: '#4f9a3a', scale: 0.92, seed: 2, browCol: '#5a3412' });
  C.wkR = MK({ skin: '#c98a3a', mask: '#f2d2a4', shirt: '#b0302a', longSleeves: true, cuffs: '#e0b040', belt2: '#e0b040', pants: '#3a2a20', shoes: '#2a1a10', collar: '#e0b040', scale: 0.92, seed: 3, browCol: '#5a3412' });
  const FUR = ['#b07a3a', '#8a5a2c', '#d09a50', '#a06a30', '#c08040', '#7a4a28'];
  C.mk = FUR.map((f, i) => MK({ skin: f, mask: '#efd0a6', shirt: f, pants: f, shoes: f, scale: 0.66 + (i % 3) * 0.05, seed: 10 + i, scarf: i === 2 ? '#e0453a' : null, browCol: '#4a2a10' }));
  C.old = MK({ skin: '#a39a90', mask: '#d8ccbc', shirt: '#a39a90', pants: '#a39a90', shoes: '#8a8278', wrinkles: true, scale: 0.68, seed: 20, browCol: '#e8e8e8' });
  C.jade = new Rig({ skin: '#f0c8a8', shirt: '#e8b830', longSleeves: true, robe: '#e8b830', robeTrim: '#b8222a', pants: '#e8b830', shoes: '#b8222a', jadeCrown: true, longBeard: '#1a1a1a', mustache: '#1a1a1a', hair: 'buzz', hairColor: '#1a1a1a', scale: 1.1, seed: 30, cuffs: '#b8222a' });
  C.sub = new Rig({ skin: '#ecc8a8', shirt: '#5a6a8a', longSleeves: true, robe: '#5a6a8a', robeTrim: '#d8c8a0', pants: '#5a6a8a', shoes: '#2a2a2a', hair: 'bald', hairColor: '#f0f0f0', topknot: '#f0f0f0', longBeard: '#f4f4f4', mustache: '#f4f4f4', wrinkles: true, browCol: '#f4f4f4', scale: 1.05, seed: 31, belt2: '#d8c8a0' });
  C.stu = [0, 1, 2].map(i => new Rig({ skin: ['#f2c9a0', '#c68e6a', '#e8b796'][i], shirt: '#8a8a8a', longSleeves: true, robe: '#8a8a8a', pants: '#8a8a8a', shoes: '#2a2a2a', hair: 'bun', hairColor: '#1a1a1a', seed: 40 + i, belt2: '#4a4a4a' }));
  C.off = [0, 1].map(i => new Rig({ skin: '#f0c8a8', shirt: ['#2a4a8a', '#8a2a4a'][i], longSleeves: true, robe: ['#2a4a8a', '#8a2a4a'][i], pants: '#222', shoes: '#111', hair: 'cap', capColor: '#111', hairColor: '#111', seed: 50 + i }));
  C.all = [C.wkS, C.wk, C.wkR, ...C.mk, C.old, C.jade, C.sub, ...C.stu, ...C.off];
  for (const r of C.all) r.ice = null;
  return C;
}
