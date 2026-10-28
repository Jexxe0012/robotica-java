// Second round: variations on the four-legged robot cat (concept C), 57 × 57 logical pixels each.
import {Pix} from './pix.mjs';
import {mkdirSync} from 'node:fs';

const W = 57;
const L = () => new Pix(W, W);

// b = body plating, s = secondary plating, v = visor, g = glow, a = accent.
const cream = {
  ink: '#0b1d22',
  b0: '#fbf5d6', b1: '#ece2b4', b2: '#c9bd88', b3: '#9c9160',
  s0: '#b3ad63', s1: '#8f8b4b', s2: '#6a6838', s3: '#45462a',
  v0: '#1f5f62', v1: '#14474c', v2: '#0d3238',
  eye: '#f6dc3c', eyeHi: '#fff6ad',
  g0: '#a6f3e2', g1: '#35b9aa', g2: '#15786f',
  a0: '#f3c676', a1: '#d59b48', a2: '#9a6a2c',
  nose: '#e38d79', nose2: '#b55f51', earIn: '#d59b48', earIn2: '#9a6a2c'
};
const brass = {
  ...cream, ink: '#1c110b',
  b0: '#fdf0b8', b1: '#efd27c', b2: '#cba64a', b3: '#96742a',
  s0: '#e3a273', s1: '#bb7140', s2: '#8c4b27', s3: '#572a10',
  a0: '#f08a72', a1: '#c4503f', a2: '#832c25',
  nose: '#8c4b27', nose2: '#572a10', earIn: '#8c4b27', earIn2: '#572a10'
};
const lunar = {
  ...cream, ink: '#161230',
  b0: '#f8f5ff', b1: '#dcd5f2', b2: '#b3a9d8', b3: '#8176b0',
  s0: '#a094d6', s1: '#7868b8', s2: '#56498e', s3: '#372e60',
  v0: '#3d3478', v1: '#241d4a', v2: '#181336',
  eye: '#ffd95a', eyeHi: '#fff6c8',
  g0: '#fff3b0', g1: '#ffd95a', g2: '#d59b48',
  a0: '#ffe9a0', a1: '#f0c04f', a2: '#b88a2c',
  nose: '#eaa7ca', nose2: '#b66f98', earIn: '#eaa7ca', earIn2: '#b66f98'
};
const jade = {
  ...cream,
  b0: '#f3f9de', b1: '#d5e9b9', b2: '#a5c892', b3: '#6f9a6d',
  s0: '#82cda3', s1: '#4f9a76', s2: '#35705a', s3: '#1f4636',
  v0: '#2a5a66', v1: '#143a45', v2: '#0c2830'
};

const EAR = ['..o.......', '.ooo......', '.oooo.....', '.oiioo....', 'ooiiioo...', 'ooiiiioo..', 'ooiiiiioo.', 'oooiiiiooo', 'oooooooooo'];
const EAR_TALL = ['.o........', '.oo.......', '.ooo......', '.oioo.....', 'ooiioo....', 'ooiiioo...', 'ooiiiioo..', 'ooiiiiioo.', 'ooiiiiioo.', 'oooiiiiooo', 'oooooooooo'];
const EAR_WIDE = ['...o.......', '..ooo......', '..oooo.....', '.ooiioo....', '.oiiiioo...', 'ooiiiiioo..', 'ooiiiiiioo.', 'ooiiiiiiioo', 'oooiiiiiooo', 'ooooooooooo', 'ooooooooooo'];

