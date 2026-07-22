# PROMAX Web asset architecture

This site is intentionally static: GitHub Pages can serve every file without a build step.

## Home

- `index.html` contains the semantic document, SEO metadata, and section markup.
- `assets/css/base.css` contains reset, variables, base typography, and global display-font rules.
- `assets/css/components.css` contains shared UI primitives used by the home: cursor, nav, mobile menu, footer logo, grid overlay.
- `assets/css/sections.css` contains home sections, responsive rules, gallery, form, and page-specific layouts.
- `assets/js/main.js` contains home animation setup, scroll progress, counters, typewriter, and mobile menu behavior.
- `assets/js/cursor.js`, `gallery.js`, `form.js`, `recaptcha.js`, and `video-crossfade.js` each own one behavior.
- `assets/data/projects.json` is the portfolio data source used by the gallery.

## Service pages

The public service URLs use clean directory routes: `servicios/<slug>/index.html` is served as `/servicios/<slug>/`.
The legacy `servicios/*.html` files are lightweight compatibility redirects for old indexed or shared links.

Shared service assets:

- `assets/css/service-pages.css` contains the common design system and layout for all service landing pages.
- `assets/css/service-production.css` contains the one override needed by `produccion-mobiliario-museografico/`.
- `assets/js/service-pages.js` contains shared cursor, reveal animation, process dots, and mobile menu behavior.

When adding a service page, copy an existing `servicios/<slug>/index.html`, update metadata, JSON-LD, hero/body copy, related links, and keep the shared CSS/JS includes. If a legacy `.html` URL exists, keep it as a redirect bridge to the clean route.

## Brand assets

- `assets/brand/promax.svg` is the local logo used by the home and service footers.
- Cloudinary remains the CDN for project imagery and video.

## Validation checklist

Before pushing larger changes:

1. Run `node --check` on JS files.
2. Parse `assets/data/projects.json`.
3. Parse all JSON-LD blocks in `index.html` and `servicios/*/index.html`.
4. Serve the site locally over HTTP and request `/`, service pages, CSS, JS, JSON, and SVG assets.
5. Run `git diff --check`.
