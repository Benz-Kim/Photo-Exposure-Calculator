"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");

function makeApp() {
  const nodes = new Map();
  const document = {
    getElementById(id) {
      if (!nodes.has(id)) nodes.set(id, {
        value: "", textContent: "", innerHTML: "", className: "", style: {},
        classList: { add() {}, remove() {}, toggle() {} },
        attributes: {}, setAttribute(name, value) { this.attributes[name] = value; }
      });
      return nodes.get(id);
    }
  };
  const window = { innerWidth: 1200, addEventListener() {} };
  const context = vm.createContext({
    document, window, console, setTimeout() {}
  });
  vm.runInContext(fs.readFileSync(path.join(root, "exposure-core.js"), "utf8"), context);
  vm.runInContext(fs.readFileSync(path.join(root, "exposure-script.js"), "utf8"), context);
  const run = command => vm.runInContext(command, context);
  const state = () => run("({ locks: { ...locks }, idx: { ...idx }, targetEV, solveMeta })");
  return { document, run, state };
}

test("HTML loads core before the application", () => {
  const html = fs.readFileSync(path.join(root, "exposure-index.html"), "utf8");
  const coreIndex = html.indexOf('<script src="exposure-core.js"></script>');
  const appIndex = html.indexOf('<script src="exposure-script.js"></script>');
  assert.ok(coreIndex >= 0);
  assert.ok(appIndex > coreIndex);
});

test("changes to a locked slider automatically re-solve the third variable", () => {
  const app = makeApp();
  const before = app.state();
  app.document.getElementById("sl-shutter").value = "10";
  app.run('onSliderChange("shutter")');
  const after = app.state();
  assert.equal(after.idx.shutter, 10);
  assert.notEqual(after.idx.iso, before.idx.iso);
  assert.equal(after.targetEV, before.targetEV);
  assert.ok(Number.isFinite(after.solveMeta.residualEV));
});

test("clicking a locked control swaps which control is calculated", () => {
  const app = makeApp();
  app.run('toggleLock("shutter")');
  const s = app.state();
  assert.equal(s.locks.shutter, false);
  assert.equal(s.locks.iso, true);
  assert.equal(Object.values(s.locks).filter(Boolean).length, 2);
});

test("presets reset the EV target rather than inheriting previous target", () => {
  const app = makeApp();
  app.run('applyPreset("night")');
  const s = app.state();
  assert.ok(Math.abs(s.solveMeta.residualEV) < 1e-9);
  assert.equal(Object.values(s.locks).filter(Boolean).length, 2);
});

test("status reports rounding errors when the exact exposure is unavailable", () => {
  const app = makeApp();
  const original = app.state();
  const status = app.document.getElementById("ev-status").textContent;
  assert.ok(status.includes("EV100"));
  assert.ok(Number.isFinite(original.solveMeta.residualEV));
});

test("desktop and mobile describe EV as settings, not overexposure diagnosis", () => {
  const app = makeApp();
  const judge = app.document.getElementById("judge-desc").textContent;
  const mobile = app.document.getElementById("mbb-text").textContent;
  assert.ok(judge.includes("scene brightness"));
  assert.ok(mobile.includes("Actual exposure"));
  assert.ok(!mobile.includes("overexposed"));
});


test("complete EXIF is accepted and can establish a fresh target EV", async () => {
  const app = makeApp();
  app.run("window.exifr = { parse: async () => ({ FNumber: 2.8, ExposureTime: 1/125, ISO: 400 }) }");
  app.run('loadExif({ files: [{ name: "camera.jpg" }] })');
  await new Promise(resolve => setImmediate(resolve));
  assert.ok(app.run("exifPending !== null"));
  assert.equal(app.document.getElementById("exif-apply-btn").style.display, "inline-block");
  app.run("applyExif()");
  const state = app.state();
  assert.ok(Math.abs(state.solveMeta.residualEV) < 1e-8);
});

