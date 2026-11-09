import { defineAction } from "@agent-native/core/action";
import { readAppStateForCurrentTab } from "@agent-native/core/application-state";
import { z } from "zod";

import { clipText, loadBoard } from "../server/lib/board-store.js";
import { requireOwner } from "../server/lib/owner.js";
import { UNTITLED_LABEL, type BoardNote } from "../shared/board-types.js";

interface BoardSelection {
  noteIds: string[];
  clusterId: string | null;
}

function parseSelection(value: Record<string, unknown> | null): BoardSelection | null {
  if (!value || value.kind !== "stigi.board") return null;
  const noteIds = Array.isArray(value.noteIds)
    ? value.noteIds.filter((id): id is string => typeof id === "string")
    : [];
  const clusterId = typeof value.clusterId === "string" ? value.clusterId : null;
  return { noteIds, clusterId };
}

export default defineAction({
  description:
    "See what the user sees: navigation (board or report), the selection they made, cluster ids/names/counts and the selected notes or cluster. Call this before acting on what the user is looking at.",
  schema: z.object({}),
  http: false,
  readOnly: true,
  run: async (_args, ctx) => {
    const owner = requireOwner(ctx);
    const navigation = await readAppStateForCurrentTab("navigation", { fallbackToGlobal: true });
    const selection = parseSelection(await readAppStateForCurrentTab("selection", { fallbackToGlobal: true }));
    const board = await loadBoard(owner);
    const names = new Map<string, string>(board.clusters.map((c) => [c.id, c.name ?? UNTITLED_LABEL]));
    const every: BoardNote[] = [...board.unsorted, ...board.clusters.flatMap((c) => c.notes)];
    const compact = (n: BoardNote) => ({
      id: n.id,
      text: clipText(n.body, 200),
      cluster: n.clusterId === null ? null : (names.get(n.clusterId) ?? UNTITLED_LABEL),
    });
    const selectedIds = new Set(selection?.noteIds ?? []);
    const selectedClusterRow = selection?.clusterId
      ? board.clusters.find((c) => c.id === selection.clusterId)
      : undefined;
    return {
      navigation,
      selection,
      board: {
        clusters: board.clusters.map((c) => ({
          id: c.id, name: c.name ?? UNTITLED_LABEL, noteCount: c.notes.length, createdBy: c.createdBy,
        })),
        unsortedCount: board.unsorted.length,
        totalNotes: board.totalNotes,
        sampleNotes: board.sampleNotes,
      },
      selectedNotes: every.filter((n) => selectedIds.has(n.id)).slice(0, 20).map(compact),
      selectedCluster: selectedClusterRow
        ? {
            id: selectedClusterRow.id,
            name: selectedClusterRow.name ?? UNTITLED_LABEL,
            notes: selectedClusterRow.notes.slice(0, 20).map((n) => ({ id: n.id, text: clipText(n.body, 200) })),
          }
        : null,
    };
  },
});
