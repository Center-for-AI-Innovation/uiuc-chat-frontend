# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

UIUC.chat Frontend — a Next.js 13 (Pages Router) AI chatbot platform for education. Built on the T3 Stack with Mantine UI, shadcn/ui, Tailwind CSS, and Drizzle ORM.

### Quick reference commands

| Task | Command |
|------|---------|
| Dev server (no secrets manager) | `npm run local` |
| Lint | `npm run lint` |
| Unit tests | `npx vitest run` |
| Test with coverage | `npm run test:coverage` |
| Format check | `npm run format` |
| Format fix | `npm run format:fix` |

### Development caveats

- **No T3 env validation active**: Despite `@t3-oss/env-nextjs` being a dependency, there is no active import of env validation. The comment in `next.config.mjs` about `SKIP_ENV_VALIDATION` is informational only.
- **DB client fallback**: `src/db/dbClient.ts` gracefully falls back to `postgres://postgres:postgres@localhost:5432/postgres` when env vars are missing, so the dev server starts without a running Postgres instance. Pages that hit the database will error at runtime, but the server itself compiles and serves static pages fine.
- **Keycloak auth**: Authentication flows require a running Keycloak instance. Without it, auth-related pages/features will fail, but public pages (landing page, etc.) work normally.
- **External services** (Redis, Qdrant, S3/MinIO, Flask backend): Required for full functionality (chat, RAG, file upload) but not for starting the dev server or running unit tests.
- **Pre-commit hook**: `.husky/pre-commit` runs `trunk fmt`. The `@trunkio/launcher` is a devDependency. If `trunk` isn't configured, the hook may fail — this is safe to skip in CI/cloud environments.
- **Package manager**: Uses `npm` (lockfile: `package-lock.json`).
- **Node version**: Tested working with Node.js v22. The Dockerfile uses Node 18 for production builds, but v22 works fine for development.
- **Port**: Dev server runs on port 3000 by default.
