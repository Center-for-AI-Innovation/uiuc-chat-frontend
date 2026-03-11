import { useQuery } from '@tanstack/react-query'
import { type ChatCompletionMessageToolCall } from 'openai/resources/chat/completions'
import posthog from 'posthog-js'
import type { ToolOutput } from '~/types/chat'
import { type Conversation, type Message, type UIUCTool } from '~/types/chat'
import { type ToolParameter, type OpenAICompatibleTool } from '~/types/tools'
import { type SimWorkflow } from '~/types/sim'
import {
  type AllLLMProviders,
  type AnySupportedModel,
  ProviderNames,
} from '~/utils/modelProviders/LLMProvider'

// ---------------------------------------------------------------------------
// handleFunctionCall — sends conversation + tools to OpenAI, gets tool_calls
// ---------------------------------------------------------------------------

export async function handleFunctionCall(
  message: Message,
  availableTools: UIUCTool[],
  imageUrls: string[],
  imageDescription: string,
  selectedConversation: Conversation,
  openaiKey: string,
  course_name: string,
  base_url?: string,
  llmProviders?: AllLLMProviders,
): Promise<UIUCTool[]> {
  try {
    const openAITools = getOpenAIToolFromUIUCTool(availableTools)

    const isOpenAICompatible =
      llmProviders?.OpenAICompatible?.enabled &&
      (llmProviders.OpenAICompatible.models || []).some(
        (m: AnySupportedModel) =>
          m.enabled &&
          m.id.toLowerCase() === selectedConversation.model.id.toLowerCase(),
      )

    const baseEndpoint = base_url
      ? `${base_url}/api/chat/openaiFunctionCall`
      : '/api/chat/openaiFunctionCall'
    const url = course_name
      ? `${baseEndpoint}?course_name=${encodeURIComponent(course_name)}`
      : baseEndpoint

    const body: any = {
      conversation: selectedConversation,
      tools: openAITools,
      imageUrls: imageUrls,
      imageDescription: imageDescription,
      course_name: course_name,
    }

    if (isOpenAICompatible) {
      body.providerBaseUrl = llmProviders!.OpenAICompatible.baseUrl
      body.apiKey = llmProviders!.OpenAICompatible.apiKey
      let modelIdToSend = selectedConversation.model.id
      const providerBaseUrl = llmProviders!.OpenAICompatible.baseUrl
      if (providerBaseUrl) {
        try {
          const parsedUrl = new URL(providerBaseUrl)
          const hostname = parsedUrl.hostname.toLowerCase()
          const isOpenRouter =
            hostname === 'openrouter.ai' || hostname.endsWith('.openrouter.ai')
          if (isOpenRouter) {
            modelIdToSend = selectedConversation.model.id.toLowerCase()
          }
        } catch {
          /* invalid URL, use original modelId */
        }
      }
      body.modelId = modelIdToSend
    } else {
      body.openaiKey = openaiKey
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      console.error('Error calling openaiFunctionCall: ', response)
      return []
    }
    const openaiFunctionCallResponse = await response.json()
    const modelMessage =
      openaiFunctionCallResponse.choices?.[0]?.message?.content
    const openaiResponse: ChatCompletionMessageToolCall[] =
      openaiFunctionCallResponse.choices?.[0]?.message?.tool_calls || []

    if (openaiResponse.length === 0) {
      if (modelMessage && selectedConversation.messages.length > 0) {
        const lastMsg =
          selectedConversation.messages[
            selectedConversation.messages.length - 1
          ]
        if (lastMsg && lastMsg.role === 'user') {
          ;(lastMsg as any)._toolRoutingResponse = modelMessage
        }
      }
      return []
    }
    console.log('OpenAI tools to run: ', openaiResponse)

    const healToolArguments = (args: string): any => {
      try {
        return JSON.parse(args)
      } catch (parseError) {
        const trimmed = args.trim()
        if (!trimmed.startsWith('{') && trimmed.endsWith('}')) {
          try {
            return JSON.parse('{' + trimmed)
          } catch {
            throw new Error(
              `Failed to parse tool arguments: ${parseError instanceof Error ? parseError.message : String(parseError)}. Original arguments: ${args.substring(0, 200)}`,
            )
          }
        }
        throw new Error(
          `Failed to parse tool arguments: ${parseError instanceof Error ? parseError.message : String(parseError)}. Arguments: ${args.substring(0, 200)}`,
        )
      }
    }

    const uiucToolsToRun: UIUCTool[] = openaiResponse.map((openaiTool) => {
      const baseTool = availableTools.find(
        (availableTool) => availableTool.name === openaiTool.function.name,
      )

      const parsedArguments = healToolArguments(openaiTool.function.arguments)

      if (!baseTool) {
        console.error(
          `Tool ${openaiTool.function.name} not found in available tools.`,
        )
        return {
          id: 'error',
          invocationId: openaiTool.id,
          name: openaiTool.function.name,
          readableName: `Error: ${openaiTool.function.name} not found`,
          description: 'Tool definition not found',
          aiGeneratedArgumentValues: parsedArguments,
          error: 'Tool definition not found in available tools list.',
        } as UIUCTool
      }

      return {
        ...baseTool,
        invocationId: openaiTool.id,
        aiGeneratedArgumentValues: parsedArguments,
      }
    })

    const validUiucToolsToRun = uiucToolsToRun.filter(
      (tool) => tool.id !== 'error',
    )

    message.tools = [...validUiucToolsToRun]
    selectedConversation.messages[selectedConversation.messages.length - 1] =
      message
    console.log(
      'UIUC tools to run (with invocation IDs): ',
      validUiucToolsToRun,
    )

    return validUiucToolsToRun
  } catch (error) {
    console.error(
      'Error calling openaiFunctionCall from handleFunctionCall: ',
      error,
    )
    return []
  }
}

