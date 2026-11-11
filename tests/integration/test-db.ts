import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "@/platform/db/schema";
import type { Database } from "@/platform/db/types";

/**
 * A fresh, real PostgreSQL (compiled to WebAssembly, in-process) with the
 * project's actual migrations applied. No Docker, no shared state.
 */
export async function createTestDb(): Promise<{ db: Database; close: () => Promise<void> }> {
  const client = new PGlite();
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: "./drizzle" });
  return { db, close: () => client.close() };
}

/** Postgres error code of a failed query, wherever the driver put it. */
export function pgErrorCode(error: unknown): string | undefined {
  for (let current = error; current instanceof Error; current = current.cause) {
    const code = (current as { code?: unknown }).code;
    if (typeof code === "string") return code;
  }
  return undefined;
}

export async function expectPgError(run: () => Promise<unknown>, code: string): Promise<void> {
  try {
    await run();
  } catch (error) {
    if (pgErrorCode(error) === code) return;
    throw new Error(`Expected Postgres error ${code}, got ${pgErrorCode(error) ?? String(error)}`);
  }
  throw new Error(`Expected Postgres error ${code}, but the query succeeded`);
}

export const PG = {
  uniqueViolation: "23505",
  checkViolation: "23514",
  /** A row is still referenced through an ON DELETE RESTRICT foreign key. */
  restrictViolation: "23001",
  /** Raised by the append-only triggers on ledger tables. */
  appendOnlyViolation: "AP001",
} as const;
