# Testing and Validation Plan

This document separates planned checks from verified results. A checkbox should be marked complete only after the behavior has been tested against the current deployed or local version.

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
| Not yet recorded | — | — | — | Add an entry after performing checks |

## Reporting standard

Do not claim a test passed until it has been run. For each test session, record the date, commit SHA, browser/device, steps, expected result, actual result, and any issue found. When fixing a defect, document the reproduction steps and the change that resolved it.
