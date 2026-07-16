export type RequestIdentity = Readonly<{
  queryKey: string;
  sequence: number;
}>;

export type RequestIdentityGuard = {
  begin: (queryKey: string) => RequestIdentity;
  invalidate: (nextQueryKey: string) => void;
  isCurrent: (identity: RequestIdentity) => boolean;
  commit: (identity: RequestIdentity, operation: () => void) => boolean;
};

export function createRequestIdentityGuard(): RequestIdentityGuard {
  let queryKey = "";
  let sequence = 0;

  const isCurrent = (identity: RequestIdentity) =>
    identity.queryKey === queryKey && identity.sequence === sequence;

  return {
    begin(nextQueryKey) {
      queryKey = nextQueryKey;
      sequence += 1;
      return { queryKey, sequence };
    },
    invalidate(nextQueryKey) {
      queryKey = nextQueryKey;
      sequence += 1;
    },
    isCurrent,
    commit(identity, operation) {
      if (!isCurrent(identity)) return false;
      operation();
      return true;
    },
  };
}