test("partial EXIF cannot silently mix previous slider settings", async () => {
  const app = makeApp();
  app.run("window.exifr = { parse: async () => ({ FNumber: 2.8 }) }");
  app.run('loadExif({ files: [{ name: "partial.jpg" }] })');
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(app.run("exifPending"), null);
  assert.equal(app.document.getElementById("exif-apply-btn").style.display, "none");
  assert.ok(app.document.getElementById("exif-msg").textContent.includes("missing"));
});

test("EXIF CDN failure gives a recoverable message instead of hanging", async () => {
  const app = makeApp();
  app.document.createElement = () => ({});
  app.document.head = { appendChild(script) { script.onerror(new Error("offline")); } };
  app.run('loadExif({ files: [{ name: "offline.jpg" }] })');
  await new Promise(resolve => setImmediate(resolve));
  assert.ok(app.document.getElementById("exif-chips").textContent.includes("Could not load"));
});


test("target EV slider changes reference and re-solves the automatic parameter", () => {
  const app = makeApp();
  const previous = app.state();
  app.document.getElementById("sl-target-ev").value = "12.0";
  app.run("onTargetEVChange()");
  const changed = app.state();
  assert.equal(changed.targetEV, 12);
  assert.notEqual(changed.targetEV, previous.targetEV);
  assert.ok(Number.isFinite(changed.solveMeta.actualEV));
  assert.equal(app.document.getElementById("target-ev-value").textContent, "12.0");
});

test("equivalent exposure rows report bounded quantization residuals", () => {
  const app = makeApp();
  const markup = app.document.getElementById("combo-tbody").innerHTML;
  const deltas = [...markup.matchAll(/ΔEV ([+-]?[0-9]+\.[0-9]+)/g)]
    .map(match => Number(match[1]));
  assert.ok(deltas.length > 0, "At least one equivalent exposure row should be shown");
  for (const delta of deltas) {
    assert.ok(Math.abs(delta) <= 0.5, "Displayed EV residual must not exceed half a stop");
  }
});

test("English interface declares its language and names all camera controls", () => {
  const html = fs.readFileSync(path.join(root, "exposure-index.html"), "utf8");
  assert.match(html, /<html lang="en">/);
  assert.doesNotMatch(html, /[가-힣]/);
  for (const name of ["Shutter speed", "Aperture", "ISO"]) {
    assert.ok(html.includes('aria-label="' + name + '"'));
  }
});

test("mode buttons expose automatic state and slider values to assistive technology", () => {
  const app = makeApp();
  assert.equal(app.document.getElementById("lock-iso").attributes["aria-pressed"], "true");
  assert.equal(app.document.getElementById("lock-shutter").attributes["aria-pressed"], "false");
  app.run('toggleLock("aperture")');
  assert.equal(app.document.getElementById("lock-aperture").textContent, "Auto");
  assert.equal(app.document.getElementById("lock-aperture").attributes["aria-pressed"], "true");
  assert.match(app.document.getElementById("sl-shutter").attributes["aria-valuetext"], /seconds/);
});

test("reset restores the initial reference, manual modes and values after edits", () => {
  const app = makeApp();
  const initial = app.state();
  app.run('applyPreset("night"); toggleLock("shutter"); resetCalculator()');
  const reset = app.state();
  assert.deepEqual(JSON.parse(JSON.stringify(reset.idx)), JSON.parse(JSON.stringify(initial.idx)));
  assert.deepEqual(JSON.parse(JSON.stringify(reset.locks)), JSON.parse(JSON.stringify(initial.locks)));
  assert.equal(reset.targetEV, initial.targetEV);
  assert.equal(app.run("activePreset"), null);
});

test("preset selection clears when a manual edit changes the scene settings", () => {
  const app = makeApp();
  app.run('applyPreset("sunny")');
  assert.equal(app.document.getElementById("preset-sunny").attributes["aria-pressed"], "true");
  app.document.getElementById("sl-shutter").value = "10";
  app.run('onSliderChange("shutter")');
  assert.equal(app.document.getElementById("preset-sunny").attributes["aria-pressed"], "false");
});