function tipStamp(p, P, tip) {
  if (tip === 'lantern') p.stamp(48, 28, ['..kkk..', '..k.k..', '.kkkkk.', 'kYyyYYk', 'kyyyYYk', 'kYyYYak', 'kYYYaak', '.kkkkk.'], {k: P.s3, y: P.eyeHi, Y: P.a0, a: P.a1});
  else if (tip === 'star') p.stamp(48, 30, ['...y...', '...Y...', '..YYY..', 'yYYYYYy', '..YYY..', '...Y...', '...y...'], {y: P.a0, Y: P.a1});
  else p.stamp(49, 32, ['..l..', '.llt.', 'lltTT', '.tTT.', '..T..'], {l: P.g0, t: P.g1, T: P.g2});
}
function charm(p, P, y, kind) {
  if (kind === 'star') p.stamp(26, y, ['..y..', '.yYy.', 'yYYYy', '.yYy.', '..y..'], {y: P.a0, Y: P.a1});
  else p.stamp(26, y, ['..l..', '.llt.', 'lltTT', '.tTT.', '..T..'], {l: P.g0, t: P.g1, T: P.g2});
}
function catFace(p, P, y, line) {
  p.rect(27, y, 3, 1, P.nose).px(28, y + 1, P.nose2);
  for (const [dx, dy] of [[0, 2], [-3, 2], [3, 2], [-2, 3], [-1, 3], [1, 3], [2, 3]]) p.px(28 + dx, y + dy, line);
}
function whiskers(p, P, x, y) {
  for (const [dx, dy] of [[0, 0], [-1, 0], [-2, -1], [-3, -1], [0, 3], [-1, 3], [-2, 4], [-3, 4]]) { p.px(x + dx, y + dy, P.b2); p.px(W - 1 - x - dx, y + dy, P.b2); }
}
function lens(head, P, cy) {
  // Left lens only; the caller mirrors and then adds one-sided highlights with lensLight().
  head.ellipse(20, cy, 4.6, 4.6, P.s3).ellipse(20, cy, 3.4, 3.4, P.g1).rect(20, cy - 2, 1, 5, P.ink);
}
function lensLight(head, P, cy) {
  for (const x of [18, 34]) head.px(x, cy - 2, P.g0).px(x + 1, cy - 3, P.g0).px(x, cy - 1, P.g0).px(x + 3, cy + 2, P.g2).px(x + 4, cy + 1, P.g2).px(x + 3, cy + 3, P.g2);
}