// ---------------------------------------------------------------------------
// handleToolCall — executes tools in parallel, stores outputs in message
// ---------------------------------------------------------------------------

export async function handleToolCall(
  uiucToolsToRun: UIUCTool[],
  selectedConversation: Conversation,
  projectName: string,
  base_url?: string,
) {
  try {
    if (uiucToolsToRun.length > 0) {
      console.log('Running tools in parallel')
      const toolResultsPromises = uiucToolsToRun.map(async (tool) => {
        if (!tool.invocationId) {
          console.error(
            `Tool ${tool.readableName} is missing an invocationId. Skipping.`,
          )
          return
        }

        const lastMessageIndex = selectedConversation.messages.length - 1
        const lastMessage = selectedConversation.messages[lastMessageIndex]

        if (!lastMessage || !lastMessage.tools) {
          console.error(
            'handleToolCall: Last message or its tools array is missing.',
          )
          return
        }

        const targetToolInMessage = lastMessage.tools.find(
          (t) => t.invocationId === tool.invocationId,
        )

        if (!targetToolInMessage) {
          console.error(
            `handleToolCall: Tool invocation with ID "${tool.invocationId}" (Name: ${tool.readableName}) not found in the last message's tools list.`,
          )
          return
        }

        try {
          const toolOutput = await callSimFunction(tool, projectName, base_url)
          targetToolInMessage.output = toolOutput
        } catch (error: unknown) {
          console.error(`Error running tool ${tool.readableName}: ${error}`)
          targetToolInMessage.error = `Error running tool: ${error}`
        }
      })
      await Promise.all(toolResultsPromises)
    }
    const lastMessage =
      selectedConversation.messages.length > 0
        ? selectedConversation.messages[
            selectedConversation.messages.length - 1
          ]
        : null
    console.log(
      'tool outputs:',
      lastMessage ? lastMessage.tools : 'No last message found',
    )
  } catch (error) {
    console.error('Error running tools from handleToolCall: ', error)
    throw error
  }
}

