// Wind-up robot cat in moonlight colours: 48 × 48 walking frames for the four board directions.
import {Pix} from './pix.mjs';

export const S = 48;
const L = () => new Pix(S, S);
export const P = {
  ink: '#161230',
  b0: '#f8f5ff', b1: '#dcd5f2', b2: '#b3a9d8', b3: '#8176b0', // silver-lavender plating
  s0: '#a094d6', s1: '#7868b8', s2: '#56498e', s3: '#372e60', // violet plating
  y0: '#fff3b0', y1: '#ffd95a', y2: '#f0c04f', y3: '#c8922f', // gold
  nose: '#eaa7ca', nose2: '#b66f98'
};
const RING = '#7868b9'; // marker colour, resolved by shadeRing()
const lined = l => l.outline(P.ink);
const rings = i => (i % 5 === 4 ? P.s3 : i % 5 === 0 ? P.s0 : P.s1);
const gem = (p, x, y) => p.stamp(x, y, ['..l..', '.lly.', 'llyYY', '.yYY.', '..Y..'], {l: P.y0, y: P.y1, Y: P.y3});
const openRow = (p, y) => { for (let x = 0; x < S; x++) if (p.get(x, y) === P.ink) p.px(x, y, null); };

function cog(p, cx, cy) {
  for (const [dx, dy] of [[0, -3], [0, 3], [-3, 0], [3, 0]]) p.px(cx + dx, cy + dy, P.y2);
  p.ellipse(cx, cy, 2.4, 2.4, P.y2).px(cx - 1, cy - 1, P.y0).px(cx + 1, cy + 2, P.y3).px(cx + 2, cy + 1, P.y3).px(cx, cy, P.s3);
}
function goggle(p, cx, cy, slit = cx) {
  p.ellipse(cx, cy, 4.4, 4.4, RING).ellipse(cx, cy, 2.6, 2.6, P.y1).rect(slit, cy - 2, 1, 5, P.ink);
}
// Light from the top left, one ring at a time.
function shadeRing(p, cx, cy) {
  for (let y = cy - 5; y <= cy + 5; y++) for (let x = cx - 5; x <= cx + 5; x++) {
    if (p.get(x, y) !== RING) continue;
    const d = x - cx + y - cy;
    p.px(x, y, d <= -3 ? P.s0 : d >= 3 ? P.s2 : P.s1);
  }
  p.px(cx - 2, cy - 1, P.y0).px(cx - 1, cy - 2, P.y0).px(cx + 2, cy + 1, P.y3).px(cx + 1, cy + 2, P.y3);
}
function whiskers(p, x, y) {
  for (const [dx, dy] of [[0, 0], [-1, 0], [-2, -1], [-3, -1], [0, 3], [-1, 3], [-2, 4], [-3, 4]]) { p.px(x + dx, y + dy, P.b2); p.px(S - 1 - x - dx, y + dy, P.b2); }
}
// Wind-up key on the cat's right flank, drawn sticking out to the viewer's left.
function keyLayer(x, y, phase) {
  const k = L();
  k.rect(x + 6, y + 4, 6, 2, P.y2).rect(x + 6, y + 5, 6, 1, P.y3);
  if (phase) k.rect(x + 2, y, 3, 10, P.y1).rect(x + 2, y, 1, 10, P.y0).rect(x + 4, y, 1, 10, P.y3);
  else k.rrect(x, y, 7, 10, 2, P.y1).rect(x + 2, y, 3, 1, P.y0).rect(x, y + 2, 1, 6, P.y0).rect(x + 6, y + 2, 1, 6, P.y3).rect(x + 2, y + 9, 3, 1, P.y3).rect(x + 2, y + 2, 3, 2, P.ink).rect(x + 2, y + 6, 3, 2, P.ink);
  return k;
}

const EAR = ['..o.....', '.ooo....', '.oioo...', 'ooiioo..', 'ooiiioo.', 'ooiiiioo', 'oooiiioo', 'oooooooo'];

