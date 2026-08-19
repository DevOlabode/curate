#!/usr/bin/env node
/**
 * Rasterize the Curate bookmark mark to PNG (transparent) and JPEG (paper background).
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { PNG } = require('pngjs');

const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'public/images');
const SIZE = 1024;
const SUPER = 2;
const INK = { r: 196, g: 73, b: 29, a: 255 };
const PAPER = { r: 244, g: 239, b: 230, a: 255 };

function insideBookmark(x, y) {
  if (x < 4.5 || x > 19.5 || y < 3.5 || y > 21.1) return false;

  const r = 2.5;
  if (y < 6) {
    if (x < 7) {
      const dx = x - 7;
      const dy = y - 6;
      if (dx * dx + dy * dy > r * r) return false;
    } else if (x > 17) {
      const dx = x - 17;
      const dy = y - 6;
      if (dx * dx + dy * dy > r * r) return false;
    }
  }

  if (x <= 12) {
    const yBottom = 21.1 - 4.4 * ((x - 4.5) / 7.5);
    if (y > yBottom) return false;
  } else {
    const yBottom = 16.7 + 4.4 * ((x - 12) / 7.5);
    if (y > yBottom) return false;
  }

  return true;
}

function render(background) {
  const dim = SIZE * SUPER;
  const png = new PNG({ width: dim, height: dim });
  const pad = dim * 0.14;
  const scale = (dim - pad * 2) / 24;

  for (let py = 0; py < dim; py += 1) {
    for (let px = 0; px < dim; px += 1) {
      const vx = (px + 0.5 - pad) / scale;
      const vy = (py + 0.5 - pad) / scale;
      const fill = insideBookmark(vx, vy);
      const idx = (dim * py + px) << 2;
      const c = fill ? INK : background;
      png.data[idx] = c.r;
      png.data[idx + 1] = c.g;
      png.data[idx + 2] = c.b;
      png.data[idx + 3] = c.a;
    }
  }

  return downsample(png, SIZE);
}

function downsample(src, size) {
  const factor = src.width / size;
  const out = new PNG({ width: size, height: size });
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let oy = 0; oy < factor; oy += 1) {
        for (let ox = 0; ox < factor; ox += 1) {
          const sx = x * factor + ox;
          const sy = y * factor + oy;
          const idx = (src.width * sy + sx) << 2;
          r += src.data[idx];
          g += src.data[idx + 1];
          b += src.data[idx + 2];
          a += src.data[idx + 3];
        }
      }
      const n = factor * factor;
      const o = (size * y + x) << 2;
      out.data[o] = Math.round(r / n);
      out.data[o + 1] = Math.round(g / n);
      out.data[o + 2] = Math.round(b / n);
      out.data[o + 3] = Math.round(a / n);
    }
  }
  return out;
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const pngPath = path.join(OUT_DIR, 'logo.png');
  const jpgPath = path.join(OUT_DIR, 'logo.jpg');
  const jpgSource = path.join(OUT_DIR, '.logo-jpg-source.png');

  fs.writeFileSync(pngPath, PNG.sync.write(render({ r: 0, g: 0, b: 0, a: 0 })));
  fs.writeFileSync(jpgSource, PNG.sync.write(render(PAPER)));

  execSync(`sips -s format jpeg -s formatOptions 90 "${jpgSource}" --out "${jpgPath}"`, {
    stdio: 'pipe',
  });
  fs.unlinkSync(jpgSource);

  console.log(`[logo] ${pngPath}`);
  console.log(`[logo] ${jpgPath}`);
}

main();
