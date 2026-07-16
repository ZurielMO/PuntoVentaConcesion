import assert from "node:assert/strict";
import test from "node:test";
import {
  CORTE_IDEMPOTENCY_HEADER,
  closeSubmissionFingerprint,
  getOrCreateCloseAttempt,
} from "../../src/features/cortes/idempotency.ts";
import { FORWARD_HEADERS } from "../../src/lib/server/proxy-headers.ts";

test("usa y reenvía el encabezado Idempotency-Key", () => {
  assert.equal(CORTE_IDEMPOTENCY_HEADER, "Idempotency-Key");
  assert.equal(FORWARD_HEADERS.includes("idempotency-key"), true);
});

test("reutiliza la clave al reintentar exactamente el mismo cierre", () => {
  let generated = 0;
  const generate = () => `key-${++generated}`;
  const filters = { cajaId: "caja-1", idUser: "seller-1" };
  const first = getOrCreateCloseAttempt(
    null,
    { efectivoContado: 150, comentarios: "Conteo final" },
    filters,
    generate,
  );
  const retry = getOrCreateCloseAttempt(
    first,
    { comentarios: "Conteo final", efectivoContado: 150 },
    { idUser: "seller-1", cajaId: "caja-1" },
    generate,
  );

  assert.equal(retry.key, first.key);
  assert.equal(generated, 1);
});

test("genera otra clave cuando cambia el contenido o el alcance", () => {
  let generated = 0;
  const generate = () => `key-${++generated}`;
  const first = getOrCreateCloseAttempt(
    null,
    { efectivoContado: 150 },
    { cajaId: "caja-1" },
    generate,
  );
  const changed = getOrCreateCloseAttempt(
    first,
    { efectivoContado: 151 },
    { cajaId: "caja-1" },
    generate,
  );

  assert.notEqual(changed.key, first.key);
  assert.notEqual(
    closeSubmissionFingerprint({ efectivoContado: 150 }, { cajaId: "caja-1" }),
    closeSubmissionFingerprint({ efectivoContado: 150 }, { cajaId: "caja-2" }),
  );
});
