# Phase 10 — Accessibility and UI hardening

## Findings and fixes

| Area                    | Finding                                                                                     | Fix                                                                                                                                                                                                                        |
| ----------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Color contrast          | Inline error red and subtle component borders did not provide enough contrast in dark mode. | Replaced hardcoded error colors with the theme-aware `--danger` token and raised the shared border token to meet non-text contrast. Checked primary/danger buttons, muted copy, and all four status colors in both themes. |
| Landmarks               | Claim and admin pages rendered nested `<main>` landmarks inside the application shell.      | Route content now uses non-landmark wrappers so the shell provides the single main landmark. The error boundary retains a main landmark and announces its fallback assertively.                                            |
| Form errors             | Some inline errors were not announced or programmatically connected to their fields.        | Shared field errors and page-level validation messages now use alert semantics; claim and listing-report fields expose `aria-invalid` and matching `aria-describedby` references.                                          |
| Touch targets           | Several icon, pagination, filter, and admin controls were below 44px.                       | Raised buttons, form controls, tabs, selectors, icon controls, navigation, and admin controls to a 44px minimum where applicable. Mobile admin navigation now retains that target size.                                    |
| Motion                  | Message autoscroll always used smooth motion.                                               | Chat autoscroll uses automatic motion when `prefers-reduced-motion` is enabled; existing global reduced-motion rules remain in place.                                                                                      |
| Images and layout shift | Listing, detail, report, claim, and admin images lacked intrinsic dimensions.               | Added width/height attributes, retained lazy loading for non-critical images, and kept the primary detail image eager.                                                                                                     |
| Performance             | The font stylesheet was not preloaded.                                                      | Added a stylesheet preload alongside existing font preconnects and `display=swap`. Route-level lazy loading was already present and remains intact; no unmeasured memoization was added.                                   |
| Visual consistency      | Small labels and radii varied across styles; the auth page used a decorative gradient.      | Raised 8–9px interface text to 10px, normalized spacing and standard radii to shared tokens, and removed the auth gradient.                                                                                                |

## Contrast checks

Text/background pairs meet the 4.5:1 normal-text target. Component boundaries meet the 3:1 non-text target.

| Pair                         |  Light |   Dark |
| ---------------------------- | -----: | -----: |
| Muted text on surface        | 5.63:1 | 5.93:1 |
| Danger text on surface       | 6.46:1 | 8.16:1 |
| Component border on surfaces | 3.29:1 | 3.29:1 |
| Primary button text          | 7.84:1 | 6.62:1 |
| Danger button text           | 6.46:1 | 8.10:1 |
| Lost status                  | 5.52:1 | 8.13:1 |
| Found status                 | 6.42:1 | 7.45:1 |
| Claimed status               | 5.97:1 | 7.03:1 |
| Returned status              | 5.78:1 | 8.21:1 |

## Verification

- Production build and TypeScript check: `npm run build`.
- Lint: `npm run lint`.
- Formatting: `npm run format:check`.
- Browser checks at 360, 768, 1024, and 1440px covered home, browse, item detail, report, all account tabs, and admin sections. No horizontal overflow was observed; the application rendered one main landmark per route, and visible controls were checked against the 44px target.
- Checked the claim dialog and its validation at 360px, including error associations and touch targets. Submitted the report form empty and verified that invalid fields referenced their live-announced error messages.
- Verified that keyboard focus reaches the skip link first after page load.
- Reduced-motion behavior and contrast values were checked directly; no automated axe scanner is configured in this project.
