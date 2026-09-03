/**
 * Flattens a built page into ONE self-contained HTML fragment suitable for
 * publishing as a preview. Inlines every local stylesheet and module script,
 * keeps the Google Fonts link, and drops the document skeleton.
 *
 *   node scripts/preview.mjs <route> <outfile>
 *   node scripts/preview.mjs / preview-home.html
 */
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const route = process.argv[2] ?? '/';
const out = process.argv[3] ?? 'preview.html';

const file = join('dist', route === '/' ? 'index.html' : route.replace(/^\/|\/$/g, '') + '/index.html');
let html = await readFile(file, 'utf8');

// --- inline local stylesheets -------------------------------------------------
const cssLinks = [...html.matchAll(/<link[^>]+rel="stylesheet"[^>]*href="(\/[^"]+\.css)"[^>]*>/g)];
for (const [tag, href] of cssLinks) {
  const css = await readFile(join('dist', href), 'utf8');
  html = html.replace(tag, `<style>${css}</style>`);
}

// --- inline local module scripts ---------------------------------------------
const jsTags = [...html.matchAll(/<script[^>]*src="(\/[^"]+\.js)"[^>]*><\/script>/g)];
for (const [tag, src] of jsTags) {
  const js = await readFile(join('dist', src), 'utf8');
  html = html.replace(tag, `<script type="module">${js}</script>`);
}

// --- strip the document skeleton; the host supplies it ------------------------
const title = html.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? 'LS3';
const fonts = [...html.matchAll(/<link[^>]+fonts\.googleapis[^>]*>/g)].map((m) => m[0]).join('\n');
const styles = [...html.matchAll(/<style>[\s\S]*?<\/style>/g)].map((m) => m[0]).join('\n');
const body = html.match(/<body[^>]*>([\s\S]*)<\/body>/)?.[1] ?? '';

// Internal navigation would 404 inside a single-page preview.
const nav = body
  .replace(/href="\/(?!\/)[^"]*"/g, 'href="#"')
  .replace(/<a class="skip" href="#">/, '<a class="skip" href="#main">');

const banner = `
<div style="font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11.5px;letter-spacing:.1em;
            text-transform:uppercase;background:#0B2B63;color:#FFC629;padding:9px 16px;text-align:center">
  Static preview of the home page · internal links are disabled
</div>`;

await writeFile(
  out,
  `<title>${title}</title>\n${fonts}\n${styles}\n${banner}\n${nav}\n`,
);
console.log(`${out} written (${Math.round((await readFile(out)).length / 1024)} KB)`);
