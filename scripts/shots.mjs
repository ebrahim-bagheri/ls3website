import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import { join, extname } from 'node:path';

const ROOT = join(process.cwd(), 'dist');
const TYPES = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.svg': 'image/svg+xml', '.xml': 'application/xml', '.png': 'image/png',
  '.txt': 'text/plain', '.json': 'application/json', '.woff2': 'font/woff2',
};

const server = createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = join(ROOT, p);
  try {
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
  } catch {
    file = join(ROOT, '404.html');
  }
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end('nf');
  }
});

await new Promise((r) => server.listen(4321, r));
const base = 'http://localhost:4321';

await mkdir('shots', { recursive: true });
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });

const pages = [
  ['home', '/'],
  ['research', '/research/'],
  ['theme', '/research/ai-and-scientific-integrity/'],
  ['publications', '/publications/'],
  ['people', '/people/'],
  ['alumni', '/people/alumni/'],
  ['join', '/join/'],
  ['news', '/news/'],
  ['contact', '/contact/'],
  ['styleguide', '/styleguide/'],
  ['projects', '/projects/'],
];

for (const [name, path] of pages) {
  for (const [tag, opts] of [
    ['light', { viewport: { width: 1440, height: 1000 }, colorScheme: 'light' }],
    ['dark', { viewport: { width: 1440, height: 1000 }, colorScheme: 'dark' }],
  ]) {
    const ctx = await browser.newContext(opts);
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto(base + path, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    await page.screenshot({ path: `shots/${name}-${tag}.png`, fullPage: tag === 'light' });
    if (errors.length) console.log(`JS ERRORS on ${path} [${tag}]:`, errors);
    await ctx.close();
  }
}

// mobile
const m = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const mp = await m.newPage();
await mp.goto(base + '/', { waitUntil: 'networkidle' });
await mp.screenshot({ path: 'shots/home-mobile.png', fullPage: true });
await mp.close();

// horizontal-overflow check
const chk = await browser.newContext({ viewport: { width: 375, height: 800 } });
const cp = await chk.newPage();
for (const [name, path] of pages) {
  await cp.goto(base + path, { waitUntil: 'networkidle' });
  const over = await cp.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  if (over > 1) console.log(`OVERFLOW ${path}: +${over}px at 375w`);
}
await chk.close();

await browser.close();
server.close();
console.log('shots done');
