import assert from "node:assert/strict";
import test from "node:test";
import {
  canAccessCorteSection,
  canEditCorteFilter,
  getCorteAccessModel,
} from "../../src/features/cortes/role-access.ts";

test("prioriza Caja actual y oculta Resumen al vendedor", () => {
  const access = getCorteAccessModel("CONCESION_VENDEDOR");
  assert.ok(access);
  assert.equal(access.defaultSection, "caja-actual");
  assert.equal(canAccessCorteSection(access, "resumen"), false);
  assert.equal(canAccessCorteSection(access, "historial"), true);
  assert.equal(canEditCorteFilter(access, "idUser"), false);
});

test("admin ve las seis secciones sin controlar la concesión", () => {
  const access = getCorteAccessModel("ADMIN");
  assert.ok(access);
  assert.equal(access.sections.length, 6);
  assert.equal(canEditCorteFilter(access, "concesionId"), false);
  assert.equal(canEditCorteFilter(access, "sucursalId"), true);
});

test("superadmin consolida sin exponer una Caja actual ambigua", () => {
  const access = getCorteAccessModel("SUPERADMIN");
  assert.ok(access);
  assert.equal(canAccessCorteSection(access, "caja-actual"), false);
  assert.equal(canAccessCorteSection(access, "resumen"), true);
  assert.equal(canEditCorteFilter(access, "concesionId"), true);
});
