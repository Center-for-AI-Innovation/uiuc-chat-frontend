/**
 * Types for the evaluation system
 * Structured to be easily extensible for future database storage
 */

export interface EvaluationRequest {
  questionAnswerPairs: Record<string, string> // question -> ground truth
  judge: string[] // judge model IDs from available course models
  course_name: string
  model: string // model to evaluate (from available course models)
  temperature: number
  doc_groups?: string[] // optional, defaults to enabled doc groups
}

export interface EvaluationResponse {
  results: Record<string, Record<string, number>> // judge -> metric -> score
  // Future DB fields (optional for now):
  id?: string
  created_at?: string
  user_email?: string
  course_name?: string
  model?: string
  judges?: string[]
}

export interface RagasDatasetItem {
  question: string
  answer: string
  retrieved_contexts: string[]
  ground_truth: string
}

export interface RagasEvaluationRequest {
  dataset: RagasDatasetItem[]
  judge: string[]
  temperature: number
  model_config?: Record<string, ModelConfig>
}

export interface ModelConfig {
  provider: string // "OpenAI", "Ollama", "Anthropic", etc.
  base_url?: string // For Ollama/NCSA hosted models
  api_key?: string // If needed for the provider
  model_id: string
}

export interface EvaluationMetrics {
  context_precision: number
  context_recall: number
  answer_relevancy: number
  faithfulness: number
  factual_correctness: number
}


