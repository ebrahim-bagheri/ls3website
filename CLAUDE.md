# LS3 website — working rules

Read this before changing anything. It applies to every AI-assisted session on this repo.

## What this is

The website for LS3 (Laboratory for Systems, Software and Semantics), a research lab at the
Faculty of Information, University of Toronto, directed by Prof. Ebrahim Bagheri.

The lab moved from Toronto Metropolitan University (formerly Ryerson). **Nothing on this site
should refer to Ryerson, TMU, or the old 87 Gerrard St East address except the deliberate
redirect note on the contact page.**

## Stack

- Astro 7, TypeScript strict, plain CSS. No Tailwind, no CSS-in-JS, no UI framework.
- Content in `src/content/` (Markdown) and `src/data/publications.json`.
- Schemas in `src/content.config.ts`. Static output; deploys to Cloudflare Pages / GitHub Pages.

## Hard rules

1. **All styling goes through the custom properties in `src/styles/tokens.css`.** Never write a
   raw hex value, font size, or spacing number in a component. If a token is missing, add it to
   `tokens.css` first and say so.
2. **Yellow is a surface colour, not a text colour.** `--yellow` on a light ground fails contrast
   at small sizes. Use `--yellow-deep` when yellow must be text.
3. **Never edit anything under `src/content/`.** Those are human-authored files owned by lab
   members. Same for `src/data/publications.json` unless explicitly asked.
4. **Never invent content.** No placeholder people, no made-up papers, no fabricated dates or
   deadlines. If a fact is missing, leave the field out and report what is needed.
5. **Zero client-side JavaScript** beyond what already exists (mobile menu, theme toggle,
   publication filters). No animation libraries, no icon packages, no analytics scripts without
   asking.
6. Every image needs explicit `width`/`height` and real alt text.
7. Semantic HTML, one `<h1>` per page, visible focus states, WCAG 2.2 AA contrast in both themes.

## Before a large change

List the files you intend to touch and the approach. Wait for approval.

## Definition of done for a page

Builds clean with `npm run build`; renders correctly at 375px and 1440px; correct in light **and**
dark; keyboard-navigable; no horizontal scroll on the body.

Run `node scripts/shots.mjs` after building to capture light/dark screenshots of every page into
`shots/` and to check for horizontal overflow at 375px.

## Taxonomy

The five research themes in `THEMES` (`src/content.config.ts`) are the single taxonomy.
Publications and people all tag into it. Adding a theme means adding it there **and**
creating `src/content/themes/<id>.md`.
