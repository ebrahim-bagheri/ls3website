/**
 * Turns the lab's logo PNG into the assets the site needs.
 *
 *   node scripts/build-logo.mjs <source.png>
 *
 * The source is a transparent PNG in three flat colours: navy #000080 (the S/L
 * monogram), gold #FBC201 (the superscript 3) and grey #444444 (the tagline).
 * Because the colours are flat and separable, each one is traced to vector
 * independently and reassembled — so the output is a real SVG, sharp at any
 * size, rather than a bitmap that goes soft on a retina screen.
 *
 * Writes into public/:
 *   logo.svg        full lockup, brand colours          (footer, OG card)
 *   logo-dark.svg   same, lifted for dark grounds
 *   logo-mark.svg   monogram only, no tagline           (header)
 *   logo-mark-dark.svg
 *   favicon.svg     monogram on a navy tile
 *
 * Needs `potrace` on PATH (apt-get install potrace).
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const src = process.argv[2];
if (!src) { console.error('usage: node scripts/build-logo.mjs <source.png>'); process.exit(1); }

const tmp = mkdtempSync(join(tmpdir(), 'logo-'));
const py = join(tmp, 'split.py');

/* ---- 1. split the PNG into one bitmap per brand colour ---- */
writeFileSync(py, `
import sys, numpy as np
from PIL import Image

src, out = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGBA')
a = np.array(im)
rgb, alpha = a[:, :, :3].astype(int), a[:, :, 3]
ink = alpha > 20

def mask(c, tol=60):
    return (np.abs(rgb - np.array(c)).sum(axis=2) < tol) & ink

layers = {'navy': (0, 0, 128), 'gold': (251, 194, 1), 'grey': (68, 68, 68)}
masks = {k: mask(v) for k, v in layers.items()}

# Bounding boxes: the monogram is navy+gold, the tagline is grey.
def bbox(m):
    ys, xs = np.where(m)
    return (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)

full = bbox(masks['navy'] | masks['gold'] | masks['grey'])
markbb = bbox(masks['navy'] | masks['gold'])
print('FULL', *full)
print('MARK', *markbb)

# potrace reads PBM: black = ink.
for name, m in masks.items():
    for tag, (x0, y0, x1, y1) in (('full', full), ('mark', markbb)):
        if tag == 'mark' and name == 'grey':
            continue
        sub = m[y0:y1, x0:x1]
        img = Image.fromarray(np.where(sub, 0, 255).astype('uint8'), 'L').convert('1')
        img.save(f'{out}/{tag}-{name}.pbm')
`);

const info = execFileSync('python3', [py, src, tmp]).toString().trim().split('\n');
const dims = Object.fromEntries(info.map((l) => {
  const [k, ...n] = l.split(' ');
  return [k, n.map(Number)];
}));

/* ---- 2. trace each layer ---- */
const trace = (name) => {
  const out = join(tmp, `${name}.svg`);
  execFileSync('potrace', [
    join(tmp, `${name}.pbm`),
    '-s', '-o', out,
    '--flat',
    '-t', '2',          // suppress specks
    '-a', '1.2',        // corner smoothing
    '-O', '0.2',        // curve optimisation tolerance
  ]);
  const svg = readFileSync(out, 'utf8');
  const path = [...svg.matchAll(/<path[^>]*d="([^"]+)"/g)].map((m) => m[1]).join(' ');
  const g = svg.match(/<g([^>]*)>/)?.[1] ?? '';
  return { path, transform: g.match(/transform="([^"]+)"/)?.[1] ?? '' };
};

const compose = (tag, [x0, y0, x1, y1], colours) => {
  const w = x1 - x0, h = y1 - y0;
  const layers = Object.entries(colours).map(([name, fill]) => {
    const { path, transform } = trace(`${tag}-${name}`);
    if (!path.trim()) return '';
    return `<g transform="${transform}" fill="${fill}"><path d="${path}"/></g>`;
  }).filter(Boolean).join('\n  ');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="LS3 — Systems, Software, Semantics">\n  ${layers}\n</svg>\n`;
};

const NAVY = '#000080', GOLD = '#FBC201', GREY = '#444444';
// Lifted for dark grounds: pure navy disappears against near-black, and #444
// tagline text fails contrast entirely.
const NAVY_D = '#9FB4FF', GOLD_D = '#FFC629', GREY_D = '#AAB4C6';

writeFileSync('public/logo.svg',
  compose('full', dims.FULL, { navy: NAVY, gold: GOLD, grey: GREY }));
writeFileSync('public/logo-dark.svg',
  compose('full', dims.FULL, { navy: NAVY_D, gold: GOLD_D, grey: GREY_D }));
writeFileSync('public/logo-mark.svg',
  compose('mark', dims.MARK, { navy: NAVY, gold: GOLD }));
writeFileSync('public/logo-mark-dark.svg',
  compose('mark', dims.MARK, { navy: NAVY_D, gold: GOLD_D }));

/* ---- 3. favicon: the monogram reversed out of a navy tile ---- */
{
  const [x0, y0, x1, y1] = dims.MARK;
  const w = x1 - x0, h = y1 - y0;
  const pad = 0.13;
  const scale = (1 - pad * 2) / Math.max(w, h);
  const dx = (1 - w * scale) / 2, dy = (1 - h * scale) / 2;
  const inner = ['navy', 'gold'].map((name, i) => {
    const { path, transform } = trace(`mark-${name}`);
    return `<g transform="${transform}" fill="${i === 0 ? '#FFFFFF' : GOLD}"><path d="${path}"/></g>`;
  }).join('\n    ');
  writeFileSync('public/favicon.svg',
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1">\n` +
    `  <rect width="1" height="1" rx="0.16" fill="${NAVY}"/>\n` +
    `  <g transform="translate(${dx.toFixed(4)} ${dy.toFixed(4)}) scale(${scale.toFixed(6)})">\n    ${inner}\n  </g>\n</svg>\n`);
}

rmSync(tmp, { recursive: true, force: true });
console.log('wrote public/logo.svg, logo-dark.svg, logo-mark.svg, logo-mark-dark.svg, favicon.svg');
