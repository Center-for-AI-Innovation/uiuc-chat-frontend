## Agent Mode: Design and Implementation Plan

### Objective
- Add an Agent Mode that makes the chat flow agentic: the model can decide to call tools (image description, retrieval, n8n workflows) in multiple steps, then produce a final response. Reuse the existing AI SDK integration (ai) and current tool/retrieval logic where possible.

### Current pipeline (hard-coded) and where it lives
- UI entry point: `src/components/Chat/Chat.tsx`
  - Image → text: calls `handleImageContent(...)` which uses `fetchImageDescription` and `src/pages/api/imageDescription.ts`.
  - Retrieval: calls `handleContextSearch(...)` from `src/utils/streamProcessing.ts`, which ultimately uses `src/pages/api/getContexts.ts`.
  - Tool routing: calls `handleFunctionCall(...)` then `handleToolCall(...)` from `src/utils/functionCalling/handleFunctionCalling.ts`. Tool selection uses `src/app/api/chat/openaiFunctionCall/route.ts` (OpenAI function calling) and tool execution uses n8n via `callN8nFunction`.
  - Final response: builds `ChatBody` and streams via provider routes using AI SDK `streamText`/`generateText`.

### Requirements
- When Agent Mode is ON, replace the fixed sequence with an agentic loop using AI SDK tools:
  - Tools available to the model:
    - Image description tool (VLM-based, reusing existing endpoint/logic)
    - Retrieval tool (vector search via existing getContexts)
    - Dynamic n8n tools (one tool per enabled workflow)
  - The model can call any tool multiple times, then return the final answer.
  - Stream the final text as today; optionally emit lightweight tool-progress events.
  - Backwards compatible: existing sequential mode remains unchanged when Agent Mode is OFF.

### High-level design
- Server endpoint for Agent Mode
  - Create `src/app/api/agent/chat/route.ts` (Node runtime, streaming).
  - Input: `ChatBody` + extras (enabled document groups, enabled workflows for the course). Output: streamed final text, plus optional tool-progress events.
  - Build AI SDK tools and run an agent loop:
    - Use AI SDK `streamText`/`generateText` with a `tools` map.
    - On tool calls: execute the tool function, append a tool result message, continue until the model stops calling tools and returns final text.
    - Return `result.toTextStreamResponse()` for the final answer (plain text stream). If needed, multiplex minimal JSON tool events.

- Tool definitions (executors on server)
  - Image Description tool
    - Inputs: `{ imageUrls: string[], userQuery?: string }`
    - Implementation: reuse `src/pages/api/imageDescription.ts` by internally formatting a request (or calling the function logic directly) to produce a concise description; return a string.
  - Retrieval tool
    - Inputs: `{ query: string, documentGroups?: string[] }`
    - Implementation: reuse `handleContextSearch` + `attachContextsToLastMessage` from `src/utils/streamProcessing.ts` to fetch and attach contexts; return `{ contexts: ContextWithMetadata[] }` so the model can cite.
  - n8n tools (dynamic)
    - For each enabled `UIUCTool` (workflow), create a tool:
      - Parameters: zod schema derived from `UIUCTool.inputParameters` (start with string/number/boolean; extend as needed).
      - Executor: reuse `callN8nFunction(...)` from `src/utils/functionCalling/handleFunctionCalling.ts`; return `{ text?: string, data?: any, imageUrls?: string[] }`.

- Agent instructions
  - Provide system instructions that explain:
    - When to call the image description tool (only if images are present or needed).
    - When to perform retrieval (for course documents, to ground answers and provide citations).
    - When to call n8n tools (task automation/workflows).
    - Always finish with a final grounded answer; cite sources when retrieval used.
  - Enforce a max tool-call step limit to avoid loops.

- Streaming and intermediate updates
  - Final assistant text: stream via `toTextStreamResponse()` to match current frontend.
  - Optional tool events: while executing tools, emit small tagged lines (e.g., `event: tool\n data: {...}`) to drive UI progress indicators (`isRetrievalLoading`, `isRunningTool`, etc.). Keep minimal to avoid breaking clients.

