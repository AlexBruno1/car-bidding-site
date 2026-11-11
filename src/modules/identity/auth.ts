import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import type { BetterAuthPlugin } from "better-auth";
import type { Database } from "@/platform/db/types";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "./domain/credentials";
import { accounts, rateLimits, sessions, users, verifications } from "./data/schema";

export type AuthConfig = {
  db: Database;
  baseUrl: string;
  secret: string;
  production: boolean;
  plugins?: BetterAuthPlugin[];
};

/**
 * Builds the auth instance. Dependencies are passed in so tests can run the
 * real auth flows against an in-process database.
 */
export function createAuth(config: AuthConfig) {
  return betterAuth({
    baseURL: config.baseUrl,
    secret: config.secret,
    database: drizzleAdapter(config.db, {
      provider: "pg",
      schema: {
        user: users,
        session: sessions,
        account: accounts,
        verification: verifications,
        rateLimit: rateLimits,
      },
    }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: PASSWORD_MIN_LENGTH,
      maxPasswordLength: PASSWORD_MAX_LENGTH,
    },
    user: {
      additionalFields: {
        // `input: false` means a sign-up request can never choose its role.
        role: { type: "string", defaultValue: "member", input: false },
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
    },
    rateLimit: {
      enabled: config.production,
      storage: "database",
      window: 60,
      max: 100,
      customRules: {
        "/sign-in/email": { window: 60, max: 5 },
        "/sign-up/email": { window: 60 * 60, max: 10 },
      },
    },
    advanced: {
      useSecureCookies: config.production,
    },
    plugins: config.plugins ?? [],
  });
}

export type Auth = ReturnType<typeof createAuth>;
