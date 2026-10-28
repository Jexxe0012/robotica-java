// Writes the walking sheet the project mode loads: web/proyectos/assets/miaubit-camina.png,
// 192 × 192 px, rows south, north, east and west with four 48 px frames each.
// Run without arguments: cat48.mjs only writes its review sheets when it receives a folder.
import {mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {sheet, S} from './cat48.mjs';

const folder = fileURLToPath(new URL('../../web/proyectos/assets/', import.meta.url));
const {pix} = sheet();
mkdirSync(folder, {recursive: true});
pix.save(folder + 'miaubit-camina.png');
console.log('miaubit-camina.png', pix.w, '×', pix.h, 'frame', S, 'bytes', pix.png().length);
