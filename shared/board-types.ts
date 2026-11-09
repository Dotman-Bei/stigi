export type Actor = "user" | "agent";
export type ClusterOrigin = "user" | "agent" | "sample";
export type NoteSource = "sample" | "import";

export interface BoardNote {
  id: string;
  body: string;
  source: NoteSource;
  clusterId: string | null;
  reason: string | null;
  movedBy: Actor | null;
  movedAt: string | null;
  position: number;
}

export interface BoardCluster {
  id: string;
  name: string | null;
  createdBy: ClusterOrigin;
  position: number;
  notes: BoardNote[];
}

export interface BoardSnapshot {
  clusters: BoardCluster[];
  unsorted: BoardNote[];
  totalNotes: number;
  sampleNotes: number;
}

export interface AgentUsage {
  used: number;
  limit: number;
  remaining: number;
  resetsAt: string;
}

export const MAX_BOARD_NOTES = 500;
export const MAX_MOVES_PER_CALL = 50;
export const MAX_REASON_CHARS = 140;
export const MAX_CLUSTER_NAME_CHARS = 60;
export const UNTITLED_LABEL = "Untitled";
