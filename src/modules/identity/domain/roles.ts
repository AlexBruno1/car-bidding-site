/**
 * Every registered user is a member and can both sell and bid. What a member
 * may do in a given moment (e.g. bid only with a verified card) is decided by
 * permissions, not by adding more roles.
 */
export const ROLES = ["member", "admin"] as const;
export type Role = (typeof ROLES)[number];

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

/** The authenticated user as the rest of the app sees it. */
export type Actor = {
  readonly id: string;
  readonly role: Role;
};
