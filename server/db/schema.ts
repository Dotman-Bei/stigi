import { integer, pgTable, primaryKey, text } from "drizzle-orm/pg-core";

export const stigiClusters = pgTable("stigi_clusters", {
  id: text("id").primaryKey(),
  ownerEmail: text("owner_email").notNull(),
  name: text("name"),
  createdBy: text("created_by", { enum: ["user", "agent", "sample"] }).notNull(),
  position: integer("position").notNull().default(0),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const stigiNotes = pgTable("stigi_notes", {
  id: text("id").primaryKey(),
  ownerEmail: text("owner_email").notNull(),
  body: text("body").notNull(),
  source: text("source", { enum: ["sample", "import"] }).notNull(),
  clusterId: text("cluster_id"),
  reason: text("reason"),
  movedBy: text("moved_by", { enum: ["user", "agent"] }),
  movedAt: text("moved_at"),
  position: integer("position").notNull().default(0),
  createdAt: text("created_at").notNull(),
});

export const stigiReports = pgTable("stigi_reports", {
  ownerEmail: text("owner_email").primaryKey(),
  markdown: text("markdown").notNull(),
  updatedBy: text("updated_by", { enum: ["user", "agent"] }).notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const stigiAgentTurns = pgTable(
  "stigi_agent_turns",
  {
    ownerEmail: text("owner_email").notNull(),
    day: text("day").notNull(),
    count: integer("count").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.ownerEmail, t.day] })],
);
