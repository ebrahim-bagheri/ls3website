/**
 * Flattens the entire built site into ONE navigable HTML file.
 *
 * Every page becomes a <template>, internal links are rewritten to hash routes,
 * and a small router swaps the body content. The result behaves like the real
 * site — you can click through all of it — but it is a single file that can be
 * published, emailed, or opened offline.
 *
 *   npm run build && node scripts/bundle-preview.mjs out.html
 */
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';

const DIST = 'dist';
const out = process.argv[2] ?? 'site-preview.html';

/* ---------- collect every built page ---------- */
async function walk(dir) {
  const found = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) found.push(...(await walk(p)));
    else if (e.name.endsWith('.html')) found.push(p);
  }
  return found;
}

// The CMS is a live app that needs GitHub auth; it cannot work inside an
// offline single-file preview, so it is left out rather than shipped broken.
const files = (await walk(DIST)).sort().filter((f) => !f.includes('/admin/'));

/* ---------- one CSS bundle for all of them ---------- */
const cssHrefs = new Set();
const inlineCss = new Set();   // Astro inlines small scoped stylesheets in <head>
const assetSrcs = new Set();
const pages = [];

for (const file of files) {
  const html = await readFile(file, 'utf8');
  const head = html.match(/<head[^>]*>([\s\S]*?)<\/head>/)?.[1] ?? '';

  for (const m of html.matchAll(/<link[^>]+rel="stylesheet"[^>]*href="(\/[^"]+\.css)"[^>]*>/g)) {
    cssHrefs.add(m[1]);
  }
  // Miss these and per-page scoped styles vanish — grids collapse, borders go.
  for (const m of head.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) {
    if (m[1].trim()) inlineCss.add(m[1]);
  }

  const rel = '/' + relative(DIST, file).replace(/\\/g, '/');
  const route = rel === '/404.html' ? '/404/' : rel.replace(/index\.html$/, '');
  const title = html.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? 'LS3';
  let body = html.match(/<body[^>]*>([\s\S]*)<\/body>/)?.[1] ?? '';

  // Strip EVERY script from the page body. Astro inlines small component
  // scripts, and a <script> inside a <template> re-executes each time the
  // template is cloned into the document — which quietly stacks up duplicate
  // listeners (a theme toggle that fires twice and appears not to work).
  // The router below provides this behaviour once, via delegation.
  body = body.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');

  // Internal links -> hash routes. Leave mailto:, http(s):, and #anchors alone.
  body = body.replace(/href="(\/[^"#][^"]*)"/g, (_, href) => `href="#${href}"`);
  body = body.replace(/href="\/"/g, 'href="#/"');

  // Responsive srcset/sizes would win over src and point at paths that do not
  // exist inside a single file, so they are dropped; src alone is inlined below.
  body = body.replace(/\s(?:srcset|sizes)="[^"]*"/g, '');

  // Images point at site-absolute paths that do not exist in a single file, so
  // they are embedded as data URIs. Collected here, resolved after the loop.
  for (const m of body.matchAll(/src="(\/[^"]+\.(?:svg|png|jpe?g|webp|avif))"/g)) {
    assetSrcs.add(m[1]);
  }

  pages.push({ route, title, body });
}

/* ---------- embed referenced images as data URIs ---------- */
const MIME = {
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif',
};
const dataUris = new Map();
for (const src of assetSrcs) {
  try {
    const buf = await readFile(join(DIST, src));
    const ext = src.slice(src.lastIndexOf('.')).toLowerCase();
    dataUris.set(src, `data:${MIME[ext] ?? 'application/octet-stream'};base64,${buf.toString('base64')}`);
  } catch {
    console.warn(`  ! missing asset ${src}`);
  }
}
for (const pg of pages) {
  for (const [src, uri] of dataUris) {
    pg.body = pg.body.split(`src="${src}"`).join(`src="${uri}"`);
  }
}
if (dataUris.size) console.log(`embedded ${dataUris.size} image(s)`);

let css = '';
for (const href of cssHrefs) css += await readFile(join(DIST, href), 'utf8') + '\n';
for (const block of inlineCss) css += block + '\n';
console.log(`css: ${cssHrefs.size} linked file(s) + ${inlineCss.size} inline block(s)`);

const home = pages.find((p) => p.route === '/');
const fonts =
  '<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Literata:opsz,wght@7..72,400;7..72,600;7..72,700&family=Public+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap">';

