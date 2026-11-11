import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import type * as schema from "./schema";

/**
 * Driver-independent database type. Production uses postgres-js, tests use
 * PGlite; code that takes a `Database` works with both.
 */
export type Database = PgDatabase<PgQueryResultHKT, typeof schema>;