// pose: 0 standing · 1 the cat's right paw forward · 2 its left paw forward
export function front(pose, keyPhase = 0) {
  const b = pose ? 1 : 0, dl = [0, 1, -1][pose], sway = [0, 1, -1][pose], out = L();

  const tail = L().tube([[31, 33 + b], [35, 30 + b], [38, 25 + b], [39, 19 + b], [38 + sway, 15 + b]], 3, rings);
  gem(tail, 37 + sway, 10 + b);
  out.blit(lined(tail));
  out.blit(lined(keyLayer(3, 27 + b, keyPhase)));

  const hind = L();
  hind.ellipse(14.5, 36, 3.5, 6, P.s1).rrect(11, 42, 5, 3, 1, P.b1);
  hind.mirror();
  hind.swap(P.s1, P.s0, 11, 30, 2, 8).swap(P.s1, P.s2, 34, 30, 3, 12);
  out.blit(lined(hind));

  const chest = L();
  chest.rrect(15, 26 + b, 18, 13 - b, 2, P.b1).swap(P.b1, P.b2, 31, 26, 2, 14).rect(21, 37, 6, 4, P.b3);
  out.blit(lined(chest));

  const legs = L();
  for (const [x, d, pawX] of [[16, dl, 15], [27, -dl, 27]]) {
    legs.rect(x, 36, 5, 6 + d, P.b0).rrect(pawX, 42 + d, 6, 3, 1, P.b0).px(pawX + 2, 44 + d, P.b3).px(pawX + 4, 44 + d, P.b3);
  }
  lined(legs);
  openRow(legs, 35);
  out.blit(legs);

  const collar = L();
  collar.rect(16, 29 + b, 16, 2, P.y2).rect(16, 29 + b, 16, 1, P.y1).stamp(22, 30 + b, ['.ll.', 'lyyY', '.yY.'], {l: P.y0, y: P.y1, Y: P.y3});
  out.blit(lined(collar));

  const head = L();
  head.stamp(11, 4 + b, EAR, {o: P.s1, i: P.nose});
  head.rrect(11, 11 + b, 26, 17, 3, P.b1).swap(P.b1, P.s1, 11, 11 + b, 26, 3);
  head.rect(11, 17 + b, 13, 3, P.s3);
  goggle(head, 18, 18 + b);
  head.mirror();
  shadeRing(head, 18, 18 + b); shadeRing(head, 29, 18 + b);
  head.swap(P.s1, P.s0, 11, 11 + b, 26, 1).swap(P.s1, P.s0, 11, 4 + b, 2, 7).swap(P.nose, P.nose2, 29, 4 + b, 8, 8);
  head.swap(P.b1, P.b0, 11, 14 + b, 2, 10).swap(P.b1, P.b2, 35, 14 + b, 2, 14).swap(P.b1, P.b2, 11, 27 + b, 26, 1);
  head.rect(23, 23 + b, 2, 1, P.nose).rect(23, 24 + b, 2, 1, P.nose2);
  for (const [x, y] of [[20, 24], [21, 25], [22, 25], [25, 25], [26, 25], [27, 24]]) head.px(x, y + b, P.b3);
  out.blit(lined(head));
  whiskers(out, 9, 22 + b);
  return out;
}

