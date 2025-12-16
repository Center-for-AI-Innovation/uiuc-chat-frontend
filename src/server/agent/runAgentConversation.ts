// src/server/agent/runAgentConversation.ts
// Server-side agent loop runner - orchestrates tool selection, execution, and response generation

import { v4 as uuidv4 } from 'uuid'
import {
  type Conversation,
  type Message,
  type UIUCTool,
  type ContextWithMetadata,
  type AgentEvent,
  type AgentEventStatus,
} from '~/types/chat'
import {
  type AgentStreamEvent,
  type ClientUIUCTool,
  type ContextMetadata,
  toClientUIUCTool,
} from '~/types/agentStream'
import {
  selectToolsServer,
  executeToolsServer,
  fetchContextsServer,
  fetchToolsServer,
  getOpenAIToolFromUIUCTool,
  generatePresignedUrlServer,
} from './agentServerUtils'
import { persistMessageServer } from '~/pages/api/conversation'
import { buildPrompt } from '~/app/utils/buildPromptUtils'
import { routeModelRequest, processChunkWithStateMachine, State } from '~/utils/streamProcessing'
import { type ChatBody } from '~/types/chat'
import { type CourseMetadata } from '~/types/courseMetadata'
import { type AllLLMProviders } from '~/utils/modelProviders/LLMProvider'

export interface RunAgentParams {
  conversation: Conversation
  courseName: string
  userMessage: Message
  documentGroups: string[]
  courseMetadata: CourseMetadata
  llmProviders: AllLLMProviders
  openaiKey: string
  userIdentifier: string
  // Callback to emit events to the client
  emit: (event: AgentStreamEvent) => void
  // Abort signal for cancellation
  signal?: AbortSignal
}

export interface RunAgentResult {
  success: boolean
  conversation: Conversation
  error?: string
}

const MAX_AGENT_STEPS = 20

/**
 * Run the full agent conversation loop on the server.
 * Emits typed events via the `emit` callback as processing progresses.
 */
