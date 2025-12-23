# WebLLM Integration Overview

This document summarizes how WebLLM fits into the overall model-provider architecture in the UIUC Chat frontend.

## Core WebLLM Capabilities

- `ChatUI` encapsulates the on-device inference loop. It handles sequentializing requests, managing model load state, and streaming responses from `@mlc-ai/web-llm`.
- Before running a completion, `ChatUI.runChatCompletion` calls the backend `/api/buildPrompt` endpoint so WebLLM and remote LLMs share the same prompt-engineering pipeline.
- `prebuiltAppConfig` in `ConfigWebLLM.ts` lists all supported on-device models (URLs, WASM libraries, VRAM requirements, context sizes). These entries are converted to `WebllmModel` records via `convertToLocalModels` and exported as `webLLMModels`.
- `getWebLLMModels` ensures that the project’s stored WebLLM configuration stays in sync with the canonical `webLLMModels` list, provides sensible defaults, and removes stale model entries.

## Shared Provider Abstractions

- All LLM providers, including WebLLM, implement the `LLMProvider` interface and are indexed by the `ProviderNames` enum.
- `/api/models` iterates through every provider name and, for WebLLM, returns the hydrated provider definition from `getWebLLMModels`. React Query’s `useGetProjectLLMProviders` hook therefore receives WebLLM and remote providers in the same payload.
- `LLM_PROVIDER_ORDER` defines how providers appear in UI menus; WebLLM sits alongside OpenAI, Anthropic, etc.
- Admin pages use `WebLLMProviderInput` and the shared `ModelToggles` component to enable WebLLM and toggle specific on-device models, just as with remote providers.

## Runtime Selection Flow

- In `Chat.tsx`, after shared pre-processing (query rewrite, retrieval, tool execution), the code checks whether the active model exists in `webLLMModels`.
  - If yes, the request goes through the local `chat_ui.runChatCompletion`.
  - Otherwise, the conversation is sent to the server endpoint `/api/allNewRoutingChat`, which routes to the appropriate remote provider.
- Because prompt building, retrieval, and tool invocation happen before this split, WebLLM and remote models benefit from the same business logic.

## Unified UI Experience

- `ModelSelect` flattens all enabled providers into a single dropdown. WebLLM entries display download size, download status, and recommended/warning badges based on `recommendedModelIds` and `warningLargeModelIds`.
- `UserSettings` queries WebLLM’s browser cache (`webllm.hasModelInCache`) to populate the shared `modelCached` array. `ModelSelect` uses this array to show “downloaded” indicators.
- The project admin UI stores WebLLM settings alongside other providers, so React Query invalidations and cache updates keep the UI consistent regardless of provider type.

## Server-Side Guardrails

- Request validation for server-side chat routes excludes WebLLM model IDs (`AllSupportedModels` minus `webLLMModels`). This prevents on-device-only identifiers from being sent to remote APIs.
- When fetching available models during streaming (`streamProcessing.ts`), WebLLM entries are filtered out of the remote-provider list to avoid mismatches.

## Key Takeaways

- WebLLM shares configuration, selection, and admin tooling with every other provider, so end users experience a unified model-management flow.
- The only divergence is where inference runs: WebLLM executes fully in the browser through `ChatUI`, while all other providers rely on backend routes.
- Shared pre-processing steps (prompt engineering, document retrieval, tool calls) ensure feature parity across on-device and remote models.
