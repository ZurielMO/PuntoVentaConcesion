import assert from "node:assert/strict";
import test from "node:test";
import {
  corteCalculationLabel,
  corteLifecycleLabel,
  formatBusinessDate,
  formatCorteTimestamp,
} from "../../src/features/cortes/formatters.ts";

test("formatea fecha operativa sin desplazarla por zona horaria", () => {
  assert.equal(formatBusinessDate("2026-07-14"), "14/07/2026");
  assert.equal(formatBusinessDate(null), "Sin registro");
  assert.equal(formatBusinessDate("legacy"), "legacy");
});

test("formatea timestamps y fallbacks de cálculo y ciclo de vida", () => {
  assert.notEqual(formatCorteTimestamp("2026-07-14T18:00:00.000Z"), "Sin registro");
  assert.equal(formatCorteTimestamp("no-date"), "Sin registro");
  assert.equal(corteCalculationLabel("cortes-v2"), "Cálculo nuevo v2");
  assert.equal(corteCalculationLabel(null), "Legacy v1");
  assert.equal(corteLifecycleLabel("reabierto"), "Reabierto");
});
