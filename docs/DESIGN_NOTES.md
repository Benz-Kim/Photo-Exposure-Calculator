# Exposure Lab interface

The public site is an English-language photography learning tool. A new reader
should be able to identify what it does and try a setting without signing in.
The interface retains the pure EV model and its numerical limits.

## Design direction

A camera workbench provides the organizing idea. A vector aperture/viewfinder
anchors the introduction; its three numeric readouts follow the actual controls.
It is explicitly labeled as an illustration, not a scene-exposure simulation.

- Palette: workspace `#edf1f5`, white controls `#ffffff`, viewfinder `#20334b`,
  blue actions `#245bdb`, body text `#172536`, guidance `#e4eceb`.
- Type: a system sans-serif stack for headings and body, with monospace only for
  camera-style numerical viewfinder readouts and slider ticks. No font request or
  third-party image dependency is needed to render the application.
- Layout: left-aligned explanation alongside the viewfinder, followed by the
  calculator. Three desktop controls become a selectable single panel on mobile.
  Photo metadata import follows the calculator so a first-time visitor can start
  without providing a file.
- Interaction: Manual/Auto buttons replace ambiguous lock icons. Exactly two
  settings remain manual. The reference control, rounding residual and range
  limits remain visible. Presets show selection state and edits clear it.
- Accessibility: English document language, named sliders and mode buttons,
  keyboard focus, a skip link, visible file-input focus, reduced-motion support,
  semantic table headers and recoverable metadata errors.

The original blue/light workbench direction was selected over a generic warm
serif portfolio or a dense dark dashboard. The viewfinder carries the strongest
visual identity; the rest stays quiet enough for the tool to be read and used.

## Open-source guidance

This redesign applied the public
[Anthropic frontend-design skill](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md),
read on 2026-10-29: plan around the subject, use an intentional token system,
review for generic treatments, and inspect actual screenshots. The page,
workflow diagram and CSS are project-specific implementations. No external
skill was installed as an application dependency.