// ---------------------------------------------------------------------------
// handleToolsServer — orchestrates function call + tool execution
// ---------------------------------------------------------------------------

export async function handleToolsServer(
  message: Message,
  availableTools: UIUCTool[],
  imageUrls: string[],
  imageDescription: string,
  selectedConversation: Conversation,
  openaiKey: string,
  projectName: string,
  base_url?: string,
  llmProviders?: AllLLMProviders,
): Promise<Conversation> {
  try {
    const uiucToolsToRun = await handleFunctionCall(
      message,
      availableTools,
      imageUrls,
      imageDescription,
      selectedConversation,
      openaiKey,
      projectName,
      base_url,
      llmProviders,
    )

    if (uiucToolsToRun.length > 0) {
      await handleToolCall(
        uiucToolsToRun,
        selectedConversation,
        projectName,
        base_url,
      )
    }

    return selectedConversation
  } catch (error) {
    console.error('Error in handleToolsServer: ', error)
  }
  return selectedConversation
}

// ---------------------------------------------------------------------------
// getOpenAIToolFromUIUCTool — converts UIUCTool[] to OpenAI function schemas
// ---------------------------------------------------------------------------

export function getOpenAIToolFromUIUCTool(
  tools: UIUCTool[],
): OpenAICompatibleTool[] {
  return tools.map((tool) => {
    return {
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.inputParameters
          ? {
              type: 'object',
              properties: Object.keys(tool.inputParameters.properties).reduce(
                (acc, key) => {
                  const param = tool.inputParameters?.properties[key]
                  acc[key] = {
                    type:
                      param?.type === 'number'
                        ? 'number'
                        : param?.type === 'Boolean'
                          ? 'Boolean'
                          : 'string',
                    description: param?.description,
                    enum: param?.enum,
                  }
                  return acc
                },
                {} as {
                  [key: string]: {
                    type: 'string' | 'number' | 'Boolean'
                    description?: string
                    enum?: string[]
                  }
                },
              ),
              required: tool.inputParameters.required,
            }
          : undefined,
      },
    }
  })
}

// ---------------------------------------------------------------------------
// useFetchAllWorkflows — React Query hook for tool discovery
// ---------------------------------------------------------------------------

export const useFetchAllWorkflows = (course_name?: string) => {
  if (!course_name) {
    throw new Error('course_name is required')
  }

  return useQuery({
    queryKey: ['tools', course_name],
    queryFn: async (): Promise<UIUCTool[]> => {
      return fetchSimTools(course_name).catch((err) => {
        console.debug('[useFetchAllWorkflows] failed to load sim tools', err)
        return [] as UIUCTool[]
      })
    },
    staleTime: 60_000,
  })
}

// ---------------------------------------------------------------------------
// Sim AI helpers — discovery, conversion, execution
// ---------------------------------------------------------------------------

/**
 * Convert SimWorkflow[] (from API) to UIUCTool[] for the function-calling pipeline.
 * Tool names are prefixed with 'sim_' for consistent identification.
 */
export function getUIUCToolFromSim(workflows: SimWorkflow[]): UIUCTool[] {
  return workflows.map((wf) => {
    const slug = wf.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 59)

    const properties: Record<string, ToolParameter> =
      wf.inputFields.length > 0
        ? Object.fromEntries(
            wf.inputFields.map((f) => [
              f.name,
              {
                type:
                  f.type === 'number'
                    ? 'number'
                    : f.type === 'boolean'
                      ? 'Boolean'
                      : 'string',
                description: f.description ?? f.name,
              } satisfies ToolParameter,
            ]),
          )
        : { input: { type: 'string', description: 'Input for the workflow' } }

    // Treat all declared input fields as required — Sim API doesn't expose
    // a required flag, and workflows define only the fields they need.
    const required: string[] =
      wf.inputFields.length > 0 ? wf.inputFields.map((f) => f.name) : ['input']

    return {
      id: wf.id,
      name: `sim_${slug}`,
      readableName: wf.name,
      description: wf.description || `Execute the "${wf.name}" Sim workflow`,
      enabled: true,
      inputParameters: { type: 'object', properties, required },
    } satisfies UIUCTool
  })
}

