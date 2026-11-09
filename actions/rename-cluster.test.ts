import { beforeEach, describe, expect, it } from "vitest";

import { resetTestDb } from "../server/db/test-db.js";
import { loadBoard } from "../server/lib/board-store.js";
import createCluster from "./create-cluster.js";
import renameCluster from "./rename-cluster.js";

const user = { userEmail: "ada@stigi.test", caller: "frontend" as const };
const agent = { userEmail: "ada@stigi.test", caller: "tool" as const };
const bob = { userEmail: "bob@stigi.test", caller: "frontend" as const };

describe("rename-cluster", () => {
  beforeEach(async () => {
    await resetTestDb();
  });

  it("renames an owned cluster (agent or user)", async () => {
    const created = await createCluster.run({}, user);
    const result = await renameCluster.run({ clusterId: created.id, name: "Plan & billing confusion" }, agent);
    expect(result).toMatchObject({ id: created.id, name: "Plan & billing confusion" });
    const board = await loadBoard("ada@stigi.test");
    expect(board.clusters[0]?.name).toBe("Plan & billing confusion");
  });

  it("refuses another user's cluster", async () => {
    const created = await createCluster.run({}, user);
    await expect(renameCluster.run({ clusterId: created.id, name: "Mine" }, bob)).rejects.toThrow(/Cluster not found/);
  });
});
