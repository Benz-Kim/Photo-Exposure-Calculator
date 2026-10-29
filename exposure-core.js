/* Pure exposure-math utilities; no DOM or third-party dependencies. */
(function (root, factory) {
  "use strict";
  const core = factory();
  if (typeof module === "object" && module.exports) module.exports = core;
  if (root) root.ExposureCore = core;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const KEYS = ["shutter", "aperture", "iso"];

  function positiveFinite(value, name) {
    if (!Number.isFinite(value) || value <= 0) {
      throw new RangeError(name + " must be a positive finite number");
    }
  }

  /** EV100 = log2(N^2 / t) - log2(ISO / 100). */
  function calculateEV(shutterSeconds, aperture, iso) {
    positiveFinite(shutterSeconds, "shutterSeconds");
    positiveFinite(aperture, "aperture");
    positiveFinite(iso, "iso");
    return 2 * Math.log2(aperture) - Math.log2(shutterSeconds) - Math.log2(iso / 100);
  }

  /**
   * Solve exactly one unknown variable while preserving a target EV100.
   * shutterSeconds is in seconds, aperture is the f-number, ISO is numeric.
   */
  function solveUnknown(unlocked, ev, values) {
    if (!KEYS.includes(unlocked)) throw new RangeError("Unknown parameter: " + unlocked);
    if (!Number.isFinite(ev)) throw new RangeError("EV must be finite");
    if (!values || typeof values !== "object") throw new TypeError("Values are required");

    let result;
    if (unlocked === "shutter") {
      positiveFinite(values.aperture, "aperture");
      positiveFinite(values.iso, "iso");
      result = (values.aperture ** 2) / (2 ** ev * (values.iso / 100));
    } else if (unlocked === "aperture") {
      positiveFinite(values.shutter, "shutterSeconds");
      positiveFinite(values.iso, "iso");
      result = Math.sqrt(2 ** ev * values.shutter * (values.iso / 100));
    } else {
      positiveFinite(values.shutter, "shutterSeconds");
      positiveFinite(values.aperture, "aperture");
      result = (100 * values.aperture ** 2) / (values.shutter * 2 ** ev);
    }
    positiveFinite(result, unlocked);
    return result;
  }

  /**
   * Compare candidates by logarithmic stop distance rather than linear value
   * distance. Camera settings change in approximately multiplicative steps.
   */
  function nearestIndex(options, target) {
    positiveFinite(target, "target");
    if (!Array.isArray(options) || options.length === 0) {
      throw new RangeError("A nonempty settings list is required");
    }
    let best = 0;
    let smallest = Infinity;
    options.forEach(function (entry, index) {
      const value = typeof entry === "number" ? entry : entry.val;
      positiveFinite(value, "option");
      const distance = Math.abs(Math.log2(value / target));
      if (distance < smallest) {
        smallest = distance;
        best = index;
      }
    });
    return best;
  }

  /** Returns rounded setting and measured EV residual in stops. */
  function resolveSetting(unlocked, targetEV, indices, settings) {
    if (!indices || !settings) throw new TypeError("Indices and settings required");
    const shutter = settings.shutter[indices.shutter].val;
    const aperture = settings.aperture[indices.aperture].val;
    const iso = settings.iso[indices.iso];
    const desired = solveUnknown(unlocked, targetEV, { shutter, aperture, iso });
    const options = settings[unlocked];
    const index = nearestIndex(options, desired);
    const selected = typeof options[index] === "number" ? options[index] : options[index].val;
    const values = { shutter, aperture, iso };
    values[unlocked] = selected;
    const actualEV = calculateEV(values.shutter, values.aperture, values.iso);
    const numericOptions = options.map(entry => typeof entry === "number" ? entry : entry.val);
    return {
      index,
      desired,
      selected,
      actualEV,
      residualEV: actualEV - targetEV,
      rangeLimited: desired < Math.min(...numericOptions) || desired > Math.max(...numericOptions)
    };
  }

  /**
   * Exactly two controls are locked (user-adjustable), one is auto-solved.
   * Clicking any locked control makes it auto; clicking the auto control
   * locks it and releases the first currently locked control.
   */
  function transitionLocks(current, clicked) {
    if (!KEYS.includes(clicked)) throw new RangeError("Unknown parameter: " + clicked);
    if (!current || KEYS.filter(key => current[key] === true).length !== 2) {
      throw new RangeError("Exactly two parameters must already be locked");
    }
    const next = { shutter: !!current.shutter, aperture: !!current.aperture, iso: !!current.iso };
    const release = current[clicked] ? clicked : KEYS.find(key => current[key]);
    const activate = current[clicked] ? KEYS.find(key => !current[key]) : clicked;
    next[release] = false;
    next[activate] = true;
    return next;
  }

  return Object.freeze({ calculateEV, solveUnknown, nearestIndex, resolveSetting, transitionLocks });
});
