import { type WorkflowExecutionResult, type SimWorkflow, type SimWorkflowsResponse } from '@/types/sim'

/**
 * Sim service for executing workflows
 * Uses browser fetch API to call Sim API directly
 */
class SimService {
  private apiKey: string
  private baseUrl: string
  private workflowId: string

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_SIM_API_KEY || ''
    this.baseUrl =
      process.env.NEXT_PUBLIC_SIM_BASE_URL || 'http://localhost:3100'
    this.workflowId =
      process.env.NEXT_PUBLIC_SIM_WORKFLOW_ID ||
      '1f011789-d1ac-4514-8fb4-dd9aa3426e21'
  }

  /**
   * Get the configured API key
   */
  getApiKey(): string {
    return this.apiKey
  }

  /**
   * Get the configured base URL
   */
  getBaseUrl(): string {
    return this.baseUrl
  }

  /**
   * Fetch all available workflows from Sim
   * Note: This requires session-based auth, so it goes through our API route
   * @returns Array of workflows
   */
  async fetchWorkflows(): Promise<SimWorkflow[]> {
    try {
      // Call our API route which will handle the Sim API call
      const response = await fetch('/api/UIUC-api/getSimWorkflows')
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Failed to fetch Sim workflows:', errorText)
        throw new Error(`Failed to fetch Sim workflows: ${response.status}`)
      }

      const data = await response.json()
      return data.workflows || []
    } catch (error) {
      console.error('Error fetching Sim workflows:', error)
      throw error
    }
  }

  /**
   * Execute a specific Sim workflow by ID
   * @param workflowId - The ID of the workflow to execute
   * @param input - The input data to pass to the workflow
   * @param stream - Whether to stream the response (default: false)
   * @returns The workflow execution result
   */
  async executeWorkflowById(
    workflowId: string,
    input: Record<string, any>,
    stream: boolean = false
  ): Promise<WorkflowExecutionResult> {
    console.log(`🔵 SIM executeWorkflowById called with workflowId: ${workflowId}, input:`, input)
    if (!this.apiKey) {
      throw new Error('SIM_API_KEY is not configured')
    }

    const url = `${this.baseUrl}/api/workflows/${workflowId}/execute`
    console.log('🔵 SIM executeWorkflowById URL:', url)

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
        },
        body: JSON.stringify({
          ...input,
          stream: stream,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.log('SIM workflow error response (raw):', errorText)
        const errorData = (() => {
          try {
            return JSON.parse(errorText)
          } catch {
            return {}
          }
        })() as any
        throw new Error(
          errorData.error ||
            `HTTP ${response.status}: ${response.statusText}`,
        )
      }

      // Get raw response text first to log it
      const responseText = await response.text()
      console.log('🔵 SIM workflow response (raw):', responseText.substring(0, 200))
      
      // Parse the response, handling SSE format if needed
      return this.parseWorkflowResponse(responseText)
    } catch (error: any) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error(
        error?.message || 'Failed to execute Sim workflow',
      )
    }
  }

  /**
   * Parse workflow response, handling SSE format if needed
   * @param responseText - Raw response text from the workflow execution
   * @returns Parsed WorkflowExecutionResult
   */
  private parseWorkflowResponse(responseText: string): WorkflowExecutionResult {
    let textToParse = responseText
    
    // Check if response is in SSE format (starts with "data: ")
    if (responseText.trim().startsWith('data: ')) {
      console.log('🔵 Detected SSE format, extracting JSON from data: prefix')
      const lines = responseText.split('\n')
      const dataLines = lines.filter(line => line.trim().startsWith('data: '))
      console.log('🔵 Found', dataLines.length, 'data lines')
      
      // Find the first data line that contains a valid JSON object (not "[DONE]")
      for (const line of dataLines) {
        const content = line.substring(line.indexOf('data:') + 5).trim()
        if (content && content !== '"[DONE]"' && content !== '[DONE]') {
          textToParse = content
          console.log('🔵 Extracted from SSE line:', textToParse.substring(0, 100))
          break
        }
      }
      
      // If we got an SSE event object, extract the actual data
      try {
        const sseEvent = JSON.parse(textToParse)
        if (sseEvent && typeof sseEvent === 'object') {
          // Check if this is a SIM workflow event format: {event: "final", data: {...}}
          if (sseEvent.event === 'final' && sseEvent.data) {
            console.log('🔵 Detected SIM event format, extracting data field')
            textToParse = JSON.stringify(sseEvent.data)
          }
        }
      } catch {
        // Not an SSE event object, use as-is
      }
    }
    
    // Try to parse as JSON
    let result: WorkflowExecutionResult
    try {
      result = JSON.parse(textToParse) as WorkflowExecutionResult
      console.log('🔵 Successfully parsed SIM workflow response:', result)
    } catch (parseError) {
      console.error('❌ Failed to parse SIM workflow response as JSON:', {
        error: parseError instanceof Error ? parseError.message : String(parseError),
        rawResponse: responseText,
        textToParse: textToParse,
        responseLength: responseText.length,
        responsePreview: responseText.substring(0, 500),
      })
      throw new Error(
        `Failed to parse SIM workflow response: ${parseError instanceof Error ? parseError.message : String(parseError)}. Raw response: ${responseText.substring(0, 200)}`
      )
    }
    
    return result
  }

  /**
   * Execute a Sim workflow with the given input
   * @param input - The input data to pass to the workflow
   * @returns The workflow execution result
   */
  async executeWorkflow(input: string): Promise<WorkflowExecutionResult> {
    console.log('🔵 SIM executeWorkflow called with input:', input)
    if (!this.apiKey) {
      throw new Error('SIM_API_KEY is not configured')
    }

      const url = `${this.baseUrl}/api/workflows/${this.workflowId}/execute`
      console.log('🔵 SIM executeWorkflow URL:', url)

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
        },
        body: JSON.stringify({
          input: input,
          stream: false,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.log('SIM workflow error response (raw):', errorText)
        const errorData = (() => {
          try {
            return JSON.parse(errorText)
          } catch {
            return {}
          }
        })() as any
        throw new Error(
          errorData.error ||
            `HTTP ${response.status}: ${response.statusText}`,
        )
      }

      // Get raw response text first to log it
      const responseText = await response.text()
      console.log('🔵 SIM workflow response (raw, full):', responseText)
      
      // Use shared parsing logic
      return this.parseWorkflowResponse(responseText)
    } catch (error: any) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error(
        error?.message || 'Failed to execute Sim workflow',
      )
    }
  }

  /**
   * Execute the weather workflow with database connection parameters
   * @param query - The query string from the message
   * @returns The workflow execution result
   */
  async executeWeatherWorkflow(query: string): Promise<WorkflowExecutionResult> {
    console.log('🌤️ Weather executeWorkflow called with query:', query)
    if (!this.apiKey) {
      throw new Error('SIM_API_KEY is not configured')
    }

    const weatherWorkflowId = 'e9cbf746-ae46-4b39-911a-f09e752e3859'
    const url = `${this.baseUrl}/api/workflows/${weatherWorkflowId}/execute`
    console.log('🌤️ Weather executeWorkflow URL:', url)

    // Get environment variables for database connection
    // Note: These need to be prefixed with NEXT_PUBLIC_ to be accessible in the browser
    const host =
      process.env.NEXT_PUBLIC_SIM_WEATHER_WORKFLOW_HOST ||
      process.env.SIM_WEATHER_WORKFLOW_HOST ||
      'sim-weatherdb-1'
    const port =
      process.env.NEXT_PUBLIC_SIM_WEATHER_WORKFLOW_PORT ||
      process.env.SIM_WEATHER_WORKFLOW_PORT ||
      '5432'
    const dbname =
      process.env.NEXT_PUBLIC_SIM_WEATHER_WORKFLOW_DB ||
      process.env.SIM_WEATHER_WORKFLOW_DB ||
      'weather'
    const username =
      process.env.NEXT_PUBLIC_SIM_WEATHER_WORKFLOW_USERNAME ||
      process.env.SIM_WEATHER_WORKFLOW_USERNAME ||
      'postgres'
    const password =
      process.env.NEXT_PUBLIC_SIM_WEATHER_WORKFLOW_PASSWORD ||
      process.env.SIM_WEATHER_WORKFLOW_PASSWORD ||
      'postgres'

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
        },
        body: JSON.stringify({
          Query: query,
          host: host,
          port: parseInt(port, 10),
          dbname: dbname,
          username: username,
          password: password,
          stream: true,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.log('Weather workflow error response (raw):', errorText)
        const errorData = (() => {
          try {
            return JSON.parse(errorText)
          } catch {
            return {}
          }
        })() as any
        throw new Error(
          errorData.error ||
            `HTTP ${response.status}: ${response.statusText}`,
        )
      }

      // Get raw response text first to log it
      const responseText = await response.text()
      console.log('🌤️ Weather workflow response (raw, full):', responseText)
      
      // Use shared parsing logic
      return this.parseWorkflowResponse(responseText)
    } catch (error: any) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error(
        error?.message || 'Failed to execute weather workflow',
      )
    }
  }
}

