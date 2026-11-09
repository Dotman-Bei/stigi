import { runMigrations } from "@agent-native/core/db";

import { STIGI_MIGRATIONS, STIGI_MIGRATIONS_TABLE } from "../db/migrations.js";

export default runMigrations(STIGI_MIGRATIONS, { table: STIGI_MIGRATIONS_TABLE });
