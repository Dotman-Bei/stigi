import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import { getDb, schema } from "./index.js";
import { STIGI_MIGRATIONS } from "./migrations.js";
import { resetTestDb } from "./test-db.js";

const OWNER = "ada@stigi.test";

describe("stigi schema", () => {
  beforeEach(async () => {
    await resetTestDb();
  });

  it("has six additive, uniquely versioned single-statement migrations", () => {
    expect(STIGI_MIGRATIONS.map((m) => m.version)).toEqual([1, 2, 3, 4, 5, 6]);
    for (const m of STIGI_MIGRATIONS) {
      expect(typeof m.sql).toBe("string");
      expect(String(m.sql).startsWith("CREATE")).toBe(true);
      expect(String(m.sql).includes(";")).toBe(false);
    }
  });

  it("round-trips a sample cluster and a sample note through drizzle", async () => {
    const db = getDb();
    const now = new Date().toISOString();
    await db.insert(schema.stigiClusters).values({
      id: "c1", ownerEmail: OWNER, name: "Mobile app", createdBy: "sample",
      position: 0, createdAt: now, updatedAt: now,
    });
    await db.insert(schema.stigiNotes).values({
      id: "n1", ownerEmail: OWNER, body: "hello", source: "sample", clusterId: "c1",
      reason: null, movedBy: null, movedAt: null, position: 0, createdAt: now,
    });
    const rows = await db.select().from(schema.stigiNotes).where(eq(schema.stigiNotes.clusterId, "c1"));
    expect(rows).toHaveLength(1);
    expect(rows[0]?.source).toBe("sample");
  });

  it("rejects an unknown created_by value", async () => {
    const now = new Date().toISOString();
    await expect(
      getDb().insert(schema.stigiClusters).values({
        id: "c2", ownerEmail: OWNER, name: "x", createdBy: "robot" as unknown as "user",
        position: 0, createdAt: now, updatedAt: now,
      }),
    ).rejects.toThrow();
  });

  it("keeps one agent-turn row per owner and day", async () => {
    const db = getDb();
    await db.insert(schema.stigiAgentTurns).values({ ownerEmail: OWNER, day: "2026-11-09", count: 1 });
    await expect(
      db.insert(schema.stigiAgentTurns).values({ ownerEmail: OWNER, day: "2026-11-09", count: 1 }),
    ).rejects.toThrow();
  });
});
