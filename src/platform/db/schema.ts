/**
 * The full database schema, assembled from the tables each module owns.
 * This is the only file allowed to reach into the modules' data folders.
 */
export * from "@/modules/identity/data/schema";
export * from "@/modules/listings/data/schema";
export * from "@/modules/auctions/data/schema";
export * from "@/modules/community/data/schema";
export * from "@/modules/audit/data/schema";
