import { useQuery } from '@tanstack/react-query'
import { Dispatch } from 'react'
import { Conversation, Message } from '~/types/chat'
import { ActionType } from '@/hooks/useCreateReducer'
import { HomeInitialState } from '~/pages/api/home/home.state'
import { ChatCompletionMessageToolCall } from 'openai/resources/chat/completions'
import { N8NParameter, N8nWorkflow, OpenAICompatibleTool } from '~/types/tools'
import { UIUCTool } from '~/types/chat'
import type { ToolOutput } from '~/types/chat'
import posthog from 'posthog-js'

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
      console.error('No tools invoked by OpenAI')
      return []
    }

    const openaiResponse: ChatCompletionMessageToolCall[] =
      openaiFunctionCallResponse

    console.log('OpenAI tools to run: ', openaiResponse)

    // Map tool into UIUCTool, parse arguments
    const uiucToolsToRun = openaiResponse.map((openaiTool) => {
      const uiucTool = availableTools.find(
        (availableTool) => availableTool.name === openaiTool.function.name,
      ) as UIUCTool
      uiucTool.aiGeneratedArgumentValues = JSON.parse(
        openaiTool.function.arguments,
      )
      return uiucTool
    })
    message.tools = [...uiucToolsToRun]
    selectedConversation.messages[selectedConversation.messages.length - 1] =
      message
    console.log('UIUC tools to run: ', uiucToolsToRun)

    return uiucToolsToRun
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
        try {
          const toolOutput = await callN8nFunction(
            tool,
            projectName,
            undefined,
            base_url,
          )
          // Add success output: update message with tool output, but don't add another tool.
          // ✅ TOOL SUCCEEDED
          selectedConversation.messages[
            selectedConversation.messages.length - 1
          ]!.tools!.find((t) => t.readableName === tool.readableName)!.output =
            toolOutput
        } catch (error: unknown) {
          // ❌ TOOL ERRORED
          console.error(`Error running tool: ${error}`)
          // Add error output
          selectedConversation.messages[
            selectedConversation.messages.length - 1
          ]!.tools!.find((t) => t.readableName === tool.readableName)!.error =
            `Error running tool: ${error}`
        }
      })
      await Promise.all(toolResultsPromises)
    }
    console.log(
      'tool outputs:',
      selectedConversation.messages[selectedConversation.messages.length - 1]!
        .tools,
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
  const timeoutId = setTimeout(() => controller.abort(), 30000)

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

  // Run tool
  const body = JSON.stringify({
    api_key: n8n_api_key,
    name: tool.readableName,
    data: tool.aiGeneratedArgumentValues,
  })

  const timeStart = Date.now()
  const response: Response = await fetch(
    `https://flask-production-751b.up.railway.app/run_flow`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      body: body,
      signal: controller.signal,
    },
  ).catch((error) => {
    if (error.name === 'AbortError') {
      throw new Error(
        'Request timed out after 30 seconds, try "Regenerate Response" button',
      )
    }
    throw error
  })
  const timeEnd = Date.now()
  console.debug(
    'Time taken for n8n function call: ',
    (timeEnd - timeStart) / 1000,
    'seconds',
  )

  clearTimeout(timeoutId)
  if (!response.ok) {
    const errjson = await response.json()
    console.error('Error calling n8n function: ', errjson.error)
    throw new Error(errjson.error)
  }

  // Parse final answer from n8n workflow object
  const n8nResponse = await response.json()
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

  const response = await fetch(
    `https://flask-production-751b.up.railway.app/getworkflows?api_key=${api_key}&limit=${limit}&pagination=${parsedPagination}`,
  )
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
