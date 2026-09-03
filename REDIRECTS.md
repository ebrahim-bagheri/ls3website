# Redirects from the old site

The previous site lives at `https://ls3.rnet.torontomu.ca/`. Every paper that cites a lab URL,
every old email signature, and every inbound link from a collaborator's page still points there.
Losing those is the most expensive part of a site move, and it is entirely avoidable.

There are two separate jobs, and only the first is done for you.

---

## 1. New domain handles old paths — done

`public/_redirects` ships with the site and is read automatically by **Cloudflare Pages** and by
**Netlify**. It catches anyone who arrives at the new domain carrying an old path.

On **GitHub Pages** `_redirects` is ignored — Pages has no redirect engine. If you deploy there,
either put Cloudflare in front of it, or generate stub HTML pages with meta-refresh (say the word
and I will add the generator).

## 2. Old domain forwards to the new one — needs TMU

This is the one that actually recovers your traffic, and it needs whoever administers
`ls3.rnet.torontomu.ca` to act. Ask Toronto Metropolitan University IT for **one** of these, in
order of preference:

**Best — a full path-preserving map.** Send them the table below.

**Good — a single site-wide 301** to the new home page. You lose deep-link accuracy but keep the
domain authority and stop the 404s.

**Acceptable — leave the old site up** with a banner at the top of every page linking to the new
one. Worse for search ranking, but better than nothing, and it costs them no configuration.

If TMU will do nothing at all, the old site will eventually be taken down and those links die.
In that case, prioritise emailing collaborators who link to you, and update your Google Scholar,
ORCID and DBLP profiles to the new URL — those three carry most of the residual traffic.

---

## The map

| Old path | New path |
| --- | --- |
| `/` | `/` |
| `/publications/` | `/publications/` |
| `/people/` | `/people/` |
| `/research/` | `/research/` |
| `/contact/` | `/contact/` |
| `/open-positions/` | `/join/` |
| `/category/news/` | `/news/` |
| `/news/` | `/news/` |
| `/semantic-analysis/` | `/research/` |
| `/human-centered-computing/` | `/research/` |
| `/social-behavior-analysis/` | `/research/information-people-society/` |
| `/information-processig-and-retrieval/` | `/research/neural-ranking/` |
| `/sigir_2022_tutorial/` | `/research/` |
| `/canadian-responsible-ai-2022-meet-and-greet/` | `/news/` |
| `/feed/` | `/news/rss.xml` |
| anything else | `/` |

Two of these are judgement calls worth a second look. The old *Semantic Analysis* and
*Human-Centered Computing* areas have no clean successor among the five current themes, so they
go to the research index rather than to a theme that only half fits. Change them if you disagree.

Note the typo in the old URL — `information-processig` is missing an `n`. It is correct as
written; that is genuinely how the old page was published.

---

## Apache, for whoever runs the old host

```apache
RewriteEngine On
RewriteRule ^open-positions/?$            https://ls3lab.com/join/ [R=301,L]
RewriteRule ^category/news/?$             https://ls3lab.com/news/ [R=301,L]
RewriteRule ^social-behavior-analysis/?$  https://ls3lab.com/research/information-people-society/ [R=301,L]
RewriteRule ^information-processig-and-retrieval/?$ https://ls3lab.com/research/neural-ranking/ [R=301,L]
RewriteRule ^(semantic-analysis|human-centered-computing|sigir_2022_tutorial)/?$ https://ls3lab.com/research/ [R=301,L]
RewriteRule ^(publications|people|research|contact|news)/?$ https://ls3lab.com/$1/ [R=301,L]
RewriteRule ^(.*)$                        https://ls3lab.com/ [R=301,L]
```

## nginx

```nginx
location = /open-positions/ { return 301 https://ls3lab.com/join/; }
location = /category/news/  { return 301 https://ls3lab.com/news/; }
location = /social-behavior-analysis/ { return 301 https://ls3lab.com/research/information-people-society/; }
location = /information-processig-and-retrieval/ { return 301 https://ls3lab.com/research/neural-ranking/; }
location ~ ^/(publications|people|research|contact|news)/?$ { return 301 https://ls3lab.com/$1/; }
location / { return 301 https://ls3lab.com/; }
```

Replace `ls3lab.com` throughout once the domain is decided.

---

## After the switch

- Add both the old and new domains to **Google Search Console**, then use the *Change of Address*
  tool. It is the single highest-value ten minutes in this whole process.
- Update the lab URL on Google Scholar, ORCID, DBLP, Semantic Scholar and your Faculty of
  Information profile page.
- Re-crawl: submit `https://ls3lab.com/sitemap-index.xml` in Search Console.
- Give it a month, then check Search Console for 404s and add any missed paths to `_redirects`.
