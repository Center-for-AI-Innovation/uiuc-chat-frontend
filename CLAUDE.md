# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Illinois Chat frontend — a Next.js education platform with AI-powered chat (RAG over uploaded documents). Built on the T3 Stack with Keycloak auth, multiple LLM providers, and Qdrant vector search.

## Commands

```bash
# Development
npm run local          # Local dev server (no Infisical secrets)
npm run dev            # Dev server with Infisical secrets manager

# Build
npm run build          # Production build (runs keycloak URL update script first)
npm run build:self-hosted  # Build without keycloak URL update

# Testing (Vitest)
npx vitest run                    # Run all tests once
npx vitest run src/path/to/file   # Run a single test file
npx vitest --watch                # Watch mode
npx vitest --ui                   # Browser UI for tests
npm run test:coverage             # Coverage report (v8)
npm run test:coverage:check       # Coverage with threshold check

# Linting & Formatting
npm run lint           # ESLint (next lint --max-warnings=10000)
npm run format         # Prettier check
npm run format:fix     # Prettier auto-fix

# Database (Drizzle ORM)
npm run db:push        # Push schema changes to DB
npm run db:generate    # Generate migrations
npm run db:studio      # Visual DB editor
npm run db:migrate     # Run migrations

# Bundle analysis
npm run analyze        # Build with bundle analyzer
```

## Architecture

### Hybrid Next.js Routing

Both routers coexist (gradual migration):

- **Pages Router** (`src/pages/`): Main UI pages — home (`index.tsx`), chat (`chat.tsx`), dynamic course routes (`[course_name]/`)
- **App Router** (`src/app/`): Newer API routes — LLM chat streaming endpoints, chat routing

### State Management — React Query (TanStack Query v5)

React Query is the primary state management layer. No Redux or Zustand.

**Hook patterns** in `src/hooks/queries/`:

- **Declarative fetching**: `useQuery` hooks — auto-fetch on mount/param change
- **Imperative actions**: `useMutation` hooks with `mutateAsync` — for event handlers
- **Non-component contexts**: Import raw fetch functions directly from hook files (exported alongside hooks)

**Query keys**: All centralized in `src/hooks/queries/keys.ts` via `queryKeys` and `mutationKeys` factories. Always use these factories — never inline key arrays. See `docs/QUERY_KEYS_GUIDE.md` for full conventions.

### Authentication — Keycloak OIDC

- Provider: `src/providers/KeycloakProvider.tsx` (wraps `react-oidc-context`)
- API route auth: `withAuth()` wrapper (pages router) and `withCourseAccessFromRequest()` wrapper (app router)
- Middleware (`src/middleware.ts`): Handles auth callbacks and route protection

### LLM Provider Abstraction

Multiple AI providers supported via Vercel AI SDK (`ai` package):

- Provider-specific routes in `src/app/api/chat/` (anthropic, openAI, bedrock, google, ollama, etc.)
- Dynamic routing in `src/app/api/allNewRoutingChat/route.ts`
- Stream processing utilities in `src/utils/streamProcessing.ts`
- Model provider configs in `src/utils/modelProviders/`

### Database Layer

- **ORM**: Drizzle ORM with PostgreSQL (`src/db/schema.ts`)
- **Caching**: Redis for course metadata
- **Vector DB**: Qdrant for RAG document retrieval (`src/utils/qdrantClient.ts`)

### UI Stack

Multiple component libraries coexist:

- **Mantine v6** (`@mantine/core`): Primary component library with Illinois brand theming
- **shadcn/ui** + **Radix UI**: Headless accessible components (`src/components/shadcn/`)
- **Tailwind CSS**: Utility styling with class-based dark mode and CSS variable color system
- **styled-components**: Used in some components

### Provider Hierarchy (`_app.tsx`)

PostHogProvider → KeycloakProvider → QueryClientProvider → MantineProvider → ThemeProvider → MaintenanceGate → Page

### Internationalization

22 languages via `next-i18next`. Locale files in `src/public/locales/`.

## Code Conventions

### TypeScript

- Strict mode enabled with `noUncheckedIndexedAccess`
- Path aliases: `~/` and `@/` both resolve to `./src/`
- Use `type` imports: `import { type Foo }` (enforced by ESLint)
- Unused vars prefixed with `_` are allowed

### Formatting

- No semicolons, single quotes, trailing commas (Prettier)
- `@ts-ignore` requires a description (min 3 chars); prefer `@ts-expect-error`

### Testing

- Framework: Vitest + React Testing Library + MSW for API mocking
- Setup: `vitest.setup.ts` mocks next/router, next/navigation, react-oidc-context, posthog-js, and browser APIs
- Test locations: colocated in `src/**/*.{test,spec}.{ts,tsx}` or `__tests__/` directories

### Node Version

v22.12.0 (see `.nvmrc`)
