import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "@/modules/identity/data/schema";
import { listings } from "@/modules/listings/data/schema";
import { AUCTION_STATUSES } from "../domain/status";

export const auctionStatus = pgEnum("auction_status", AUCTION_STATUSES);

export const auctions = pgTable(
  "auctions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    listingId: uuid("listing_id")
      .notNull()
      .unique()
      .references(() => listings.id, { onDelete: "restrict" }),
    status: auctionStatus("status").notNull().default("scheduled"),
    currency: text("currency").notNull().default("EUR"),

    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    /** Moves forward when a late bid triggers the anti-sniping extension. */
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    originalEndsAt: timestamp("original_ends_at", { withTimezone: true }).notNull(),

    startingPriceCents: bigint("starting_price_cents", { mode: "number" }).notNull(),
    /** Secret copy taken from the listing when the auction is created. */
    reservePriceCents: bigint("reserve_price_cents", { mode: "number" }),

    // Denormalized from bids, updated in the same transaction as each bid,
    // so list pages never have to aggregate the bids table.
    currentPriceCents: bigint("current_price_cents", { mode: "number" }),
    bidCount: integer("bid_count").notNull().default(0),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("auctions_status_ends_at_idx").on(table.status, table.endsAt),
    check("auctions_ends_after_start", sql`${table.endsAt} > ${table.startsAt}`),
    check("auctions_end_never_earlier", sql`${table.endsAt} >= ${table.originalEndsAt}`),
    check("auctions_starting_price_positive", sql`${table.startingPriceCents} > 0`),
    check("auctions_bid_count_non_negative", sql`${table.bidCount} >= 0`),
  ],
);

/**
 * Append-only ledger. Rows are never updated or deleted: a database trigger
 * rejects both (see the custom migration). A bid is cancelled only by adding
 * a row to `bid_voids`.
 */
export const bids = pgTable(
  "bids",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    auctionId: uuid("auction_id")
      .notNull()
      .references(() => auctions.id, { onDelete: "restrict" }),
    bidderId: text("bidder_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    amountCents: bigint("amount_cents", { mode: "number" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Two bids of the same amount on one auction cannot both exist.
    uniqueIndex("bids_auction_amount_idx").on(table.auctionId, table.amountCents),
    index("bids_bidder_id_idx").on(table.bidderId),
    check("bids_amount_positive", sql`${table.amountCents} > 0`),
  ],
);

export const bidVoids = pgTable("bid_voids", {
  bidId: uuid("bid_id")
    .primaryKey()
    .references(() => bids.id, { onDelete: "restrict" }),
  voidedBy: text("voided_by")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