/**
 * Fetch deployed Sim workflows for a project and return as UIUCTool[].
 * Reads credentials from localStorage and passes them to the API route.
 */
export async function fetchSimTools(course_name?: string): Promise<UIUCTool[]> {
  if (!course_name) return []

  const apiKey =
    typeof window !== 'undefined'
      ? (localStorage.getItem(`sim_api_key_${course_name}`) ?? '')
      : ''
  const workspaceId =
    typeof window !== 'undefined'
      ? (localStorage.getItem(`sim_workspace_id_${course_name}`) ?? '')
      : ''

  if (!apiKey || !workspaceId) return []

  const params = new URLSearchParams({
    course_name,
    api_key: apiKey,
    workspace_id: workspaceId,
  })
  const url = `/api/UIUC-api/getSimWorkflows?${params}`
  const response = await fetch(url)

  if (!response.ok) {
    console.debug('[fetchSimTools] non-ok response', response.status)
    return []
  }

  const data = (await response.json()) as { workflows: SimWorkflow[] }
  if (!data.workflows?.length) return []

  const tools = getUIUCToolFromSim(data.workflows)
  console.debug(
    '[fetchSimTools] loaded',
    tools.length,
    'Sim tools for',
    course_name,
  )
  return tools
}

/**
 * Execute a Sim workflow via our server-side proxy route.
 * Reads api_key from localStorage and passes it in the request body.
 */
export async function callSimFunction(
  tool: UIUCTool,
  projectName: string,
  base_url?: string,
): Promise<ToolOutput> {
  const apiKey =
    typeof window !== 'undefined'
      ? (localStorage.getItem(`sim_api_key_${projectName}`) ?? '')
      : ''

  if (!apiKey) {
    throw new Error('Sim API key not configured for this project')
  }

  const timeStart = Date.now()
  const endpoint = base_url
    ? `${base_url}/api/UIUC-api/runSimWorkflow`
    : '/api/UIUC-api/runSimWorkflow'

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      workflow_id: tool.id,
      input: tool.aiGeneratedArgumentValues ?? {},
      api_key: apiKey,
    }),
  })

  const secondsToRun = (Date.now() - timeStart) / 1000

  if (!response.ok) {
    const err = (await response.json().catch(() => ({
      error: response.statusText,
    }))) as { error?: string }
    posthog.capture('sim_tool_error', {
      course_name: projectName,
      readableToolName: tool.readableName,
      secondsToRunTool: secondsToRun,
      error: err.error,
    })
    throw new Error(
      err.error ?? `Sim workflow failed with status ${response.status}`,
    )
  }

  const result = (await response.json()) as {
    success: boolean
    output?: unknown
    error?: string
  }

  if (!result.success || result.error) {
    posthog.capture('sim_tool_error', {
      course_name: projectName,
      readableToolName: tool.readableName,
      secondsToRunTool: secondsToRun,
      error: result.error,
    })
    throw new Error(result.error ?? 'Sim workflow returned success=false')
  }

  let toolOutput: ToolOutput
  if (typeof result.output === 'string') {
    toolOutput = { text: result.output }
  } else if (result.output != null) {
    toolOutput = { data: result.output as Record<string, unknown> }
  } else {
    toolOutput = {}
  }

  posthog.capture('sim_tool_invoked', {
    course_name: projectName,
    readableToolName: tool.readableName,
    secondsToRunTool: secondsToRun,
    success: true,
  })

  console.debug('[callSimFunction] success', {
    tool: tool.readableName,
    secondsToRun,
  })

  return toolOutput
}