// Singleton instance
let simServiceInstance: SimService | null = null

/**
 * Get the Sim service instance (singleton pattern)
 */
export function getSimService(): SimService {
  if (!simServiceInstance) {
    simServiceInstance = new SimService()
  }
  return simServiceInstance
}

/**
 * Execute a Sim workflow with the given input
 * @param input - The input data to pass to the workflow
 * @returns The workflow execution result
 */
export async function executeSimWorkflow(
  input: string,
): Promise<WorkflowExecutionResult> {
  const service = getSimService()
  return service.executeWorkflow(input)
}

/**
 * Execute the weather workflow with the given query
 * @param query - The query string from the message
 * @returns The workflow execution result
 */
export async function executeWeatherWorkflow(
  query: string,
): Promise<WorkflowExecutionResult> {
  const service = getSimService()
  return service.executeWeatherWorkflow(query)
}

/**
 * Fetch all available Sim workflows
 * @returns Array of workflows
 */
export async function fetchSimWorkflows(): Promise<SimWorkflow[]> {
  const service = getSimService()
  return service.fetchWorkflows()
}

/**
 * Execute a specific Sim workflow by ID
 * @param workflowId - The ID of the workflow to execute
 * @param input - The input data to pass to the workflow
 * @param stream - Whether to stream the response (default: false)
 * @returns The workflow execution result
 */
export async function executeSimWorkflowById(
  workflowId: string,
  input: Record<string, any>,
  stream: boolean = false
): Promise<WorkflowExecutionResult> {
  const service = getSimService()
  return service.executeWorkflowById(workflowId, input, stream)
}

