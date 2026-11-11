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
import { LISTING_STATUSES } from "../domain/status";

export const listingStatus = pgEnum("listing_status", LISTING_STATUSES);
export const fuelType = pgEnum("fuel_type", [
  "petrol",
  "diesel",
  "hybrid",
  "electric",
  "lpg",
  "cng",
  "other",
]);
export const transmissionType = pgEnum("transmission_type", ["manual", "automatic", "other"]);

export const listings = pgTable(
  "listings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sellerId: text("seller_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    status: listingStatus("status").notNull().default("draft"),

    make: text("make").notNull(),
    model: text("model").notNull(),
    year: integer("year").notNull(),
    mileageKm: integer("mileage_km"),
    vin: text("vin"),
    fuel: fuelType("fuel"),
    transmission: transmissionType("transmission"),

    /** ISO 3166-1 alpha-2 country where the car is located. */
    locationCountry: text("location_country").notNull().default("IT"),
    locationCity: text("location_city"),

    title: text("title").notNull(),
    description: text("description").notNull().default(""),

    /** Secret. Must never be selected into anything sent to a browser. */
    reservePriceCents: bigint("reserve_price_cents", { mode: "number" }),
    currency: text("currency").notNull().default("EUR"),

    reviewedBy: text("reviewed_by").references(() => users.id, { onDelete: "set null" }),
    reviewNote: text("review_note"),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("listings_seller_id_idx").on(table.sellerId),
    index("listings_status_idx").on(table.status),
    check("listings_year_range", sql`${table.year} between 1885 and 2100`),
    check(
      "listings_mileage_non_negative",
      sql`${table.mileageKm} is null or ${table.mileageKm} >= 0`,
    ),
    check(
      "listings_reserve_positive",
      sql`${table.reservePriceCents} is null or ${table.reservePriceCents} > 0`,
    ),
    check("listings_country_format", sql`${table.locationCountry} ~ '^[A-Z]{2}$'`),
    check("listings_currency_format", sql`${table.currency} ~ '^[A-Z]{3}$'`),
  ],
);

export const listingPhotos = pgTable(
  "listing_photos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    listingId: uuid("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    /** Object-storage key. Bytes never live in the database or the app server. */
    storageKey: text("storage_key").notNull().unique(),
    position: integer("position").notNull(),
    altText: text("alt_text"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("listing_photos_position_idx").on(table.listingId, table.position)],
);
