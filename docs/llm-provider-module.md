# LLM Provider Module Overview

This note catalogs the shared provider layer that lets UIUC Chat work with many different large-language-model backends (OpenAI, Anthropic, WebLLM, etc.) through a single abstraction.

## Core Files

- `src/utils/modelProviders/LLMProvider.ts`: central type definitions, enums, helper sets, and model-selection logic.
- `src/pages/api/models.ts`: backend entry point that hydrates provider metadata per project.
- `src/hooks/useProjectAPIKeys.ts`: React Query hooks (`useGetProjectLLMProviders`, `useSetProjectLLMProviders`) that fetch and mutate provider settings.
- `src/components/Chat/ModelSelect.tsx` & `src/components/Chat/UserSettings.tsx`: front-end consumers that surface provider/model options to end users.
- `src/components/UIUC-Components/api-inputs/providers/*`: admin UI forms for enabling/disabling each provider.
- `src/utils/streamProcessing.ts`: server-side safeguards that validate requested models and filter out unsupported providers.

## Provider Registry (`LLMProvider.ts`)

- `ProviderNames` enumerates every supported backend: `OpenAI`, `Anthropic`, `Azure`, `Ollama`, `WebLLM`, `NCSAHosted`, `NCSAHostedVLM`, `Bedrock`, `Gemini`, `SambaNova`.
- `LLM_PROVIDER_ORDER` defines UI display priority (used in model dropdowns).
- A union type `LLMProvider` plus sub-interfaces (`OpenAIProvider`, `WebLLMProvider`, etc.) ensures each provider shares the common fields (`enabled`, `baseUrl`, `apiKey`, …) while allowing provider-specific properties.
- `AnySupportedModel` union wraps all model record types so components can operate on a single `model.id`/`model.enabled` shape.
- Helper sets:
  - `VisionCapableModels`: IDs that support multi-modal input (vision tooling warns if a non-vision model is selected).
  - `ReasoningCapableModels`: IDs with special <think> support.
  - `AllSupportedModels`: aggregated set of every remote model the backend can accept (WebLLM excluded, as its inference is browser-side).
- `preferredModelIds` enumerates fallback order when no explicit default is available.
- `selectBestModel(allLLMProviders)` chooses a default model respecting:
  1. User-defined localStorage override.
  2. Admin-marked default models.
  3. Preferred model priority list.
  4. Hard fallback to `QWEN2_5VL_72B_INSTRUCT`.

## Configuration Fetching & Mutation

- `/api/models` loops over `ProviderNames` and calls provider-specific helpers (e.g. `getOpenAIModels`, `getWebLLMModels`) to return a fully hydrated `AllLLMProviders` object.
- `useGetProjectLLMProviders` wraps that endpoint in React Query, giving components access to live provider settings with caching, retry, and `queryKey` scoping.
- `useSetProjectLLMProviders` debounces updates, applies optimistic cache patches, and invalidates the `['projectLLMProviders', projectName]` query when mutations settle.
- Admin screens edit `form.state.values.providers` and reuse `ModelToggles` to switch individual models on or off across providers.

## Runtime Usage

- Chat client:
  - `ModelSelect` merges `llmProviders` from React Query, filters to enabled models, and uses provider metadata (logo, download size, recommended/warning flags) for UX.
  - `Chat.tsx` inspects the selected model’s `provider` to decide execution path:
    - Server-backed providers go through `/api/allNewRoutingChat`.
    - `ProviderNames.WebLLM` uses the local `chat_ui.runChatCompletion`.
- Streaming & validation:
  - `streamProcessing.ts` fetches `AllLLMProviders` to verify that the requested `model.id` is enabled and to build error messages listing allowed IDs.
  - Validation routines remove WebLLM models from server-side allowed lists, preventing on-device-only IDs from leaking into backend routes.

## Extending the Module

When adding a new provider:

1. Create a type definition (mirroring other `types/*` files) and extend `LLMProvider`/`AnySupportedModel`.
2. Append the provider to `ProviderNames`, `LLM_PROVIDER_ORDER`, and any capability sets that apply (vision, reasoning).
3. Implement a `getXYZModels` helper and add a case in `/api/models`.
4. Update admin UI (provider input + translations) so project owners can enable/disable it.
5. Ensure backend validation and streaming utilities understand the new model IDs.

Following this pattern keeps all providers consistent, so front-end features (model picker, user defaults, tool restrictions) work without bespoke code per backend.
