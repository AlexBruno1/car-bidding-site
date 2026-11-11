import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * Architecture rules. They are the enforceable version of docs/architecture.md:
 * if one of these fails, the dependency direction is wrong, not the rule.
 */
const noDeepModuleImports = {
  group: ["@/modules/*/*", "!@/modules/*/server"],
  message:
    "Import a module only through its public API: '@/modules/<name>' or '@/modules/<name>/server'. Inside a module, use relative imports.",
};

const noDatabaseAccess = {
  group: ["drizzle-orm", "drizzle-orm/*", "postgres", "@/platform/db", "@/platform/db/*"],
  message: "This layer must not talk to the database. Go through a module's public API.",
};

const noFramework = {
  group: [
    "next",
    "next/*",
    "react",
    "react-dom",
    "react/*",
    "server-only",
    "better-auth",
    "better-auth/*",
  ],
  message: "Domain code is plain TypeScript: no framework, no I/O.",
};

const noOuterLayers = {
  group: ["@/app/*", "@/platform/*", "../data/*", "../data", "../server", "../auth"],
  message: "Domain code may depend only on other domain code and on '@/shared'.",
};

const restrict = (...patterns) => ["error", { patterns }];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    name: "architecture/default",
    files: ["src/**/*.{ts,tsx}", "tests/**/*.ts", "scripts/**/*.ts"],
    rules: { "no-restricted-imports": restrict(noDeepModuleImports) },
  },
  {
    name: "architecture/presentation",
    files: ["src/app/**/*.{ts,tsx}"],
    rules: { "no-restricted-imports": restrict(noDeepModuleImports, noDatabaseAccess) },
  },
  {
    name: "architecture/domain",
    files: ["src/modules/*/domain/**/*.ts", "src/shared/**/*.ts"],
    rules: {
      "no-restricted-imports": restrict(
        noDeepModuleImports,
        noDatabaseAccess,
        noFramework,
        noOuterLayers,
      ),
    },
  },
  {
    // Table definitions reference each other for foreign keys, and the
    // platform assembles them into one schema. Nothing else may do this.
    name: "architecture/schema-exception",
    files: ["src/modules/*/data/schema.ts", "src/platform/db/schema.ts"],
    rules: {
      "no-restricted-imports": restrict({
        group: [
          "@/modules/*/*",
          "!@/modules/*/data",
          "@/modules/*/data/*",
          "!@/modules/*/data/schema",
        ],
        message: "Schema files may import only other modules' data/schema files.",
      }),
    },
  },
  {
    // Tests and scripts wire real pieces together on purpose.
    name: "architecture/tooling-exception",
    files: ["tests/**/*.ts", "scripts/**/*.ts", "**/*.test.ts"],
    rules: { "no-restricted-imports": "off" },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "drizzle/**"]),
]);

export default eslintConfig;
