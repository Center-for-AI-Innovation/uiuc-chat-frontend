import { useQuery } from '@tanstack/react-query'
import { type ChatCompletionMessageToolCall } from 'openai/resources/chat/completions'
import posthog from 'posthog-js'
import { runN8nFlowBackend } from '~/pages/api/UIUC-api/runN8nFlow'
import type { ToolOutput } from '~/types/chat'
import { type Conversation, type Message, type UIUCTool } from '~/types/chat'
import {
  type N8NParameter,
  type N8nWorkflow,
  type OpenAICompatibleTool,
} from '~/types/tools'
import { getBackendUrl } from '~/utils/apiUtils'

export async function handleFunctionCall(
  message: Message,
  availableTools: UIUCTool[],
  imageUrls: string[],
  imageDescription: string,
  selectedConversation: Conversation,
  openaiKey: string,
  base_url?: string,
): Promise<UIUCTool[]> {
  try {
    // Convert UIUCTool to OpenAICompatibleTool
    const openAITools = getOpenAIToolFromUIUCTool(availableTools)
    // console.log('OpenAI compatible tools (handle tools): ', openaiKey)
    const url = base_url
      ? `${base_url}/api/chat/openaiFunctionCall`
      : '/api/chat/openaiFunctionCall'
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversation: selectedConversation,
        tools: openAITools,
        imageUrls: imageUrls,
        imageDescription: imageDescription,
        openaiKey: openaiKey,
      }),
    })

    if (!response.ok) {
      console.error('Error calling openaiFunctionCall: ', response)
      return []
    }
    const openaiFunctionCallResponse = await response.json()
    if (openaiFunctionCallResponse.message === 'No tools invoked by OpenAI') {
      console.debug('No tools invoked by OpenAI')
      return []
    }

    const openaiResponse: ChatCompletionMessageToolCall[] =
      openaiFunctionCallResponse.choices?.[0]?.message?.tool_calls || []
    console.log('OpenAI tools to run: ', openaiResponse)

    // Map tool into UIUCTool, parse arguments, and add invocation ID
    const uiucToolsToRun: UIUCTool[] = openaiResponse.map((openaiTool) => {
      const baseTool = availableTools.find(
        (availableTool) => availableTool.name === openaiTool.function.name,
      )

      if (!baseTool) {
        // Handle case where the tool specified by OpenAI isn't available
        // This shouldn't happen if availableTools is correctly populated
        console.error(
          `Tool ${openaiTool.function.name} not found in available tools.`,
        )
        // Return a placeholder or throw an error, depending on desired handling
        // For now, returning a minimal object to avoid crashing the map
        return {
          id: 'error', // N8N workflow ID - invalid
          invocationId: openaiTool.id, // OpenAI call ID
          name: openaiTool.function.name,
          readableName: `Error: ${openaiTool.function.name} not found`,
          description: 'Tool definition not found',
          aiGeneratedArgumentValues: JSON.parse(openaiTool.function.arguments),
          error: 'Tool definition not found in available tools list.',
        } as UIUCTool
      }

      // Create a new object for this specific invocation
      return {
        ...baseTool, // Copy properties from the base tool definition
        invocationId: openaiTool.id, // Add the unique invocation ID from OpenAI
        aiGeneratedArgumentValues: JSON.parse(openaiTool.function.arguments), // Add the specific arguments for this call
      }
    })

    // Filter out any tools that weren't found (if we didn't throw an error)
    const validUiucToolsToRun = uiucToolsToRun.filter(
      (tool) => tool.id !== 'error',
    )

    // Update the message object with the array of tool invocations
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

