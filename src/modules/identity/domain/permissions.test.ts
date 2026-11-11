import { describe, expect, it } from "vitest";
import { can, type Permission } from "./permissions";
import type { Actor } from "./roles";

const member: Actor = { id: "user-1", role: "member" };
const otherMember: Actor = { id: "user-2", role: "member" };
const admin: Actor = { id: "admin-1", role: "admin" };

describe("permissions", () => {
  it("denies everything to guests", () => {
    expect(can(null, "listing:create")).toBe(false);
    expect(can(null, "comment:create")).toBe(false);
    expect(can(null, "admin:access")).toBe(false);
    expect(can(null, "bid:place", { ownerId: "user-1" })).toBe(false);
  });

  it("reserves staff permissions to admins", () => {
    const staffOnly: Extract<
      Permission,
      "admin:access" | "listing:review" | "bid:void" | "comment:moderate"
    >[] = ["admin:access", "listing:review", "bid:void", "comment:moderate"];
    for (const permission of staffOnly) {
      expect(can(member, permission), permission).toBe(false);
      expect(can(admin, permission), permission).toBe(true);
    }
  });

  it("lets any member create listings and comments", () => {
    expect(can(member, "listing:create")).toBe(true);
    expect(can(member, "comment:create")).toBe(true);
  });

  it("lets sellers edit only their own listing, and only while editable", () => {
    expect(can(member, "listing:edit", { ownerId: member.id, editable: true })).toBe(true);
    expect(can(member, "listing:edit", { ownerId: member.id, editable: false })).toBe(false);
    expect(can(otherMember, "listing:edit", { ownerId: member.id, editable: true })).toBe(false);
  });

  it("lets admins edit any listing in any state", () => {
    expect(can(admin, "listing:edit", { ownerId: member.id, editable: false })).toBe(true);
  });

  it("never lets a seller bid on their own car, not even an admin", () => {
    expect(can(member, "bid:place", { ownerId: member.id })).toBe(false);
    expect(can(admin, "bid:place", { ownerId: admin.id })).toBe(false);
    expect(can(otherMember, "bid:place", { ownerId: member.id })).toBe(true);
  });
});
