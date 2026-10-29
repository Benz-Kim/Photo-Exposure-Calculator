"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const core = require("../exposure-core.js");

const SHUTTERS = [30, 15, 8, 4, 2, 1, 1/2, 1/4, 1/8, 1/15, 1/30, 1/60, 1/125, 1/250, 1/500, 1/1000, 1/2000, 1/4000, 1/8000]
  .map(val => ({ val }));
const APERTURES = [1, 1.4, 2, 2.8, 4, 5.6, 8, 11, 16, 22, 32].map(val => ({ val }));
const ISOS = [100, 200, 400, 800, 1600, 3200, 6400, 12800, 25600, 51200];
const settings = { shutter: SHUTTERS, aperture: APERTURES, iso: ISOS };

function close(actual, expected, tolerance = 1e-10) {
  assert.ok(Math.abs(actual - expected) <= tolerance,
    "Expected " + actual + " to be within " + tolerance + " of " + expected);
}

test("Sunny 16: f/16, 1/100 s, ISO 100", () => {
  close(core.calculateEV(1/100, 16, 100), Math.log2(25600));
});

test("doubling ISO reduces EV100 by exactly one stop", () => {
  close(core.calculateEV(1/125, 5.6, 200) - core.calculateEV(1/125, 5.6, 100), -1);
});

test("halving shutter time increases EV100 by one stop", () => {
  close(core.calculateEV(1/250, 5.6, 100) - core.calculateEV(1/125, 5.6, 100), 1);
});

test("inverse equations recover exposure for all three parameters", () => {
  const examples = [
    { shutter: 1/125, aperture: 5.6, iso: 400 },
    { shutter: 30, aperture: 2.8, iso: 3200 },
    { shutter: 1/8000, aperture: 22, iso: 100 }
  ];
  for (const v of examples) {
    const target = core.calculateEV(v.shutter, v.aperture, v.iso);
    for (const key of ["shutter", "aperture", "iso"]) {
      const solved = { ...v, [key]: core.solveUnknown(key, target, v) };
      close(core.calculateEV(solved.shutter, solved.aperture, solved.iso), target);
    }
  }
});

test("logarithmic nearest-neighbor differs from misleading linear distance", () => {
  assert.equal(core.nearestIndex([100, 200], 145), 1);
  assert.equal(core.nearestIndex([100, 200], 140), 0);
});

test("rounding is the closest achievable EV for the unlocked parameter", () => {
  for (let si = 0; si < SHUTTERS.length; si += 2) {
    for (let ai = 0; ai < APERTURES.length; ai += 2) {
      for (let ii = 0; ii < ISOS.length; ii += 2) {
        const indices = { shutter: si, aperture: ai, iso: ii };
        const target = core.calculateEV(SHUTTERS[si].val, APERTURES[ai].val, ISOS[ii]);
        for (const key of ["shutter", "aperture", "iso"]) {
          const adjusted = { ...indices, [key]: (indices[key] + 1) % settings[key].length };
          const result = core.resolveSetting(key, target, adjusted, settings);
          assert.ok(Number.isFinite(result.actualEV));
          assert.ok(Number.isFinite(result.residualEV));
          assert.ok(result.index >= 0 && result.index < settings[key].length);
          const attainable = settings[key].map((option, index) => {
            const i = { ...adjusted, [key]: index };
            return Math.abs(core.calculateEV(
              SHUTTERS[i.shutter].val, APERTURES[i.aperture].val, ISOS[i.iso]
            ) - target);
          });
          const minimum = Math.min(...attainable);
          close(Math.abs(result.residualEV), minimum, 1e-9);
        }
      }
    }
  }
});

test("unattainable target is clamped to a supported setting and flagged", () => {
  const result = core.resolveSetting("iso", 30,
    { shutter: 18, aperture: 10, iso: 0 }, settings);
  assert.equal(result.rangeLimited, true);
  assert.equal(result.index, 0);
  assert.ok(Number.isFinite(result.residualEV));
});

test("locking transitions preserve exactly two locks for repeated interactions", () => {
  let locks = { shutter: true, aperture: true, iso: false };
  for (let round = 0; round < 100; round++) {
    for (const key of ["shutter", "iso", "aperture", "iso", "shutter"]) {
      const previous = { ...locks };
      locks = core.transitionLocks(locks, key);
      assert.equal(Object.values(locks).filter(Boolean).length, 2);
      assert.deepEqual(Object.keys(locks).sort(), ["aperture", "iso", "shutter"]);
      assert.notStrictEqual(locks, previous);
    }
  }
});

test("rejects undefined, negative and non-finite inputs", () => {
  assert.throws(() => core.calculateEV(0, 2.8, 100), RangeError);
  assert.throws(() => core.calculateEV(1/60, Infinity, 100), RangeError);
  assert.throws(() => core.solveUnknown("bad", 10, {}), RangeError);
  assert.throws(() => core.nearestIndex([], 123), RangeError);
  assert.throws(() => core.transitionLocks({ shutter: true, aperture: false, iso: false }, "iso"), RangeError);
});
