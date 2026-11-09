import { getDbExec } from "@agent-native/core/db";

import { STIGI_MIGRATIONS } from "./migrations.js";

export async function resetTestDb(): Promise<void> {
  const exec = getDbExec();
  for (const migration of STIGI_MIGRATIONS) {
    const statement = typeof migration.sql === "string" ? migration.sql : migration.sql.postgres;
    if (statement) await exec.execute(statement);
  }
  await exec.execute("DELETE FROM stigi_notes");
  await exec.execute("DELETE FROM stigi_clusters");
  await exec.execute("DELETE FROM stigi_reports");
  await exec.execute("DELETE FROM stigi_agent_turns");
}
