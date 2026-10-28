// Presentation sheet for the chosen cat: portrait, four standing views and the walk strips.
import {Pix} from './pix.mjs';
import {portrait} from './concepts2.mjs';
import {sheet, S} from './cat48.mjs';
import {writeFileSync} from 'node:fs';

const FONT = {
  A: '.#.#.#####.##.#', C: '.###..#..#...##', D: '##.#.##.##.###.', E: '####..##.#..###', F: '####..##.#..#..', H: '#.##.#####.##.#',
  I: '###.#..#..#.###', L: '#..#..#..#..###', M: '#.########.##.#', N: '##.#.##.##.##.#', O: '####.##.##.####', P: '####.#####..#..',
  Q: '####.##.####..#', R: '##.#.###.#.##.#', S: '.###...#...###.', T: '###.#..#..#..#.', U: '#.##.##.##.####', Z: '###..#.#.#..###'
};
function text(p, x, y, str, k, color) {
  for (const ch of str) {
    const g = FONT[ch];
    if (g) for (let i = 0; i < 15; i++) if (g[i] === '#') p.rect(x + (i % 3) * k, y + Math.floor(i / 3) * k, k, k, color);
    x += 4 * k;
  }
}
const {rows, pix} = sheet();
const out = process.argv[2], gap = 20, big = 4, small = 2, label = '#d59b48', dim = '#95ada2';
const W = gap + 57 * big + gap + 4 * (S * big + gap), rowH = 57 * big;
const stripW = 4 * S * small, H = gap + rowH + 34 + 2 * (S * small + 34) + gap;
const p = new Pix(W, H, '#13221f');
p.blit(portrait.scaled(big), gap, gap);
text(p, gap, gap + rowH + 8, 'RETRATO', 2, label);
['FRENTE', 'ESPALDA', 'DERECHA', 'IZQUIERDA'].forEach((name, i) => {
  const x = gap + 57 * big + gap + i * (S * big + gap);
  p.blit(rows[i][0].scaled(big), x, gap + rowH - S * big);
  text(p, x, gap + rowH + 8, name, 2, label);
});
['FRENTE', 'ESPALDA', 'DERECHA', 'IZQUIERDA'].forEach((name, i) => {
  const x = gap + (i % 2) * (stripW + gap * 2), y = gap + rowH + 34 + Math.floor(i / 2) * (S * small + 34);
  rows[i].forEach((frame, c) => p.blit(frame.scaled(small), x + c * S * small, y));
  text(p, x, y + S * small + 6, 'CAMINA ' + name, 2, dim);
});
p.save(`${out}/gato-vistas.png`);
portrait.save(`${out}/gato-retrato.png`);
pix.save(`${out}/gato-hoja.png`);
writeFileSync(`${out}/gato-hoja.b64.txt`, pix.png().toString('base64'));
console.log('sheet bytes', pix.png().length, 'b64', pix.png().toString('base64').length, 'size', W, H);
