/**
 * Merges the harvested DBLP files in scripts/import/ into src/data/publications.json.
 *
 *   node scripts/merge-imports.mjs [--dry]
 *
 * Existing entries always win: nothing already in publications.json is touched.
 * Imported entries are flagged `needsReview: true` until a human has checked them.
 */
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const OUT = 'src/data/publications.json';
const DIR = 'scripts/import';
const dry = process.argv.includes('--dry');

/* ---------- conservative theme tagging ----------
   Only strong, unambiguous signals. A paper that matches nothing stays
   untagged, which is the honest outcome for work that predates the current
   five themes (software product lines, semantic web, critical infrastructure). */
const RULES = [
  ['responsible-information-access', /\b(gender|bias|biases|fair|fairness|de-bias|debias|stereotyp|ethics|responsible ai|equit)/i],
  ['robustness-and-adversarial-ir',  /\b(adversarial|attack|attacks|poison|perturbation|robust|manipulat|misinformation|dis\/misinformation)/i],
  ['ai-and-scientific-integrity',    /\b(peer review|peer-review|reviewer|research integrity|scholarly|citation|review quality|claim verification)/i],
  ['neural-ranking',                 /\b(rank|ranking|ranker|retriev|query|search|relevance|embedding|index|team formation|expert find|question answering)/i],
  ['information-people-society',     /\b(social|twitter|reddit|user interest|communit|immigrant|worker|labor|labour|dao|court|behaviou?r|society|interests)/i],
];

const themesFor = (title, venue) => {
  const hay = `${title} ${venue}`;
  return RULES.filter(([, re]) => re.test(hay)).map(([id]) => id);
};

const key = (t) => t.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 64);

const slug = (s) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/* ---------- load ---------- */
const existing = JSON.parse(await readFile(OUT, 'utf8')).publications;
const seen = new Map(existing.map((e) => [key(e.title), e]));

const files = (await readdir(DIR)).filter((f) => f.endsWith('.json')).sort();
const incoming = [];
for (const f of files) {
  const rows = JSON.parse(await readFile(join(DIR, f), 'utf8'));
  incoming.push(...rows);
  console.log(`${f}: ${rows.length}`);
}

/* ---------- merge ---------- */
const added = [];
const ids = new Set(existing.map((e) => e.id));
let dupes = 0;

for (const row of incoming) {
  const k = key(row.title);
  if (seen.has(k)) {
    // Same title, different year = a preprint and its published version. Keep both
    // only when the years differ by more than one; otherwise treat as a duplicate.
    const prior = seen.get(k);
    if (Math.abs((prior.year ?? 0) - row.year) <= 1) { dupes++; continue; }
  }

  const first = row.authors?.[0]?.split(',')[0] ?? 'anon';
  const stem = `${row.year}-${slug(first)}-${slug(row.title.split(/[:\-–—]/)[0]).slice(0, 34)}`;
  let id = stem, n = 2;
  while (ids.has(id)) id = `${stem}-${n++}`;
  ids.add(id);

  const entry = {
    id,
    title: row.title.replace(/\.$/, ''),
    authors: row.authors,
    venue: row.venue,
    year: row.year,
    type: row.type,
    themes: themesFor(row.title, row.venue),
    links: {},
    needsReview: true,
  };
  if (row.venueShort) entry.venueShort = row.venueShort;

  added.push(entry);
  seen.set(k, entry);
}

const merged = [...existing, ...added].sort(
  (a, b) => b.year - a.year || a.title.localeCompare(b.title),
);

const years = merged.map((p) => p.year);
const tagged = merged.filter((p) => p.themes.length > 0).length;

console.log(`\nexisting ${existing.length}  incoming ${incoming.length}  duplicates skipped ${dupes}`);
console.log(`added ${added.length}  ->  TOTAL ${merged.length}`);
console.log(`years ${Math.min(...years)}–${Math.max(...years)}`);
console.log(`theme-tagged ${tagged}/${merged.length}`);

const byYear = {};
for (const p of merged) byYear[p.year] = (byYear[p.year] ?? 0) + 1;
console.log('\nper year:');
console.log(Object.entries(byYear).sort((a, b) => b[0] - a[0]).map(([y, n]) => `  ${y}  ${n}`).join('\n'));

if (dry) { console.log('\nDry run — nothing written.'); process.exit(0); }
await writeFile(OUT, JSON.stringify({ publications: merged }, null, 2) + '\n');
console.log(`\nWrote ${OUT}`);
