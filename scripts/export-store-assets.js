#!/usr/bin/env node
/**
 * Export Chrome Web Store and Edge Add-ons graphic assets.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { PNG } = require('pngjs');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'store-assets');
const SRC = path.join(OUT, 'src');
const SHOTS = path.join(ROOT, 'public/images/screenshots');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

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

function renderIcon(size) {
  const png = new PNG({ width: size, height: size });
  const pad = size * 0.12;
  const scale = (size - pad * 2) / 24;
  for (let py = 0; py < size; py += 1) {
    for (let px = 0; px < size; px += 1) {
      const vx = (px + 0.5 - pad) / scale;
      const vy = (py + 0.5 - pad) / scale;
      const fill = insideBookmark(vx, vy);
      const idx = (size * py + px) << 2;
      const c = fill ? INK : PAPER;
      png.data[idx] = c.r;
      png.data[idx + 1] = c.g;
      png.data[idx + 2] = c.b;
      png.data[idx + 3] = 255;
    }
  }
  return png;
}

function sipsInfo(file) {
  const out = execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', file], {
    encoding: 'utf8',
  });
  const width = Number(out.match(/pixelWidth:\s+(\d+)/)[1]);
  const height = Number(out.match(/pixelHeight:\s+(\d+)/)[1]);
  return { width, height };
}

function toJpeg(src, dest) {
  execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '90', src, '--out', dest], {
    stdio: 'pipe',
  });
}

function screenshotHtml(htmlFile, width, height, destPng) {
  const url = `file://${htmlFile}`;
  execFileSync(
    CHROME,
    [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
      `--window-size=${width},${height}`,
      '--virtual-time-budget=4000',
      `--screenshot=${destPng}`,
      url,
    ],
    { stdio: 'pipe' }
  );
}

function fitOnCanvas(src, destJpg, canvasW, canvasH, padHex) {
  const { width, height } = sipsInfo(src);
  const maxW = canvasW - 80;
  const maxH = canvasH - 80;
  const scale = Math.min(maxW / width, maxH / height, 1);
  const nw = Math.max(1, Math.round(width * scale));
  const nh = Math.max(1, Math.round(height * scale));
  const tmp = destJpg.replace(/\.jpg$/, '.tmp.png');

  execFileSync('sips', ['--resampleHeightWidth', String(nh), String(nw), src, '--out', tmp], {
    stdio: 'pipe',
  });
  execFileSync(
    'sips',
    ['--padToHeightWidth', String(canvasH), String(canvasW), '--padColor', padHex, tmp],
    { stdio: 'pipe' }
  );
  const padded = sipsInfo(tmp);
  if (padded.width !== canvasW || padded.height !== canvasH) {
    execFileSync('sips', ['-z', String(canvasH), String(canvasW), tmp], { stdio: 'pipe' });
  }
  toJpeg(tmp, destJpg);
  fs.unlinkSync(tmp);
}

function main() {
  fs.mkdirSync(path.join(OUT, 'screenshots'), { recursive: true });

  const iconPath = path.join(OUT, 'icon-128.png');
  fs.writeFileSync(iconPath, PNG.sync.write(renderIcon(128)));
  console.log('[store] icon-128.png');

  const smallPng = path.join(OUT, 'small-tile-440x280.png');
  const smallJpg = path.join(OUT, 'small-tile-440x280.jpg');
  screenshotHtml(path.join(SRC, 'small-tile.html'), 440, 280, smallPng);
  toJpeg(smallPng, smallJpg);
  fs.unlinkSync(smallPng);
  console.log('[store] small-tile-440x280.jpg');

  const largePng = path.join(OUT, 'large-tile-1400x560.png');
  const largeJpg = path.join(OUT, 'large-tile-1400x560.jpg');
  screenshotHtml(path.join(SRC, 'large-tile.html'), 1400, 560, largePng);
  toJpeg(largePng, largeJpg);
  fs.unlinkSync(largePng);
  console.log('[store] large-tile-1400x560.jpg');

  const shots = [
    {
      src: 'Screenshot 2026-08-18 at 20.45.41.png',
      dest: '01-sign-in-1280x800.jpg',
      pad: 'F4EFE6',
    },
    {
      src: 'Screenshot 2026-08-18 at 20.45.15.png',
      dest: '02-create-account-1280x800.jpg',
      pad: '12100E',
    },
    {
      src: 'Screenshot 2026-08-18 at 20.46.30.png',
      dest: '03-library-1280x800.jpg',
      pad: 'F4EFE6',
    },
    {
      src: 'Screenshot 2026-08-18 at 20.46.57.png',
      dest: '04-add-collection-1280x800.jpg',
      pad: '12100E',
    },
    {
      src: 'Screenshot 2026-08-18 at 20.46.42.png',
      dest: '05-library-dark-1280x800.jpg',
      pad: '12100E',
    },
  ];

  for (const shot of shots) {
    fitOnCanvas(
      path.join(SHOTS, shot.src),
      path.join(OUT, 'screenshots', shot.dest),
      1280,
      800,
      shot.pad
    );
    console.log(`[store] screenshots/${shot.dest}`);
  }
}

main();
