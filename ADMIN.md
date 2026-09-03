# The site editor

There is a full editing screen at **`/admin`** on the live site. Sign in with GitHub and you can
change anything on the site — publications, people, news, research themes, the page
text, the address, and the recruiting banner — without touching code or running anything.

Everything here is free. Sveltia CMS is MIT-licensed open source, GitHub is free, Cloudflare
Pages is free, and the login worker runs on Cloudflare's free tier. The only thing you pay for is
the domain.

---

## How access works

**Access is GitHub repository access. There is no separate user list.**

Anyone with write access to the repository can sign in at `/admin`. Anyone without it cannot,
and there is nothing for them to sign in with. To add an editor, invite them to the repository.
To remove one — a student who has graduated, say — remove them from the repository and they lose
access immediately.

Everyone who can sign in can edit everything. That is deliberate: the lab is small and the people
are trusted. Git keeps a complete history, so a mistake is visible and reversible rather than
prevented. If that stops feeling right, see *Adding a review step* at the bottom.

**Why there's no email-and-password option.** The site is static — there is no server and no user
database to check a password against. A password checked in the browser could be read by anyone
viewing the page source. Signing in through GitHub puts the identity check somewhere that really
does verify it, and has the useful side effect of stamping every change with a real name.

---

## One-time setup

Four steps, about twenty minutes. Steps 2 and 3 need you signed in as yourself, so they can't be
done for you.

### 1. Put the repository on GitHub

Follow `DEPLOY.md` step 1 if you haven't already. Invite your editors under
**Settings → Collaborators**, giving them **Write** access.

### 2. Deploy the login worker

The CMS runs entirely in the browser, so it needs a small server-side helper to complete the
GitHub sign-in handshake. Sveltia publishes one; it runs free on Cloudflare Workers.

1. Go to <https://github.com/sveltia/sveltia-cms-auth> and follow its README to deploy the worker
   to your Cloudflare account. It's a one-click deploy plus two secrets, which you'll get in the
   next step.
2. Note the worker's URL — something like `https://ls3-cms-auth.yourname.workers.dev`.

### 3. Create a GitHub OAuth app

1. GitHub → **Settings → Developer settings → OAuth Apps → New OAuth App**
2. Fill in:
   - **Application name:** `LS3 site editor`
   - **Homepage URL:** your site's URL
   - **Authorization callback URL:** your worker URL + `/callback`
     (e.g. `https://ls3-cms-auth.yourname.workers.dev/callback`)
3. Click **Register application**, then **Generate a new client secret**.
4. Copy the **Client ID** and **Client Secret** into the worker's environment variables in
   Cloudflare, named `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`.

The client secret is shown once. If you lose it, generate a new one — no harm done.

### 4. Point the CMS at both

Open `public/admin/config.yml` and replace the two placeholders at the top:

```yaml
backend:
  name: github
  repo: OWNER/REPO                                     # e.g. ls3lab/ls3-site
  branch: main
  base_url: https://ls3-cms-auth.yourname.workers.dev  # your worker URL
```

Commit, push, wait for the build, then open `https://your-domain/admin` and sign in.

### Before launch: remove the CDN

`public/admin/index.html` loads the editor from unpkg. That works, but it means a third party can
change the editor under your editors. Vendor it instead:

```bash
curl -o public/admin/sveltia-cms.js https://unpkg.com/@sveltia/cms/dist/sveltia-cms.js
```

then change the `src` in `public/admin/index.html` to `/admin/sveltia-cms.js`. Re-run that command
when you want to update.

---

## Using it

Go to `https://your-domain/admin`, click **Sign in with GitHub**, and you'll see six sections
down the left.

| Section | What's in it |
| --- | --- |
| **Site settings** | Lab name, address, contact email, external links, and the recruiting banner |
| **Page text** | The words on the home, Join us and Contact pages |
| **Publications** | All 262, newest first |
| **People** | One entry per person, current and alumni |
| **News** | Announcements, awards, media |
| **Research themes** | The five theme pages |

Edit, click **Save**, and the site rebuilds itself. **Your change is live in about ninety
seconds** — there's no separate publish step, and no way to preview on the real domain first.
Read twice before saving.

### The things worth knowing

**The recruiting banner has an on/off switch.** *Site settings → Recruiting banner → Show the
banner.* Turn it off the day it stops being true; a stale "now recruiting" costs you good
applicants who assume the rest of the site is stale too.

**Author names must match.** In publications, write authors as `Lastname, Firstname` in printed
order. Lab members are bolded automatically by matching against the People section, so spell
names the same way in both places or the bolding silently stops working.

**Never delete a person.** Set their status to `alumni` instead. Their page stays at the same
address, which matters because students put that URL on CVs and job applications.

**The highlighted word on the home page** must appear in the headline exactly. Change the
headline and forget the highlight field, and the yellow marker just disappears — no error.

**Themes can be edited but not added.** The five research themes are the site's spine; every
publication and person tags into them. Adding a sixth needs a code change, so the CMS won't let
you create one by accident.

**Photos.** Upload one in a person's entry, or drop a square image into `public/people/` named
after their file — either works.

### If something goes wrong

Every save is a commit, so nothing is ever really lost. On the repository page, open **Commits**,
find the change, and click **Revert**. If a save fails, it's almost always an expired sign-in —
reload `/admin` and sign in again.

---

## Adding a review step

If you later want students' changes to be checked before going live, change one line in
`public/admin/config.yml`:

```yaml
publish_mode: editorial_workflow
```

Saves then become pull requests, and the CMS grows a Workflow tab where you approve and publish
them. You can also do this per-person by giving some editors read-only repository access — the
CMS will automatically open a pull request for anyone who can't push directly.
