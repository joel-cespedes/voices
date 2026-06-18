/**
 * Generate the PWA PNG icons with no external dependencies.
 * Draws a rounded brand background with a centered "play" glyph.
 * Run: node scripts/generate-icons.mjs
 */
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons');

const BG = [124, 131, 255]; // accent indigo
const BG_DEEP = [18, 19, 31]; // app background
const GLYPH = [13, 14, 22];

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePng(size, pixels /* Uint8Array RGBA */) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  // 10,11,12 = 0 (compression, filter, interlace)
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    pixels.subarray(y * stride, y * stride + stride).forEach((v, i) => {
      raw[y * (stride + 1) + 1 + i] = v;
    });
  }
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function draw(size, { padding }) {
  const px = new Uint8Array(size * size * 4);
  const r = size * (0.22 - padding * 0.1); // corner radius
  const inset = size * padding;
  const cx = size / 2;
  const cy = size / 2;
  const triSize = size * (0.5 - padding);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      // Rounded-rect background (the rest is the deep app bg).
      const inside = roundedRect(x, y, inset, inset, size - inset, size - inset, r);
      let color = inside ? BG : BG_DEEP;

      // Centered play triangle.
      if (inside && inTriangle(x - cx, y - cy, triSize)) {
        color = GLYPH;
      }
      px[i] = color[0];
      px[i + 1] = color[1];
      px[i + 2] = color[2];
      px[i + 3] = 255;
    }
  }
  return px;
}

function roundedRect(x, y, x0, y0, x1, y1, radius) {
  if (x < x0 || x > x1 || y < y0 || y > y1) return false;
  const dxl = x0 + radius - x;
  const dxr = x - (x1 - radius);
  const dyt = y0 + radius - y;
  const dyb = y - (y1 - radius);
  const dx = Math.max(dxl, dxr, 0);
  const dy = Math.max(dyt, dyb, 0);
  return dx * dx + dy * dy <= radius * radius;
}

function inTriangle(px, py, s) {
  // Right-pointing triangle centered at origin.
  const h = s * 0.55;
  const w = s * 0.5;
  if (px < -w * 0.6 || px > w) return false;
  const t = (px + w * 0.6) / (w + w * 0.6); // 0..1 left→right
  const halfH = h * (1 - t);
  return Math.abs(py) <= halfH;
}

mkdirSync(OUT_DIR, { recursive: true });
const variants = [
  { name: 'icon-192.png', size: 192, padding: 0.0 },
  { name: 'icon-512.png', size: 512, padding: 0.0 },
  { name: 'icon-maskable-512.png', size: 512, padding: 0.12 },
];
for (const v of variants) {
  writeFileSync(join(OUT_DIR, v.name), encodePng(v.size, draw(v.size, { padding: v.padding })));
  console.log('wrote', v.name);
}
