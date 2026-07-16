export type MutationAttemptToken = Readonly<{
  attemptId: string;
  generation: number;
  scopeIdentity: string;
}>;

export type MutationAttemptGuard = {
  begin: (scopeIdentity: string) => MutationAttemptToken;
  invalidate: () => void;
  isCurrent: (attempt: MutationAttemptToken | string) => boolean;
  accept: <T>(attempt: MutationAttemptToken | string, value: T) => T | null;
  currentAttemptId: () => string | null;
};

/**
 * A monotonic mutation identity. Scope equality alone is intentionally
 * insufficient: A -> B -> A must not make the first A current again.
 */
export function createMutationAttemptGuard(): MutationAttemptGuard {
  let generation = 0;
  let current: MutationAttemptToken | null = null;

  const attemptId = (scopeIdentity: string, nextGeneration: number) =>
    `${nextGeneration}:${scopeIdentity}`;

  const isCurrent = (attempt: MutationAttemptToken | string) => {
    const id = typeof attempt === "string" ? attempt : attempt.attemptId;
    return current?.attemptId === id;
  };

  return {
    begin(scopeIdentity) {
      generation += 1;
      current = {
        attemptId: attemptId(scopeIdentity, generation),
        generation,
        scopeIdentity,
      };
      return current;
    },
    invalidate() {
      generation += 1;
      current = null;
    },
    isCurrent,
    accept<T>(attempt: MutationAttemptToken | string, value: T) {
      return isCurrent(attempt) ? value : null;
    },
    currentAttemptId() {
      return current?.attemptId ?? null;
    },
  };
}

export class StaleCorteAttemptError extends Error {
  constructor() {
    super("El intento de cierre ya no pertenece al contexto operativo actual.");
    this.name = "StaleCorteAttemptError";
  }
}
