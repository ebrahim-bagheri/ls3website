# Brand assets

`ls3-logo-source.png` is the lab's original logo artwork — a transparent PNG in three
flat colours: navy `#000080` (the S/L monogram), gold `#FBC201` (the superscript 3),
and grey `#444444` (the tagline).

Everything in `public/` is generated from it:

```bash
node scripts/build-logo.mjs brand/ls3-logo-source.png
```

That writes `logo.svg`, `logo-dark.svg`, `logo-mark.svg`, `logo-mark-dark.svg` and
`favicon.svg`. Each colour layer is traced separately with `potrace` and reassembled,
so the result is real vector artwork rather than a bitmap — sharp at any size, and a
fraction of the file size.

The dark variants lift the navy to `#9FB4FF` and the tagline grey to `#AAB4C6`. Pure
navy is unreadable against the site's near-black ground, and `#444` fails contrast
outright.

Requires `potrace` (`apt-get install potrace` / `brew install potrace`).

The site's `--blue-deep` and `--yellow` tokens are set to the logo's own navy and gold,
so the brand and the interface agree.

## Hero illustration

`../src/assets/hero-illustration.png` is the illustration from the previous LS3 site,
with **one edit**: the mug on the desk carried a "Ryerson University" band, which was
repainted as a University of Toronto navy band reading "U of T". Everything else —
including the S³L logo on the laptop lid — is the original artwork.

The background is transparent, so it composites correctly on both the light and dark
grounds. Astro's `<Image>` generates the responsive WebP variants at build time; the
PNG in `src/assets/` is the master. Do not move it into `public/` — that would skip
the optimisation.

If the original illustrator's file or a higher-resolution version turns up, drop it in
at the same path and rebuild.
