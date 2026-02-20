# Refactor + Upgrade Matrix (PR-by-PR)

## Progress Tracker

Last updated: 2026-02-20

| Item            | Status    | Notes                                                                                                                                                                                       |
| --------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1              | Completed | Unified course/user conversation history download logic behind `src/hooks/__internal__/downloadConversationHistory.ts`, kept backward-compatible call signature, kept hook wrappers stable. |
| A2-part-1       | Completed | Updated `src/hooks/__internal__/folders.ts` to throw on failed responses instead of swallowing errors.                                                                                      |
| A2-part-1 tests | Completed | Updated `src/utils/app/__tests__/folders.test.ts` to assert rejection behavior.                                                                                                             |
| A2-part-2       | Completed | Updated `src/hooks/__internal__/conversation.ts` to throw on non-OK/failed fetch for conversation loaders while preserving valid empty-data semantics.                                      |
| A2-part-2 tests | Completed | Updated `src/utils/app/__tests__/conversation.test.ts` to assert rejection behavior for non-OK response paths.                                                                              |
| A3              | Completed | Added `src/hooks/queries/keys.ts` and migrated query/mutation keys across hooks to shared factories while preserving existing key shapes and cache behavior.                                |
| A4              | Pending   | Query-layer `any`/`unknown` cleanup not started yet.                                                                                                                                        |

## Track A - React Query Contract Stabilization (Do First)

| PR  | Goal                                                   | Primary files                                                                                                                                                                                                                                                               | Key checks                                                                              | Rollback                                                                |
| --- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| A1  | Unify conversation history download hook               | `src/hooks/queries/useDownloadConvoHistory.ts`, `src/hooks/queries/useDownloadConversationHistory.ts`, `src/hooks/__internal__/downloadConversationHistory.ts`, consumers: `src/components/Chatbar/Chatbar.tsx`, `src/components/UIUC-Components/MakeQueryAnalysisPage.tsx` | Both UI entry points still download correctly; JSON + ZIP + large-file S3 flow works    | Keep old hook exported as alias behind deprecated wrapper               |
| A2  | Standardize error contract for hooks/internal fetchers | `src/hooks/__internal__/folders.ts`, `src/hooks/__internal__/conversation.ts`, `src/hooks/__internal__/message.ts`                                                                                                                                                          | Failures surface as typed errors (not empty data); existing optimistic tests still pass | Revert only internal helper changes; keep public hook signatures stable |
| A3  | Add query-key factory and normalize keys               | new `src/hooks/queries/keys.ts`; touch high-traffic hooks (`useFetchConversationHistory`, `useFetchFolders`, `useFetchDocumentGroups`, etc.)                                                                                                                                | Cache invalidation still works (folder/conversation tests + manual smoke)               | Re-export legacy key builders for one release                           |
| A4  | Remove `any`/`unknown` in query layer                  | `src/hooks/queries/useFetchAllCourseData.ts`, `src/hooks/queries/useUpdateProjectLLMProviders.ts`, related types in `src/types/*`                                                                                                                                           | Typecheck clean, no `any` regressions in hooks                                          | Keep old response type aliases temporarily                              |

## Track B - Framework/Tooling Upgrade (Isolate in Dedicated Branch)

| PR  | Goal                                              | Primary files                                                                                                 | Key checks                                                            | Rollback                                     |
| --- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | -------------------------------------------- |
| B1  | Upgrade Next + React baseline                     | `package.json`, `next.config.mjs`, app/pages entry files                                                      | `npm run build`, route smoke tests (`chat`, course pages, API routes) | Pin previous Next/React versions in lockfile |
| B2  | React 19 compatibility pass (no behavior changes) | Components with strict type breaks, starting with `src/components/Chat/*`, `src/components/UIUC-Components/*` | Typecheck + runtime chat flow                                         | Keep codemod commit separate for easy revert |
| B3  | ESLint + TypeScript ESLint modernization          | ESLint config (`.eslintrc.cjs` or flat config migration), `tsconfig.json`                                     | Lint passes; no flood of new suppressions                             | Keep previous lint config in fallback branch |
| B4  | Tailwind 4 + Prettier alignment                   | Tailwind config/CSS entrypoints, formatting config                                                            | Visual smoke on key pages + class compile success                     | Restore Tailwind 3 config and lock versions  |

## Track C - Data/Runtime Dependency Upgrades

