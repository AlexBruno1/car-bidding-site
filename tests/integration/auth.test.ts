import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createAuth, type Auth } from "@/modules/identity/auth";
import { accounts, sessions, users } from "@/platform/db/schema";
import type { Database } from "@/platform/db/types";
import { createTestDb } from "./test-db";

let db: Database;
let close: () => Promise<void>;
let auth: Auth;

const credentials = {
  name: "Ada Rossi",
  email: "ada@example.com",
  password: "correct horse battery",
};

beforeAll(async () => {
  ({ db, close } = await createTestDb());
  auth = createAuth({
    db,
    baseUrl: "http://localhost:3000",
    secret: "test-secret-test-secret-test-secret-test",
    production: false,
  });
});

afterAll(() => close());

describe("authentication", () => {
  it("registers a member and stores only a hash of the password", async () => {
    const { user } = await auth.api.signUpEmail({ body: credentials });

    const [stored] = await db.select().from(users).where(eq(users.id, user.id));
    expect(stored).toMatchObject({ email: credentials.email, role: "member" });

    const [account] = await db.select().from(accounts).where(eq(accounts.userId, user.id));
    expect(account!.password).toBeTruthy();
    expect(account!.password).not.toContain(credentials.password);
  });

  it("ignores a role sent with the sign-up request", async () => {
    const body = {
      name: "Mallory",
      email: "mallory@example.com",
      password: "let me be an admin",
      role: "admin",
    };
    await auth.api.signUpEmail({ body }).catch(() => undefined);

    const stored = await db.select().from(users).where(eq(users.email, body.email));
    for (const user of stored) expect(user.role).toBe("member");
    const admins = await db.select().from(users).where(eq(users.role, "admin"));
    expect(admins).toHaveLength(0);
  });

  it("refuses a second account with the same email", async () => {
    await expect(auth.api.signUpEmail({ body: credentials })).rejects.toThrow();
    const stored = await db.select().from(users).where(eq(users.email, credentials.email));
    expect(stored).toHaveLength(1);
  });

  it("refuses passwords shorter than the minimum", async () => {
    const body = { name: "Shorty", email: "short@example.com", password: "123456789" };
    await expect(auth.api.signUpEmail({ body })).rejects.toThrow();
  });

  it("signs in with the right password and resolves the session from its cookie", async () => {
    const response = await auth.api.signInEmail({
      body: { email: credentials.email, password: credentials.password },
      asResponse: true,
    });
    expect(response.status).toBe(200);
    const setCookie = response.headers.get("set-cookie") ?? "";
    expect(setCookie).toMatch(/HttpOnly/i);
    expect(setCookie).toMatch(/SameSite=Lax/i);

    const cookie = setCookie.split(";")[0]!;
    const session = await auth.api.getSession({ headers: new Headers({ cookie }) });
    expect(session?.user).toMatchObject({ email: credentials.email, role: "member" });
  });

  it("rejects a wrong password and an unknown email the same way", async () => {
    const wrongPassword = await auth.api
      .signInEmail({ body: { email: credentials.email, password: "not the password" } })
      .catch((error: { statusCode?: number; body?: { code?: string } }) => error);
    const unknownEmail = await auth.api
      .signInEmail({ body: { email: "nobody@example.com", password: "not the password" } })
      .catch((error: { statusCode?: number; body?: { code?: string } }) => error);

    expect(wrongPassword).toMatchObject({ statusCode: 401 });
    expect(unknownEmail).toMatchObject({ statusCode: 401 });
    expect((wrongPassword as { body?: { code?: string } }).body?.code).toBe(
      (unknownEmail as { body?: { code?: string } }).body?.code,
    );
  });

  it("does not accept a forged or tampered session cookie", async () => {
    const [session] = await db.select().from(sessions).limit(1);
    const forged = new Headers({ cookie: `better-auth.session_token=${session!.token}.forged` });
    expect(await auth.api.getSession({ headers: forged })).toBeNull();
  });
});
