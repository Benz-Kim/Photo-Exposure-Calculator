# Photo Exposure Calculator

An interactive, browser-based learning tool for exploring the relationship between shutter speed, aperture, ISO, and exposure value (EV).

**Live demo:** https://exposure-calculator.netlify.app/  
**Source code:** https://github.com/Benz-Kim/Photo-Exposure-Calculator

## Why I built it

Photography beginners often learn the exposure triangle as a set of rules to memorize. I wanted to make those relationships easier to explore by letting people change settings, see the calculated exposure value, and compare equivalent combinations in one place.

This project combines a practical photography problem with mathematical modeling, JavaScript state management, interface design, and deployment of a static website.

## Features

- **Interactive exposure controls:** Adjust shutter speed, aperture, and ISO with sliders.
- **Two-parameter locking:** Lock two settings and calculate the third setting automatically.
- **Exposure-value feedback:** Calculate EV and visualize it on a scale.
- **Contextual guidance:** Display a rough lighting-context interpretation and warnings for settings such as high ISO, slow shutter speeds, and narrow apertures.
- **Equivalent-exposure table:** Explore alternative shutter/aperture/ISO combinations for a similar EV, with labels describing likely photographic effects.
- **Shooting presets:** Start from Sunny, Indoor, Night, Portrait, or Sports settings.
- **Photo EXIF import:** Read available shutter speed, aperture, and ISO metadata from an uploaded image, then apply the closest supported values to the calculator.
- **Responsive interface:** Provide a desktop layout and mobile-specific panel navigation.

> The lighting guidance is educational and approximate. Actual exposure depends on scene luminance, metering, camera calibration, lens transmission, and creative intent.

## How the calculation works

The calculator uses the exposure-value relationship for ISO 100:

EV = log₂(N² / t) − log₂(ISO / 100)

Where:

- N is the aperture f-number.
- t is shutter time in seconds.
- ISO is sensor sensitivity.

The application stores supported settings in discrete arrays. When a computed value does not exactly match a supported setting, it maps the result to the nearest available value. This makes the interface practical to use, while meaning the displayed settings may only approximate the mathematically exact solution.

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
- exposure-script.js — exposure calculations, interaction state, presets, guidance, equivalent combinations, mobile UI, and EXIF import.
- netlify.toml — Netlify publish and root-route configuration.
- favicon.svg and other assets — interface assets.

## Deployment

The site is configured for Netlify as a static website. The repository's netlify.toml sets the publish directory to the repository root and rewrites the root route to /exposure-index.html.

Live deployment: https://exposure-calculator.netlify.app/

## Development notes

The project evolved from a single-file prototype into separate HTML, CSS, and JavaScript files. That refactor made the code easier to navigate, but also surfaced the importance of consistent file paths and names. The current entry-point redirect and Netlify rewrite are intended to keep the deployed root URL working with the existing page filename.

The next improvement phase should prioritize repeatable validation: verify calculations and lock-state behavior, test EXIF files with missing metadata, check mobile and desktop layouts, and record the results in the project documentation before describing those checks as completed.

## Limitations and next steps

- Lighting-context descriptions are heuristics, not a replacement for a camera light meter.
- The calculator maps results to discrete supported values rather than presenting arbitrary continuous values.
- EXIF import depends on metadata being present in the image and on the external parser CDN being reachable.
- Add automated checks for calculation edge cases and the invariant that exactly two parameters are locked.
- Add a documented manual test checklist and record browser/device coverage.
- Review accessibility, including keyboard navigation, visible focus, semantic labels, and screen-reader feedback.
- Consider adding a clear privacy note for image metadata processing and verifying whether image bytes remain local throughout EXIF parsing.

## Learning outcomes

This project has provided practice in translating a domain formula into interactive software, coordinating UI state across multiple controls, handling discrete numeric ranges, parsing image metadata, designing a responsive interface, and deploying a static application.

---

*Built as an independent web-development and photography-learning project.*
