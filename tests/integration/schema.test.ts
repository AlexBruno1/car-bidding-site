import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { auctions, auditLog, bidVoids, bids, listings, users } from "@/platform/db/schema";
import type { Database } from "@/platform/db/types";
import { PG, createTestDb, expectPgError } from "./test-db";

let db: Database;
let close: () => Promise<void>;
let auctionId: string;
let listingId: string;

const hour = 60 * 60 * 1000;
const startsAt = new Date("2026-01-01T10:00:00Z");
const endsAt = new Date(startsAt.getTime() + 7 * 24 * hour);

beforeAll(async () => {
  ({ db, close } = await createTestDb());
  await db.insert(users).values([
    { id: "seller", name: "Seller", email: "seller@example.com" },
    { id: "bidder", name: "Bidder", email: "bidder@example.com" },
    { id: "admin", name: "Admin", email: "admin@example.com", role: "admin" },
  ]);
  const [listing] = await db
    .insert(listings)
    .values({ sellerId: "seller", make: "Lancia", model: "Delta", year: 1992, title: "Delta" })
    .returning();
  listingId = listing!.id;
  const [auction] = await db
    .insert(auctions)
    .values({ listingId, startsAt, endsAt, originalEndsAt: endsAt, startingPriceCents: 1_000_00 })
    .returning();
  auctionId = auction!.id;
});

afterAll(() => close());

describe("database schema", () => {
  it("applies sensible defaults to a new listing", async () => {
    const [listing] = await db.select().from(listings).where(eq(listings.id, listingId));
    expect(listing).toMatchObject({
      status: "draft",
      currency: "EUR",
      locationCountry: "IT",
      reservePriceCents: null,
    });
  });

  it("rejects impossible listing data", async () => {
    const base = { sellerId: "seller", make: "Fiat", model: "500", title: "500" };
    await expectPgError(
      () => db.insert(listings).values({ ...base, year: 1700 }),
      PG.checkViolation,
    );
    await expectPgError(
      () => db.insert(listings).values({ ...base, year: 1970, mileageKm: -1 }),
      PG.checkViolation,
    );
    await expectPgError(
      () => db.insert(listings).values({ ...base, year: 1970, reservePriceCents: 0 }),
      PG.checkViolation,
    );
    await expectPgError(
      () => db.insert(listings).values({ ...base, year: 1970, locationCountry: "Italy" }),
      PG.checkViolation,
    );
  });

  it("allows only one auction per listing", async () => {
    await expectPgError(
      () =>
        db
          .insert(auctions)
          .values({ listingId, startsAt, endsAt, originalEndsAt: endsAt, startingPriceCents: 1 }),
      PG.uniqueViolation,
    );
  });

  it("lets an auction be extended but never shortened", async () => {
    const extended = new Date(endsAt.getTime() + 2 * 60 * 1000);
    await db.update(auctions).set({ endsAt: extended }).where(eq(auctions.id, auctionId));
    await expectPgError(
      () =>
        db
          .update(auctions)
          .set({ endsAt: new Date(endsAt.getTime() - 1) })
          .where(eq(auctions.id, auctionId)),
      PG.checkViolation,
    );
  });

  it("stores prices above the 32-bit integer limit", async () => {
    const fiftyMillionEuros = 50_000_000_00;
    const [bid] = await db
      .insert(bids)
      .values({ auctionId, bidderId: "bidder", amountCents: fiftyMillionEuros })
      .returning();
    expect(bid!.amountCents).toBe(fiftyMillionEuros);
  });

  it("rejects non-positive bids and duplicate amounts on the same auction", async () => {
    await expectPgError(
      () => db.insert(bids).values({ auctionId, bidderId: "bidder", amountCents: 0 }),
      PG.checkViolation,
    );
    await db.insert(bids).values({ auctionId, bidderId: "bidder", amountCents: 2_000_00 });
    await expectPgError(
      () => db.insert(bids).values({ auctionId, bidderId: "seller", amountCents: 2_000_00 }),
      PG.uniqueViolation,
    );
  });

  it("does not let a user with bids or listings be deleted", async () => {
    await expectPgError(() => db.delete(users).where(eq(users.id, "bidder")), PG.restrictViolation);
    await expectPgError(() => db.delete(users).where(eq(users.id, "seller")), PG.restrictViolation);
  });
});

describe("append-only ledgers", () => {
  it("refuses to update, delete or truncate bids", async () => {
    const [bid] = await db
      .insert(bids)
      .values({ auctionId, bidderId: "bidder", amountCents: 3_000_00 })
      .returning();

    await expectPgError(
      () => db.update(bids).set({ amountCents: 1 }).where(eq(bids.id, bid!.id)),
      PG.appendOnlyViolation,
    );
    await expectPgError(() => db.delete(bids).where(eq(bids.id, bid!.id)), PG.appendOnlyViolation);
    await expectPgError(() => db.execute(sql`truncate table bids cascade`), PG.appendOnlyViolation);

    const [unchanged] = await db.select().from(bids).where(eq(bids.id, bid!.id));
    expect(unchanged!.amountCents).toBe(3_000_00);
  });

  it("voids a bid by adding a record, once, and keeps that record forever", async () => {
    const [bid] = await db
      .insert(bids)
      .values({ auctionId, bidderId: "bidder", amountCents: 4_000_00 })
      .returning();
    const voided = { bidId: bid!.id, voidedBy: "admin", reason: "Entered by mistake" };

    await db.insert(bidVoids).values(voided);
    await expectPgError(() => db.insert(bidVoids).values(voided), PG.uniqueViolation);
    await expectPgError(
      () => db.delete(bidVoids).where(eq(bidVoids.bidId, bid!.id)),
      PG.appendOnlyViolation,
    );
  });

  it("refuses to rewrite the audit log", async () => {
    const [entry] = await db
      .insert(auditLog)
      .values({ actorId: "admin", action: "bid.voided", entityType: "bid", entityId: "x" })
      .returning();

    await expectPgError(
      () => db.update(auditLog).set({ action: "nothing" }).where(eq(auditLog.id, entry!.id)),
      PG.appendOnlyViolation,
    );
    await expectPgError(
      () => db.delete(auditLog).where(eq(auditLog.id, entry!.id)),
      PG.appendOnlyViolation,
    );
  });
});
