import { getCollection } from 'astro:content';
import { readdirSync, existsSync } from 'node:fs';
import { nameKey } from './format';

/**
 * Photos are picked up automatically: drop `public/people/<slug>.jpg` into the
 * repo and it appears. No frontmatter edit needed — which matters, because the
 * person adding photos is usually not the person who wrote the profile.
 * An explicit `photo:` in frontmatter still wins.
 */
const PHOTO_DIR = 'public/people';
const EXT = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];

let photoIndex: Map<string, string> | null = null;

export function photoFor(slug: string, explicit?: string): string | undefined {
  if (explicit) return explicit;
  if (!photoIndex) {
    photoIndex = new Map();
    if (existsSync(PHOTO_DIR)) {
      for (const file of readdirSync(PHOTO_DIR)) {
        const dot = file.lastIndexOf('.');
        if (dot < 1) continue;
        const base = file.slice(0, dot).toLowerCase();
        if (EXT.includes(file.slice(dot).toLowerCase())) {
          photoIndex.set(base, `/people/${file}`);
        }
      }
    }
  }
  return photoIndex.get(slug.toLowerCase());
}

/**
 * Same idea for one-off assets at the root of public/ — the lab logo, mostly.
 * `assetFor('logo')` finds public/logo.svg, .png, .webp… and returns its URL,
 * or undefined so the caller can fall back. SVG wins when several exist.
 */
const ASSET_EXT = ['.svg', '.png', '.webp', '.avif', '.jpg', '.jpeg'];

export function assetFor(base: string): string | undefined {
  for (const ext of ASSET_EXT) {
    if (existsSync(`public/${base}${ext}`)) return `/${base}${ext}`;
  }
  return undefined;
}

/** Loose name keys for everyone ever in the lab — used to bold names in citations. */
export async function getLabKeys(): Promise<Set<string>> {
  const people = await getCollection('people');
  return new Set(people.map((p) => nameKey(p.data.name)));
}

/** Publications, newest first, then alphabetical by title inside a year. */
export async function getPublications() {
  const pubs = await getCollection('publications');
  return pubs.sort(
    (a, b) => b.data.year - a.data.year || a.data.title.localeCompare(b.data.title),
  );
}

export async function getThemes() {
  const themes = await getCollection('themes');
  return themes.sort((a, b) => a.data.order - b.data.order);
}


/**
 * Page copy from src/content/pages/. Returns the entry's data, or an empty
 * object if the file is missing — a page with no copy file should render with
 * its fallbacks rather than crash the build.
 */
export async function getPageCopy(id: string): Promise<Record<string, any>> {
  const pages = await getCollection('pages');
  return pages.find((p) => p.id === id)?.data ?? {};
}

/** Splits a heading around the phrase to highlight. Returns [before, hit, after]. */
export function splitHighlight(heading: string, phrase?: string): [string, string, string] {
  if (!phrase) return [heading, '', ''];
  const i = heading.indexOf(phrase);
  if (i === -1) return [heading, '', ''];
  return [heading.slice(0, i), phrase, heading.slice(i + phrase.length)];
}
