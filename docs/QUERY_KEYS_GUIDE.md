# React Query Keys Guide

This project centralizes React Query keys in `src/hooks/queries/keys.ts`.

## Why this file exists

- Keep cache keys consistent across the app.
- Avoid subtle cache bugs from typoed or mismatched array shapes.
- Make invalidation and optimistic updates predictable.
- Improve type safety with `as const` tuple keys.

## What `keys.ts` exports

- `queryKeys`: factories for `useQuery` keys and `invalidateQueries` / `setQueryData` query keys.
- `mutationKeys`: factories for `useMutation` keys.

Both return readonly tuples so TypeScript can track exact key shapes.

## How to use it

### In queries

- Use `queryKeys.*(...)` in `queryKey`.
- Use the same factory for related cache operations (`cancelQueries`, `invalidateQueries`, `getQueryData`, `setQueryData`).

Example:

```ts
useQuery({
  queryKey: queryKeys.documents(courseName),
  queryFn: fetchDocuments,
})
```

### In mutations

- Use `mutationKeys.*(...)` in `mutationKey`.
- In `onMutate` / `onError` / `onSettled`, reference cache via `queryKeys.*(...)`.

Example:

```ts
useMutation({
  mutationKey: mutationKeys.deleteFolder(userEmail, courseName),
  mutationFn: deleteFolder,
  onSettled: () => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.folders(courseName),
    })
  },
})
```

## Rules for developers and agents

- Always import from `src/hooks/queries/keys.ts` instead of inlining arrays.
- Reuse existing key factories whenever possible.
- Preserve existing key shape/order if migrating old code (to avoid cache regressions).
- Only add a new key factory when a genuinely new cache domain is introduced.
- When optional args exist (e.g. `documents(courseName, page?)`, `tools(apiKey?)`), pass values exactly as current behavior expects.
- For tests, inline arrays are acceptable when asserting exact key payloads, but prefer factory usage for behavior tests.

## Adding a new key safely

1. Add a new function to `queryKeys` or `mutationKeys`.
2. Keep naming domain-first and specific (e.g. `projectDocumentCount`, not `count`).
3. Update all runtime call sites to use the new factory.
4. Verify invalidation still targets the right cache entries.
5. Run targeted hook/component tests that touch that domain.

## Common pitfalls

- Using a near-match key (`['documents', project]`) when code expects a paged/materials shape.
- Invalidating with a different argument order than the query used.
- Mixing old inline keys and new factory keys in the same flow.
- Changing a key tuple shape during refactor without a migration plan.

## Quick reference

- Query cache for folders: `queryKeys.folders(courseName)`
- Query cache for conversation history: `queryKeys.conversationHistory(courseName, searchTerm)`
- Query cache for docs: `queryKeys.documents(courseName, page?)`
- Mutation key for deleting messages: `mutationKeys.deleteMessages(userEmail, courseName)`
