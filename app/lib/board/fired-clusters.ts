export const FIRED_CLUSTERS_STORAGE_KEY = "stigi.autoTeachFired";
export const MAX_FIRED_CLUSTERS = 200;

type StorageLike = Pick<Storage, "getItem" | "setItem">;

/** Cluster ids auto-teach already handed to the agent, so a page reload does not fire them again. */
export function readFiredClusterIds(storage: StorageLike): Set<string> {
  try {
    const raw = storage.getItem(FIRED_CLUSTERS_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === "string"));
  } catch {
    return new Set();
  }
}

export function writeFiredClusterIds(ids: ReadonlySet<string>, storage: StorageLike): void {
  try {
    storage.setItem(FIRED_CLUSTERS_STORAGE_KEY, JSON.stringify([...ids].slice(-MAX_FIRED_CLUSTERS)));
  } catch {
    // Storage blocked (private window): the in-memory set still applies for this visit.
  }
}
