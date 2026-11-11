/**
 * The contract for events exchanged between modules. A module publishes an
 * event and does not know who listens; listeners import only this file.
 * Payloads carry identifiers, not full records, so listeners read fresh data.
 */
export type AppEvents = {
  "user.registered": { userId: string };
  "listing.submitted": { listingId: string; sellerId: string };
  "listing.reviewed": {
    listingId: string;
    reviewerId: string;
    outcome: "approved" | "rejected" | "changes_requested";
  };
};

export type AppEventName = keyof AppEvents;
