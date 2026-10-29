# Testing and Validation Plan

This document separates planned checks from verified results. A checkbox should be marked complete only after the behavior has been tested against the current deployed or local version.

## Verified automated checks — 2026-10-29

A GitHub Actions run on the feature branch completed successfully: [CI run #40869977667](https://github.com/Benz-Kim/Photo-Exposure-Calculator/actions/runs/40869977667).

**Evidence:** 18 automated tests passed, 0 failed. Tests ran under Node.js 22 in GitHub Actions; browser behavior was simulated for integration checks. The test runner also performed syntax checks on `exposure-core.js` and `exposure-script.js`.

- [x] Algebraic EV100 reference and one-stop relationships.
- [x] All three inverse formulas at representative settings.
- [x] Logarithmic nearest-index selection and boundaries.
- [x] Multiple lock-state transitions preserving exactly two locked parameters.
- [x] Simulated slider, preset, EV target, and status updates.
- [x] Complete/partial EXIF data handling and CDN-load failure in a simulated environment.

These checks are **not** evidence that the app passed real-camera EXIF samples, screen readers, or physical mobile devices.

## Manual test checklist

### Core calculator
- [ ] Initial page loads without JavaScript errors.
- [ ] Changing a locked slider updates the displayed value and EV feedback.
- [ ] Exactly two parameters remain locked after any sequence of lock/unlock actions.
- [ ] The unlocked parameter is recalculated when either locked value changes.
- [ ] EV output matches an independently calculated reference case within the expected rounding and discrete-setting limits.
- [ ] Values at the ends of each slider range do not produce NaN, Infinity, or a broken interface.

### Presets and equivalent combinations
- [ ] Each of the five presets updates the controls consistently.
- [ ] Equivalent-exposure rows are refreshed when the settings change.
- [ ] Duplicate combinations are not displayed.
- [ ] The table remains readable on narrow screens.

### Guidance and warnings
- [ ] Low and high EV values produce the intended guidance categories.
- [ ] High ISO, slow shutter speed, and narrow-aperture warnings appear at the intended thresholds.
- [ ] Guidance is presented as approximate educational advice, not a guarantee of exposure.

### EXIF import
- [ ] A camera-original JPEG with shutter, aperture, and ISO metadata is parsed.
- [ ] An image with only some of those fields is handled without crashing.
- [ ] An image without usable EXIF metadata produces a clear message.
- [ ] A malformed or unsupported image produces a recoverable error.
- [ ] The apply action maps metadata to the nearest supported settings.
- [ ] The UI remains usable if the EXIF parser CDN cannot be reached.

### Responsive and accessibility checks
- [ ] Desktop layout works at common laptop widths.
- [ ] Mobile panel tabs switch to the correct parameter panel.
- [ ] Resizing between mobile and desktop widths does not leave panels hidden.
- [ ] All controls can be operated with a keyboard.
- [ ] Focus indicators, labels, contrast, and status messages are usable.
- [ ] No unintended horizontal overflow appears at narrow widths.

### Deployment
- [ ] The Netlify root URL loads the calculator.
- [ ] Direct navigation to exposure-index.html works.
- [ ] CSS, JavaScript, favicon, and other local assets load successfully.
- [ ] A fresh GitHub commit triggers the expected Netlify deployment.
- [ ] The deployed version is checked after each release.

## Test record

| Date | Version / commit | Environment | Checks performed | Result / issues |
|---|---|---|---|---|
| 2026-10-29 | Feature PR #1 / commit `d7c6ac78` | GitHub Actions, Node.js 22 | Syntax + 20 unit/integration tests | **Pass: 20 / Fail: 0** — [run](https://github.com/Benz-Kim/Photo-Exposure-Calculator/actions/runs/40869977667) |

## Reporting standard

Do not claim a test passed until it has been run. For each test session, record the date, commit SHA, browser/device, steps, expected result, actual result, and any issue found. When fixing a defect, document the reproduction steps and the change that resolved it.

## Exposure Lab English interface — 2026-10-29

Validated locally on the English interface revision, using Node 24.19.0 and the
system Chromium through Playwright:

- `node --test tests/*.test.cjs`: **24 passed, 0 failed**, including the original
  numerical/integration suite and new language, mode accessibility, reset and
  preset-state regression checks.
- `node tests/browser-smoke.cjs` against a Python static server on port 5501:
  passed. Verified English language/text, three desktop columns, keyboard-driven
  solving, Auto/Manual accessibility state, all five presets, reset, no page
  overflow at 320/390/640/768/1024 px, mobile panel selection and return to desktop.
- The real metadata parser loaded from jsDelivr. A tiny PNG without camera
  metadata produced a recoverable English message and no Apply action.
- axe-core 4.10.2 automated WCAG 2 A/AA and 2.1 AA checks: **0 violations**
  at both 1440 px and 390 px (28 passing rules per viewport).
- No uncaught browser JavaScript exceptions or HTTP asset failures were observed.
- Desktop and mobile full-page screenshots were visually inspected. The README
  preview is a real desktop screenshot; the workflow SVG is an original diagram,
  not a screenshot or a claim of physical camera testing.

The optional browser check requires Playwright and Chromium already installed
and a server started with `python3 -m http.server 5501 --bind 127.0.0.1` from the
repository root. It does not add dependencies to the static application or to
the dependency-free CI suite. Browser screenshots go to `/tmp`.

Physical-camera JPEG coverage, screen-reader usability, other browser engines,
and measured user outcomes remain unverified. Automated accessibility checks do
not establish full WCAG conformance.
