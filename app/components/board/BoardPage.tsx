import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useAgentChatGenerating } from "@agent-native/core/client/agent-chat";
import {
  actionErrorMessage,
  setClientAppState,
  useActionMutation,
  useActionQuery,
} from "@agent-native/core/client/hooks";
import { LayoutGroup, MotionConfig } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { dailyLimitMessage } from "@shared/agent-limits";
import type { BoardCluster, BoardNote, BoardSnapshot } from "@shared/board-types";

import { allNotes, diffAgentMoves } from "@/lib/board/agent-moves";
import { findAutoTeachCluster } from "@/lib/board/auto-teach";
import { UNSORTED_DROP_ID, clusterDropId, noteIdFromDragId, resolveDrop } from "@/lib/board/drop-target";
import { buildSortHandoff, buildTeachHandoff, type Handoff } from "@/lib/board/handoff";
import { nextSortStep } from "@/lib/board/sort-loop";

import { BoardTopBar } from "./BoardTopBar";
import { ClusterColumn } from "./ClusterColumn";
import { ClusterMenu } from "./ClusterMenu";
import { EmptyBoard } from "./EmptyBoard";
import { ImportCsvDialog } from "./ImportCsvDialog";
import { NewClusterZone } from "./NewClusterZone";
import { SelectionBar } from "./SelectionBar";

export const AGENT_POLL_MS = 750;
export const HIGHLIGHT_MS = 6_000;
const AUTO_TEACH_STORAGE_KEY = "stigi.autoTeach";

function readAutoTeach(): boolean {
  try {
    return window.localStorage.getItem(AUTO_TEACH_STORAGE_KEY) !== "0";
  } catch {
    return true;
  }
}

function writeAutoTeach(value: boolean): void {
  try {
    window.localStorage.setItem(AUTO_TEACH_STORAGE_KEY, value ? "1" : "0");
  } catch {
    // Storage blocked (private window): the in-memory value still applies for this visit.
  }
}

function showError(error: unknown): void {
  toast.error(actionErrorMessage(error));
}

