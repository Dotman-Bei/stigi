import { beforeEach, describe, expect, it } from "vitest";

import { resetTestDb } from "../server/db/test-db.js";
import getBoard from "./get-board.js";
import importNotes from "./import-notes.js";

const ada = { userEmail: "ada@stigi.test", caller: "frontend" as const };
const bob = { userEmail: "bob@stigi.test", caller: "frontend" as const };

describe("get-board", () => {
  beforeEach(async () => {
    await resetTestDb();
  });

  it("returns an empty board for a new user", async () => {
    expect(await getBoard.run({}, ada)).toEqual({ clusters: [], unsorted: [], totalNotes: 0, sampleNotes: 0 });
  });

  it("returns only the caller's board", async () => {
    await importNotes.run({ sample: true }, ada);
    const adaBoard = await getBoard.run({}, ada);
    expect(adaBoard.totalNotes).toBe(200);
    expect(adaBoard.clusters).toHaveLength(6);
    expect((await getBoard.run({}, bob)).totalNotes).toBe(0);
  });
});
