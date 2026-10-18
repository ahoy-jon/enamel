import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import pg from "pg";

const run = promisify(execFile);
const root = new URL("..", import.meta.url);
const migrationUrl = new URL("migrations/001_initial.sql", root);

const database = await new PostgreSqlContainer("postgres:16-alpine")
  .withDatabase("subscriptions")
  .withUsername("app")
  .withPassword("app")
  .start();

try {
  const connectionString = database.getConnectionUri();
  const pool = new pg.Pool({ connectionString });
  try {
    await pool.query(await readFile(migrationUrl, "utf8"));
    // This is deliberately not an exact copy of the application's schema. The
    // CUE rules must permit unrelated additions while retaining their own
    // structural conventions.
    await pool.query(`
      ALTER TABLE subscriptions ADD COLUMN internal_note text;
      CREATE TABLE audit_log (
        id uuid PRIMARY KEY,
        action text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);
  } finally {
    await pool.end();
  }

  await run(process.execPath, ["tools/extract-program-schema.mjs"], {
    cwd: root.pathname,
    stdio: "inherit",
  });
  await run(process.execPath, ["tools/dump-database-schema.mjs"], {
    cwd: root.pathname,
    env: { ...process.env, DATABASE_URL: connectionString },
    stdio: "inherit",
  });
  await run("cue", ["export", "-e", "schema", "./enamel"], {
    cwd: root.pathname,
    stdio: "inherit",
  });
} finally {
  await database.stop();
}
