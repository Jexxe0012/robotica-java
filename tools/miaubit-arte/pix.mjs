// Minimal pixel-art canvas with a dependency-free PNG encoder.
import zlib from 'node:zlib';
import {writeFileSync} from 'node:fs';

const rgba = hex => {
  const n = parseInt(hex.slice(1), 16);
  return hex.length > 7 ? [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255] : [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255];
};

export class Pix {
  constructor(w, h, fill = null) { this.w = w; this.h = h; this.d = new Array(w * h).fill(fill); }
  clone() { const p = new Pix(this.w, this.h); p.d = this.d.slice(); return p; }
  inb(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
  get(x, y) { return this.inb(x, y) ? this.d[y * this.w + x] : null; }
  px(x, y, c) { if (this.inb(x, y)) this.d[y * this.w + x] = c; return this; }
  rect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, c); return this; }
  // Rectangle with stair-stepped corners; r is the size of the cut.
  rrect(x, y, w, h, r, c) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      if (Math.min(i, w - 1 - i) + Math.min(j, h - 1 - j) < r) continue;
      this.px(x + i, y + j, c);
    }
    return this;
  }
  ellipse(cx, cy, rx, ry, c) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x - cx) / rx, dy = (y - cy) / ry;
      if (dx * dx + dy * dy <= 1) this.px(x, y, c);
    }
    return this;
  }
  line(x0, y0, x1, y1, c, t = 1) {
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy, x = x0, y = y0;
    for (;;) {
      this.rect(x, y, t, t, c);
      if (x === x1 && y === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x += sx; }
      if (e2 <= dx) { err += dx; y += sy; }
    }
    return this;
  }
  // Thick polyline whose colour is chosen per step: color(i) → colour.
  tube(points, t, color) {
    let i = 0;
    for (let k = 1; k < points.length; k++) {
      const [x0, y0] = points[k - 1], [x1, y1] = points[k];
      const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
      let err = dx + dy, x = x0, y = y0;
      for (;;) {
        this.rect(x, y, t, t, typeof color === 'function' ? color(i++) : color);
        if (x === x1 && y === y1) break;
        const e2 = 2 * err;
        if (e2 >= dy) { err += dy; x += sx; }
        if (e2 <= dx) { err += dx; y += sy; }
      }
    }
    return this;
  }
  poly(pts, c) {
    const ys = pts.map(p => p[1]);
    for (let y = Math.min(...ys); y <= Math.max(...ys); y++) {
      const xs = [];
      for (let i = 0; i < pts.length; i++) {
        const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % pts.length];
        if ((y0 <= y && y1 > y) || (y1 <= y && y0 > y)) xs.push(x0 + (y - y0) * (x1 - x0) / (y1 - y0));
      }
      xs.sort((a, b) => a - b);
      for (let i = 0; i + 1 < xs.length; i += 2) for (let x = Math.ceil(xs[i] - .01); x <= Math.floor(xs[i + 1] + .01); x++) this.px(x, y, c);
    }
    for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; this.line(a[0], a[1], b[0], b[1], c); }
    return this;
  }
  // ASCII stamp: characters present in `map` are painted, everything else is skipped.
  stamp(x, y, rows, map, flip = false) {
    rows.forEach((row, j) => [...row].forEach((ch, i) => { if (ch in map) this.px(flip ? x - i : x + i, y + j, map[ch]); }));
    return this;
  }
  // Recolour `from` → `to` inside a rectangle (defaults to the whole canvas).
  swap(from, to, x = 0, y = 0, w = this.w, h = this.h) {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (this.get(i, j) === from) this.px(i, j, to);
    return this;
  }
  // Recolour `from` pixels that fall outside an ellipse: cheap crescent shading.
  crescent(from, to, cx, cy, rx, ry) {
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (this.get(x, y) !== from) continue;
      const dx = (x - cx) / rx, dy = (y - cy) / ry;
      if (dx * dx + dy * dy > 1) this.px(x, y, to);
    }
    return this;
  }
  // Copy the left half over the right half (vertical axis at the centre column).
  mirror() {
    for (let y = 0; y < this.h; y++) for (let x = 0; x < Math.floor(this.w / 2); x++) this.d[y * this.w + this.w - 1 - x] = this.d[y * this.w + x];
    return this;
  }
  flipX() {
    const p = new Pix(this.w, this.h);
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) p.d[y * this.w + this.w - 1 - x] = this.d[y * this.w + x];
    return p;
  }
  blit(src, dx = 0, dy = 0) {
    for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) { const c = src.d[y * src.w + x]; if (c) this.px(dx + x, dy + y, c); }
    return this;
  }
  // Paint transparent pixels that touch an opaque one (4-neighbourhood).
  outline(c) {
    const src = this.d.slice(), at = (x, y) => this.inb(x, y) && src[y * this.w + x];
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (src[y * this.w + x]) continue;
      if (at(x - 1, y) || at(x + 1, y) || at(x, y - 1) || at(x, y + 1)) this.d[y * this.w + x] = c;
    }
    return this;
  }
  scaled(n) {
    const p = new Pix(this.w * n, this.h * n);
    for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) p.d[y * p.w + x] = this.d[Math.floor(y / n) * this.w + Math.floor(x / n)];
    return p;
  }
  bounds() {
    let x0 = this.w, y0 = this.h, x1 = -1, y1 = -1;
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) if (this.d[y * this.w + x]) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    return {x0, y0, x1, y1};
  }
  png() {
    const raw = Buffer.alloc((this.w * 4 + 1) * this.h);
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      const c = this.d[y * this.w + x];
      if (c) raw.set(rgba(c), y * (this.w * 4 + 1) + 1 + x * 4);
    }
    const chunk = (type, data) => {
      const body = Buffer.concat([Buffer.from(type, 'ascii'), data]), out = Buffer.alloc(body.length + 8);
      out.writeUInt32BE(data.length, 0); body.copy(out, 4); out.writeUInt32BE(zlib.crc32(body) >>> 0, body.length + 4);
      return out;
    };
    const head = Buffer.alloc(13);
    head.writeUInt32BE(this.w, 0); head.writeUInt32BE(this.h, 4); head.set([8, 6, 0, 0, 0], 8);
    return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', head), chunk('IDAT', zlib.deflateSync(raw, {level: 9})), chunk('IEND', Buffer.alloc(0))]);
  }
  save(file, scale = 1) { writeFileSync(file, (scale > 1 ? this.scaled(scale) : this).png()); return this; }
}