export function back(pose, keyPhase = 0) {
  const b = pose ? 1 : 0, dl = [0, 1, -1][pose], sway = [0, -1, 1][pose], out = L();
  out.blit(lined(keyLayer(3, 27 + b, keyPhase)).flipX());

  // Thigh plates seen edge-on: narrow side panels, with only the gold rim of each cog showing.
  const thighs = L();
  thighs.rrect(11, 30, 4, 11, 1, P.s1).rect(11, 33, 1, 5, P.y2).px(11, 33, P.y0);
  thighs.mirror();
  thighs.swap(P.s1, P.s0, 12, 30, 2, 2).swap(P.s1, P.s2, 33, 32, 2, 9);
  out.blit(lined(thighs));

  // One back plate with a horizontal seam and the tail socket, so it reads as a machine panel.
  const rump = L();
  rump.rrect(15, 26 + b, 18, 13 - b, 2, P.b1).swap(P.b1, P.b2, 31, 26, 2, 14).rect(21, 37, 6, 4, P.b3);
  rump.rect(17, 36, 14, 1, P.b2).rect(22, 31 + b, 5, 4, P.s3);
  out.blit(lined(rump));

  const legs = L();
  for (const [x, d, pawX] of [[16, dl, 15], [27, -dl, 27]]) legs.rect(x, 37, 5, 5 + d, P.b1).rect(x, 39, 5, 1, P.b2).rrect(pawX, 42 + d, 6, 3, 1, P.b0);
  lined(legs);
  openRow(legs, 36);
  out.blit(legs);

  const collar = L();
  collar.rect(16, 29 + b, 16, 2, P.y2).rect(16, 29 + b, 16, 1, P.y1);
  out.blit(lined(collar));

  const head = L();
  head.stamp(11, 4 + b, EAR, {o: P.s1, i: P.s1});
  head.rrect(11, 11 + b, 26, 17, 3, P.b1).swap(P.b1, P.s1, 11, 11 + b, 26, 3);
  head.rect(11, 17 + b, 13, 3, P.s3).px(15, 23 + b, P.b3).rect(23, 21 + b, 1, 6, P.b2);
  head.mirror();
  head.rect(22, 16 + b, 4, 5, P.y2).rect(22, 16 + b, 4, 1, P.y0).rect(23, 18 + b, 2, 1, P.s3);
  head.swap(P.s1, P.s0, 11, 11 + b, 26, 1).swap(P.s1, P.s0, 11, 4 + b, 2, 7).swap(P.s1, P.s2, 33, 6 + b, 4, 5);
  head.swap(P.b1, P.b0, 11, 14 + b, 2, 10).swap(P.b1, P.b2, 35, 14 + b, 2, 14).swap(P.b1, P.b2, 11, 27 + b, 26, 1);
  out.blit(lined(head));

  const tail = L().tube([[23, 32 + b], [20, 29 + b], [15, 26 + b], [9, 23 + b], [6, 18 + b], [6 + sway, 14 + b]], 3, rings);
  gem(tail, 5 + sway, 9 + b);
  out.blit(lined(tail));
  return out;
}

// One leg seen from the side: a 3 px column leaning by dx at the paw.
function sideLeg(p, x0, dx, lift, c) {
  const top = 32, foot = 44 - lift;
  for (let y = top; y <= foot - 2; y++) p.rect(x0 + Math.round(dx * (y - top) / (foot - 2 - top)), y, 3, 1, y < 38 ? c.up : c.low);
  p.rect(x0 + dx, foot - 1, 4, 2, c.paw).px(x0 + dx + 3, foot, c.toe);
}

