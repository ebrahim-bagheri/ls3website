// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Public domain. If it ever changes, also update:
//   public/robots.txt   (the Sitemap: line)
//   REDIRECTS.md        (every ls3lab.com occurrence)
export const SITE = 'https://ls3lab.com';

export default defineConfig({
  site: SITE,
  trailingSlash: 'always',
  integrations: [sitemap()],
  build: { format: 'directory' },
  // Off deliberately: the HTML minifier collapses the whitespace between an
  // inline <a> and the text around it, so links fuse into their neighbours
  // ("check theadmissions pagesfor the dates"). The few KB are worth it.
  compressHTML: false,
  devToolbar: { enabled: false },
});
