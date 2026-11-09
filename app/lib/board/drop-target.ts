export const UNSORTED_DROP_ID = "drop:unsorted";
export const NEW_CLUSTER_DROP_ID = "drop:new-cluster";
const CLUSTER_DROP_PREFIX = "drop:cluster:";
const NOTE_DRAG_PREFIX = "note:";

export type DropAction =
  | { kind: "create-cluster"; noteId: string }
  | { kind: "move"; noteId: string; clusterId: string | null }
  | { kind: "none" };

export function clusterDropId(clusterId: string): string {
  return `${CLUSTER_DROP_PREFIX}${clusterId}`;
}

export function noteDragId(noteId: string): string {
  return `${NOTE_DRAG_PREFIX}${noteId}`;
}

export function noteIdFromDragId(dragId: string): string {
  return dragId.startsWith(NOTE_DRAG_PREFIX) ? dragId.slice(NOTE_DRAG_PREFIX.length) : dragId;
}

export function resolveDrop(noteId: string, currentClusterId: string | null, overId: string | null): DropAction {
  if (overId === null) return { kind: "none" };
  if (overId === NEW_CLUSTER_DROP_ID) return { kind: "create-cluster", noteId };
  if (overId === UNSORTED_DROP_ID) {
    return currentClusterId === null ? { kind: "none" } : { kind: "move", noteId, clusterId: null };
  }
  if (overId.startsWith(CLUSTER_DROP_PREFIX)) {
    const clusterId = overId.slice(CLUSTER_DROP_PREFIX.length);
    return clusterId === currentClusterId ? { kind: "none" } : { kind: "move", noteId, clusterId };
  }
  return { kind: "none" };
}
