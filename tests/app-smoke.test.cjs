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
        classList: { add() {}, remove() {}, toggle() {} }
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
  assert.ok(judge.includes("장면 밝기"));
  assert.ok(mobile.includes("실제 노출"));
  assert.ok(!mobile.includes("과노출 심각"));
});