export function BoardPage() {
  const [isGenerating, sendToAgent] = useAgentChatGenerating();
  const navigate = useNavigate();
  const boardQuery = useActionQuery("get-board", {}, { refetchInterval: isGenerating ? AGENT_POLL_MS : false });
  const usageQuery = useActionQuery("get-agent-usage", {}, { refetchInterval: isGenerating ? AGENT_POLL_MS * 2 : false });
  const importNotes = useActionMutation("import-notes", { onError: showError });
  const createCluster = useActionMutation("create-cluster", { onError: showError });
  const renameCluster = useActionMutation("rename-cluster", { onError: showError });
  const moveNotes = useActionMutation("move-notes", { onError: showError });
  const mergeClusters = useActionMutation("merge-clusters", { onError: showError });
  const deleteCluster = useActionMutation("delete-cluster", { onError: showError });
  const resetBoard = useActionMutation("reset-board", { onError: showError });

  const board: BoardSnapshot | undefined = boardQuery.data;
  const usage = usageQuery.data ?? null;

  const [autoTeach, setAutoTeach] = useState(true);
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(() => new Set());
  const [highlightedIds, setHighlightedIds] = useState<ReadonlySet<string>>(() => new Set());
  const [activeNote, setActiveNote] = useState<BoardNote | null>(null);
  const firedRef = useRef<Set<string>>(new Set());
  const previousBoardRef = useRef<BoardSnapshot | null>(null);
  const timersRef = useRef<number[]>([]);
  const [sorting, setSorting] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const lastSortUnsortedRef = useRef<number | null>(null);
  const sortPendingRef = useRef(false);
  const noProgressRecheckRef = useRef(false);

  const notesById = useMemo(() => {
    const map = new Map<string, BoardNote>();
    if (board) for (const n of allNotes(board)) map.set(n.id, n);
    return map;
  }, [board]);
  const agentBlocked = isGenerating || (usage !== null && usage.remaining <= 0);

  useEffect(() => {
    setAutoTeach(readAutoTeach());
  }, []);

  // Selection is app-state the agent reads through view-screen (ids only, spec §7).
  useEffect(() => {
    const noteIds = [...selectedIds];
    void setClientAppState(
      "selection",
      noteIds.length > 0 ? { kind: "stigi.board", noteIds, clusterId: null, capturedAt: new Date().toISOString() } : null,
      { keepalive: true },
    );
  }, [selectedIds]);

  // Glide-in highlight: ring the notes the agent just moved for HIGHLIGHT_MS.
  useEffect(() => {
    if (!board) return;
    const moved = diffAgentMoves(previousBoardRef.current, board);
    previousBoardRef.current = board;
    if (moved.length === 0) return;
    setHighlightedIds((prev) => new Set([...prev, ...moved]));
    const timer = window.setTimeout(() => {
      setHighlightedIds((prev) => {
        const next = new Set(prev);
        for (const id of moved) next.delete(id);
        return next;
      });
    }, HIGHLIGHT_MS);
    timersRef.current.push(timer);
  }, [board]);

  useEffect(() => () => {
    for (const timer of timersRef.current) window.clearTimeout(timer);
  }, []);

  async function hasCredits(): Promise<boolean> {
    const latest = (await usageQuery.refetch()).data;
    if (latest && latest.remaining <= 0) {
      toast.error(dailyLimitMessage(latest.limit));
      return false;
    }
    return true;
  }

  function handOff(handoff: Handoff): void {
    sendToAgent({ message: handoff.message, context: handoff.context, submit: true, openSidebar: true });
  }

  async function teach(cluster: Pick<BoardCluster, "id" | "notes">): Promise<void> {
    firedRef.current.add(cluster.id);
    if (!(await hasCredits())) return;
    handOff(buildTeachHandoff(cluster));
  }

  // Spec D7: auto-teach once a user-made untitled cluster has two seeds.
  useEffect(() => {
    if (!board || !autoTeach || isGenerating) return;
    const cluster = findAutoTeachCluster(board, firedRef.current);
    if (cluster) void teach(cluster);
  }, [board, autoTeach, isGenerating]);

  // Spec §8: the UI drives one-batch agent turns until Unsorted is empty, a turn makes no progress,
  // credits run out or the user stops it.
  useEffect(() => {
    if (isGenerating) sortPendingRef.current = false;
    if (!board || sortPendingRef.current) return;
    const step = nextSortStep({
      active: sorting,
      generating: isGenerating,
      unsortedCount: board.unsorted.length,
      remainingTurns: usage?.remaining ?? 1,
      lastUnsortedCount: lastSortUnsortedRef.current,
    });
    if (step === "wait") return;
    if (step === "stop-no-progress" && !noProgressRecheckRef.current) {
      // The turn may have ended before this tab refetched: re-read the board once before giving up.
      noProgressRecheckRef.current = true;
      void boardQuery.refetch().then((result) => {
        const fresh = result.data?.unsorted.length;
        const last = lastSortUnsortedRef.current;
        if (fresh !== undefined && last !== null && fresh < last) return; // new data re-runs this effect
        noProgressRecheckRef.current = false;
        setSorting(false);
        lastSortUnsortedRef.current = null;
        toast.error("The agent's last turn sorted nothing, so sorting stopped. Try again or sort by hand.");
      });
      return;
    }
    if (step === "send") {
      noProgressRecheckRef.current = false;
      sortPendingRef.current = true;
      lastSortUnsortedRef.current = board.unsorted.length;
      void (async () => {
        if (await hasCredits()) {
          handOff(buildSortHandoff());
          return;
        }
        sortPendingRef.current = false;
        setSorting(false);
      })();
      return;
    }
    setSorting(false);
    lastSortUnsortedRef.current = null;
    noProgressRecheckRef.current = false;
    if (step === "stop-done") toast.success("Every note is sorted.");
    if (step === "stop-credits" && usage) toast.error(dailyLimitMessage(usage.limit));
  }, [board, sorting, isGenerating, usage]);

  function toggleSorting(): void {
    if (sorting) {
      setSorting(false);
      lastSortUnsortedRef.current = null;
      return;
    }
    sortPendingRef.current = false;
    noProgressRecheckRef.current = false;
    lastSortUnsortedRef.current = null;
    setSorting(true);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  function onDragStart(event: DragStartEvent): void {
    setActiveNote(notesById.get(noteIdFromDragId(String(event.active.id))) ?? null);
  }

  function onDragEnd(event: DragEndEvent): void {
    setActiveNote(null);
    const noteId = noteIdFromDragId(String(event.active.id));
    const note = notesById.get(noteId);
    if (!note) return;
    const action = resolveDrop(noteId, note.clusterId, event.over ? String(event.over.id) : null);
    if (action.kind === "create-cluster") createCluster.mutate({ noteIds: [action.noteId] });
    if (action.kind === "move") moveNotes.mutate({ moves: [{ noteId: action.noteId, clusterId: action.clusterId }] });
  }

  function toggleSelect(noteId: string): void {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(noteId)) next.delete(noteId);
      else next.add(noteId);
      return next;
    });
  }

  async function moreLikeSelection(): Promise<void> {
    const noteIds = [...selectedIds];
    if (noteIds.length < 2) return;
    try {
      const created = await createCluster.mutateAsync({ noteIds });
      setSelectedIds(new Set());
      if (autoTeach) return; // the auto-teach effect picks up the new untitled two-seed cluster
      const seeds = noteIds.map((id) => notesById.get(id)).filter((n): n is BoardNote => n !== undefined);
      await teach({ id: created.id, notes: seeds });
    } catch {
      // onError already showed a toast.
    }
  }

  function loadSample(): void {
    importNotes.mutate({ sample: true }, {
      onSuccess: () => toast.success("Loaded 200 sample notes (pre-sorted starting layout)."),
    });
  }

  function resetBoardNow(): void {
    resetBoard.mutate({}, {
      onSuccess: () => {
        firedRef.current = new Set();
        setSelectedIds(new Set());
        setSorting(false);
        toast.success("Board reset.");
      },
    });
  }

  async function importCsv(csv: string): Promise<boolean> {
    try {
      const result = await importNotes.mutateAsync({ csv });
      toast.success(result.message);
      return true;
    } catch {
      return false; // onError already showed the reason
    }
  }

  function changeAutoTeach(value: boolean): void {
    setAutoTeach(value);
    writeAutoTeach(value);
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="stigi" data-agent-state={isGenerating ? "running" : "idle"}>
        <BoardTopBar
          totalNotes={board?.totalNotes ?? 0}
          themeCount={board?.clusters.length ?? 0}
          unsortedCount={board?.unsorted.length ?? 0}
          sampleNotes={board?.sampleNotes ?? 0}
          usage={usage}
          agentRunning={isGenerating}
          autoTeach={autoTeach}
          onAutoTeachChange={changeAutoTeach}
          sorting={sorting}
          onSortToggle={toggleSorting}
          onImportCsv={() => setImportOpen(true)}
          onOpenReport={() => navigate("/board/report")}
          onResetBoard={resetBoardNow}
        />
        {board === undefined ? (
          <p className="stigi-meta">Loading your board…</p>
        ) : board.totalNotes === 0 ? (
          <EmptyBoard loading={importNotes.isPending} onLoadSample={loadSample} onImportCsv={() => setImportOpen(true)} />
        ) : (
          <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setActiveNote(null)}>
            <LayoutGroup>
              <div className="stigi-board">
                <div className="stigi-rail">
                  <NewClusterZone />
                  <ClusterColumn
                    dropId={UNSORTED_DROP_ID}
                    clusterId={null}
                    title="Unsorted"
                    untitled={false}
                    notes={board.unsorted}
                    selectedIds={selectedIds}
                    highlightedIds={highlightedIds}
                    onToggleSelect={toggleSelect}
                    actions={null}
                  />
                </div>
                <div className="stigi-clusters">
                  {board.clusters.map((cluster) => (
                    <ClusterColumn
                      key={cluster.id}
                      dropId={clusterDropId(cluster.id)}
                      clusterId={cluster.id}
                      title={cluster.name ?? "Untitled"}
                      untitled={cluster.name === null}
                      notes={cluster.notes}
                      selectedIds={selectedIds}
                      highlightedIds={highlightedIds}
                      onToggleSelect={toggleSelect}
                      actions={
                        <ClusterMenu
                          clusterName={cluster.name}
                          agentDisabled={agentBlocked || cluster.notes.length === 0}
                          onMoreLikeThese={() => void teach(cluster)}
                          onRename={(name) => renameCluster.mutate({ clusterId: cluster.id, name })}
                          mergeTargets={board.clusters
                            .filter((c) => c.id !== cluster.id)
                            .map((c) => ({ id: c.id, name: c.name ?? "Untitled" }))}
                          onMerge={(targetClusterId) => mergeClusters.mutate({ sourceClusterId: cluster.id, targetClusterId })}
                          onDelete={() => deleteCluster.mutate({ clusterId: cluster.id })}
                        />
                      }
                    />
                  ))}
                </div>
              </div>
            </LayoutGroup>
            <DragOverlay>
              {activeNote ? (
                <div className="stigi-note stigi-note--overlay">
                  <p className="stigi-note__body">{activeNote.body}</p>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
        <ImportCsvDialog open={importOpen} onClose={() => setImportOpen(false)} onImport={importCsv} />
        <SelectionBar
          count={selectedIds.size}
          canTeach={!agentBlocked}
          onMoreLikeThese={() => void moreLikeSelection()}
          onClear={() => setSelectedIds(new Set())}
        />
      </div>
    </MotionConfig>
  );
}
