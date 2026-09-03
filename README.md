# LS3 website

Website for the **Laboratory for Systems, Software and Semantics (LS3)**, Faculty of Information,
University of Toronto. Built with Astro 7, static output, no runtime dependencies.

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # -> dist/
npm run check    # type + content-schema check
```

## Layout

```
src/
  content.config.ts        schemas + the THEMES taxonomy (single source of truth)
  content/
    themes/    5 research themes, Markdown
    people/    one file per person, current and alumni
    news/      one file per news item
  data/
    publications.json      all publications (an object with a `publications` array)
    settings.json          lab name, address, contact, recruiting banner
  content/pages/           editable copy for home, join and contact
  styles/tokens.css        every colour, size and space value in the site
  lib/                     small helpers (name formatting, collection queries)
  components/  layouts/  pages/
scripts/
  seed-people.mjs          regenerates alumni files; skips anything with manual: true
  openalex.mjs             pulls the publication record from the OpenAlex API
  merge-imports.mjs        merges scripts/import/*.json into publications.json
  bundle-preview.mjs       flattens the built site into one navigable HTML file
  shots.mjs                builds screenshots of every page, light + dark, and
                           checks for horizontal overflow at 375px
templates/person.md        copy this to add a person
public/admin/              the CMS: index.html + config.yml
```

## Editing the site

There is a full editing screen at **`/admin`** — sign in with GitHub and change anything on the
site without touching code. Access is GitHub repository access: invite someone to the repo and
they can edit; remove them and they can't. Everyone who can sign in can edit everything.

**Setup instructions and the editor's guide are in `ADMIN.md`.** Two placeholders in
`public/admin/config.yml` must be filled in before it works.

Editable through the CMS: site settings and the recruiting banner, home / Join / Contact page
copy, publications, people, news, research themes. Not editable: design, layout,
navigation, and the set of research themes — those stay in code on purpose.

## The lab logo

In place. The original artwork lives in `brand/ls3-logo-source.png`; everything in `public/` is
generated from it by `scripts/build-logo.mjs`, which traces each colour layer to vector — see
`brand/README.md`.

| File | Used for |
| --- | --- |
| `logo-mark.svg` / `logo-mark-dark.svg` | header and footer — the S³L monogram alone |
| `logo.svg` / `logo-dark.svg` | full lockup with the tagline |
| `favicon.svg` | browser tab: the monogram reversed out of a navy tile |
| `og-default.png` | social share card |

`--blue-deep` and `--yellow` in `tokens.css` are set to the logo's own navy `#000080` and gold
`#FBC201`, so the brand and the interface use the same colours.

If any of these files are deleted, the header falls back to a built-in mark rather than
breaking.

## Hero illustration

The home page hero is the illustration carried over from the previous site, with the
Ryerson-branded mug repainted for U of T — see `brand/README.md`. The master PNG lives at
`src/assets/hero-illustration.png` and Astro generates responsive WebP variants at build.

`src/components/HeroArt.astro` holds an alternative: a hand-drawn SVG diagram of a corpus
being queried and ranked. It is unused; swap it into the hero if the diagram is preferred.

## Headshots

Drop a square image at `public/people/<slug>.jpg` — where `<slug>` matches the person's
Markdown filename — and it is picked up automatically. No frontmatter edit needed. `.png`,
`.webp` and `.avif` work too; an explicit `photo:` in frontmatter still wins.

Until a photo exists, the person renders as their initials on a tinted square, so the grid
never breaks and there is no broken-image icon.

**Migrating photos from the old site.** The previous site is WordPress, so every image lives
under `https://ls3.rnet.torontomu.ca/wp-content/uploads/YYYY/MM/`. The director's is at
`.../2020/06/bagheri.jpg`. The reliable way to get them all is the WordPress admin —
*Media → Library*, or *Tools → Export → Media* — rather than saving them one at a time.

Editing instructions for lab members are in **CONTRIBUTING.md**.
Conventions for AI-assisted sessions are in **CLAUDE.md**.

## Before this goes live

- [ ] Replace the current-member roster (see the notice on `/people/`)
- [ ] Review the remaining publications — 106 of the 329 entries carry
      `"needsReview": true`. The rest were confirmed against the lab's own BibTeX
      export and their flags are cleared. What is left is either not in that export,
      or is new from it and carries theme tags assigned by keyword rather than by a
      person. Search the file for `needsReview` and clear the flag as you go.
- [ ] **Optional: re-host the paper PDFs.** 178 `links.pdf` values point at
      `ls3.rnet.torontomu.ca/wp-content/uploads/...`. TMU has confirmed that site is
      staying up, so these work and there is no deadline. Worth doing eventually
      anyway — a UofT lab serving its papers from a TMU server is an odd dependency
      to carry, and it would go away if the media library were exported into
      `public/uploads/` and the links rewritten to `/uploads/<file>.pdf`.
      `grep -c torontomu src/data/publications.json` counts them.
- [ ] Confirm affiliated-faculty titles and institutions in `src/content/people/`
- [ ] Add headshots to `public/people/` — see below
- [ ] Set the real domain in `astro.config.mjs` (`site`) and in `public/robots.txt`
- [ ] Add 301 redirects from the old `ls3.rnet.torontomu.ca` URLs
- [ ] Add real links (PDF / arXiv / code) to publication entries
- [ ] Replace `public/og-default.png` if a different social card is wanted
- [ ] Set up the site editor — `ADMIN.md` (repo name + OAuth worker URL in `public/admin/config.yml`)
- [ ] Vendor the CMS script instead of loading it from unpkg — see `ADMIN.md`

## Deploying

**Cloudflare Pages** — connect the repo, framework preset *Astro*, build `npm run build`,
output `dist`.

**GitHub Pages** — the workflow in `.github/workflows/deploy.yml` builds and publishes on every
push to `main`. Enable Pages with source *GitHub Actions* in repository settings.
