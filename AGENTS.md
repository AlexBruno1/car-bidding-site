<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project rules

- Read `docs/architecture.md` before changing structure. `pnpm lint` enforces the dependency rules.
- Import a module only through `@/modules/<name>` or `@/modules/<name>/server`.
- Code in `domain/` and `src/shared` is plain TypeScript: no framework, no database, no I/O.
- Money is integer cents plus a currency. Never floats.
- No user-visible text in components: add it to every file in `src/platform/i18n/dictionaries/`.
- Every server action validates input with Zod and calls `requirePermission` before acting.
- Never edit a published migration. Change the schema, then run `pnpm db:generate`.
- Run `pnpm check` before committing.
