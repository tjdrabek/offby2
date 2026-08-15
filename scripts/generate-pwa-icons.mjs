#!/usr/bin/env node
/**
 * Generates the PWA icon set in `public/icons/` from a single drawing routine.
 *
 * The icons are committed to the repository; this script exists so they can be
 * regenerated deterministically without pulling in an image-processing
 * dependency. It writes 8-bit RGBA PNGs using only Node's built-in zlib.
 *
 * Usage: node scripts/generate-pwa-icons.mjs
 */
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const OUTPUT_DIR = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "public",
  "icons",
);

/** Drawn at this multiple of the target size, then box-filtered down. */
const SUPERSAMPLE = 4;

const BACKGROUND = [27, 42, 74];
const SHEET = [255, 255, 255];
const LABEL = [76, 110, 245];

/**
 * Allocates an opaque RGBA canvas of `size` x `size` pixels.
 */
function createCanvas(size) {
  return { size, data: new Uint8Array(size * size * 4) };
}

/**
 * Fills an axis-aligned rectangle with `radius`-rounded corners. Coordinates
 * are in pixels and may be fractional; the caller draws supersampled so that
 * simple inside/outside testing still yields smooth edges after downsampling.
 */
function fillRoundedRect(canvas, x, y, width, height, radius, color) {
  const r = Math.min(radius, width / 2, height / 2);
  const left = Math.max(0, Math.floor(x));
  const top = Math.max(0, Math.floor(y));
  const right = Math.min(canvas.size, Math.ceil(x + width));
  const bottom = Math.min(canvas.size, Math.ceil(y + height));

  for (let py = top; py < bottom; py += 1) {
    for (let px = left; px < right; px += 1) {
      const cx = px + 0.5;
      const cy = py + 0.5;
      const dx = Math.max(x + r - cx, 0, cx - (x + width - r));
      const dy = Math.max(y + r - cy, 0, cy - (y + height - r));
      if (dx * dx + dy * dy > r * r) continue;

      const offset = (py * canvas.size + px) * 4;
      canvas.data[offset] = color[0];
      canvas.data[offset + 1] = color[1];
      canvas.data[offset + 2] = color[2];
      canvas.data[offset + 3] = 255;
    }
  }
}

/**
 * Draws the app mark: a portrait label sheet carrying a 4x3 grid of labels,
 * centred on a solid background. `contentScale` is the fraction of the icon
 * edge the sheet height occupies, which is what shrinks the artwork into the
 * maskable safe zone.
 */
function drawIcon(size, contentScale) {
  const canvas = createCanvas(size);
  fillRoundedRect(canvas, 0, 0, size, size, 0, BACKGROUND);

  const sheetHeight = size * contentScale;
  const sheetWidth = sheetHeight * 0.78;
  const sheetX = (size - sheetWidth) / 2;
  const sheetY = (size - sheetHeight) / 2;
  fillRoundedRect(
    canvas,
    sheetX,
    sheetY,
    sheetWidth,
    sheetHeight,
    size * 0.045,
    SHEET,
  );

  const columns = 3;
  const rows = 4;
  const margin = sheetWidth * 0.1;
  const gap = sheetWidth * 0.06;
  const labelWidth = (sheetWidth - margin * 2 - gap * (columns - 1)) / columns;
  const labelHeight = (sheetHeight - margin * 2 - gap * (rows - 1)) / rows;

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      fillRoundedRect(
        canvas,
        sheetX + margin + column * (labelWidth + gap),
        sheetY + margin + row * (labelHeight + gap),
        labelWidth,
        labelHeight,
        Math.min(labelWidth, labelHeight) * 0.22,
        LABEL,
      );
    }
  }

  return canvas;
}

/**
 * Box-filters a supersampled canvas down to `size` x `size`.
 */
function downsample(canvas, size) {
  const factor = canvas.size / size;
  const out = createCanvas(size);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let sy = 0; sy < factor; sy += 1) {
        for (let sx = 0; sx < factor; sx += 1) {
          const offset =
            ((y * factor + sy) * canvas.size + (x * factor + sx)) * 4;
          r += canvas.data[offset];
          g += canvas.data[offset + 1];
          b += canvas.data[offset + 2];
          a += canvas.data[offset + 3];
        }
      }
      const samples = factor * factor;
      const offset = (y * size + x) * 4;
      out.data[offset] = Math.round(r / samples);
      out.data[offset + 1] = Math.round(g / samples);
      out.data[offset + 2] = Math.round(b / samples);
      out.data[offset + 3] = Math.round(a / samples);
    }
  }

  return out;
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes) {
  let c = 0xffffffff;
  for (const byte of bytes) {
    c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, "ascii");
  const body = Buffer.concat([typeBytes, Buffer.from(data)]);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([length, body, crc]);
}

/**
 * Encodes an RGBA canvas as a PNG buffer (8-bit, colour type 6, no filtering).
 */
function encodePng(canvas) {
  const { size } = canvas;
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // RGBA
  header[10] = 0; // deflate
  header[11] = 0; // adaptive filtering
  header[12] = 0; // no interlace

  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y += 1) {
    raw[y * (stride + 1)] = 0; // filter type: none
    Buffer.from(canvas.data.buffer, y * stride, stride).copy(
      raw,
      y * (stride + 1) + 1,
    );
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const TARGETS = [
  { file: "icon-192.png", size: 192, contentScale: 0.86 },
  { file: "icon-512.png", size: 512, contentScale: 0.86 },
  { file: "icon-maskable-512.png", size: 512, contentScale: 0.62 },
  { file: "apple-touch-icon-180.png", size: 180, contentScale: 0.74 },
];

mkdirSync(OUTPUT_DIR, { recursive: true });
for (const { file, size, contentScale } of TARGETS) {
  const png = encodePng(
    downsample(drawIcon(size * SUPERSAMPLE, contentScale), size),
  );
  writeFileSync(resolve(OUTPUT_DIR, file), png);
  console.log(`wrote ${file} (${size}x${size}, ${png.length} bytes)`);
}
