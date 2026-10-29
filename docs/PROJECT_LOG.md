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

### 2026-10-29 — Numerical model and reproducible verification

- Found a discrepancy between the documented two-parameter auto-solver and the old event handler: changing a locked slider did not update the third parameter.
- Extracted a DOM-independent EV100 mathematical module with three inverse formulas, logarithmic nearest-setting quantization and immutable lock transitions.
- Connected the original page to the solver and added a separate reference EV100 control. The interface now reports quantization residuals instead of claiming exact equivalence.
- Improved EXIF handling for partial camera metadata, CDN loading failures and untrusted error messages.
- Added unit tests, simulated-browser integration tests, and GitHub Actions.
- Recorded [CI run #40869977667](https://github.com/Benz-Kim/Photo-Exposure-Calculator/actions/runs/40869977667), which reported 20 passing tests and no failures on the feature branch at commit `d7c6ac78`.
- Documented mathematical assumptions and the actual commit sequence in [ENGINEERING_RATIONALE.md](ENGINEERING_RATIONALE.md) and [CHANGE_BREAKPOINTS.md](CHANGE_BREAKPOINTS.md).
- **Status:** all changes are on [Draft PR #1](https://github.com/Benz-Kim/Photo-Exposure-Calculator/pull/1). CI success confirms only automated test coverage; no completed real-device, screen-reader, or camera-original EXIF report is yet recorded.
- **Provenance:** this improvement pass includes AI-assisted code changes. Student review and reproduction are needed before making authorship or impact claims in an application.

## Decision record

| Decision | Rationale | Status |
|---|---|---|
| Keep the app as a static site for now | No build step is needed for the current HTML/CSS/JS implementation | Current |
| Keep discrete supported camera settings | Matches the current slider-driven interface; computed results are mapped to nearest supported values | Current |
| Record test outcomes explicitly | Makes reliability claims auditable and avoids presenting planned tests as completed | Adopted |
| Prioritize calculation/state correctness before adding more features | Core correctness is central to an exposure calculator's educational value | Implemented on feature PR; manual QA still pending |
| Maintain an auditable commit sequence | Review changes by engineering purpose, never synthesize older history | Implemented on feature PR |
| Require full EXIF triple for application | Avoid mixing photo metadata with stale slider values | Implemented on feature PR |

## Next milestones

1. Verify the deployed site and asset loading.
2. Test the two-lock invariant, inverse calculations, and edge cases.
3. Test EXIF import with full, partial, and absent metadata.
4. Check mobile layout and accessibility.
5. Fix verified defects and document each change with a commit.
6. Add automated tests if a lightweight test setup can be introduced without making the static site harder to run.
7. Capture genuine screenshots and a concise project demo for a portfolio or extracurricular activity submission.

## 2026-10-29 — English Exposure Lab interface

- Started from the latest merged solver implementation, preserving the pure
  mathematics module and existing engineering history.
- Replaced the public UI with an English, responsive camera-workbench interface.
  Added explicit Manual/Auto modes, preset selection feedback, reset, named
  controls, keyboard focus and a local-photo privacy explanation.
- Replaced conflicting legacy stylesheet rules with one responsive stylesheet.
- Added the original workflow SVG and a real interface preview to the root README.
- Local evidence: 24 Node checks passed and real Chromium interaction/layout
  smoke validation passed. See TESTING.md for scope and limitations.
