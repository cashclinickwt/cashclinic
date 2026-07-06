# Cash Clinic — Website (Phase 1 + 2)

Static, bilingual (Arabic RTL default / English) site. No build step — plain HTML/CSS/JS.

## Structure
- `index.html` — homepage
- `policy.html` — consultation policy
- `clinics/` — Cash Nas, Cash Invest, Cash Riyada
- `consultants/` — Ghaliya, Sara, Hasan
- `assets/ds/` — design system (fonts, tokens, base)
- `assets/css/site.css` — site styles
- `assets/js/i18n.js` — language toggle + WhatsApp link builder
- `brand/`, `assets/img/` — logos, marks, blobs, consultant photos

## IMPORTANT: .nojekyll
The `.nojekyll` file (empty) MUST stay in the repo root. It tells GitHub Pages to skip Jekyll
and serve the files as-is. Without it, the deploy fails. Do not delete it.

## Notes
- Booking is disabled; all CTAs open WhatsApp (+965 22260820).
- No prices are shown publicly (internal price file is not included here).
- Consultant photos use the brand blob + gold-line composite design.

## Deploy (GitHub Pages — branch mode)
Settings → Pages → Source: "Deploy from a branch" → main / (root). Push files to the repo root.
