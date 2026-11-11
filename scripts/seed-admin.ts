import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { createAuth } from "@/modules/identity/auth";
import { PASSWORD_MIN_LENGTH, signUpSchema } from "@/modules/identity";
import * as schema from "@/platform/db/schema";

/**
 * Creates the first administrator, or promotes the existing account with
 * that email. The only way to become admin: there is no UI for it.
 */
async function main() {
  const { DATABASE_URL, AUTH_SECRET, APP_URL, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!DATABASE_URL || !AUTH_SECRET || !APP_URL) {
    throw new Error("DATABASE_URL, AUTH_SECRET and APP_URL must be set");
  }
  const input = signUpSchema.safeParse({
    name: "Admin",
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });
  if (!input.success) {
    const problems = input.error.issues.map((issue) => {
      if (issue.path[0] === "email") {
        return ADMIN_EMAIL ? "ADMIN_EMAIL is not a valid email address" : "ADMIN_EMAIL is empty";
      }
      return ADMIN_PASSWORD
        ? `ADMIN_PASSWORD has ${ADMIN_PASSWORD.length} characters, it needs at least ${PASSWORD_MIN_LENGTH}`
        : "ADMIN_PASSWORD is empty";
    });
    throw new Error(`Check .env (and save the file):\n  - ${problems.join("\n  - ")}`);
  }

  const client = postgres(DATABASE_URL, { max: 1 });
  const db = drizzle(client, { schema });
  try {
    const [existing] = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.email, input.data.email));

    if (!existing) {
      const auth = createAuth({ db, baseUrl: APP_URL, secret: AUTH_SECRET, production: false });
      await auth.api.signUpEmail({ body: input.data });
    }
    await db
      .update(schema.users)
      .set({ role: "admin" })
      .where(eq(schema.users.email, input.data.email));
    await db.insert(schema.auditLog).values({
      action: "user.role_changed",
      entityType: "user",
      entityId: input.data.email,
      metadata: { role: "admin", source: "seed-admin script" },
    });
    console.log(
      `✓ ${input.data.email} is an administrator${existing ? " (existing account promoted)" : ""}`,
    );
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
