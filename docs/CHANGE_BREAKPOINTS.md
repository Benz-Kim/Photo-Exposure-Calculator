# Development Breakpoints and Commit Evidence

This document groups genuine, chronological commits by engineering question. It does **not** rewrite, split, backdate, or embellish older history. Each link points to an actual change on the feature branch.

**Review branch:** \`feature/ev-model-validation-2026-10-29\`  
**Pull request:** https://github.com/Benz-Kim/Photo-Exposure-Calculator/pull/1

## BP-01 — Define the mathematical contract

**Question:** How can three camera settings be modeled as deterministic, independently testable calculations?

- [51ad55f](https://github.com/Benz-Kim/Photo-Exposure-Calculator/commit/51ad55f4e194b7657b4edf66512ed298d5872b86) — \`feat(core): extract deterministic EV100 math and lock transitions\`
- Deliverable: \`exposure-core.js\`, a browser/Node-compatible module with pure calculations, inverse formulas, logarithmic rounding, and a two-lock transition function.
- Proof obligation: the inverse formula must recover the original EV100 before rounding.

## BP-02 — Connect math to the actual interface

**Question:** Does changing either locked parameter actually solve the unlocked one?

- [fb15c80](https://github.com/Benz-Kim/Photo-Exposure-Calculator/commit/fb15c803b47aaa5a9bb9e3208cc0b5532df2ebf9) — \`feat(ui): load pure math module and label EV100 accurately\`
- [ebd0c0f](https://github.com/Benz-Kim/Photo-Exposure-Calculator/commit/ebd0c0f6041e82f2710dc7ab50c2ba65211f7d77) — \`fix(calculator): auto-solve unlocked setting against persistent EV100 target\`
- Deliverable: working two-lock auto-solver; actual/target EV difference displayed when selectable values cause rounding.
- Proof obligation: exactly two parameters remain user-adjustable and target EV stays fixed when their values change.

## BP-03 — Establish reproducible tests

**Question:** Can another developer check the mathematical and behavioral claims?

- [c12d80a](https://github.com/Benz-Kim/Photo-Exposure-Calculator/commit/c12d80acce007d221c3fa3fe35c35f76c7f91b40) — \`test(core): verify inverse formulas, rounding, boundaries and lock invariants\`
- [f1356c7](https://github.com/Benz-Kim/Photo-Exposure-Calculator/commit/f1356c772dc104065467f692f54819138a850e57) — \`test(app): cover real script integration and EV target persistence\`
- [413abc7](https://github.com/Benz-Kim/Photo-Exposure-Calculator/commit/413abc77c8345d3976080b618531d6bd6a5462ab) — \`ci: verify syntax and automated calculator tests on push and PR\`
- Deliverable: Node-based test suite and GitHub Actions verification.
- Evidence: [CI run #40869486242](https://github.com/Benz-Kim/Photo-Exposure-Calculator/actions/runs/40869486242) — **18 tests passed, 0 failed** on the tested feature revision.

## BP-04 — Make the reference EV explicit

**Question:** How can a user intentionally change the reference exposure rather than only comparing equivalent configurations?

- [0a150df](https://github.com/Benz-Kim/Photo-Exposure-Calculator/commit/0a150dfa62983d9e36c513e2cabb0031a164587c) — \`feat(calculator): support independently adjustable reference EV100\`
- [489abf6](https://github.com/Benz-Kim/Photo-Exposure-Calculator/commit/489abf69af1022537581a34c1386302ca316ffce) — \`feat(ui): add an explicit target EV100 control with accessible label\`
- [4efd62a](https://github.com/Benz-Kim/Photo-Exposure-Calculator/commit/4efd62a0c100ae2f59eb526066072d050b2c7233) — \`style: make target EV slider readable and keyboard accessible\`
- Deliverable: separate target EV100 slider and context labels.
- Caveat: keyboard support is not a substitute for screen-reader and real-device testing.

## BP-05 — Improve reliability and represent uncertainty

**Question:** What happens if EXIF is incomplete, the parser is unavailable, or exact equivalent settings are impossible?

- [0c058c0](https://github.com/Benz-Kim/Photo-Exposure-Calculator/commit/0c058c056ffe9ec673d39e381951bf5b069e782f) — \`fix(exif): recover from loader failures and reject incomplete metadata\`
- [d2fef40](https://github.com/Benz-Kim/Photo-Exposure-Calculator/commit/d2fef4004434316c2de8a82b2ef7001c4e010e72) — \`test(exif): cover complete, partial and offline image imports\`
- [d5e294e](https://github.com/Benz-Kim/Photo-Exposure-Calculator/commit/d5e294e352c6e095cff76ebb223c3f3f7f89f738) — \`fix(combos): bound equivalent settings and show EV rounding residual\`
- [3860a38](https://github.com/Benz-Kim/Photo-Exposure-Calculator/commit/3860a384b1163bc0cc589c99957d4fe21576c9bb) — \`style(combos): make displayed EV rounding error legible\`
- Deliverable: robust partial-EXIF refusal, loader failure message, supported-range filtering, and explicit EV residual in the combination table.

## BP-06 — Record theory and verification limits

**Question:** Can a reviewer trace what the software claims, the mathematical reasoning, the tested evidence, and the remaining uncertainties?

- [79857df](https://github.com/Benz-Kim/Photo-Exposure-Calculator/commit/79857dfa8fe549ffc546d6f370c18f32b99140c6) — \`docs(math): derive EV100 inverses, invariants and falsifiable checks\`
- [7b838c3](https://github.com/Benz-Kim/Photo-Exposure-Calculator/commit/7b838c3f3fa3f8087f813e860e33d43f2c9ebce3) — \`docs(test): record verified 18-test CI result separately from manual QA\`
- Deliverable: engineering rationale, reproducible checks, and transparent CI evidence.

## Future breakpoints (not completed)

- **BP-07 — Real device validation:** screenshot and browser/device report, mobile interaction, keyboard and screen-reader testing.
- **BP-08 — Camera-image validation:** camera-original EXIF fixtures with consent, metadata variations, and failure notes.
- **BP-09 — Release evidence:** confirm production Netlify deployment, capture deployed revision and release timestamp.
- **BP-10 — User research:** document actual participant tasks, outcomes, and what was changed in response.

## Provenance / authorship

These changes include AI-assisted design and coding. The GitHub commit log records repository changes, not necessarily the identity of every human who typed every line. For a college application, only describe work personally understood, reviewed, reproduced, and genuinely carried out; do not present unverified usage, adoption, or original authorship as fact. No historical commits have been rewritten to create the impression of a longer development period.
