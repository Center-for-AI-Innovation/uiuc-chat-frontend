### Agent Mode - Implementation Summary (This PR)

Scope:
- Added Agent Mode as a separate pipeline, UI, and prompt behavior without altering default chat behavior.

Key Changes:
- State
  - Added `agentMode: boolean` to `HomeInitialState` in `src/pages/api/home/home.state.tsx`.

- UI
  - `src/components/Chat/ChatInput.tsx`: Added an Agent pill to toggle `agentMode`.
  - `src/components/Chat/ChatMessage.tsx`: Agent-only UI with global "Thinking…" shimmer, hides default "Retrieved documents" accordion, shows interleaved per-batch tool inputs/outputs; default chat unchanged and retains original accordions.
  - `src/components/UIUC-Components/IntermediateStateAccordion.tsx`: Normalized width (`w-full max-w-full`) so accordions render uniformly.

- Chat Orchestration
  - `src/components/Chat/Chat.tsx`:
    - Agent pipeline runs only when `agentMode` is true; default retrieval/tool execution are skipped in Agent Mode.
    - Default mode remains intact; retrieval and tools run only when `!agentMode`.
    - Final request body trimming is applied only for Agent Mode to prevent payload bloat; default mode sends the full conversation (unchanged).
    - Sends `agentMode` flag to `/api/allNewRoutingChat`.

- Prompt Builder
  - `src/app/utils/buildPromptUtils.ts`:
    - Appends `<AgentMode>` system instructions only when `agentMode` is true.
    - Skips injecting heavy contexts and tool outputs into the prompt when `agentMode` is true (reduces token/payload usage for agent runs).
    - Exported `getDefaultPostPrompt` for legacy usage.

- Function Calling / Tools
  - `src/utils/functionCalling/handleFunctionCalling.ts`:
    - Trims conversation only for agent planning calls (last 8 messages, text-only, strips contexts/tools/system fields).
    - Persists tool input batches to server memory.

- Unified Routing & Compatibility
  - `src/app/api/allNewRoutingChat/route.ts`: Accepts `agentMode` and passes to `buildPrompt`.
  - `src/app/api/agent/chat/route.ts`: Compatibility shim that forwards to `allNewRoutingChat`.

- In-memory Agent Store
  - `src/pages/api/agent-memory.ts`: New API to upsert/fetch/delete per-conversation agent batches (inputs/outputs) for UI persistence and to avoid large request payloads.

Streaming & SSE
- Client parser tolerant to provider streams; intermediate tool inputs/outputs render in Agent Mode accordions without flicker.

Payload Size Fixes
- Agent planning and final LLM calls: trimmed bodies in Agent Mode only. Default mode remains untrimmed to preserve behavior.

Bugs Fixed
- Agent vs default routing crossover (now fully gated by `agentMode`).
- Request Entity Too Large in agent runs by trimming bodies and skipping heavy prompt sections.
- Intermediate accordions flicker/overwrite: persisted via in-memory batches; inputs remain visible while routing.
- Width inconsistencies in accordions.

Build
- `npm run build:self-hosted` passes.

Notes on Flags
- `mode`: existing field used by legacy flows; left as-is for compatibility (set to 'chat').
- `agentMode`: explicit boolean to enable Agent Mode pipeline and prompt adjustments. Both retained.

