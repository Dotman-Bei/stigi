import type { MigrationEntry } from "@agent-native/core/db";

export const STIGI_MIGRATIONS_TABLE = "stigi_migrations";

export const STIGI_MIGRATIONS: MigrationEntry[] = [
  {
    version: 1,
    name: "create_stigi_clusters",
    sql: `CREATE TABLE IF NOT EXISTS stigi_clusters (
  id TEXT PRIMARY KEY,
  owner_email TEXT NOT NULL,
  name TEXT,
  created_by TEXT NOT NULL CHECK (created_by IN ('user','agent','sample')),
  position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
)`,
  },
  {
    version: 2,
    name: "index_stigi_clusters_owner",
    sql: `CREATE INDEX IF NOT EXISTS stigi_clusters_owner_idx ON stigi_clusters (owner_email)`,
  },
  {
    version: 3,
    name: "create_stigi_notes",
    sql: `CREATE TABLE IF NOT EXISTS stigi_notes (
  id TEXT PRIMARY KEY,
  owner_email TEXT NOT NULL,
  body TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('sample','import')),
  cluster_id TEXT,
  reason TEXT,
  moved_by TEXT CHECK (moved_by IN ('user','agent')),
  moved_at TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
)`,
  },
  {
    version: 4,
    name: "index_stigi_notes_owner_cluster",
    sql: `CREATE INDEX IF NOT EXISTS stigi_notes_owner_cluster_idx ON stigi_notes (owner_email, cluster_id)`,
  },
  {
    version: 5,
    name: "create_stigi_reports",
    sql: `CREATE TABLE IF NOT EXISTS stigi_reports (
  owner_email TEXT PRIMARY KEY,
  markdown TEXT NOT NULL,
  updated_by TEXT NOT NULL CHECK (updated_by IN ('user','agent')),
  updated_at TEXT NOT NULL
)`,
  },
  {
    version: 6,
    name: "create_stigi_agent_turns",
    sql: `CREATE TABLE IF NOT EXISTS stigi_agent_turns (
  owner_email TEXT NOT NULL,
  day TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (owner_email, day)
)`,
  },
];
