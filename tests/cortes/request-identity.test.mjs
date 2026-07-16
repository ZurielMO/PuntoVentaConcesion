import assert from "node:assert/strict";
import test from "node:test";
import { createRequestIdentityGuard } from "../../src/features/cortes/request-identity.ts";
import { createMutationAttemptGuard } from "../../src/features/cortes/mutation-attempt.ts";

const deferred = () => {
  let resolve;
  const promise = new Promise((next) => { resolve = next; });
  return { promise, resolve };
};

test("ignora determinísticamente la respuesta A tardía después de B", async () => {
  const guard = createRequestIdentityGuard();
  const events = [];
  const a = deferred();
  const b = deferred();
  const requestA = guard.begin("scope=A");
  const lateA = a.promise.then((value) => {
    guard.commit(requestA, () => events.push(`data:${value}`));
    guard.commit(requestA, () => events.push("error:A"));
    guard.commit(requestA, () => events.push("loading:A:false"));
  });
  const requestB = guard.begin("scope=B");
  const currentB = b.promise.then((value) => {
    guard.commit(requestB, () => events.push(`data:${value}`));
    guard.commit(requestB, () => events.push("loading:B:false"));
  });

  b.resolve("B");
  await currentB;
  a.resolve("A");
  await lateA;

  assert.deepEqual(events, ["data:B", "loading:B:false"]);
});

test("invalidar un queryKey impide cualquier commit pendiente", () => {
  const guard = createRequestIdentityGuard();
  const request = guard.begin("scope=A");
  guard.invalidate("scope=B");
  let committed = false;
  assert.equal(guard.commit(request, () => { committed = true; }), false);
  assert.equal(committed, false);
});

test("A-B-A no permite que el primer A escriba ni retorne exito", () => {
  const guard = createMutationAttemptGuard();
  const firstA = guard.begin("A");
  guard.begin("B");
  const currentA = guard.begin("A");

  assert.equal(guard.isCurrent(firstA), false);
  assert.equal(guard.accept(firstA, "stale"), null);
  assert.equal(guard.accept(currentA, "current"), "current");
});