// Each head returns its layer and where the wire whiskers start.
const heads = {
  visor(P, o) {
    const head = L(), ear = o.ears === 'tall' ? EAR_TALL : EAR;
    head.stamp(13, o.ears === 'tall' ? -1 : 1, ear, {o: P.s1, i: P.earIn});
    head.rrect(12, 8, 33, 21, 4, P.b1).swap(P.b1, P.s1, 12, 8, 33, 4);
    head.rrect(15, 14, 27, 9, 2, P.v1);
    if (o.eyes === 'square') head.rect(19, 16, 5, 5, P.eye);
    else head.rrect(19, 15, 5, 7, 1, P.eye).rect(21, 16, 1, 5, P.v2);
    head.mirror();
    head.swap(P.s1, P.s0, 12, 8, 33, 1).swap(P.b1, P.b0, 12, 12, 2, 12).swap(P.b1, P.b2, 43, 12, 2, 17).swap(P.b1, P.b2, 12, 27, 33, 2);
    head.swap(P.v1, P.v2, 15, 14, 27, 1).px(37, 16, P.v0).px(38, 16, P.v0).px(39, 17, P.v0);
    head.px(20, 16, P.eyeHi).px(34, 16, P.eyeHi);
    head.swap(P.s1, P.s0, 13, 0, 3, 8).swap(P.earIn, P.earIn2, 34, 0, 11, 9);
    if (o.mark === 'moon') head.stamp(27, 8, ['.YY', 'YY.', 'YY.', '.YY'], {Y: P.a1}).px(27, 9, P.a0);
    catFace(head, P, 24, P.b3);
    return {head, whisk: [10, 24]};
  },
  crt(P) {
    const head = L();
    head.stamp(11, 0, EAR, {o: P.s1, i: P.earIn});
    head.rrect(9, 8, 39, 22, 3, P.s1).rrect(12, 10, 33, 18, 2, P.b1).rrect(15, 12, 27, 14, 2, P.v1);
    head.rrect(19, 14, 5, 6, 1, P.eye).rect(21, 15, 1, 4, P.v2);
    head.mirror();
    head.swap(P.s1, P.s0, 9, 8, 39, 1).swap(P.s1, P.s0, 9, 8, 1, 18).swap(P.s1, P.s2, 9, 28, 39, 2).swap(P.s1, P.s2, 46, 10, 2, 20);
    head.swap(P.b1, P.b0, 12, 10, 33, 1).swap(P.b1, P.b0, 12, 10, 1, 17).swap(P.b1, P.b2, 12, 27, 33, 1).swap(P.b1, P.b2, 44, 11, 1, 17);
    head.swap(P.v1, P.v2, 15, 12, 27, 1).swap(P.v1, P.v2, 15, 12, 1, 14).px(37, 14, P.v0).px(38, 14, P.v0).px(39, 15, P.v0).px(39, 16, P.v0);
    head.px(20, 15, P.eyeHi).px(34, 15, P.eyeHi);
    head.swap(P.s1, P.s0, 11, 0, 3, 7).swap(P.earIn, P.earIn2, 35, 0, 11, 8);
    catFace(head, P, 20, P.eye);
    return {head, whisk: [7, 21], neckY: 30};
  },
  round(P) {
    const head = L();
    head.stamp(10, -1, EAR_WIDE, {o: P.s1, i: P.nose});
    head.ellipse(28, 20, 17, 11.5, P.b1);
    head.rect(28, 10, 1, 4, P.s1).rect(24, 11, 1, 3, P.s1);
    lens(head, P, 21);
    head.px(13, 21, P.b3).px(15, 27, P.b3);
    head.mirror();
    head.crescent(P.b1, P.b2, 26, 18, 17, 11.5).crescent(P.b1, P.b0, 30, 22, 17, 11.5);
    head.swap(P.s1, P.s0, 10, 0, 3, 8).swap(P.nose, P.nose2, 36, 0, 12, 9);
    lensLight(head, P, 21);
    catFace(head, P, 25, P.s3);
    return {head, whisk: [10, 24]};
  },
  goggles(P) {
    const head = L(), ring = '#bb7141';
    head.stamp(13, 1, EAR, {o: P.s1, i: P.earIn});
    head.rrect(12, 8, 33, 21, 4, P.b1).swap(P.b1, P.s1, 12, 8, 33, 3);
    head.rect(12, 16, 16, 3, P.s3);
    head.ellipse(20, 17, 5.3, 5.3, ring).ellipse(20, 17, 3.7, 3.7, P.g1).rect(20, 15, 1, 5, P.ink);
    head.px(15, 26, P.b3);
    head.mirror();
    for (const cx of [20, 36]) for (let y = 11; y <= 23; y++) for (let x = cx - 6; x <= cx + 6; x++) if (head.get(x, y) === ring) { const d = x - cx + y - 17; head.px(x, y, d <= -4 ? P.s0 : d >= 4 ? P.s2 : P.s1); }
    head.swap(P.s1, P.s0, 12, 8, 33, 1).swap(P.b1, P.b0, 12, 11, 2, 5).swap(P.b1, P.b2, 43, 19, 2, 10).swap(P.b1, P.b2, 12, 27, 33, 2);
    for (const x of [18, 34]) head.px(x, 15, P.g0).px(x + 1, 14, P.g0).px(x, 16, P.g0).px(x + 3, 19, P.g2).px(x + 4, 18, P.g2).px(x + 3, 20, P.g2);
    head.swap(P.s1, P.s0, 13, 1, 3, 7).swap(P.earIn, P.earIn2, 34, 1, 11, 8);
    catFace(head, P, 23, P.b3);
    return {head, whisk: [10, 24]};
  }
};

