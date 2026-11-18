// Pixel tiles are baked into Alba's atlas when the Tiled map is authored.
export const firstTrailTile = 21;
export const trailVariants = 2;
const tileSize = 32;
const columns = 5;
const directions = [
  { bit: 1, dx: 0, dy: -1 },
  { bit: 2, dx: 1, dy: 0 },
  { bit: 4, dx: 0, dy: 1 },
  { bit: 8, dx: -1, dy: 0 }
];

export function trailTileAt(x, y, connects) {
  const mask = directions.reduce((bits, { bit, dx, dy }) =>
    connects(x + dx, y + dy) ? bits | bit : bits, 0);
  return firstTrailTile + mask * trailVariants + (x + y * 3) % trailVariants;
}

function hash(x, y, seed) {
  let value = Math.imul(x + 17, 374761393) ^ Math.imul(y + 29, 668265263) ^ seed;
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return (value ^ (value >>> 16)) >>> 0;
}

function makeTrail(mask, variant) {
  const colors = new Map();
  const center = tileSize / 2 - .5;
  const arms = directions.filter(({ bit }) => mask & bit);
  const seed = mask * 31 + variant * 71;
  function distanceToTrail(x, y) {
    let distance = Math.hypot(x - center, y - center);
    for (const { dx, dy, bit } of arms) {
      const along = (x - center) * dx + (y - center) * dy;
      if (along < 0) continue;
      const across = (x - center) * -dy + (y - center) * dx;
      // Return to the same width and center at every tile edge.
      const bend = (variant ? 1 : -1) * (bit % 3 + 1) * Math.sin(Math.PI * along / center);
      distance = Math.min(distance, Math.abs(across - bend));
    }
    return distance;
  }
  function pixelColor(x, y) {
    const edge = Math.min(x, y, tileSize - 1 - x, tileSize - 1 - y);
    const variation = hash(Math.floor(x / 3), Math.floor(y / 3), seed);
    const fleck = hash(x, y, seed) % 101;
    const shoulder = 9 + (edge < 2 ? 0 : (variation % 5 - 2) * .65);
    const distance = distanceToTrail(x, y);
    if (distance > shoulder + 2) return '';
    if (distance > shoulder) return fleck < 23 ? '#5e764a' : fleck < 61 ? '#354734' : '';
    if (distance > shoulder - 2) return fleck < 24 ? '#5b5a3f' : '#403c2b';

    // Give a handful of flat stones irregular edges and a lit face.
    const stoneX = Math.floor((x + (variant ? 3 : 0)) / 7);
    const stoneY = Math.floor((y + 2) / 6);
    const stone = hash(stoneX, stoneY, seed);
    const sx = (x + (variant ? 3 : 0)) % 7;
    const sy = (y + 2) % 6;
    if (edge > 1 && stone % 5 === 0 && sx >= 1 && sx <= 5 && sy >= 1 && sy <= 4 && !(sx === 5 && sy === 1)) {
      return sy === 1 ? '#b09c74' : sy === 4 ? '#514b3a' : '#877b61';
    }
    if (fleck < 9) return '#9b8158';
    if (fleck < 20) return '#685039';
    return ['#806746', '#786043', '#8b704e', '#765d41'][variation % 4];
  }
  // Group horizontal runs by color instead of emitting a rectangle per pixel.
  for (let y = 0; y < tileSize; y++) {
    let x = 0;
    while (x < tileSize) {
      const start = x;
      const color = pixelColor(x++, y);
      while (x < tileSize && pixelColor(x, y) === color) x++;
      if (color) colors.set(color, (colors.get(color) || '') + `M${start} ${y}h${x - start}v1H${start}z`);
    }
  }
  return Array.from(colors, ([fill, path]) => `<path fill="${fill}" d="${path}"/>`).join('');
}

export function trailAtlasMarkup() {
  let markup = '';
  for (let mask = 0; mask < 16; mask++) {
    for (let variant = 0; variant < trailVariants; variant++) {
      const index = firstTrailTile - 1 + mask * trailVariants + variant;
      const x = index % columns * tileSize;
      const y = Math.floor(index / columns) * tileSize;
      markup += `<g transform="translate(${x} ${y})">${makeTrail(mask, variant)}</g>`;
    }
  }
  return markup;
}
