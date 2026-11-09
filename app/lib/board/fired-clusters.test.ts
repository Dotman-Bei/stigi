import { describe, expect, it } from "vitest";

import { FIRED_CLUSTERS_STORAGE_KEY, MAX_FIRED_CLUSTERS, readFiredClusterIds, writeFiredClusterIds } from "./fired-clusters";

function memoryStorage(initial: Record<string, string> = {}): Pick<Storage, "getItem" | "setItem"> {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
  };
}

describe("fired auto-teach cluster ids", () => {
  it("round-trips through storage so a reload does not re-fire an old untitled cluster", () => {
    const storage = memoryStorage();
    writeFiredClusterIds(new Set(["c1", "c2"]), storage);
    expect(readFiredClusterIds(storage)).toEqual(new Set(["c1", "c2"]));
  });

  it("starts empty when nothing is stored or the stored value is not a list of ids", () => {
    expect(readFiredClusterIds(memoryStorage())).toEqual(new Set());
    expect(readFiredClusterIds(memoryStorage({ [FIRED_CLUSTERS_STORAGE_KEY]: "{oops" }))).toEqual(new Set());
    expect(readFiredClusterIds(memoryStorage({ [FIRED_CLUSTERS_STORAGE_KEY]: '{"a":1}' }))).toEqual(new Set());
    expect(readFiredClusterIds(memoryStorage({ [FIRED_CLUSTERS_STORAGE_KEY]: '["ok",3]' }))).toEqual(new Set(["ok"]));
  });

  it("keeps only the most recent ids", () => {
    const storage = memoryStorage();
    const ids = Array.from({ length: MAX_FIRED_CLUSTERS + 5 }, (_, i) => `c${i}`);
    writeFiredClusterIds(new Set(ids), storage);
    const read = readFiredClusterIds(storage);
    expect(read.size).toBe(MAX_FIRED_CLUSTERS);
    expect(read.has(`c${MAX_FIRED_CLUSTERS + 4}`)).toBe(true);
    expect(read.has("c0")).toBe(false);
  });

  it("never throws when storage is blocked", () => {
    const blocked = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };
    expect(readFiredClusterIds(blocked)).toEqual(new Set());
    expect(() => writeFiredClusterIds(new Set(["c1"]), blocked)).not.toThrow();
  });
});
