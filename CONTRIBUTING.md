# Adding to the LS3 site

You do not need to know Astro. Every task below is editing a text file.

**Setup, once:**

```bash
git clone <this-repo> && cd ls3-site
npm install
npm run dev          # open http://localhost:4321
```

Leave `npm run dev` running while you edit — the page reloads as you save.

---

## 1. Add a publication

Open `src/data/publications.json` and add an object to the **top** of the list:

```json
{
  "id": "2026-yourname-short-title",
  "title": "The Full Title of the Paper",
  "authors": ["Lastname, Firstname", "Bagheri, Ebrahim"],
  "venue": "49th International ACM SIGIR Conference on Research and Development in Information Retrieval",
  "venueShort": "SIGIR 2026",
  "year": 2026,
  "type": "conference",
  "themes": ["neural-ranking"],
  "links": { "arxiv": "https://arxiv.org/abs/XXXX.XXXXX", "code": "https://github.com/..." }
}
```

- `authors` — **"Lastname, Firstname"**, in printed order. Lab members are bolded automatically
  by matching against the People files, so spell names the same way.
- `type` — one of `journal`, `conference`, `workshop`, `preprint`, `thesis`, `book-section`, `patent`.
- `themes` — zero or more ids from `THEMES` in `src/content.config.ts`.
- `links` — leave out any that do not exist. Do not use empty strings.
- `award` — add `"award": "Best Paper"` and it renders as a yellow badge.

Save. If the site fails to build, the error names the field that is wrong.

---

## 2. Add yourself to the People page

```bash
cp templates/person.md src/content/people/firstname-lastname.md
```

Edit it. Keep `manual: true` — that stops the seed script from overwriting you.

For a photo: drop a square JPG at `public/people/firstname-lastname.jpg` (600×600 or larger) and
set `photo: "/people/firstname-lastname.jpg"`. Without a photo you get initials on a tinted
square, which is fine — the grid does not break.

---

## 3. Move someone to alumni

In their file under `src/content/people/`:

```yaml
status: "alumni"
gradYear: 2026
nowAt: "Research Scientist, Company"
```

Do **not** delete the file. Alumni pages stay up permanently — people link to them from CVs.

---

## 4. Post a news item

Create `src/content/news/2026-05-14-short-slug.md`:

```markdown
---
title: "Best Paper Award at SIGIR 2026"
date: 2026-05-14
kind: award        # paper | award | media | talk | lab
summary: One or two sentences. Shown on the home page and in the RSS feed.
external: https://example.com/optional-link
---

Optional extra paragraphs.
```

---

## 5. Update the recruiting status

The banner text lives in `src/pages/index.astro` (search for `class="recruit"`), and the fuller
version is in `src/pages/join.astro` (search for `class="status"`).

**Take it down when it stops being true.** A stale "now recruiting" banner costs you good
applicants who assume the rest of the site is stale too.

---

## Submitting your change

```bash
npm run build        # must succeed before you push
git checkout -b add-my-paper
git add -A && git commit -m "Add SIGIR 2026 paper"
git push -u origin add-my-paper
```

Then open a pull request. The build runs automatically; a red check means something in your
frontmatter does not match the schema, and the log says which field.

## When the build fails

Read the last few lines. Nearly every failure is one of:

- a missing comma or a trailing comma in `publications.json`
- a `theme` id that is not in `THEMES`
- a `type` or `role` value outside the allowed list
- a date that is not `YYYY-MM-DD`