| PR  | Goal                                                         | Primary files                                                                                                                 | Key checks                                         | Rollback                                             |
| --- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ---------------------------------------------------- |
| C1  | Decide ORM ownership (Prisma vs Drizzle) + document decision | `package.json`, `src/db/*`, architecture decision doc                                                                         | CI green + no duplicate runtime paths              | Keep both, but mark one as deprecated for next cycle |
| C2  | Drizzle/postgres upgrade                                     | `src/db/dbClient.ts`, `src/db/dbHelpers.ts`, API files using DB                                                               | CRUD smoke: conversation/folder/messages/materials | Pin previous `drizzle-orm`/`postgres` versions       |
| C3  | AWS S3 SDK package upgrade                                   | upload/download hooks + API routes (`useUploadToS3.ts`, `downloadPresignedUrl`, `src/pages/api/UIUC-api/uploadToS3.ts`, etc.) | Upload + presigned URL + download preview          | Restore previous AWS SDK versions                    |

## Track D - Auth/Provider Dependency Upgrades

| PR  | Goal                                               | Primary files                                                                                         | Key checks                                          | Rollback                                 |
| --- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------- | ---------------------------------------- |
| D1  | `keycloak-js` + `react-oidc-context` compatibility | `src/providers/KeycloakProvider.tsx`, `src/providers/AuthCookie.tsx`, auth-consuming pages/components | Login/logout, token refresh, protected route access | Lock old auth deps and keep adapter shim |
| D2  | `react-hook-form` + `react-dropzone` upgrades      | `src/components/UIUC-Components/api-inputs/*`, upload forms/cards                                     | Form validation + file upload UX                    | Pin individual package versions back     |

## Track E - shadcn Primitives Migration (Radix -> Base UI)

| PR  | Goal                                             | Primary files                                                                   | Key checks                                               | Rollback                                              |
| --- | ------------------------------------------------ | ------------------------------------------------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------- |
| E1  | Bootstrap Base UI config + regenerate primitives | `components.json` (or equivalent), regenerated `src/components/shadcn/ui/*` set | Build passes; no import-resolution breaks                | Keep Radix primitives in parallel namespace           |
| E2  | Migrate overlay primitives first                 | `dialog.tsx`, `sheet.tsx`, `popover.tsx`, `tooltip.tsx`, dependents             | Modal/sheet/popover interaction tests                    | Toggle imports back to Radix wrappers                 |
| E3  | Migrate form/select/navigation primitives        | `select.tsx`, `dropdown-menu.tsx`, `radio-group.tsx`, `tabs.tsx`, `form.tsx`    | Keyboard/accessibility behavior parity                   | Repoint problematic primitives one-by-one             |
| E4  | Remove Radix packages and wrappers               | `package.json`, all `@radix-ui/*` imports under `src/components/*`              | `rg "@radix-ui/" src` returns no matches; full app smoke | Reintroduce only necessary Radix packages selectively |

## Cross-Cutting Test Matrix Per PR

Run this minimal gate on every PR:

- `npm run lint`
- `npm run test -- src/hooks/__tests__/conversationQueries.test.tsx src/hooks/__tests__/folderQueries.test.tsx`
- `npm run build`
- Manual smoke:
  - chat send/stream
  - conversation history load/delete
  - folder create/update/delete
  - file upload + download/presigned URL
  - auth-protected course page access

## Recommended Execution Order

`A1 -> A2 -> A3 -> A4 -> B1 -> B2 -> B3 -> B4 -> C1 -> C2 -> C3 -> D1 -> D2 -> E1 -> E2 -> E3 -> E4`

## Resume Checklist (Next Session)

1. Start with A2-part-2: update `src/hooks/__internal__/conversation.ts` to throw on failed fetch/response paths (avoid silent fallback returns for true API errors).
2. Update affected tests first:
   - `src/hooks/__tests__/conversationQueries.test.tsx`
   - any direct helper tests that assert previous fallback behavior.
3. Run targeted tests:
   - `npm run test -- src/hooks/__tests__/conversationQueries.test.tsx`
   - `npm run test -- src/components/Chatbar/__tests__/Chatbar.test.tsx`
4. Re-run baseline Track A checks:
   - `npm run test -- src/hooks/__tests__/folderQueries.test.tsx src/utils/app/__tests__/folders.test.ts`
5. After green tests, continue to A3 (query key factory in `src/hooks/queries/keys.ts`).
