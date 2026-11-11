import { describe, expect, it } from "vitest";
import { LISTING_ACTIONS, LISTING_STATUSES, isEditableBySeller, transitionListing } from "./status";

describe("listing status", () => {
  it("follows the review flow", () => {
    expect(transitionListing("draft", "submit", "seller")).toEqual({
      ok: true,
      value: "submitted",
    });
    expect(transitionListing("submitted", "request_changes", "reviewer")).toEqual({
      ok: true,
      value: "changes_requested",
    });
    expect(transitionListing("changes_requested", "submit", "seller")).toEqual({
      ok: true,
      value: "submitted",
    });
    expect(transitionListing("submitted", "approve", "reviewer")).toEqual({
      ok: true,
      value: "approved",
    });
  });

  it("does not let a seller approve their own listing", () => {
    expect(transitionListing("submitted", "approve", "seller")).toEqual({
      ok: false,
      error: "wrong_party",
    });
  });

  it("does not let a reviewer submit or withdraw on the seller's behalf", () => {
    expect(transitionListing("draft", "submit", "reviewer").ok).toBe(false);
    expect(transitionListing("submitted", "withdraw", "reviewer").ok).toBe(false);
  });

  it("cannot skip review", () => {
    expect(transitionListing("draft", "approve", "reviewer")).toEqual({
      ok: false,
      error: "invalid_transition",
    });
  });

  it("treats approved, rejected and withdrawn as final", () => {
    for (const status of ["approved", "rejected", "withdrawn"] as const) {
      for (const action of LISTING_ACTIONS) {
        expect(transitionListing(status, action, "seller").ok, `${status}/${action}`).toBe(false);
        expect(transitionListing(status, action, "reviewer").ok, `${status}/${action}`).toBe(false);
      }
    }
  });

  it("allows seller edits only before and between reviews", () => {
    const editable = LISTING_STATUSES.filter(isEditableBySeller);
    expect(editable).toEqual(["draft", "changes_requested"]);
  });
});