export async function runAgentConversation(
  params: RunAgentParams
): Promise<RunAgentResult> {
  const {
    conversation,
    courseName,
    userMessage,
    documentGroups,
    courseMetadata,
    llmProviders,
    openaiKey,
    userIdentifier,
    emit,
    signal,
  } = params

  // Clone conversation to avoid mutation issues
  const workingConversation: Conversation = JSON.parse(JSON.stringify(conversation))
  
  // Ensure user message is in the conversation
  const existingMessageIndex = workingConversation.messages.findIndex(m => m.id === userMessage.id)
  if (existingMessageIndex === -1) {
    workingConversation.messages.push(userMessage)
  } else {
    workingConversation.messages[existingMessageIndex] = userMessage
  }

  const message = workingConversation.messages[workingConversation.messages.length - 1]!
  
  const initializingEvent: AgentEvent = {
    id: 'agent-initializing',
    stepNumber: 0,
    type: 'initializing',
    status: 'running',
    title: 'Initializing agent...',
    createdAt: new Date().toISOString(),
  }
  message.agentEvents = [initializingEvent]
  emit({
    type: 'agent_events_update',
    agentEvents: message.agentEvents,
    messageId: message.id,
  })

  // Track accumulated contexts and deduplication
  const seen = new Set<string>()
  const fileUploadContexts: ContextWithMetadata[] = message.contexts?.slice() || []
  const accumulatedContexts: ContextWithMetadata[] = []
  let totalContextsRetrieved = 0
  const toolsExecutedSummary: Array<{
    name: string
    readableName: string
    hasOutput: boolean
    hasError: boolean
  }> = []

  let availableTools: UIUCTool[] = []
  try {
    availableTools = await fetchToolsServer(courseName)
  } catch (error) {
    console.error('Error fetching tools:', error)
  }
  
  initializingEvent.status = 'done'
  initializingEvent.updatedAt = new Date().toISOString()
  emit({
    type: 'agent_events_update',
    agentEvents: message.agentEvents,
    messageId: message.id,
  })

  // Add synthetic retrieval tool for agent mode
  // Note: Description explicitly encourages multiple calls for deep research
  const toolsForAgent: UIUCTool[] = [
    {
      id: 'synthetic-retrieval-tool',
      name: 'search_documents',
      readableName: 'Search Documents',
      description:
        'Primary grounding tool for Agent Mode. Invoke this tool to search course documents. For deep research tasks, call this tool multiple times with different queries to explore different aspects, angles, or facets of the topic. Each call should use a distinct, focused query that targets a specific aspect of the research question. The tool returns ranked course passages with citation indices; rely on them when forming your answer and cite sources with <cite>n</cite> tags. Continue calling with varied queries until you have comprehensive coverage of the topic. Additional specialized tools may appear later, but treat them as complementary steps after retrieval.',
      inputParameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description:
              "Short natural-language query that captures the current need based on the intent of the user's message",
          },
        },
        required: ['query'],
      },
      courseName: courseName,
      enabled: true,
    } as UIUCTool,
    ...availableTools,
  ]

  const appendAgentEvent = (event: AgentEvent) => {
    if (!message.agentEvents) {
      message.agentEvents = []
    }
    message.agentEvents = [...message.agentEvents, event]
    
    // Emit agent events update
    emit({
      type: 'agent_events_update',
      agentEvents: message.agentEvents,
      messageId: message.id,
    })
  }

  const updateAgentEvent = (
    eventId: string,
    updates: Partial<AgentEvent>
  ) => {
    if (!message.agentEvents) return

    message.agentEvents = message.agentEvents.map((event) => {
      if (event.id !== eventId) return event

      const mergedMetadata =
        updates.metadata || event.metadata
          ? { ...event.metadata, ...updates.metadata }
          : event.metadata

      return {
        ...event,
        ...updates,
        ...(mergedMetadata ? { metadata: mergedMetadata } : {}),
        updatedAt: new Date().toISOString(),
      }
    })

    // Emit agent events update
    emit({
      type: 'agent_events_update',
      agentEvents: message.agentEvents,
      messageId: message.id,
    })
  }

  try {
    // Agent loop - up to MAX_AGENT_STEPS iterations
    for (let step = 0; step < MAX_AGENT_STEPS; step++) {
      // Check for cancellation
      if (signal?.aborted) {
        emit({ type: 'error', message: 'Agent run was cancelled', recoverable: false })
        return { success: false, conversation: workingConversation, error: 'Cancelled' }
      }

      const stepNumber = step + 1
      message.agentStepNumber = stepNumber

      // Step 1: Tool Selection
      const selectionEventId = `agent-step-${stepNumber}-selection`
      appendAgentEvent({
        id: selectionEventId,
        stepNumber,
        type: 'action_selection',
        status: 'running',
        title: `Step ${stepNumber}: Selecting next action`,
        createdAt: new Date().toISOString(),
      })

      emit({
        type: 'selection',
        stepNumber,
        status: 'running',
      })

      const { selectedTools, error: selectionError } = await selectToolsServer({
        conversation: workingConversation,
        availableTools: toolsForAgent,
        openaiKey,
        imageUrls: message.imageUrls,
        imageDescription: message.imageDescription,
      })

      if (selectionError) {
        updateAgentEvent(selectionEventId, {
          status: 'error',
          metadata: { errorMessage: selectionError },
        })
        emit({
          type: 'selection',
          stepNumber,
          status: 'error',
          info: selectionError,
        })
        emit({ type: 'error', message: selectionError, stepNumber, recoverable: true })
      }

      const selectedToolNames = selectedTools.map(t => t.readableName)
      
      updateAgentEvent(selectionEventId, {
        status: 'done',
        metadata:
          selectedTools.length === 0
            ? { selectedToolNames, info: 'Agent will now generate a response.' }
            : { selectedToolNames },
      })

      emit({
        type: 'selection',
        stepNumber,
        status: 'done',
        selectedTools: selectedTools.map(t => ({
          id: t.id,
          name: t.name,
          readableName: t.readableName,
          arguments: t.aiGeneratedArgumentValues,
        })),
        info: selectedTools.length === 0 ? 'Agent will now generate a response.' : undefined,
      })

      // No tools selected - proceed to final response
      if (selectedTools.length === 0) break

      // Dedupe based on tool name + args
      const signatures = selectedTools.map(
        (t) => `${t.name}:${JSON.stringify(t.aiGeneratedArgumentValues || {})}`
      )
      const allSeen = signatures.every((s) => seen.has(s))
      signatures.forEach((s) => seen.add(s))

      if (allSeen) {
        updateAgentEvent(selectionEventId, {
          metadata: {
            selectedToolNames,
            info: 'Skipping repeated tool request.',
          },
        })
        break
      }

      // Add selected tools to message
      message.tools = message.tools
        ? [...message.tools, ...selectedTools]
        : [...selectedTools]

      // Step 2: Execute tools
      const retrievalTools = selectedTools.filter(t => t.id === 'synthetic-retrieval-tool')
      const n8nTools = selectedTools.filter(t => t.id !== 'synthetic-retrieval-tool')

      // Execute retrieval tools IN PARALLEL (LLM already decided all queries for this step)
      // First, emit 'running' events for all retrievals
      for (const [idx, retrievalTool] of retrievalTools.entries()) {
        const searchQuery = retrievalTool.aiGeneratedArgumentValues?.query || ''
        const retrievalEventId = `agent-step-${stepNumber}-retrieval-${idx}`

        appendAgentEvent({
          id: retrievalEventId,
          stepNumber,
          type: 'retrieval',
          status: 'running',
          title: `Step ${stepNumber}: Searching documents`,
          createdAt: new Date().toISOString(),
          metadata: { contextQuery: searchQuery },
        })

        emit({
          type: 'retrieval',
          stepNumber,
          status: 'running',
          query: searchQuery,
        })
      }

      // Execute all retrievals in parallel
      const retrievalResults = await Promise.all(
        retrievalTools.map(async (retrievalTool, idx) => {
          const searchQuery = retrievalTool.aiGeneratedArgumentValues?.query || ''
          const retrievalEventId = `agent-step-${stepNumber}-retrieval-${idx}`

          try {
            const contexts = await fetchContextsServer({
              courseName,
              searchQuery,
              tokenLimit: workingConversation.model.tokenLimit || 4000,
              docGroups: documentGroups,
            })
            return { retrievalTool, idx, contexts, searchQuery, retrievalEventId, error: null }
          } catch (error) {
            return { retrievalTool, idx, contexts: [], searchQuery, retrievalEventId, error }
          }
        })
      )

      // Process results and emit completion events
      for (const result of retrievalResults) {
        const { retrievalTool, idx, contexts, searchQuery, retrievalEventId, error } = result

        if (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          updateAgentEvent(retrievalEventId, {
            status: 'error',
            metadata: { contextQuery: searchQuery, errorMessage },
          })
          emit({
            type: 'retrieval',
            stepNumber,
            status: 'error',
            query: searchQuery,
            errorMessage,
          })
          continue
        }

        const contextsFound = contexts.length
        totalContextsRetrieved += contextsFound
        accumulatedContexts.push(...contexts)

        // Update retrieval tool with output
        const toolIdx = message.tools?.findIndex(
          t => t.invocationId === retrievalTool.invocationId
        )
        if (toolIdx !== undefined && toolIdx >= 0 && message.tools) {
          message.tools[toolIdx]!.output = {
            text: `Retrieved ${contextsFound} document chunks for query: "${searchQuery}"`,
            data: { 
              contextsRetrieved: contextsFound,
              contexts: contexts.slice(0, 5).map(ctx => ({
                text: ctx.text?.substring(0, 200) + '...',
                filename: ctx.readable_filename,
              }))
            },
          }
        }

        updateAgentEvent(retrievalEventId, {
          status: 'done',
          metadata: {
            contextQuery: searchQuery,
            contextsRetrieved: contextsFound,
          },
        })

        emit({
          type: 'retrieval',
          stepNumber,
          status: 'done',
          query: searchQuery,
          contextsRetrieved: contextsFound,
        })
      }

      // After all retrievals complete, update message.contexts and emit metadata
      if (retrievalTools.length > 0) {
        // Update message.contexts with all accumulated contexts
        message.contexts = [...fileUploadContexts, ...accumulatedContexts]

        // Emit context metadata for citation processing on client
        const contextsMetadata: ContextMetadata[] = accumulatedContexts.map(ctx => ({
          s3_path: ctx.s3_path,
          readable_filename: ctx.readable_filename,
          url: ctx.url,
          base_url: ctx.base_url,
          pagenumber: ctx.pagenumber,
        }))
        
        emit({
          type: 'contexts_metadata',
          messageId: message.id,
          contextsMetadata,
          totalContexts: accumulatedContexts.length,
        })
      }

      // Execute N8N tools
      if (n8nTools.length > 0) {
        // Emit running events for each tool
        const toolEventIds: Record<string, string> = {}
        for (const [idx, tool] of n8nTools.entries()) {
          const eventId = `agent-step-${stepNumber}-tool-${tool.invocationId || `${tool.id}-${idx}`}`
          toolEventIds[tool.invocationId || `${tool.id}-${idx}`] = eventId

          appendAgentEvent({
            id: eventId,
            stepNumber,
            type: 'tool',
            status: 'running',
            title: `Step ${stepNumber}: ${tool.readableName}`,
            createdAt: new Date().toISOString(),
            metadata: {
              toolName: tool.name,
              readableToolName: tool.readableName,
              arguments: tool.aiGeneratedArgumentValues,
            },
          })

          emit({
            type: 'tool',
            stepNumber,
            status: 'running',
            toolName: tool.name,
            readableToolName: tool.readableName,
            invocationId: tool.invocationId,
            arguments: tool.aiGeneratedArgumentValues,
          })
        }

        // Execute tools in parallel
        const executedTools = await executeToolsServer(n8nTools, courseName)

        // Update message tools and emit completion events
        for (const [idx, executedTool] of executedTools.entries()) {
          const key = executedTool.invocationId || `${executedTool.id}-${idx}`
          const eventId = toolEventIds[key]

          // Find and update the tool in message.tools
          const toolIdx = message.tools?.findIndex(
            t => t.invocationId === executedTool.invocationId || t.id === executedTool.id
          )
          if (toolIdx !== undefined && toolIdx >= 0 && message.tools) {
            message.tools[toolIdx] = executedTool
          }

          const status: AgentEventStatus = executedTool.error ? 'error' : 'done'

          if (eventId) {
            updateAgentEvent(eventId, {
              status,
              metadata: {
                toolName: executedTool.name,
                readableToolName: executedTool.readableName,
                arguments: executedTool.aiGeneratedArgumentValues,
                outputText: executedTool.output?.text,
                outputData: executedTool.output?.data,
                outputImageUrls: executedTool.output?.imageUrls,
                errorMessage: executedTool.error,
              },
            })
          }

          emit({
            type: 'tool',
            stepNumber,
            status,
            toolName: executedTool.name,
            readableToolName: executedTool.readableName,
            invocationId: executedTool.invocationId,
            arguments: executedTool.aiGeneratedArgumentValues,
            outputText: executedTool.output?.text,
            outputData: executedTool.output?.data,
            outputImageUrls: executedTool.output?.imageUrls,
            errorMessage: executedTool.error,
          })

          // Track for summary
          toolsExecutedSummary.push({
            name: executedTool.name,
            readableName: executedTool.readableName,
            hasOutput: !!executedTool.output,
            hasError: !!executedTool.error,
          })
        }

        // Emit tools update for client state
        if (message.tools) {
          emit({
            type: 'tools_update',
            tools: message.tools.map(toClientUIUCTool),
            messageId: message.id,
          })
        }
      }

      // Persist message after each step
      try {
        await persistMessageServer({
          conversation: workingConversation,
          message,
          courseName,
          userIdentifier,
        })
      } catch (error) {
        console.error('Error persisting message after step:', error)
      }
    }

    // Combine all contexts for the final prompt
    message.contexts = [...fileUploadContexts, ...accumulatedContexts]

    // Persist before building prompt
    try {
      await persistMessageServer({
        conversation: workingConversation,
        message,
        courseName,
        userIdentifier,
      })
    } catch (error) {
      console.error('Error persisting message before prompt build:', error)
    }

    // Build the final prompt
    const chatBody: ChatBody = {
      conversation: workingConversation,
      key: openaiKey,
      course_name: courseName,
      stream: true,
      courseMetadata,
      llmProviders,
      model: workingConversation.model,
      mode: 'chat',
    }

    // Add final response event
    const finalEventId = 'agent-final-response'
    appendAgentEvent({
      id: finalEventId,
      stepNumber: message.agentStepNumber || 1,
      type: 'final_response',
      status: 'running',
      title: 'Generating response',
      createdAt: new Date().toISOString(),
    })

    // Build prompt (this populates finalPromtEngineeredMessage and latestSystemMessage)
    const conversationWithPrompt = await buildPrompt({
      conversation: workingConversation,
      projectName: courseName,
      courseMetadata,
      mode: 'chat',
    })

    if (conversationWithPrompt) {
      Object.assign(workingConversation, conversationWithPrompt)
    }

    // Persist the built prompt
    const lastMessage = workingConversation.messages[workingConversation.messages.length - 1]
    if (lastMessage) {
      try {
        await persistMessageServer({
          conversation: workingConversation,
          message: lastMessage,
          courseName,
          userIdentifier,
        })
      } catch (error) {
        console.error('Error persisting message after prompt build:', error)
      }
    }

    // Route to LLM and stream response
    const llmResponse = await routeModelRequest({
      ...chatBody,
      conversation: workingConversation,
    })

    if (llmResponse instanceof Response && llmResponse.body) {
      const reader = llmResponse.body.getReader()
      const decoder = new TextDecoder()
      let assistantContent = ''  // Processed content with citations replaced
      
      // Citation processing state - persists across chunks
      const citationStateMachine = { state: State.Normal, buffer: '' }
      const citationLinkCache = new Map<number, string>()
      
      // Debug: Log context count for citation processing
      console.log('[Agent] Starting final response streaming. Message contexts:', {
        hasContexts: !!message.contexts,
        contextCount: message.contexts?.length ?? 0,
        firstContextFilename: message.contexts?.[0]?.readable_filename,
      })

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const rawChunk = decoder.decode(value, { stream: true })
          
          // Process citations in the chunk using the user message (which has contexts)
          // Pass server-side presigned URL generator to bypass API auth
          const processedChunk = await processChunkWithStateMachine(
            rawChunk,
            message,  // User message with contexts
            citationStateMachine,
            citationLinkCache,
            courseName,
            generatePresignedUrlServer,  // Server-side presigned URL function
          )
          
          assistantContent += processedChunk

          emit({
            type: 'final_tokens',
            delta: processedChunk,  // Send processed chunk with citations replaced
            done: false,
          })
        }
      } finally {
        reader.releaseLock()
      }

      // Final tokens complete
      emit({
        type: 'final_tokens',
        delta: '',
        done: true,
      })

      // Update final response event
      updateAgentEvent(finalEventId, {
        status: 'done',
      })

      // Create assistant message
      const assistantMessageId = uuidv4()
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: assistantContent,
        created_at: new Date().toISOString(),
      }

      workingConversation.messages.push(assistantMessage)

      // Persist assistant message
      try {
        await persistMessageServer({
          conversation: workingConversation,
          message: assistantMessage,
          courseName,
          userIdentifier,
        })
      } catch (error) {
        console.error('Error persisting assistant message:', error)
      }

      // Emit done event
      emit({
        type: 'done',
        conversationId: workingConversation.id,
        finalMessageId: assistantMessageId,
        summary: {
          totalContextsRetrieved,
          toolsExecuted: toolsExecutedSummary,
        },
      })

      return { success: true, conversation: workingConversation }
    } else {
      // Non-streaming response or error
      const errorMessage = 'Failed to get streaming response from LLM'
      emit({ type: 'error', message: errorMessage, recoverable: false })
      updateAgentEvent(finalEventId, {
        status: 'error',
        metadata: { errorMessage },
      })
      return { success: false, conversation: workingConversation, error: errorMessage }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error in agent run'
    console.error('Error in runAgentConversation:', error)
    emit({ type: 'error', message: errorMessage, recoverable: false })
    return { success: false, conversation: workingConversation, error: errorMessage }
  }
}

