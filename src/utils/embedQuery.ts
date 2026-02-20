/**
 * Server-side query embedding for vector search.
 * Replaces backend /embedAndMetadata for the embedding part.
 * Uses same env and behavior as backend: EMBEDDING_MODEL, OPENAI_API_KEY/NCSA_HOSTED_API_KEY,
 * EMBEDDING_API_BASE, optional QWEN_QUERY_INSTRUCTION for Qwen models.
 */

import OpenAI from 'openai'

const DEFAULT_QWEN_QUERY_INSTRUCTION =
  'Given a user search query, retrieve the most relevant passages from the Illinois Chat knowledge base stored in the vector store to answer the query accurately. Prioritize authoritative course materials, syllabi, FAQs, official documentation, web pages, and other relevant sources. Ignore boilerplate/navigation text.'

function getOpenAIClient(): OpenAI {
  const apiKey =
    process.env.OPENAI_API_KEY || process.env.NCSA_HOSTED_API_KEY || ''
  const baseURL = process.env.EMBEDDING_API_BASE || 'https://api.openai.com/v1'
  return new OpenAI({ apiKey, baseURL })
}

/**
 * Generate embedding for a search query. Uses EMBEDDING_MODEL (default text-embedding-ada-002).
 * For Qwen models, prefixes the query with QWEN_QUERY_INSTRUCTION when set.
 */
export async function embedQuery(searchQuery: string): Promise<number[]> {
  const model = process.env.EMBEDDING_MODEL || 'text-embedding-ada-002'
  const qwenInstruction =
    process.env.QWEN_QUERY_INSTRUCTION || DEFAULT_QWEN_QUERY_INSTRUCTION

  let input = searchQuery.replace(/\n/g, ' ').trim()
  if (
    qwenInstruction &&
    typeof model === 'string' &&
    model.toLowerCase().includes('qwen')
  ) {
    input = `Instruct: ${qwenInstruction}\nQuery:${searchQuery}`
  }

  const openai = getOpenAIClient()
  const {
    data: [result],
  } = await openai.embeddings.create({
    model,
    input,
  })

  if (!result?.embedding) {
    throw new Error('No embedding returned from embedding API')
  }
  return result.embedding
}