### Frontend changes
- Add Agent Mode toggle
  - Add `agentMode: boolean` in `HomeContext` state.
  - Expose a toggle in the Chat UI (either in `src/components/Chat/ChatInput.tsx` controls or settings) to switch modes.

- Branch in `Chat.tsx` send path
  - In `handleSend`, if `agentMode` is ON:
    - Call `/api/agent/chat` with `ChatBody` + enabled document groups + enabled tools for the course.
    - Bypass the current sequential steps (image→text, retrieval, function calling) entirely.
  - If `agentMode` is OFF: keep the current sequential pipeline unchanged.

- Rendering tool outputs
  - `src/components/Chat/ChatMessage.tsx` already renders `message.tools` and shows intermediate info with `IntermediateStateAccordion`.
  - Ensure tool outputs returned by the agent loop update the last assistant/user message’s `tools` array as today, so UI can display without special-casing.

### Reuse/refactor points
- Reuse existing logic:
  - Image description: `src/pages/api/imageDescription.ts` and `fetchImageDescription` from `src/pages/api/UIUC-api/fetchImageDescription.ts`.
  - Retrieval: `handleContextSearch`, `attachContextsToLastMessage` from `src/utils/streamProcessing.ts` and `src/pages/api/getContexts.ts`.
  - n8n execution: `callN8nFunction` from `src/utils/functionCalling/handleFunctionCalling.ts` (and `runN8nFlowBackend`).
- Optional: introduce `src/utils/agent/tools.ts` to house tool builders:
  - `buildImageDescriptionTool(...)`
  - `buildRetrievalTool(...)`
  - `buildN8nToolsFromWorkflows(...)`

### Error handling, security, observability
- Validate tool inputs with zod schemas.
- Only expose tools enabled for the current course.
- Add step limit for agent loop to prevent infinite cycles.
- Propagate tool errors as readable messages (and PostHog events) while allowing the model to continue or fall back.
- Timeouts on external calls (n8n, retrieval) with helpful guidance in messages.

### File-by-file change list
- New files
  - `src/app/api/agent/chat/route.ts`: Agent endpoint implementing the tool loop, streaming final text, emitting optional tool events.
  - `src/utils/agent/tools.ts`: Utility to build AI SDK tools (image description, retrieval, dynamic n8n tools).

- Updated files
  - `src/components/Chat/Chat.tsx`: Add Agent Mode branch in `handleSend` that calls `/api/agent/chat` and bypasses sequential steps when enabled.
  - `src/components/Chat/ChatInput.tsx`: Add Agent Mode toggle control.
  - `src/pages/api/models.ts` (if needed server-side) or client passes providers/tools as today; ensure agent route has what it needs.
  - `src/components/Chat/ChatMessage.tsx`: Confirm existing `message.tools` rendering works with agent-populated tool outputs (no breaking changes expected).
  - `src/pages/api/getContexts.ts`, `src/pages/api/imageDescription.ts`, `src/utils/functionCalling/handleFunctionCalling.ts`, `src/utils/streamProcessing.ts`: reused without breaking changes; minor exports if needed for server-side use.

### Rollout plan
1) Server: implement `/api/agent/chat` with image description + retrieval tools; stream final answer.
2) Frontend: add Agent Mode toggle, wire `Chat.tsx` to call the new route.
3) Add dynamic n8n tools (schema from `UIUCTool.inputParameters`), show outputs in UI.
4) Add tool-progress events and map to UI flags for a polished experience.
5) Guardrails: step limit, input validation, timeouts; add PostHog instrumentation mirroring current tool events.

### Risks and mitigations
- Schema coverage for dynamic tools: start with primitives; extend to arrays/objects as needed.
- Streaming compatibility: keep final stream plain text; keep tool events minimal and well-delimited.
- Performance: tool calls can add latency; run independent tools in parallel when safe (as done today in `handleToolCall`).
- Provider compatibility: continue using AI SDK `streamText`/`generateText` with existing provider setup.

### Docs references (AI SDK)
- Tools and structured tool calling with AI SDK: use `tools` in `streamText`/`generateText` and define tools with zod schemas and async executors.
- Structured outputs and streaming: use AI SDK `toTextStreamResponse()`/`toDataStreamResponse()` patterns as in existing routes.

