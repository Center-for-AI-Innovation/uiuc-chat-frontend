export interface MetadataGenerationResponse {
  run_id: number
  status: 'started' | 'completed' | 'failed'
  error?: string
}

export interface DocumentStatus {
  document_id: number
  run_status: 'in_progress' | 'completed' | 'failed'
  last_error?: string
}

export interface MetadataDocument {
  id: number
  readable_filename: string
  metadata_status: 'completed' | 'failed' | 'running' | null
}

export interface MetadataField {
  document_id: number
  field_name: string
  field_value: any
  confidence_score: number | null
  extraction_method: string | null
  run_status: 'in_progress' | 'completed' | 'failed'
  last_error?: string
}

export interface MetadataRun {
  run_id: number
  timestamp: string
  prompt: string
  status: 'in_progress' | 'completed' | 'failed'
  document_count?: number
  document_ids: number[]
}

export interface MetadataRow {
  document_id: number
  document_name: string
  run_status: 'in_progress' | 'completed' | 'failed'
  last_error?: string
  [key: string]: any // For dynamic field columns
}