function neckLayer(P, o, y) {
  const n = L();
  if (o.neck === 'scarf') {
    n.rrect(17, y, 23, 6, 2, P.a1).rect(19, y, 19, 2, P.a0).rect(19, y + 5, 19, 1, P.a2);
    n.rect(16, y + 5, 5, 8, P.a1).rect(20, y + 6, 1, 7, P.a2).rect(16, y + 5, 1, 7, P.a0).px(18, y + 12, null).px(18, y + 11, null);
    n.rect(17, y + 3, 4, 3, P.a0);
  } else {
    n.rrect(19, y, 19, 3, 1, P.a1).rect(20, y, 17, 1, P.a0);
    charm(n, P, y + 2, o.charm);
  }
  return n;
}

// Sitting cat: tail, haunches, chest, front legs, neckwear, head.
function sitting(P, o = {}) {
  const rings = i => (i % 5 === 4 ? P.s3 : i % 5 === 0 ? P.s0 : P.s1);
  const lined = l => l.outline(P.ink);
  const out = L();

  if (o.key) {
    const key = L();
    const [k0, k1, k2] = o.gold ? [P.a0, P.a1, P.a2] : [P.s0, P.s1, P.s2];
    key.rect(10, 37, 9, 2, k2).rrect(4, 32, 7, 12, 2, k1).rect(6, 34, 3, 3, P.ink).rect(6, 39, 3, 3, P.ink);
    key.swap(k1, k0, 4, 32, 7, 2).swap(k1, k2, 4, 42, 7, 2).rect(10, 37, 9, 1, k1);
    out.blit(lined(key));
  }

  const tail = L().tube([[40, 51], [46, 52], [50, 49], [51, 44], [49, 40], [50, 37]], 3, rings);
  tipStamp(tail, P, o.tip);
  out.blit(lined(tail));

  const hind = L();
  hind.ellipse(18, 47, 6, 6.5, P.s1).rrect(13, 51, 8, 3, 1, P.b1).rect(14, 51, 6, 1, P.b0).px(15, 53, P.b3).px(17, 53, P.b3);
  if (o.stripes) hind.rect(14, 44, 4, 1, P.s2).rect(13, 47, 4, 1, P.s2);
  if (o.gear && o.gold) { for (const [dx, dy] of [[0, -2], [0, 2], [-2, 0], [2, 0]]) hind.px(15 + dx, 47 + dy, P.a1); hind.rect(14, 46, 3, 3, P.a1).px(14, 46, P.a0).px(16, 48, P.a2).px(15, 47, P.s3); }
  else if (o.gear) { for (const [dx, dy] of [[0, -4], [0, 4], [-4, 0], [4, 0], [-3, -3], [3, -3], [-3, 3], [3, 3]]) hind.px(18 + dx, 46 + dy, o.gold ? P.a2 : P.b2); hind.ellipse(18, 46, 3, 3, o.gold ? P.a1 : P.b1).ellipse(18, 46, 1.2, 1.2, P.s3).px(18, 46, o.gold ? P.a0 : P.b0); }
  hind.mirror();
  hind.crescent(P.s1, P.s0, 19.5, 48.5, 6, 6.5).swap(P.s1, P.s2, 38, 50, 8, 4);
  out.blit(lined(hind));

  const chest = L();
  chest.ellipse(28, 41, 10.5, 12.5, P.b1).crescent(P.b1, P.b2, 26.5, 39.5, 10.5, 12.5);
  out.blit(lined(chest));

  const front = L();
  front.rect(23, 40, 5, 11, P.b0).rrect(22, 50, 6, 4, 1, P.b0).px(24, 53, P.b3).px(26, 53, P.b3);
  front.mirror();
  lined(front);
  for (let x = 22; x <= 34; x++) front.px(x, 39, null);
  front.swap(P.ink, P.b3, 22, 40, 1, 9).swap(P.ink, P.b3, 34, 40, 1, 9).swap(P.ink, P.b3, 28, 40, 1, 4);
  out.blit(front);

  const {head, whisk, neckY = 29} = heads[o.head ?? 'visor'](P, o);
  out.blit(lined(neckLayer(P, o, neckY))).blit(lined(head));
  whiskers(out, P, ...whisk);
  return out;
}

