export const AUCTION_STATUSES = [
  "scheduled",
  "live",
  "sold",
  "reserve_not_met",
  "no_bids",
  "cancelled",
] as const;
export type AuctionStatus = (typeof AUCTION_STATUSES)[number];
