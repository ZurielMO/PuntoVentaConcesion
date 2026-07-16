import assert from "node:assert/strict";
import test from "node:test";
import {
  parseCortesUrlState,
  serializeCortesUrlState,
  updateCorteFilter,
  updateCorteHistoryView,
} from "../../src/features/cortes/query-state.ts";
import { getCorteAccessModel } from "../../src/features/cortes/role-access.ts";

test("descarta secciones y filtros que el vendedor no controla", () => {
  const access = getCorteAccessModel("VENDEDOR");
  assert.ok(access);
  const state = parseCortesUrlState(
    new URLSearchParams(
      "seccion=resumen&jornada=J1&concesion=privada&vendedor=otro&inventario=inv-1",
    ),
    access,
  );

  assert.equal(state.section, "caja-actual");
  assert.deepEqual(state.filters, {
    jornadaId: "J1",
    inventarioId: "inv-1",
  });
  assert.equal(state.historyPage, 1);
  assert.equal(state.historyLimit, 100);
  assert.equal(state.historyStatus, "");
  assert.equal(state.businessDate, "");
});

test("valida y persiste ventana, estado y fecha; el cursor no vive en URL", () => {
  const access = getCorteAccessModel("ADMIN");
  assert.ok(access);
  const state = parseCortesUrlState(
    new URLSearchParams("seccion=historial&pagina=3&limite=50&estado=anulado&fecha=2026-07-14"),
    access,
  );

  assert.equal(state.historyPage, 1);
  assert.equal(state.historyLimit, 50);
  assert.equal(state.historyStatus, "ANULADO");
  assert.equal(state.businessDate, "2026-07-14");
  const next = updateCorteHistoryView(state, { limit: 200, status: "reabierto", businessDate: "2026-07-13" });
  assert.equal(next.historyPage, 1);
  assert.equal(next.historyLimit, 200);
  assert.equal(next.historyStatus, "REABIERTO");
  assert.equal(next.businessDate, "2026-07-13");

  const invalid = parseCortesUrlState(
    new URLSearchParams("estado=borrador&fecha=14-07-2026"),
    access,
  );
  assert.equal(invalid.historyStatus, "");
  assert.equal(invalid.businessDate, "");
});

test("serializa solo filtros permitidos y conserva parámetros ajenos", () => {
  const access = getCorteAccessModel("ADMIN");
  assert.ok(access);
  const serialized = serializeCortesUrlState(
    new URLSearchParams("origen=menu&concesion=no-autorizada"),
    {
      section: "historial",
      filters: {
        concesionId: "no-autorizada",
        sucursalId: "suc-1",
        cajaId: "caja-1",
      },
      historyPage: 2,
      historyLimit: 50,
      historyStatus: "CERRADO",
      businessDate: "2026-07-14",
    },
    access,
  );

  assert.equal(serialized.get("origen"), "menu");
  assert.equal(serialized.get("seccion"), "historial");
  assert.equal(serialized.get("concesion"), null);
  assert.equal(serialized.get("sucursal"), "suc-1");
  assert.equal(serialized.get("pagina"), null);
  assert.equal(serialized.get("limite"), "50");
  assert.equal(serialized.get("estado"), "CERRADO");
  assert.equal(serialized.get("fecha"), "2026-07-14");
});

test("limpia filtros dependientes al cambiar el alcance superior", () => {
  const state = updateCorteFilter(
    {
      section: "resumen",
      filters: {
        concesionId: "con-1",
        sucursalId: "suc-1",
        cajaId: "caja-1",
        idUser: "seller-1",
        inventarioId: "inv-1",
      },
      historyPage: 4,
      historyLimit: 100,
      historyStatus: "",
      businessDate: "",
    },
    "concesionId",
    "con-2",
  );

  assert.deepEqual(state.filters, { concesionId: "con-2" });
  assert.equal(state.historyPage, 1);
});
