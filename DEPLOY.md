# Getting the site online

Start to finish, about 45 minutes. Do it once with a throwaway subdomain if you want to rehearse,
but the steps below are safe to run directly.

The order matters: **get a blank site deployed before you worry about content or the domain.**
A deploy pipeline that breaks after you have polished nine pages costs you a day.

---

## Step 0 — run it locally first

```bash
unzip ls3-site.zip && cd ls3-site
npm install
npm run dev
```

Open <http://localhost:4321>. If that works, everything below is configuration rather than code.

```bash
npm run build     # must succeed; this is what the host will run
npm run check     # type + content-schema check
```

---

## Step 1 — put it on GitHub

Create an empty repository — **public** is the right choice here. A public repo is what lets
students open pull requests to add their own papers, and there is nothing secret in it.

```bash
git init
git add -A
git commit -m "Initial site"
git branch -M main
git remote add origin https://github.com/<org-or-user>/ls3-site.git
git push -u origin main
```

Add one other person as an admin now, while you are thinking about it. A repo only you can
administer is a repo that dies when you go on sabbatical.

---

## Step 2 — deploy

### Cloudflare Pages (recommended)

Better than GitHub Pages here for one specific reason: it honours the `public/_redirects` file,
which is how old `ls3.rnet.torontomu.ca` links keep working. GitHub Pages ignores it.

1. <https://dash.cloudflare.com> → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. Pick the repository. Cloudflare detects Astro; confirm the settings:
   - Framework preset: **Astro**
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Node version: add an environment variable `NODE_VERSION` = `22`
3. **Save and Deploy.** Two minutes later you have a live `*.pages.dev` URL.

Every push to `main` rebuilds. Every pull request gets its own preview URL, which is genuinely
useful — a student can see their change rendered before you merge it.

### GitHub Pages (alternative)

`.github/workflows/deploy.yml` is already in the repo. Repository **Settings → Pages → Source:
GitHub Actions**. Push to `main` and it publishes. Remember that `_redirects` will not work.

---

## Step 3 — the domain

Buy a real domain. A `~lastname` university path breaks the moment you move institutions, and
everything ever printed on a poster or written into a paper's footnote breaks with it.

Two options, and they are not equivalent:

**A university subdomain** — `ls3.utoronto.ca` or similar. Ask the Faculty of Information's IT
group for a CNAME. Free, and it carries institutional weight. It also ties you to U of T.

**Your own domain** — `ls3lab.org`, `ls3.ca`, roughly $15/year from Cloudflare Registrar or
Namecheap. Portable forever. If you ever move again, you change one DNS record and every citation
still resolves.

Doing both is fine and common: own the independent domain, point it at the site, and have the
university subdomain redirect to it.

### Pointing it at Cloudflare Pages

1. Pages project → **Custom domains** → **Set up a custom domain**
2. Enter the domain. If the domain is already on Cloudflare DNS, the record is created for you.
   Otherwise add the `CNAME` it shows you at your registrar.
3. HTTPS is automatic. Give it ten minutes.

Then update three things in the repo so canonical URLs, the sitemap and social cards are right:

- `astro.config.mjs` → `site: 'https://YOUR-DOMAIN'`
- `public/robots.txt` → the `Sitemap:` line
- `REDIRECTS.md` → replace `NEW-DOMAIN` wherever it appears

Commit and push.

---

## Step 4 — redirects from the old site

See **REDIRECTS.md**. The half you control is already in `public/_redirects`; the half that
matters most needs Toronto Metropolitan University to forward the old domain. Ask early — that
request will sit in a queue.

---

## Step 5 — make sure people find it

- **Google Search Console** — add the property, submit `https://YOUR-DOMAIN/sitemap-index.xml`,
  then run the **Change of Address** tool from the old domain if TMU cooperates.
- Update the lab URL on **Google Scholar, ORCID, DBLP, Semantic Scholar** and your Faculty of
  Information profile.
- Analytics, if you want them: Cloudflare Web Analytics is free, needs no script tag on Pages,
  and requires no cookie banner. Plausible and Fathom are the paid equivalents. Avoid Google
  Analytics unless you are prepared to write a consent notice.

---

## Step 6 — hand it over

Do this in the same week, not "later".

1. Pick a **web steward** — one student, one-year term, named in the README, with a successor
   named before they leave.
2. Sit with them and have them add a real paper by following `CONTRIBUTING.md`, while you watch.
   Fix whatever confuses them — that friction is the whole reason lab sites go stale.
3. Add the site to the lab's onboarding checklist: new members add their own profile in week one.

---

## Troubleshooting

**Build fails on the host but works locally.** Almost always the Node version. Set
`NODE_VERSION=22` in the host's environment variables.

**Pages build succeeds, site 404s.** Output directory should be `dist`, not `dist/client` — that
is the SSR path and this site is static.

**Fonts look wrong in production.** The Google Fonts stylesheet is blocked on some campus
networks. If that bites, self-host: download the woff2 files into `public/fonts/`, add
`@font-face` rules to `tokens.css`, and drop the `<link>` from `BaseLayout.astro`.

**A pull request breaks the build.** That is the system working. The Actions log names the file
and the field. Ninety percent of the time it is a trailing comma in `publications.json`.
