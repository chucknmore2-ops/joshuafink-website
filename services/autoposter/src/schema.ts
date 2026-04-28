import { readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "./db.ts";
import { log } from "./log.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = resolve(__dirname, "..", "..", "..", "db", "schema.sql");

export async function applySchema(): Promise<void> {
  const sql = await readFile(SCHEMA_PATH, "utf8");
  await pool.query(sql);
  log.info("Schema applied (idempotent).");
}
