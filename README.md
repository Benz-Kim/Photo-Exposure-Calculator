# Photo Exposure Calculator

An interactive, browser-based learning tool for exploring the relationship between shutter speed, aperture, ISO, and exposure value (EV).

**Live demo:** https://exposure-calculator.netlify.app/  
**Source code:** https://github.com/Benz-Kim/Photo-Exposure-Calculator  
**Engineering upgrade preview (PR #1):** https://deploy-preview-1--exposure-calculator.netlify.app/

## Why I built it

Photography beginners often learn the exposure triangle as a set of rules to memorize. I wanted to make those relationships easier to explore by letting people change settings, see the calculated exposure value, and compare equivalent combinations in one place.

This project combines a practical photography problem with mathematical modeling, JavaScript state management, interface design, and deployment of a static website.

## Features

- **Interactive exposure controls:** Adjust shutter speed, aperture, and ISO with sliders.
- **Two-parameter locking:** Keep exactly two camera settings user-adjustable and solve the third toward a reference EV100.
- **Adjustable EV100 reference:** Use a separate target control to intentionally change the reference exposure setting.
- **Explicit calculation precision:** Display reference-vs-realized EV error when a discrete camera value cannot match the exact algebraic solution.
- **Contextual guidance:** Display a rough lighting-context interpretation and warnings for settings such as high ISO, slow shutter speeds, and narrow apertures.
- **Equivalent-exposure table:** Compare feasible near-equivalent combinations, filtered to at most 0.5 stop of rounding error, with an EV residual shown for each row.
- **Shooting presets:** Start from Sunny, Indoor, Night, Portrait, or Sports settings.
- **Photo EXIF import:** Parse image metadata locally in the browser, display available fields, and apply settings when shutter speed, aperture, and ISO are all present. A parser library is loaded from an external CDN on demand.
- **Responsive interface:** Provide a desktop layout and mobile-specific panel navigation.

> The lighting guidance is educational and approximate. Actual exposure depends on scene luminance, metering, camera calibration, lens transmission, and creative intent.

## How the calculation works

The calculator uses the exposure-value relationship for ISO 100:

EV = log₂(N² / t) − log₂(ISO / 100)

Where:

- N is the aperture f-number.
- t is shutter time in seconds.
- ISO is sensor sensitivity.

A pure mathematical module implements all three inverse equations. The application keeps a persistent EV100 target when either locked parameter changes. Because the interface offers discrete settings, the exact solution is snapped to the nearest supported value **in logarithmic stop distance**, and the difference between target and actual EV100 is reported.

Mathematical derivations, state invariants, and validation limits are explained in [Engineering Rationale](docs/ENGINEERING_RATIONALE.md).

## Technology

- HTML
- CSS
- Vanilla JavaScript
- Browser APIs
- [exifr](https://github.com/MikeKovarik/exifr) loaded from jsDelivr when EXIF import is used

The calculator does not require a framework, package installation, or a build step. The EXIF feature loads its parser on demand from a CDN.

## Run locally

1. Clone or download this repository.
2. Keep the HTML, CSS, JavaScript, and asset files in their repository-relative locations.
3. Open index.html in a modern browser. It redirects to exposure-index.html.
4. Alternatively, open exposure-index.html directly.

No build command is required for this static site.

## Project structure

- index.html — entry-point redirect.
- exposure-index.html — page structure and interface.
- exposure-style.css — visual styling and responsive layout.
- exposure-core.js — pure EV100 equations, inverse solver, logarithmic nearest-setting selection, and lock transitions.
- exposure-script.js — interface state, presets, guidance, equivalent combinations, mobile UI, and EXIF import.
- tests/exposure-core.test.cjs — numerical, boundary and lock-invariant tests.
- tests/app-smoke.test.cjs — simulated-browser integration and EXIF failure tests.
- .github/workflows/verify.yml — syntax and test automation.
- docs/ENGINEERING_RATIONALE.md — mathematical argument and limitations.
- docs/CHANGE_BREAKPOINTS.md — chronological, granular commit evidence.
- docs/TESTING.md — verified CI results and outstanding manual checks.
- netlify.toml — Netlify publish and root-route configuration.
- favicon.svg and other assets — interface assets.

## Deployment

The site is configured for Netlify as a static website. The repository's netlify.toml sets the publish directory to the repository root and rewrites the root route to /exposure-index.html.

Live deployment: https://exposure-calculator.netlify.app/

## Development notes

The project evolved from a single-file prototype into separate HTML, CSS, and JavaScript files. That refactor made the code easier to navigate, but also surfaced the importance of consistent file paths and names. The current entry-point redirect and Netlify rewrite are intended to keep the deployed root URL working with the existing page filename.

The engineering-upgrade branch includes automated unit and integration checks. [CI run #40869486242](https://github.com/Benz-Kim/Photo-Exposure-Calculator/actions/runs/40869486242) reported **18 passed, 0 failed** on the tested revision. These checks simulate browser behavior in Node.js; they do not replace validation on real devices or physical camera files.

For an auditable explanation of changes, see [Development Breakpoints](docs/CHANGE_BREAKPOINTS.md).

## Limitations and next steps

- Lighting-context descriptions are heuristics, not a replacement for a camera light meter.
- The calculator maps results to discrete supported values rather than presenting arbitrary continuous values.
- EXIF import depends on metadata being present in the image and on the external parser CDN being reachable.
- Expand automated checks to cover more visual/UI regressions and user interaction sequences.
- Add a documented manual test checklist and record browser/device coverage.
- Review accessibility, including keyboard navigation, visible focus, semantic labels, and screen-reader feedback.
- Confirm and document privacy behavior and third-party CDN requests for imported image metadata.

## Learning outcomes

This project has provided practice in translating a domain formula into interactive software, coordinating UI state across multiple controls, handling discrete numeric ranges, parsing image metadata, designing a responsive interface, and deploying a static application.

---

*Built as an independent web-development and photography-learning project.*