// Hovering cat-loaf: no legs to animate, it floats on a ring of light.
function loaf(P, o = {}) {
  const rings = i => (i % 5 === 4 ? P.s3 : i % 5 === 0 ? P.s0 : P.s1);
  const lined = l => l.outline(P.ink);
  const out = L();

  const tail = L().tube([[40, 42], [46, 43], [50, 41], [51, 38], [50, 36]], 3, rings);
  tail.stamp(49, 31, ['..l..', '.llt.', 'lltTT', '.tTT.', '..T..'], {l: P.g0, t: P.g1, T: P.g2});
  out.blit(lined(tail));

  const body = L();
  body.rrect(13, 28, 31, 18, 5, P.b1);
  body.swap(P.b1, P.s1, 13, 28, 4, 18).swap(P.b1, P.s1, 40, 28, 4, 18);
  body.swap(P.b1, P.b2, 13, 42, 31, 4).swap(P.s1, P.s2, 13, 42, 31, 4).swap(P.s1, P.s0, 13, 28, 4, 9);
  body.rect(27, 38, 3, 1, P.b3).rect(27, 40, 3, 1, P.b3);
  out.blit(lined(body));

  const paws = L();
  paws.rrect(18, 44, 8, 4, 1, P.b0).px(20, 47, P.b3).px(23, 47, P.b3);
  paws.mirror();
  out.blit(lined(paws));

  const {head, whisk, neckY = 29} = heads.visor(P, o);
  out.blit(lined(neckLayer(P, o, neckY))).blit(lined(head));
  whiskers(out, P, ...whisk);

  // Hover light, drawn without an outline so it reads as glow.
  for (let x = 18; x <= 38; x++) if (x % 3 !== 2) out.px(x, 49, P.g1);
  for (let x = 22; x <= 34; x++) if (x % 2 === 0) out.px(x, 51, P.g0);
  out.px(15, 50, P.g2).px(41, 50, P.g2).px(28, 53, P.g1).px(24, 53, P.g2).px(32, 53, P.g2);
  return out;
}

export const portrait = sitting(lunar, {head: 'goggles', key: true, gear: true, gold: true});
export const concepts = {
  c: sitting(cream),
  d: sitting(cream, {head: 'crt'}),
  e: sitting(cream, {head: 'round', neck: 'scarf', tip: 'lantern', stripes: true}),
  f: sitting(brass, {head: 'goggles', key: true, gear: true}),
  g: sitting(lunar, {ears: 'tall', mark: 'moon', tip: 'star', charm: 'star'}),
  h: loaf(jade, {eyes: 'square'})
};

const GLYPH = {
  c: ['.####', '#....', '#....', '#....', '#....', '#....', '.####'],
  d: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
  e: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  f: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
  g: ['.####', '#....', '#....', '#.###', '#...#', '#...#', '.####'],
  h: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#']
};
if (process.argv[2]) {
  const dir = process.argv[2];
  mkdirSync(dir, {recursive: true});
  const big = 8, small = 2, gap = 16, cellW = W * big + gap, cellH = W * big + W * small + gap * 2;
  const names = Object.keys(concepts), cols = 3, rows = Math.ceil(names.length / cols);
  const sheet = new Pix(cellW * cols + gap, cellH * rows + gap, '#13221f');
  names.forEach((name, i) => {
    const x = gap + (i % cols) * cellW, y = gap + Math.floor(i / cols) * cellH, p = concepts[name];
    sheet.blit(p.scaled(big), x, y);
    sheet.blit(new Pix(5, 7).stamp(0, 0, GLYPH[name], {'#': '#d59b48'}).scaled(5), x, y);
    sheet.blit(p.scaled(small), x + (W * big - W * small) / 2, y + W * big + gap);
    p.save(`${dir}/concept-${name}.png`);
  });
  sheet.save(`${dir}/sheet2.png`);
  console.log('ok', names.map(n => n + ':' + JSON.stringify(concepts[n].bounds())).join(' '));
}