// frame 0–3 of a trot, facing east; -1 is the standing pose. The key only exists on the cat's right flank.
export function side(frame, withKey = true) {
  const stand = frame < 0;
  if (stand) frame = 4;
  const sw = [3, 0, -3, 0, 0][frame], b = [1, 0, 1, 0, 0][frame], sway = [0, 1, 0, -1, 0][frame], out = L();

  const tail = L().tube([[9, 27 + b], [6, 23 + b], [5, 17 + b], [6 + sway, 12 + b]], 3, rings);
  gem(tail, 5 + sway, 7 + b);
  out.blit(lined(tail));

  const far = L();
  sideLeg(far, 17, sw, frame === 1 ? 1 : 0, {up: P.s2, low: P.b3, paw: P.b2, toe: P.b3});
  sideLeg(far, 31, -sw, frame === 1 ? 1 : 0, {up: P.b3, low: P.b3, paw: P.b2, toe: P.b3});
  out.blit(lined(far));

  const body = L();
  body.rrect(10, 23 + b, 24, 13, 3, P.b1).swap(P.b1, P.b0, 10, 23 + b, 24, 1).swap(P.b1, P.b2, 10, 34 + b, 24, 2);
  out.blit(lined(body));

  const near = L();
  sideLeg(near, 13, -sw, frame === 3 ? 1 : 0, {up: P.s1, low: P.b1, paw: P.b0, toe: P.b3});
  sideLeg(near, 27, sw, frame === 3 ? 1 : 0, {up: P.b1, low: P.b1, paw: P.b0, toe: P.b3});
  lined(near);
  openRow(near, 31);
  out.blit(near);

  const thigh = L();
  thigh.ellipse(15, 30 + b, 5, 6, P.s1);
  for (let y = 24; y < 40; y++) for (let x = 9; x < 22; x++) if (thigh.get(x, y) === P.s1) { const d = x - 15 + y - 30 - b; if (d <= -5) thigh.px(x, y, P.s0); else if (d >= 6) thigh.px(x, y, P.s2); }
  cog(thigh, 15, 29 + b);
  out.blit(lined(thigh));

  if (withKey) {
    const k = L(), y = 29 + b;
    if (frame % 2) k.rect(20, y - 1, 7, 3, P.y1).rect(20, y - 1, 7, 1, P.y0).rect(20, y + 1, 7, 1, P.y3).px(21, y, P.ink).px(25, y, P.ink).px(23, y - 1, null).px(23, y + 1, null);
    else k.rect(22, y - 3, 3, 7, P.y1).rect(22, y - 3, 1, 7, P.y0).rect(24, y - 3, 1, 7, P.y3).px(23, y - 2, P.ink).px(23, y + 2, P.ink).px(22, y, null).px(24, y, null);
    out.blit(lined(k));
  }

  const collar = L();
  collar.rect(28, 25 + b, 6, 2, P.y2).rect(28, 25 + b, 6, 1, P.y1).stamp(32, 27 + b, ['ll', 'yY', 'Y.'], {l: P.y0, y: P.y1, Y: P.y3});
  out.blit(lined(collar));

  const head = L();
  head.stamp(35, 4 + b, ['..o...', '.ooo..', '.oooo.', 'oooooo', 'oooooo', 'oooooo'], {o: P.s2});
  head.stamp(27, 2 + b, ['..o....', '.ooo...', '.oioo..', 'ooiioo.', 'ooiiioo', 'oooiioo', 'ooooooo', 'ooooooo'], {o: P.s1, i: P.nose});
  head.rrect(25, 9 + b, 20, 16, 3, P.b1).swap(P.b1, P.s1, 25, 9 + b, 20, 3).swap(P.s1, P.s0, 25, 9 + b, 20, 1);
  head.rrect(43, 17 + b, 4, 6, 1, P.b1).px(45, 17 + b, P.nose).px(46, 18 + b, P.nose).px(44, 21 + b, P.b3).px(45, 21 + b, P.b3);
  head.rect(25, 15 + b, 10, 3, P.s3);
  goggle(head, 38, 16 + b, 39);
  shadeRing(head, 38, 16 + b);
  head.swap(P.b1, P.b0, 25, 12 + b, 1, 11).swap(P.b1, P.b2, 25, 23 + b, 20, 2).swap(P.s1, P.s0, 27, 2 + b, 2, 7);
  out.blit(lined(head));
  out.px(47, 20 + b, P.b2).px(46, 23 + b, P.b2).px(47, 24 + b, P.b2);
  return out;
}

// Board sheet: rows south, north, east, west; four walking frames per row.
export function sheet() {
  const rows = [
    [front(0, 0), front(1, 1), front(0, 0), front(2, 1)],
    [back(0, 0), back(1, 1), back(0, 0), back(2, 1)],
    [0, 1, 2, 3].map(f => side(f, true)),
    [0, 1, 2, 3].map(f => side(f, false).flipX())
  ];
  const p = new Pix(S * 4, S * 4);
  rows.forEach((row, r) => row.forEach((frame, c) => p.blit(frame, c * S, r * S)));
  return {rows, pix: p};
}

if (process.argv[2]) {
  const {rows, pix} = sheet(), k = 5, gap = 8;
  const review = new Pix((S * k + gap) * 4 + gap, (S * k + gap) * 4 + gap, '#13221f');
  rows.forEach((row, r) => row.forEach((frame, c) => review.blit(frame.scaled(k), gap + c * (S * k + gap), gap + r * (S * k + gap))));
  review.save(`${process.argv[2]}/cat48-review.png`);
  pix.save(`${process.argv[2]}/cat48-sheet.png`);
  console.log('ok', rows.map(row => row.map(f => { const q = f.bounds(); return `${q.x0},${q.y0}-${q.x1},${q.y1}`; }).join(' ')).join(' | '));
}
