#!/usr/bin/env node
/**
 * Generates PNG extension icons from the project SVG bookmark mark.
 * Uses macOS `sips` when available; falls back to a solid-color PNG via pngjs.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SVG = path.join(ROOT, 'public/images/download.svg');
const OUT_DIR = path.join(ROOT, 'extension/assets/icons');
const SIZES = [16, 32, 48, 128];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function generateWithSips(size, outPath) {
  execSync(`sips -s format png -z ${size} ${size} "${SVG}" --out "${outPath}"`, {
    stdio: 'pipe',
  });
}

function generateFallback(size, outPath) {
  let PNG;
  try {
    PNG = require('pngjs').PNG;
  } catch {
    console.warn('[icons] pngjs not installed; skipping fallback icon generation');
    return false;
  }

  const png = new PNG({ width: size, height: size });
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const idx = (size * y + x) << 2;
      png.data[idx] = 196;
      png.data[idx + 1] = 73;
      png.data[idx + 2] = 29;
      png.data[idx + 3] = 255;
    }
  }

  fs.writeFileSync(outPath, PNG.sync.write(png));
  return true;
}

function main() {
  ensureDir(OUT_DIR);

  for (const size of SIZES) {
    const outPath = path.join(OUT_DIR, `icon${size}.png`);
    try {
      generateWithSips(size, outPath);
      console.log(`[icons] ${path.basename(outPath)}`);
    } catch (err) {
      console.warn(`[icons] sips failed for ${size}px: ${err.message}`);
      if (!generateFallback(size, outPath)) {
        throw new Error(`Unable to generate icon${size}.png`);
      }
    }
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
