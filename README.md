# Cash Clinic — Website (Phase 1 + 2)

Static, bilingual (Arabic RTL default / English) marketing site. No build step — plain HTML/CSS/JS.

## Structure
- `index.html` — homepage
- `policy.html` — consultation policy
- `clinics/` — Cash Nas, Cash Invest, Cash Riyada
- `consultants/` — Ghaliya, Sara, Hasan
- `assets/ds/` — design system (fonts, tokens, base)
- `assets/css/site.css` — site styles
- `assets/js/i18n.js` — language toggle + WhatsApp link builder
- `brand/`, `assets/img/` — logos, marks, blobs, photos

## Notes
- Booking is disabled; all CTAs open WhatsApp (`+965 22260820`).
- No prices are shown publicly (the internal `packages.js` price file is intentionally NOT included here).
- Language: toggled client-side; default Arabic. Preference saved in `localStorage` (`cc-lang`).

## Deploy (GitHub Pages)
Push to the repo and serve from the root of the branch. No configuration needed.
