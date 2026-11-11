import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { nextCookies } from "better-auth/next-js";
import { getDb } from "@/platform/db";
import { getEnv } from "@/platform/env";
import { getEventBus } from "@/platform/events";
import { err, ok, type Result } from "@/shared/result";
import { createAuth, type Auth } from "./auth";
import type { SignInInput, SignUpInput } from "./domain/credentials";
import { can, type Permission, type PermissionArgs } from "./domain/permissions";
import { isRole, type Actor } from "./domain/roles";

const globalForAuth = globalThis as unknown as { __auth?: Auth };

/** The auth instance, for the HTTP handler only. Use the functions below elsewhere. */
export function getAuth(): Auth {
  if (!globalForAuth.__auth) {
    const env = getEnv();
    globalForAuth.__auth = createAuth({
      db: getDb(),
      baseUrl: env.APP_URL,
      secret: env.AUTH_SECRET,
      production: env.NODE_ENV === "production",
      // Lets server actions set the session cookie. Must be the last plugin.
      plugins: [nextCookies()],
    });
  }
  return globalForAuth.__auth;
}

export type CurrentUser = Actor & {
  readonly name: string;
  readonly email: string;
};

/** The signed-in user, or null. Deduplicated within a single request. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  // Read the request first: this is what marks the caller as request-time
  // work, so nothing below runs while pages are prerendered at build time.
  const requestHeaders = await headers();
  const session = await getAuth().api.getSession({ headers: requestHeaders });
  if (!session) return null;
  const { id, name, email, role } = session.user;
  // An unknown role in the database is treated as the least privileged one.
  return { id, name, email, role: isRole(role) ? role : "member" };
});

export class NotAuthenticatedError extends Error {
  constructor() {
    super("Not authenticated");
    this.name = "NotAuthenticatedError";
  }
}

export class NotAuthorizedError extends Error {
  constructor(permission: Permission) {
    super(`Not authorized: ${permission}`);
    this.name = "NotAuthorizedError";
  }
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new NotAuthenticatedError();
  return user;
}

/** Guard for server actions and route handlers. Throws if not allowed. */
export async function requirePermission<P extends Permission>(
  ...args: PermissionArgs<P>
): Promise<CurrentUser> {
  const user = await requireUser();
  if (!can<P>(user, ...args)) throw new NotAuthorizedError(args[0]);
  return user;
}

export type AuthFailure = "invalid_credentials" | "email_taken" | "rate_limited" | "unknown";

/**
 * Recognised by shape, not with `instanceof`: the dev bundler can load the
 * auth library's error class twice, and then `instanceof` is false for an
 * error that is in fact an API error.
 */
function asApiError(error: unknown): { status: number; code: string } | null {
  if (!(error instanceof Error) || error.name !== "APIError") return null;
  const { statusCode, body } = error as { statusCode?: unknown; body?: { code?: unknown } };
  if (typeof statusCode !== "number") return null;
  return { status: statusCode, code: typeof body?.code === "string" ? body.code : "" };
}

function toAuthFailure(error: unknown): AuthFailure {
  const apiError = asApiError(error);
  if (!apiError) throw error;
  if (apiError.status === 429) return "rate_limited";
  if (apiError.code.startsWith("USER_ALREADY_EXISTS")) return "email_taken";
  if (apiError.status === 401 || apiError.code.startsWith("INVALID_")) return "invalid_credentials";
  return "unknown";
}

export async function signUp(input: SignUpInput): Promise<Result<{ userId: string }, AuthFailure>> {
  try {
    const requestHeaders = await headers();
    const { user } = await getAuth().api.signUpEmail({ body: input, headers: requestHeaders });
    await getEventBus().publish("user.registered", { userId: user.id });
    return ok({ userId: user.id });
  } catch (error) {
    return err(toAuthFailure(error));
  }
}

export async function signIn(input: SignInInput): Promise<Result<{ userId: string }, AuthFailure>> {
  try {
    const requestHeaders = await headers();
    const { user } = await getAuth().api.signInEmail({ body: input, headers: requestHeaders });
    return ok({ userId: user.id });
  } catch (error) {
    return err(toAuthFailure(error));
  }
}

export async function signOut(): Promise<void> {
  const requestHeaders = await headers();
  await getAuth().api.signOut({ headers: requestHeaders });
}
