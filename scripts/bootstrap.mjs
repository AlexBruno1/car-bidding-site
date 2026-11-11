// First-time local setup: env file, database, migrations.
import { execSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const run = (command) => execSync(command, { stdio: "inherit" });

if (existsSync(".env")) {
  console.log("✓ .env already exists, leaving it untouched");
} else {
  const secret = randomBytes(32).toString("base64");
  const env = readFileSync(".env.example", "utf8").replace("AUTH_SECRET=", `AUTH_SECRET=${secret}`);
  writeFileSync(".env", env, { mode: 0o600 });
  console.log("✓ Created .env with a generated AUTH_SECRET");
}

run("pnpm db:up");
run("pnpm db:migrate");
console.log("\n✓ Ready. Start the app with: pnpm dev");
