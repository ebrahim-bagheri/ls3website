import { defineCollection } from 'astro:content';
import { z } from 'astro:schema';
import { glob, file } from 'astro/loaders';

/** The single taxonomy. Publications and people all tag into it. */
export const THEMES = [
  'responsible-information-access',
  'robustness-and-adversarial-ir',
  'ai-and-scientific-integrity',
  'neural-ranking',
  'information-people-society',
] as const;

const themeEnum = z.enum(THEMES);

/*
 * Derived from `z` itself rather than imported from 'zod'. The zod package is
 * not a declared dependency — it resolves only because Astro happens to pull
 * it in — so importing from it directly would break on any install that
 * hoisted things differently.
 */
type AnySchema = Parameters<typeof z.array>[0];
type Shape = Parameters<typeof z.object>[0];

/* ---------------------------------------------------------------------------
 * Tolerant field types
 *
 * The CMS does not write the file the way a person writing JSON by hand would.
 * A field the editor never touched is written as `null`, and a text box they
 * cleared is written as `""`. Neither is `undefined`, so a plain `.optional()`
 * rejects both — and because content is validated at build time, one untouched
 * box in one entry fails the whole build and the site stops updating.
 *
 * That is a terrible failure mode for a site whose entire point is that
 * non-technical people can edit it safely. So: null and empty string mean "not
 * set", which is what the editor meant by leaving it alone.
 *
 * The same reasoning removes URL and length validation from editor-facing
 * fields. Someone pasting `www.example.com` without the `https://`, or writing
 * a summary thirty characters too long, should get a slightly untidy page —
 * not a dead deploy they cannot diagnose. Guidance for those fields lives in
 * `public/admin/config.yml` as hints, where an editor actually sees it.
 * ------------------------------------------------------------------------- */

const isBlank = (v: unknown): boolean => v === null || v === undefined || v === '';

/** Coerce to a finite number, or `undefined` if it isn't one. */
const toNumber = (v: unknown): number | undefined => {
  if (isBlank(v)) return undefined;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : undefined;
};

/*
 * These all use `z.preprocess` rather than `.transform()`. Both normalise the
 * value, but preprocess runs BEFORE validation and leaves the declared output
 * type intact — a transform returning `v ?? {}` widens the type to `{} | Shape`,
 * which TypeScript narrows to `{}`, and every `links.scholar` in the templates
 * stops type-checking.
 */

/** Optional text. `null` and `""` both mean "not set". */
const optText = z.preprocess((v) => (isBlank(v) ? undefined : v), z.string().optional());

/**
 * Optional URL. Deliberately NOT `.url()` — see the note above. A malformed
 * link renders as a link that does not work, which is visible and fixable. A
 * malformed link that fails the build is neither.
 */
const optUrl = optText;

/** Optional number. Accepts the string a number input can produce. */
const optNumber = z.preprocess(toNumber, z.number().optional());

/** Number with a fallback, for ordering fields the editor may leave blank. */
const numberOr = (fallback: number) =>
  z.preprocess((v) => toNumber(v) ?? fallback, z.number());

/** Boolean with a fallback. An untouched checkbox arrives as `null`. */
const boolOr = (fallback: boolean) =>
  z.preprocess((v) => (v === null || v === undefined ? fallback : v), z.boolean());

/** List that tolerates `null` and treats it as empty. */
const listOf = <T extends AnySchema>(item: T) =>
  z.preprocess((v) => (v === null || v === undefined ? [] : v), z.array(item));

/** Object of optional links, tolerating a `null` object as well as null members. */
const linksOf = <S extends Shape>(shape: S) =>
  z.preprocess((v) => (v === null || v === undefined ? {} : v), z.object(shape).partial());

/* ------------------------------------------------------------------------- */

const themes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/themes' }),
  schema: z.object({
    title: z.string(),
    short: z.string(),
    order: numberOr(100),
    leadQuestion: z.string(),
  }),
});

const people = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/people' }),
  schema: z.object({
    name: z.string(),
    role: z.enum([
      'director', 'faculty', 'research-staff', 'postdoc',
      'phd', 'msc', 'undergrad', 'visitor',
    ]),
    status: z.enum(['current', 'alumni']).default('current'),
    title: optText,                        // e.g. "Professor, Faculty of Information"
    affiliation: optText,
    photo: optText,                        // /people/slug.jpg in public/
    startYear: optNumber,
    gradYear: optNumber,
    /** Where an alum is now. The most persuasive recruiting content we have. */
    nowAt: optText,
    interests: listOf(z.string()),
    themes: listOf(themeEnum),
    email: optText,
    links: linksOf({
      website: optUrl,
      scholar: optUrl,
      github: optUrl,
      orcid: optUrl,
      linkedin: optUrl,
    }),
    order: numberOr(100),
    /** Set true on hand-written entries so the importer never overwrites them. */
    manual: boolOr(false),
  }),
});

const publications = defineCollection({
  // The file is an object with a `publications` array rather than a bare array,
  // because that is the shape the CMS's list widget can edit.
  loader: file('./src/data/publications.json', {
    parser: (text) => JSON.parse(text).publications,
  }),
  schema: z.object({
    id: z.string(),
    title: z.string(),
    authors: listOf(z.string()),           // "Family, Given" — printed order
    venue: z.string(),
    venueShort: optText,
    year: z.coerce.number(),
    type: z.enum(['journal', 'conference', 'workshop', 'preprint', 'thesis', 'book-section', 'patent']),
    themes: listOf(themeEnum),
    award: optText,
    abstract: optText,
    links: linksOf({
      pdf: optUrl,
      arxiv: optUrl,
      doi: optUrl,
      code: optUrl,
      data: optUrl,
      video: optUrl,
    }),
    bibtex: optText,
    featured: boolOr(false),
    /* Set by scripts/openalex.mjs on machine-imported entries. Remove the flag
       once a human has checked the venue name, authors and theme tags. */
    needsReview: boolOr(false),
    openalexId: optText,
    citedBy: optNumber,
  }),
});


/**
 * Page copy. These files exist so the CMS can edit the words on the site without
 * touching code. Fields are deliberately loose — an editor should never see a
 * validation error for prose.
 */
const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    eyebrow: optText,
    intro: optText,

    // home
    heading: optText,
    highlight: optText,
    lede: optText,
    ctaPrimary: optText,
    ctaSecondary: optText,
    themesHeading: optText,
    publicationsHeading: optText,

    // join
    statusLabel: optText,
    statusText: optText,
    emailSubject: optText,
    officialLinks: listOf(z.object({ label: z.string(), url: z.string() })),

    // contact
    movedNoteLabel: optText,
    movedNote: optText,
    directions: listOf(z.string()),
  }),
});

export const collections = { themes, people, publications, pages };
