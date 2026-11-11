import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getEnv } from "@/platform/env";
import * as schema from "./schema";
import type { Database } from "./types";

// Reuse the connection pool across hot reloads in development.
const globalForDb = globalThis as unknown as { __db?: Database };

export function getDb(): Database {
  if (!globalForDb.__db) {
    const client = postgres(getEnv().DATABASE_URL, { max: 10 });
    globalForDb.__db = drizzle(client, { schema });
  }
  return globalForDb.__db;
}
