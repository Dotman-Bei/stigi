import { fail } from "@agent-native/core/action";
import { and, asc, count, eq, inArray, isNull, max, min } from "drizzle-orm";

import type { BoardCluster, BoardNote, BoardSnapshot } from "../../shared/board-types.js";
import { getDb, schema } from "../db/index.js";

export type NoteRow = typeof schema.stigiNotes.$inferSelect;
export type ClusterRow = typeof schema.stigiClusters.$inferSelect;

const notes = schema.stigiNotes;
const clusters = schema.stigiClusters;

export function toBoardNote(row: NoteRow): BoardNote {
  return {
    id: row.id, body: row.body, source: row.source, clusterId: row.clusterId,
    reason: row.reason, movedBy: row.movedBy, movedAt: row.movedAt, position: row.position,
  };
}

export function clipText(text: string, maxChars: number): string {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > maxChars ? `${flat.slice(0, maxChars - 1)}…` : flat;
}

export async function loadBoard(ownerEmail: string): Promise<BoardSnapshot> {
  const db = getDb();
  const clusterRows = await db.select().from(clusters).where(eq(clusters.ownerEmail, ownerEmail))
    .orderBy(asc(clusters.position), asc(clusters.createdAt));
  const noteRows = await db.select().from(notes).where(eq(notes.ownerEmail, ownerEmail))
    .orderBy(asc(notes.position), asc(notes.createdAt));
  const known = new Set(clusterRows.map((c) => c.id));
  const byCluster = new Map<string, BoardNote[]>();
  const unsorted: BoardNote[] = [];
  let sampleNotes = 0;
  for (const row of noteRows) {
    const note = toBoardNote(row);
    if (note.source === "sample") sampleNotes += 1;
    if (note.clusterId === null || !known.has(note.clusterId)) {
      unsorted.push(note);
      continue;
    }
    const list = byCluster.get(note.clusterId) ?? [];
    list.push(note);
    byCluster.set(note.clusterId, list);
  }
  const boardClusters: BoardCluster[] = clusterRows.map((c) => ({
    id: c.id, name: c.name, createdBy: c.createdBy, position: c.position, notes: byCluster.get(c.id) ?? [],
  }));
  return { clusters: boardClusters, unsorted, totalNotes: noteRows.length, sampleNotes };
}

export async function nextClusterPosition(ownerEmail: string): Promise<number> {
  const [row] = await getDb().select({ value: max(clusters.position) }).from(clusters).where(eq(clusters.ownerEmail, ownerEmail));
  return (row?.value ?? -1) + 1;
}

/** Newest-first: a new cluster goes in front so it is visible at the top of the grid. */
export async function frontClusterPosition(ownerEmail: string): Promise<number> {
  const [row] = await getDb().select({ value: min(clusters.position) }).from(clusters).where(eq(clusters.ownerEmail, ownerEmail));
  return (row?.value ?? 0) - 1;
}

export async function nextNotePosition(ownerEmail: string, clusterId: string | null): Promise<number> {
  const where = clusterId === null
    ? and(eq(notes.ownerEmail, ownerEmail), isNull(notes.clusterId))
    : and(eq(notes.ownerEmail, ownerEmail), eq(notes.clusterId, clusterId));
  const [row] = await getDb().select({ value: max(notes.position) }).from(notes).where(where);
  return (row?.value ?? -1) + 1;
}

export async function getOwnedClusters(ownerEmail: string, clusterIds: string[]): Promise<ClusterRow[]> {
  const unique = [...new Set(clusterIds)];
  if (unique.length === 0) return [];
  const rows = await getDb().select().from(clusters)
    .where(and(eq(clusters.ownerEmail, ownerEmail), inArray(clusters.id, unique)));
  if (rows.length !== unique.length) {
    const found = new Set(rows.map((r) => r.id));
    const missing = unique.filter((id) => !found.has(id));
    fail(`Cluster not found: ${missing.join(", ")}`, { errorCode: "cluster_not_found", statusCode: 404 });
  }
  return rows;
}

export async function getOwnedCluster(ownerEmail: string, clusterId: string): Promise<ClusterRow> {
  const [row] = await getOwnedClusters(ownerEmail, [clusterId]);
  if (!row) fail(`Cluster not found: ${clusterId}`, { errorCode: "cluster_not_found", statusCode: 404 });
  return row;
}

export async function getOwnedNotes(ownerEmail: string, noteIds: string[]): Promise<NoteRow[]> {
  const unique = [...new Set(noteIds)];
  if (unique.length === 0) return [];
  const rows = await getDb().select().from(notes)
    .where(and(eq(notes.ownerEmail, ownerEmail), inArray(notes.id, unique)));
  if (rows.length !== unique.length) {
    const found = new Set(rows.map((r) => r.id));
    const missing = unique.filter((id) => !found.has(id));
    fail(`Note not found: ${missing.join(", ")}`, { errorCode: "note_not_found", statusCode: 404 });
  }
  return rows;
}

export async function countNotes(ownerEmail: string): Promise<{ total: number; sample: number }> {
  const rows = await getDb().select({ source: notes.source, value: count() }).from(notes)
    .where(eq(notes.ownerEmail, ownerEmail)).groupBy(notes.source);
  let total = 0;
  let sample = 0;
  for (const row of rows) {
    total += row.value;
    if (row.source === "sample") sample += row.value;
  }
  return { total, sample };
}
