import { applySchema } from "./schema.ts";
import { pool } from "./db.ts";
import { log } from "./log.ts";

async function main() {
  await applySchema();
  await pool.end();
}

main().catch((err) => {
  log.error("Migration failed:", err);
  process.exit(1);
});
