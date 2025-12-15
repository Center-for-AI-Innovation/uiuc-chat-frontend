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