const templates = pages
  .map((p) => `<template data-route="${p.route}" data-title="${p.title.replace(/"/g, '&quot;')}">${p.body}</template>`)
  .join('\n');

const ROUTER = String.raw`
(function () {
  var app = document.getElementById('app');
  var tpls = {};
  document.querySelectorAll('template[data-route]').forEach(function (t) {
    tpls[t.dataset.route] = t;
  });

  /* One delegated listener for the whole document, attached exactly once.
     Re-binding per render is how you end up toggling the theme twice per click. */
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;

    var burger = t.closest('.menu-btn');
    if (burger) {
      var header = burger.closest('.site-header');
      if (header) {
        var open = header.classList.toggle('open');
        burger.setAttribute('aria-expanded', String(open));
      }
      return;
    }

    if (t.closest('.theme-btn')) {
      var root = document.documentElement;
      var cur = root.getAttribute('data-theme') ||
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      var next = cur === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('ls3-theme', next); } catch (err) {}
      return;
    }

    var chip = t.closest('#filters .chip');
    if (chip) {
      var facet = chip.dataset.facet;
      app.querySelectorAll('.chip[data-facet="' + facet + '"]').forEach(function (c) {
        c.classList.toggle('on', c === chip);
      });
      applyFilters();
    }
  });

  function applyFilters() {
    var results = app.querySelector('#results');
    if (!results) return;
    var pick = function (f) {
      var on = app.querySelector('.chip[data-facet="' + f + '"].on');
      return on ? on.dataset.value : 'all';
    };
    var year = pick('year'), type = pick('type'), theme = pick('theme');
    var shown = 0;

    results.querySelectorAll('.row').forEach(function (row) {
      var ok =
        (year === 'all' || row.dataset.year === year) &&
        (type === 'all' || row.dataset.type === type) &&
        (theme === 'all' || (row.dataset.themes || '').split(' ').indexOf(theme) !== -1);
      row.classList.toggle('hide', !ok);
      if (ok) shown++;
    });
    results.querySelectorAll('.yeargroup').forEach(function (g) {
      g.classList.toggle('hide', g.querySelectorAll('.row:not(.hide)').length === 0);
    });

    var countEl = app.querySelector('#count');
    if (countEl) countEl.textContent = shown + ' publication' + (shown === 1 ? '' : 's');
  }

  function normalise(r) {
    if (!r || r === '#' || r === '#/') return '/';
    r = r.replace(/^#/, '');
    if (!r.startsWith('/')) r = '/' + r;
    if (!r.endsWith('/') && !r.includes('.')) r += '/';
    return r;
  }

  function render(route) {
    var t = tpls[route] || tpls['/404/'] || tpls['/'];
    app.innerHTML = '';
    app.appendChild(t.content.cloneNode(true));
    document.title = t.dataset.title || 'LS3';
    wire();
    window.scrollTo(0, 0);
  }

  /* Per-render work only: no listener binding happens here. */
  function wire() {
    applyFilters();
  }

  window.addEventListener('hashchange', function () { render(normalise(location.hash)); });
  render(normalise(location.hash));

  try {
    var saved = localStorage.getItem('ls3-theme');
    if (saved === 'dark' || saved === 'light') document.documentElement.setAttribute('data-theme', saved);
  } catch (e) {}
})();
`;

const BANNER = `
<div id="pv-banner">
  <span class="d"></span>
  <span>Offline preview of the LS3 site — all ${pages.length} pages, fully clickable</span>
  <a href="#/">Home</a>
</div>
<style>
  #pv-banner {
    position: sticky; top: 0; z-index: 90;
    display: flex; align-items: center; gap: 10px; justify-content: center;
    background: #0B2B63; color: #FFC629;
    font-family: "JetBrains Mono", ui-monospace, monospace;
    font-size: 11px; letter-spacing: .1em; text-transform: uppercase;
    padding: 8px 16px; text-align: center;
  }
  #pv-banner a { color: #fff; text-decoration: underline; }
  #pv-banner .d { width: 6px; height: 6px; border-radius: 50%; background: #FFC629; flex: none; }
  /* the real site header sticks under the banner */
  #app .site-header { top: 33px; }
</style>`;

const doc = `<title>LS3 Site Preview</title>
${fonts}
<style>${css}</style>
${BANNER}
<div id="app"></div>
${templates}
<script>${ROUTER}</script>
`;

await writeFile(out, doc);
console.log(`${out} — ${pages.length} pages, ${Math.round(doc.length / 1024)} KB`);
console.log(pages.map((p) => '  ' + p.route).join('\n'));
