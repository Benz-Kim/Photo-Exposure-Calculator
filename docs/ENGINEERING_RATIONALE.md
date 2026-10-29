# Engineering Rationale: EV100 Model and Verification

> This is a technical explanation of the implementation and its assumptions, not a claim that camera settings alone measure actual scene brightness.

## 1. Problem statement and observable behavior

**Problem found in the original implementation:** the interface described an auto-calculated third camera parameter, but changing either locked slider only changed that slider and refreshed the EV display. The third parameter did not change. This violated the central user-facing requirement.

**Revised requirement:** given a chosen reference EV100 and any two adjustable camera parameters, calculate the third parameter to minimize the difference from the reference EV100, subject to the camera setting choices supported by the UI.

The revised program must keep exactly two parameters user-adjustable at all times. The remaining one is the automatically solved variable.

## 2. Mathematical model

The camera-settings EV100 is

$
EV_{100} = \log_2\left(\frac{N^2}{t}\right) - \log_2\left(\frac{S}{100}\right)
$

where:

- $N$ = aperture f-number (positive).
- $t$ = exposure duration in seconds (positive).
- $S$ = ISO setting (positive).

This can be rearranged without approximation:

$
2^{EV_{100}} = \frac{100N^2}{tS}
$

Solving each parameter individually:

**Shutter duration**

$
t = \frac{100N^2}{S\,2^{EV_{100}}}
$

**Aperture**

$
N = \sqrt{\frac{tS}{100}\,2^{EV_{100}}}
$

**ISO**

$
S = \frac{100N^2}{t\,2^{EV_{100}}}
$

These inverses are implemented in \`exposure-core.js\`. They are valid for positive finite settings and a finite EV. Invalid values raise errors rather than silently propagating \`NaN\` or \`Infinity\`.

### Reference case

For f/16, 1/100 s, ISO 100:

$
EV_{100} = \log_2(25600) \approx 14.64
$

This is a check of arithmetic, **not** a prediction that the picture must be correctly exposed.

## 3. Quantization and approximation

Cameras commonly expose a discrete choice of shutter speeds, f-numbers, and ISO settings. Therefore an algebraically exact result may not be selectable.

Given an exact positive solution $x$ and candidate setting values $v_j$, we choose:

$
j^* = \arg\min_j \left|\log_2(v_j/x)\right|
$

This logarithmic, **stop-based** distance is more appropriate than $|v_j-x|$ because photographic settings change approximately by ratios rather than constant linear differences. As a counterexample, for candidates 100 and 200, a target of 145 is closer to 100 in ordinary absolute distance, but closer to 200 in logarithmic stop distance.

After selecting the nearest candidate, the program recomputes the realized EV100 and the residual:

$
\Delta EV = EV_{\text{realized}} - EV_{\text{target}}
$

A nonzero residual is an expected result of quantization, not automatically an arithmetic bug. The interface indicates differences of at least 0.05 stop and flags settings that fall outside the selectable range.

The equivalent-exposure table now rejects candidates requiring shutter speeds outside the supported range or exceeding 0.5 stop of approximation error, and displays the residual for retained rows.

## 4. State model and invariants

The state contains:

- \`targetEV\`: the reference EV100 that the solver attempts to preserve.
- \`idx\`: indices of the selected shutter, aperture, and ISO entries.
- \`locks\`: three booleans; exactly two must be \`true\`.
- \`solveMeta\`: the exact desired setting, selected supported setting, realized EV, residual and range-limit flag.

The lock-state invariant is:

$
\sum_{k \in \{\mathrm{shutter},\mathrm{aperture},\mathrm{iso}\}}[\mathrm{locks}[k]] = 2
$

Transitions are implemented in \`transitionLocks\`, a pure function that returns a new lock state. It does not mutate the previous state.

- Changing a *locked* parameter changes a user-controlled input; the solver adjusts the unlocked variable to keep \`targetEV\` constant as closely as possible.
- Moving the **target EV100 slider** changes \`targetEV\` and recomputes the unlocked variable.
- Selecting a **preset** starts a new reference from the preset's complete camera settings.
- Applying **complete EXIF data** starts a new reference from the imported settings after mapping them to selectable values.
- Partial EXIF cannot be applied because silently mixing missing photo metadata with values from a previous setting would misrepresent the original photo.

## 5. Interpretation boundaries

**Camera settings are not the scene.** The program is not a light meter. Without independently knowing scene luminance and the photographer's intent, a particular EV100 alone cannot prove underexposure or overexposure.

The UI labels the quantity as *setting EV100*, and scene categories are only approximate references, not verified readings. ISO noise, shutter-induced blur, and diffraction also depend on camera, lens, stabilization, subject motion, and other conditions; accompanying warnings must be interpreted as possibilities rather than guarantees.

The current displayed EV scale emphasizes 0–20; extreme EV values can fall outside that visual span. The numeric readout is authoritative; the bar is a bounded visual aid.

## 6. Verification strategy

Two independent test layers are committed:

1. \`tests/exposure-core.test.cjs\` checks known references, stop relationships, all inverse equations, nearest-setting selection, range limits, error handling and repeated lock transitions.
2. \`tests/app-smoke.test.cjs\` executes the actual browser scripts in a simulated DOM. It covers the initial lock state, slider-driven auto-solving, preset target reset, user-facing labeling, full/partial EXIF and an EXIF CDN failure.

GitHub Actions runs \`node --check\` and \`node --test tests/*.test.cjs\`. Passing these tests means the checked behaviors passed in a Node simulation; it does **not** certify all browsers, real cameras, real photos, accessibility, or mobile-device behavior.

## 7. Falsifiable acceptance criteria

- Every tested valid inverse reproduces the requested EV100 before rounding to numerical tolerance.
- The rounded setting minimizes absolute EV difference among the available settings when the other two are fixed.
- A lock interaction never leaves fewer or more than two controls locked.
- The target EV remains unchanged when a user alters a locked camera parameter.
- A new preset, full EXIF import, or direct target control appropriately establishes a new target.
- Missing EXIF values do not silently reuse unrelated camera metadata.
- No user-facing label claims that a setting EV100 alone proves over- or underexposure.

## 8. Limitations and possible experiments

- Test against real camera EXIF samples of different manufacturers and image encodings.
- Compare selected exposure combinations to a camera light meter under controlled illumination.
- Conduct desktop/mobile and screen-reader checks with reproducible device/browser logs.
- Evaluate a direct numerical-input mode and finer camera stop increments.
- Verify the color-coded EV strip does not imply universal under/overexposure.
- Record any user testing as observations, not invented impact or usage statistics.

## 9. Responsible presentation in an extracurricular portfolio

The repository is evidence of what was implemented and tested. A project description should not imply that every commit was hand-written or that independent user impact was established without supporting evidence. Changes made with AI-assisted coding tools should be reviewed, understood, and accurately described by the student. The project's educational value comes from being able to explain the model, evaluate its assumptions, reproduce the tests, and make defensible engineering decisions.
