import { err, ok, type Result } from "@/shared/result";

/**
 * Life cycle of a seller's submission, before it becomes an auction:
 *
 *   draft ──submit──▶ submitted ──approve──▶ approved
 *     ▲                  │  │
 *     │                  │  └──reject──▶ rejected
 *     │                  └──request_changes──▶ changes_requested ──submit──▶ submitted
 *     └── a seller can withdraw at any point before approval ──▶ withdrawn
 */
export const LISTING_STATUSES = [
  "draft",
  "submitted",
  "changes_requested",
  "approved",
  "rejected",
  "withdrawn",
] as const;
export type ListingStatus = (typeof LISTING_STATUSES)[number];

export const LISTING_ACTIONS = [
  "submit",
  "withdraw",
  "approve",
  "reject",
  "request_changes",
] as const;
export type ListingAction = (typeof LISTING_ACTIONS)[number];

/** Who performs the action. Authorization is checked separately, by identity. */
export type ListingParty = "seller" | "reviewer";

type Transition = { readonly by: ListingParty; readonly to: ListingStatus };

const transitions: Record<ListingStatus, Partial<Record<ListingAction, Transition>>> = {
  draft: {
    submit: { by: "seller", to: "submitted" },
    withdraw: { by: "seller", to: "withdrawn" },
  },
  submitted: {
    approve: { by: "reviewer", to: "approved" },
    reject: { by: "reviewer", to: "rejected" },
    request_changes: { by: "reviewer", to: "changes_requested" },
    withdraw: { by: "seller", to: "withdrawn" },
  },
  changes_requested: {
    submit: { by: "seller", to: "submitted" },
    withdraw: { by: "seller", to: "withdrawn" },
  },
  approved: {},
  rejected: {},
  withdrawn: {},
};

export type TransitionError = "invalid_transition" | "wrong_party";

export function transitionListing(
  current: ListingStatus,
  action: ListingAction,
  by: ListingParty,
): Result<ListingStatus, TransitionError> {
  const transition = transitions[current][action];
  if (!transition) return err("invalid_transition");
  if (transition.by !== by) return err("wrong_party");
  return ok(transition.to);
}

/** A seller may change the listing's content only in these states. */
export function isEditableBySeller(status: ListingStatus): boolean {
  return status === "draft" || status === "changes_requested";
}
