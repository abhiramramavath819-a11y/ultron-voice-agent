import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const url =
  process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL;

if (!url) {
  console.error("No database URL found. Set DATABASE_URL in .env.local, then rerun.");
  process.exit(1);
}

const sql = neon(url);
const schema = readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8");

// Split on statement boundaries; the schema deliberately contains no functions or dollar-quoting.
const statements = schema
  .split(";")
  .map((s) => s.trim())
  .filter((s) => s && !s.startsWith("--"));

for (const statement of statements) {
  await sql.query(statement);
  console.log("ok:", statement.split("\n")[0].slice(0, 68));
}

console.log(`\nSchema applied. ${statements.length} statements executed.`);
