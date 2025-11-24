import { NextResponse } from 'next/server'
import { withCourseAccessFromRequest } from '~/app/api/authorization'
import { AuthenticatedRequest } from '~/utils/appRouterAuth'
import { getModels } from '~/pages/api/models'
import { getChatResponse } from '~/utils/evaluationChatHelper'
import { fetchContexts } from '~/utils/fetchContexts'
import { fetchEnabledDocGroups } from '~/db/dbHelpers'
import { webLLMModels } from '~/utils/modelProviders/WebLLM'
import type {
  EvaluationRequest,
  EvaluationResponse,
  RagasDatasetItem,
  RagasEvaluationRequest,
  ModelConfig,
} from '~/types/evaluation'
import type { AllLLMProviders, GenericSupportedModel } from '~/utils/modelProviders/LLMProvider'
import { ProviderNames } from '~/utils/modelProviders/LLMProvider'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Get available models for evaluation (excluding WebLLM)
 */
function getAvailableModelsForEvaluation(
  allLLMProviders: AllLLMProviders,
): GenericSupportedModel[] {
  const allModels = Object.values(allLLMProviders)
    .filter((provider) => provider.enabled)
    .flatMap((provider) => provider.models || [])
    .filter((model) => model.enabled)
    .filter(
      (model) => !webLLMModels.some((webLLMModel) => webLLMModel.id === model.id),
    )

  return allModels
}

/**
 * Extract model configuration for Flask endpoint
 */
function extractModelConfig(
  modelId: string,
  allLLMProviders: AllLLMProviders,
): ModelConfig | null {
  for (const [providerName, provider] of Object.entries(allLLMProviders)) {
    if (!provider.enabled || !provider.models) continue

    const model = provider.models.find((m) => m.id === modelId && m.enabled)
    if (!model) continue

    const config: ModelConfig = {
      provider: providerName,
      model_id: modelId,
    }

    // Add provider-specific config
    if (providerName === ProviderNames.Ollama || providerName === ProviderNames.NCSAHosted) {
      config.base_url = provider.baseUrl
    }

    if (provider.apiKey) {
      config.api_key = provider.apiKey
    }

    return config
  }

  return null
}

async function handler(req: AuthenticatedRequest): Promise<NextResponse> {
  try {
    if (!req.user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 })
    }

    const body = (await req.json()) as EvaluationRequest

    // Validate request body
    if (!body.questionAnswerPairs || Object.keys(body.questionAnswerPairs).length === 0) {
      return NextResponse.json(
        { error: 'questionAnswerPairs is required and must not be empty' },
        { status: 400 },
      )
    }

    if (!body.judge || body.judge.length === 0) {
      return NextResponse.json(
        { error: 'judge is required and must contain at least one model' },
        { status: 400 },
      )
    }

    if (!body.model) {
      return NextResponse.json({ error: 'model is required' }, { status: 400 })
    }

    if (!body.course_name) {
      return NextResponse.json({ error: 'course_name is required' }, { status: 400 })
    }

    // Fetch available models for the course
    const allLLMProviders = await getModels(body.course_name)
    if (!allLLMProviders) {
      return NextResponse.json(
        { error: 'Failed to fetch available models for course' },
        { status: 500 },
      )
    }

    const availableModels = getAvailableModelsForEvaluation(allLLMProviders)

    // Validate model being evaluated
    const modelToEvaluate = availableModels.find((m) => m.id === body.model)
    if (!modelToEvaluate) {
      return NextResponse.json(
        {
          error: `Model '${body.model}' is not available or enabled for this course`,
          availableModels: availableModels.map((m) => m.id),
        },
        { status: 400 },
      )
    }

    // Validate judge models
    const invalidJudges = body.judge.filter(
      (judgeId) => !availableModels.some((m) => m.id === judgeId),
    )
    if (invalidJudges.length > 0) {
      return NextResponse.json(
        {
          error: `Invalid judge models: ${invalidJudges.join(', ')}`,
          availableModels: availableModels.map((m) => m.id),
        },
        { status: 400 },
      )
    }

    // Get document groups (default to enabled if not provided)
    let docGroups = body.doc_groups
    if (!docGroups || docGroups.length === 0) {
      const enabledGroups = await fetchEnabledDocGroups(body.course_name)
      docGroups = enabledGroups
        .filter((group) => group.enabled)
        .map((group) => group.name)
      if (docGroups.length === 0) {
        docGroups = ['All Documents'] // Fallback
      }
    }

    // Build dataset: for each question, get answer and contexts
    const dataset: RagasDatasetItem[] = []

    for (const [question, groundTruth] of Object.entries(body.questionAnswerPairs)) {
      try {
        // Get answer from chat API
        const answer = await getChatResponse({
          question,
          course_name: body.course_name,
          model: body.model,
          temperature: body.temperature ?? 0.1,
          doc_groups: docGroups,
          user: req.user,
        })

        // Get contexts
        const modelTokenLimit = modelToEvaluate.tokenLimit || 4000
        const contexts = await fetchContexts(
          body.course_name,
          question,
          modelTokenLimit,
          docGroups,
        )

        // Extract text from contexts
        const retrievedContexts = contexts.map((ctx) => ctx.text || '').filter(Boolean)

        dataset.push({
          question,
          answer,
          retrieved_contexts: retrievedContexts,
          ground_truth: groundTruth,
        })
      } catch (error) {
        console.error(`Error processing question "${question}":`, error)
        // Continue with other questions, but log the error
        // You might want to skip this question or return an error
        throw new Error(
          `Failed to process question "${question}": ${error instanceof Error ? error.message : String(error)}`,
        )
      }
    }

    // Build model configuration for Flask
    const modelConfig: Record<string, ModelConfig> = {}
    for (const judgeId of body.judge) {
      const config = extractModelConfig(judgeId, allLLMProviders)
      if (config) {
        modelConfig[judgeId] = config
      } else {
        return NextResponse.json(
          { error: `Failed to extract configuration for judge model: ${judgeId}` },
          { status: 500 },
        )
      }
    }

    // Call Flask endpoint for ragas evaluation
    const flaskUrl = process.env.FLASK_EVALUATION_URL || 'http://localhost:5000'
    const flaskResponse = await fetch(`${flaskUrl}/evaluate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dataset,
        judge: body.judge,
        temperature: body.temperature ?? 0.1,
        model_config: modelConfig,
      } as RagasEvaluationRequest),
    })

    if (!flaskResponse.ok) {
      const errorText = await flaskResponse.text()
      console.error('Flask evaluation error:', errorText)
      return NextResponse.json(
        { error: `Flask evaluation failed: ${flaskResponse.statusText}`, details: errorText },
        { status: flaskResponse.status },
      )
    }

    const flaskResults = (await flaskResponse.json()) as EvaluationResponse

    return NextResponse.json(flaskResults)
  } catch (error) {
    console.error('Error in evaluation endpoint:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

export const POST = withCourseAccessFromRequest('admin')(handler)


