# Project Development Log

This log is intended to preserve the project's real development history and decisions. Add dated entries as work happens; do not backdate or invent results.

## Current project baseline

- **Project:** Photo Exposure Calculator
- **Repository:** https://github.com/Benz-Kim/Photo-Exposure-Calculator
- **Live site:** https://exposure-calculator.netlify.app/
- **Implementation:** Static HTML, CSS, and vanilla JavaScript
- **Deployment:** Netlify, configured through netlify.toml
- **Current entry point:** index.html redirects to exposure-index.html; Netlify also rewrites the root route to that page.

## Existing implementation

- Interactive shutter speed, aperture, and ISO controls.
- Two-parameter lock state and inverse calculation of the remaining setting.
- EV display and heuristic lighting guidance.
- Equivalent-exposure combinations table.
- Five shooting presets.
- EXIF metadata import using an on-demand external parser.
- Responsive layout with mobile-specific parameter navigation.

## Work log

### 2026-10-28 — Documentation baseline

- Reviewed the repository metadata and the current README, entry-point HTML, Netlify configuration, main HTML, and JavaScript implementation.
- Identified documentation drift: the previous README described an older file layout and did not mention the current EXIF import and several current UI behaviors.
- Updated the README to describe the current entry point, feature set, formula, deployment configuration, limitations, and future validation priorities.
- Added a testing checklist and a development-log template so future claims can be tied to actual verification.
- **Validation status:** documentation reviewed against source files; application behavior and deployed-site checks have not yet been independently verified in this log.

## Decision record

| Decision | Rationale | Status |
|---|---|---|
| Keep the app as a static site for now | No build step is needed for the current HTML/CSS/JS implementation | Current |
| Keep discrete supported camera settings | Matches the current slider-driven interface; computed results are mapped to nearest supported values | Current |
| Record test outcomes explicitly | Makes reliability claims auditable and avoids presenting planned tests as completed | Adopted |
| Prioritize calculation/state correctness before adding more features | Core correctness is central to an exposure calculator's educational value | Planned |

## Next milestones

1. Verify the deployed site and asset loading.
2. Test the two-lock invariant, inverse calculations, and edge cases.
3. Test EXIF import with full, partial, and absent metadata.
4. Check mobile layout and accessibility.
5. Fix verified defects and document each change with a commit.
6. Add automated tests if a lightweight test setup can be introduced without making the static site harder to run.
7. Capture genuine screenshots and a concise project demo for a portfolio or extracurricular activity submission.
