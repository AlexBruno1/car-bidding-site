import type { Actor } from "./roles";

/**
 * Central authorization rules. Every server entry point asks `can(...)`
 * before acting; hiding a button in the UI is never the protection.
 */
type Owned = { readonly ownerId: string };

export type PermissionChecks = {
  "admin:access": undefined;
  "listing:create": undefined;
  /** Sellers edit their own listing only while it is still editable. */
  "listing:edit": Owned & { readonly editable: boolean };
  "listing:review": undefined;
  /** `ownerId` is the seller: nobody bids on their own car. */
  "bid:place": Owned;
  "bid:void": undefined;
  "comment:create": undefined;
  "comment:moderate": undefined;
};

export type Permission = keyof PermissionChecks;

type Rule<P extends Permission> = (actor: Actor, resource: PermissionChecks[P]) => boolean;

const isAdmin = (actor: Actor) => actor.role === "admin";
const anyMember = () => true;

const rules: { [P in Permission]: Rule<P> } = {
  "admin:access": isAdmin,
  "listing:create": anyMember,
  "listing:edit": (actor, listing) =>
    isAdmin(actor) || (listing.ownerId === actor.id && listing.editable),
  "listing:review": isAdmin,
  "bid:place": (actor, listing) => listing.ownerId !== actor.id,
  "bid:void": isAdmin,
  "comment:create": anyMember,
  "comment:moderate": isAdmin,
};

/** `[permission]` or `[permission, resource]`, depending on what the rule needs. */
export type PermissionArgs<P extends Permission> = PermissionChecks[P] extends undefined
  ? [permission: P]
  : [permission: P, resource: PermissionChecks[P]];

/** Guests (`null`) are never allowed anything that requires a permission. */
export function can<P extends Permission>(
  actor: Actor | null,
  ...[permission, resource]: PermissionArgs<P>
): boolean {
  if (!actor) return false;
  return rules[permission](actor, resource as PermissionChecks[P]);
}
