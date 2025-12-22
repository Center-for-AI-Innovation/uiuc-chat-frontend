/**
 * Types for Sim workflow integration
 */

export interface WorkflowExecutionResult {
  success: boolean
  output?: any
  error?: string
  logs?: any[]
  metadata?: {
    duration?: number
    executionId?: string
    [key: string]: any
  }
  traceSpans?: any[]
  totalDuration?: number
}

/**
 * Sim workflow definition from the API
 */
export interface SimWorkflow {
  id: string
  name: string
  description?: string
  color?: string
  state?: any
  userId?: string
  workspaceId?: string
  folderId?: string | null
  createdAt: string
  updatedAt: string
}

/**
 * Sim workflow input field definition
 */
export interface SimWorkflowInputField {
  name: string
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'files'
  description?: string
  required?: boolean
  default?: any
}

/**
 * Workflow metadata stored in localStorage
 */
export interface WorkflowMetadata {
  name?: string
  description?: string
  inputFields?: SimWorkflowInputField[]
}

/**
 * Sim workflow with parsed input schema
 */
export interface SimWorkflowWithInputs extends SimWorkflow {
  inputFields?: SimWorkflowInputField[]
  enabled?: boolean
}

/**
 * Response from GET /api/workflows
 */
export interface SimWorkflowsResponse {
  data: SimWorkflow[]
}

