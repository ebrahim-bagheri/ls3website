/**
 * Pull the lab's publication record from OpenAlex and merge it into
 * src/data/publications.json.
 *
 *   node scripts/openalex.mjs --search "Ebrahim Bagheri"   # find the author id
 *   node scripts/openalex.mjs --author A5012345678          # fetch and merge
 *   node scripts/openalex.mjs --author A5012345678 --dry    # show, don't write
 *
 * OpenAlex is free and needs no key. Sending a contact address puts you in the
 * "polite pool", which is faster and is simply good manners.
 *
 * SAFETY: entries already in publications.json are never overwritten. New ones
 * are appended with `"needsReview": true` so you can find them, check them, and
 * delete the flag. Machine-harvested metadata is good but not clean — expect to
 * fix venue names and drop a few papers by other people with the same surname.
 */
import { readFile, writeFile } from 'node:fs/promises';

const MAILTO = 'ebrahim.bagheri@utoronto.ca';
const OUT = 'src/data/publications.json';
const API = 'https://api.openalex.org';

const arg = (flag) => {
  const i = process.argv.indexOf(flag);
  return i === -1 ? null : process.argv[i + 1] ?? true;
};

const get = async (url) => {
  const res = await fetch(`${url}${url.includes('?') ? '&' : '?'}mailto=${MAILTO}`, {
    headers: { 'User-Agent': `LS3-site (${MAILTO})` },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.json();
};

/* ---------------- find the author id ---------------- */
if (arg('--search')) {
  const q = encodeURIComponent(arg('--search'));
  const { results } = await get(`${API}/authors?search=${q}`);
  for (const a of results.slice(0, 8)) {
    const inst = a.last_known_institutions?.map((i) => i.display_name).join(', ') || '—';
    console.log(
      `${a.id.replace('https://openalex.org/', '').padEnd(12)} ${a.display_name.padEnd(28)} ` +
      `works=${String(a.works_count).padStart(4)} cited=${String(a.cited_by_count).padStart(6)}  ${inst}`,
    );
  }
  console.log('\nPick the right id, then: node scripts/openalex.mjs --author <ID>');
  process.exit(0);
}

const authorId = arg('--author');
if (!authorId) {
  console.error('Need --search "Name" or --author <OpenAlex author id>');
  process.exit(1);
}

/* ---------------- fetch every work, paginated ---------------- */
const works = [];
let cursor = '*';
while (cursor) {
  const page = await get(
    `${API}/works?filter=author.id:${authorId}&per-page=200&cursor=${cursor}`,
  );
  works.push(...page.results);
  cursor = page.meta.next_cursor;
  process.stderr.write(`\rfetched ${works.length}/${page.meta.count}`);
}
process.stderr.write('\n');

/* ---------------- map OpenAlex -> our schema ---------------- */
const TYPE = {
  article: 'journal',
  'proceedings-article': 'conference',
  preprint: 'preprint',
  'book-chapter': 'book-section',
  dissertation: 'thesis',
  book: 'book-section',
};

// "Proceedings of the 49th International ACM SIGIR Conference on ..." -> "SIGIR"
const ACRONYMS = /\b(SIGIR|CIKM|ECIR|WSDM|EMNLP|NAACL|ACL|ICWSM|KDD|WWW|ICTIR|AAAI|IJCAI|COLING|RecSys|TheWebConf)\b/;

const shortVenue = (name, year) => {
  if (!name) return undefined;
  const m = name.match(ACRONYMS);
  return m ? `${m[1]} ${year}` : undefined;
};

const slug = (s) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48);

const mapped = works
  .filter((w) => w.title && w.publication_year)
  .map((w) => {
    const authors = (w.authorships ?? []).map((a) => {
      const parts = a.raw_author_name?.trim().split(/\s+/) ?? [];
      if (parts.length < 2) return a.raw_author_name ?? a.author?.display_name ?? '';
      return `${parts.at(-1)}, ${parts.slice(0, -1).join(' ')}`;
    });
    const venue =
      w.primary_location?.source?.display_name ??
      w.locations?.find((l) => l.source?.display_name)?.source?.display_name ??
      'Unpublished';
    const first = authors[0]?.split(',')[0] ?? 'anon';

    const links = {};
    if (w.doi) links.doi = w.doi;
    const oa = w.best_oa_location?.pdf_url ?? w.open_access?.oa_url;
    if (oa) links.pdf = oa;

    return {
      id: `${w.publication_year}-${slug(first)}-${slug(w.title.split(/[:\-–]/)[0])}`,
      title: w.title,
      authors,
      venue,
      venueShort: shortVenue(venue, w.publication_year),
      year: w.publication_year,
      type: TYPE[w.type] ?? 'conference',
      themes: [],
      links,
      needsReview: true,
      openalexId: w.id,
      citedBy: w.cited_by_count,
    };
  });

/* ---------------- merge, never clobber ---------------- */
const existing = JSON.parse(await readFile(OUT, 'utf8')).publications;
const seen = new Set(
  existing.map((e) => e.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 60)),
);

const fresh = mapped.filter((m) => {
  const k = m.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 60);
  if (seen.has(k)) return false;
  seen.add(k);
  return true;
});

fresh.sort((a, b) => b.year - a.year || a.title.localeCompare(b.title));

console.log(`\n${works.length} works from OpenAlex`);
console.log(`${existing.length} already in ${OUT}`);
console.log(`${fresh.length} new (flagged needsReview)`);
const years = fresh.map((f) => f.year);
if (years.length) console.log(`years ${Math.min(...years)}–${Math.max(...years)}`);

if (arg('--dry')) {
  console.log('\n--- first 15 ---');
  for (const f of fresh.slice(0, 15)) {
    console.log(`${f.year}  ${f.venueShort ?? f.venue.slice(0, 38).padEnd(38)}  ${f.title.slice(0, 76)}`);
  }
  console.log('\nDry run: nothing written.');
  process.exit(0);
}

await writeFile(OUT, JSON.stringify({ publications: [...existing, ...fresh] }, null, 2) + '\n');
console.log(`\nWrote ${OUT}. Now: search for "needsReview" and check each one.`);
console.log('Expect to fix venue names, drop wrong-author papers, and add themes.');
