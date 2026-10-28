// Writes Miaubit in the exact layout the game already loads:
//   atlas-directions.png  1254 × 1254, a 2 × 2 sheet of 627 px cells: [south, north] / [east, west]
//   atlas-crt.png         square portrait, 72 logical pixels so it lands on whole pixels at 144 px
import {Pix} from './pix.mjs';
import {portrait} from './concepts2.mjs';
import {front, back, side, S} from './cat48.mjs';

const out = process.argv[2];
const CELL = 627, K = Math.floor(CELL / S), PAD = Math.floor((CELL - S * K) / 2);
const sheet = new Pix(CELL * 2, CELL * 2);
[[front(0, 0), back(0, 0)], [side(-1, true), side(-1, false).flipX()]].forEach((row, r) => row.forEach((frame, c) => sheet.blit(frame.scaled(K), c * CELL + PAD, r * CELL + PAD)));
sheet.save(`${out}/atlas-directions.png`);

const LOGICAL = 72, b = portrait.bounds();
const card = new Pix(LOGICAL, LOGICAL);
// Nudged 4 px left of centre so the longer name tag in the corner does not cover the tail.
card.blit(portrait, Math.round((LOGICAL - (b.x0 + b.x1 + 1)) / 2) - 4, Math.round((LOGICAL - (b.y0 + b.y1 + 1)) / 2));
card.save(`${out}/atlas-crt.png`, 16);

const check = new Pix(CELL * 2 + LOGICAL * 16 + 30, CELL * 2 + 20, '#13221f');
check.blit(sheet, 10, 10).blit(card.scaled(16), CELL * 2 + 20, 10);
check.save(`${out}/game-assets-check.png`);
console.log('sheet', sheet.w, sheet.h, 'scale', K, 'pad', PAD, '| portrait', LOGICAL * 16, 'bounds', JSON.stringify(card.bounds()));
