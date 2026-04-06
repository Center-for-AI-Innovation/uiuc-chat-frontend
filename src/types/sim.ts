/**
 * Types for Sim AI workflow integration.
 * API docs: https://docs.sim.ai/api-reference/getting-started
 * Auth: X-API-Key header, key prefix sk-sim-
 *
 * Discovery:  GET /api/v1/workflows?workspaceId={id}&deployedOnly=true
 * Details:    GET /api/v1/workflows/{id}
 * Execute:    POST /api/workflows/{id}/execute
 */

/** Item returned by GET /api/v1/workflows (list endpoint). */
export interface SimWorkflowListItem {
  id: string
  name: string
  description: string
  color?: string
  folderId?: string | null
  isDeployed: boolean
  deployedAt?: string
  runCount?: number
  lastRunAt?: string | null
}

/** Input field definition from GET /api/v1/workflows/{id} detail endpoint. */
export interface SimInputField {
  name: string
  type: string
  description?: string
  required?: boolean
}

/** Enriched workflow with input fields — built by combining list + detail endpoints. */
export interface SimWorkflow {
  id: string
  name: string
  description: string
  inputFields: SimInputField[]
}

/** Response body from POST /api/workflows/{id}/execute. */
export interface SimExecutionResult {
  success: boolean
  executionId?: string
  output?: unknown
  error?: string | null
  metadata?: {
    duration?: number
    startTime?: string
    endTime?: string
  }
}

/** Per-project Sim config stored in DB. */
export interface SimProjectConfig {
  sim_api_key: string | null
  sim_base_url: string | null
  sim_workspace_id: string | null
}