export async function handleToolCall(
  uiucToolsToRun: UIUCTool[],
  selectedConversation: Conversation,
  projectName: string,
  base_url?: string,
) {
  try {
    if (uiucToolsToRun.length > 0) {
      // Tool calling in Parallel here!!
      console.log('Running tools in parallel')
      const toolResultsPromises = uiucToolsToRun.map(async (tool) => {
        // Ensure the tool has an invocationId before proceeding
        if (!tool.invocationId) {
          console.error(
            `Tool ${tool.readableName} is missing an invocationId. Skipping.`,
          )
          return // Skip this tool if it lacks the necessary ID
        }

        const lastMessageIndex = selectedConversation.messages.length - 1
        const lastMessage = selectedConversation.messages[lastMessageIndex]

        if (!lastMessage || !lastMessage.tools) {
          console.error(
            'handleToolCall: Last message or its tools array is missing.',
          )
          return // Skip this tool if message structure is wrong
        }

        // Find the specific tool invocation in the message using invocationId
        const targetToolInMessage = lastMessage.tools.find(
          (t) => t.invocationId === tool.invocationId,
        )

        if (!targetToolInMessage) {
          console.error(
            `handleToolCall: Tool invocation with ID "${tool.invocationId}" (Name: ${tool.readableName}) not found in the last message's tools list.`,
          )
          return // Skip this tool if not found in message
        }

        try {
          const toolOutput = await callN8nFunction(
            tool,
            projectName,
            undefined,
            base_url,
          )
          // Add success output: update message with tool output, but don't add another tool.
          // ✅ TOOL SUCCEEDED
          targetToolInMessage.output = toolOutput
        } catch (error: unknown) {
          // ❌ TOOL ERRORED
          console.error(`Error running tool ${tool.readableName}: ${error}`)
          // Add error output
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
    // return selectedConversation
  } catch (error) {
    console.error('Error running tools from handleToolCall: ', error)
    throw error
  }
}

export async function handleToolsServer(
  message: Message,
  availableTools: UIUCTool[],
  imageUrls: string[],
  imageDescription: string,
  selectedConversation: Conversation,
  openaiKey: string,
  projectName: string,
  base_url?: string,
): Promise<Conversation> {
  try {
    const uiucToolsToRun = await handleFunctionCall(
      message,
      availableTools,
      imageUrls,
      imageDescription,
      selectedConversation,
      openaiKey,
      base_url,
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

const callN8nFunction = async (
  tool: UIUCTool,
  projectName: string,
  n8n_api_key: string | undefined,
  base_url?: string,
): Promise<ToolOutput> => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 300000)

  // get n8n api key per project
  if (!n8n_api_key) {
    const url = base_url
      ? `${base_url}/api/UIUC-api/tools/getN8nKeyFromProject?course_name=${projectName}`
      : `/api/UIUC-api/tools/getN8nKeyFromProject?course_name=${projectName}`

    const response = await fetch(url, {
      method: 'GET',
    })
    if (!response.ok) {
      throw new Error(
        'Unable to fetch current N8N API Key; the network response was not ok.',
      )
    }
    n8n_api_key = await response.json()
  }

  const timeStart = Date.now()

  // Check if we're running on client-side (browser) or server-side
  const isClientSide = typeof window !== 'undefined'

  let n8nResponse: any

  if (isClientSide) {
    // Client-side: use our API route
    const response = await fetch('/api/UIUC-api/runN8nFlow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify({
        api_key: n8n_api_key,
        name: tool.readableName,
        data: tool.aiGeneratedArgumentValues,
      }),
      signal: controller.signal,
    }).catch((error) => {
      if (error.name === 'AbortError') {
        throw new Error(
          'Request timed out after 30 seconds, try "Regenerate Response" button',
        )
      }
      throw error
    })

    if (!response.ok) {
      const errjson = await response.json()
      console.error('Error calling n8n function: ', errjson.error)
      throw new Error(errjson.error)
    }

    n8nResponse = await response.json()
  } else {
    // Server-side: use the common function directly
    if (!n8n_api_key) {
      throw new Error('N8N API key is required')
    }

    try {
      n8nResponse = await runN8nFlowBackend(
        n8n_api_key,
        tool.readableName,
        tool.aiGeneratedArgumentValues,
      )
    } catch (error: any) {
      if (error.message.includes('timed out')) {
        throw new Error(
          'Request timed out after 30 seconds, try "Regenerate Response" button',
        )
      }
      throw error
    }
  }

  const timeEnd = Date.now()
  console.debug(
    'Time taken for n8n function call: ',
    (timeEnd - timeStart) / 1000,
    'seconds',
  )

  clearTimeout(timeoutId)

  const resultData = n8nResponse.data.resultData
  console.debug('N8n results data: ', resultData)
  const finalNodeType = resultData.lastNodeExecuted

  // If N8N tool error ❌
  if (resultData.runData[finalNodeType][0]['error']) {
    const formatted_err_message = `${resultData.runData[finalNodeType][0]['error']['message']}. ${resultData.runData[finalNodeType][0]['error']['description']}`
    console.error('N8N tool error: ', formatted_err_message)
    const err = resultData.runData[finalNodeType][0]['error']

    posthog.capture('tool_error', {
      course_name: projectName,
      readableToolName: tool.readableName,
      toolDescription: tool.description,
      secondsToRunTool: (timeEnd - timeStart) / 1000,
      toolInputs: tool.inputParameters,
      toolError: err,
    })
    throw new Error(formatted_err_message)
  }

  // -- PARSE TOOL OUTPUT --

  // ERROR ❌
  if (
    !resultData.runData[finalNodeType][0].data ||
    !resultData.runData[finalNodeType][0].data.main[0][0].json
  ) {
    posthog.capture('tool_error_empty_response', {
      course_name: projectName,
      readableToolName: tool.readableName,
      toolDescription: tool.description,
      secondsToRunTool: (timeEnd - timeStart) / 1000,
      toolInputs: tool.inputParameters,
      toolError: 'Tool executed successfully, but we got an empty response!',
    })

    console.error('Tool executed successfully, but we got an empty response!')
    throw new Error('Tool executed successfully, but we got an empty response!')
  }

  let toolOutput: ToolOutput
  if (resultData.runData[finalNodeType][0].data.main[0][0].json['data']) {
    // JSON data output
    toolOutput = {
      data: resultData.runData[finalNodeType][0].data.main[0][0].json['data'],
    }
  } else if (
    resultData.runData[finalNodeType][0].data.main[0][0].json['response'] &&
    Object.keys(resultData.runData[finalNodeType][0].data.main[0][0].json)
      .length === 1
  ) {
    // If there's ONLY 'response' key, return that
    toolOutput = {
      text: resultData.runData[finalNodeType][0].data.main[0][0].json[
        'response'
      ],
    }
  } else {
    // Fallback to JSON output
    toolOutput = {
      data: resultData.runData[finalNodeType][0].data.main[0][0].json,
    }
  }

  // Check for images, add that field (can be used in combination with all other outputs)
  if (
    resultData.runData[finalNodeType][0].data.main[0][0].json['image_urls'] &&
    Object.keys(resultData.runData[finalNodeType][0].data.main[0][0].json)
      .length === 1
  ) {
    // If there's ONLY 'img_urls' key, return that
    toolOutput = {
      imageUrls:
        resultData.runData[finalNodeType][0].data.main[0][0].json['image_urls'],
    }
  } else if (
    resultData.runData[finalNodeType][0].data.main[0][0].json['image_urls']
  ) {
    // There's Image URLs AND other data. Keep both.
    toolOutput = {
      ...toolOutput,
      imageUrls:
        resultData.runData[finalNodeType][0].data.main[0][0].json['image_urls'],
    }
  }

  posthog.capture('tool_invoked', {
    course_name: projectName,
    readableToolName: tool.readableName,
    toolDescription: tool.description,
    secondsToRunTool: (timeEnd - timeStart) / 1000,
    toolInputs: tool.inputParameters,
    toolOutput: toolOutput,
  })
  return toolOutput
}

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

export function getUIUCToolFromN8n(workflows: N8nWorkflow[]): UIUCTool[] {
  const extractedObjects: UIUCTool[] = []

  for (const workflow of workflows) {
    // Only active workflows
    if (!workflow.active) continue

    // Must have a form trigger node!
    const formTriggerNode = workflow.nodes.find(
      (node) => node.type === 'n8n-nodes-base.formTrigger',
    )
    if (!formTriggerNode) continue

    const properties: Record<string, N8NParameter> = {}
    const required: string[] = []
    let parameters = {}

    if (formTriggerNode.parameters.formFields) {
      formTriggerNode.parameters.formFields.values.forEach((field) => {
        const key = field.fieldLabel.replace(/\s+/g, '_').toLowerCase() // Replace spaces with underscores and lowercase
        properties[key] = {
          type: field.fieldType === 'number' ? 'number' : 'string',
          description: field.fieldLabel,
        }

        if (field.requiredField) {
          required.push(key)
        }
        parameters = {
          type: 'object',
          properties,
          required,
        }
      })
    }

    extractedObjects.push({
      id: workflow.id,
      name: workflow.name.replace(/[^a-zA-Z0-9_-]/g, '_'),
      readableName: workflow.name,
      description: formTriggerNode.parameters.formDescription,
      updatedAt: workflow.updatedAt,
      createdAt: workflow.createdAt,
      enabled: workflow.active,
      // @ts-ignore -- can't get the 'only add if non-zero' to work nicely. It's fine.
      inputParameters:
        Object.keys(parameters).length > 0 ? parameters : undefined,
    })
  }

  return extractedObjects
}

export async function fetchTools(
  course_name: string,
  api_key: string,
  limit: number,
  pagination: string,
  full_details: boolean,
  base_url?: string,
) {
  if (isNaN(limit) || limit <= 0) {
    limit = 10
  }

  if (!api_key || api_key === 'undefined') {
    try {
      const response = await fetch(
        `${base_url ? base_url : ''}/api/UIUC-api/tools/getN8nKeyFromProject?course_name=${course_name}`,
        {
          method: 'GET',
        },
      )
      if (response.status === 404) {
        console.debug("No N8N API key found for the Project, can't fetch tools")
        return []
      }
      if (!response.ok) {
        throw new Error("Failed to fetch Project's N8N API key")
      }
      api_key = await response.json()

    } catch (error) {
      console.error('Error fetching N8N API key:', error)
      return []
    }
  }

  if (!api_key || api_key === 'undefined') {
    console.debug("No N8N API key found, can't fetch tools")
    return []
  }

  const parsedPagination = pagination.toLowerCase() === 'true'

  // Check if we're running on client-side (browser) or server-side
  const isClientSide = typeof window !== 'undefined'

  let response: Response

  if (isClientSide) {
    // Client-side: use our API route
    response = await fetch(
      `/api/UIUC-api/getN8nWorkflows?api_key=${api_key}&limit=${limit}&pagination=${parsedPagination}`,
    )
  } else {
    // Server-side: use direct backend call
    const backendUrl = getBackendUrl()
    if (!backendUrl) {
      throw new Error(
        'No backend URL configured. Please provide base_url parameter or set RAILWAY_URL environment variable.',
      )
    }
    response = await fetch(
      `${backendUrl}/getworkflows?api_key=${api_key}&limit=${limit}&pagination=${parsedPagination}`,
    )
  }

  if (!response.ok) {
    // return res.status(response.status).json({ error: response.statusText })
    throw new Error(`Unable to fetch n8n tools: ${response.statusText}`)
  }

  const workflows = await response.json()
  if (full_details) return workflows[0]

  const uiucTools = getUIUCToolFromN8n(workflows[0])
  return uiucTools
}

export const useFetchAllWorkflows = (
  course_name?: string,
  api_key?: string,
  limit = 20,
  pagination = 'true',
  full_details = false,
) => {
  if (!course_name && !api_key) {
    throw new Error('One of course_name OR api_key is required')
  }
  // Note: api_key can still be 'undefined' here... but we'll fetch it inside fetchTools

  return useQuery({
    queryKey: ['tools', api_key],
    queryFn: async (): Promise<UIUCTool[]> =>
      fetchTools(course_name!, api_key!, limit, pagination, full_details),
  })
}
