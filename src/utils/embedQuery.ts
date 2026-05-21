/**
 * Server-side query embedding for vector search.
 *
 * Resolves the embedding client through `connectionManager.getEmbeddingClient`
 * so the per-project `embedding_config` is honoured — same code path as the
 * backend's `_resolve_embedding_client`. Vectors produced here land in the
 * same space as vectors produced by the backend `/getTopContexts` route, so
 * retrieval over the Drizzle pgvector path stays consistent.
 *
 * Provider semantics:
 *   - openai: OpenAI SDK; Qwen-model queries get the `Instruct: …\nQuery:`
 *     prefix (backend `retrieval_service.py:631-635`).
 *   - ollama: raw `fetch` to `${baseUrl}/api/embeddings` with `{model, prompt}`
 *     (the LangChain `OllamaEmbeddings` shape — NOT Ollama's `/v1` OpenAI
 *     compat endpoint). No Qwen prefix (backend gates the prefix on
 *     `isinstance(client, OpenAIEmbeddings)`).
 */

import { connectionManager } from '~/utils/connectionManager'

/**
 * Generate embedding for a search query. The per-project `embedding_config`
 * decides provider + model + base_url + (optional) api_key/api_base. Caller
 * MUST pass `projectName` so per-project overrides apply — passing the wrong
 * name embeds against the default OpenAI client and silently breaks retrieval.
 */
export async function embedQuery(
  searchQuery: string,
  projectName: string,
): Promise<number[]> {
  const resolved = await connectionManager.getEmbeddingClient(projectName)

  if (resolved.kind === 'ollama') {
    // LangChain `OllamaEmbeddings.embed_query` shape — mirror it exactly so
    // the frontend Drizzle path and backend /getTopContexts produce
    // bit-identical vectors for the same query + model.
    const url = `${resolved.baseUrl.replace(/\/$/, '')}/api/embeddings`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: resolved.model, prompt: searchQuery }),
    })
    if (!res.ok) {
      throw new Error(
        `Ollama embeddings request failed: HTTP ${res.status} ${res.statusText}`,
      )
    }
    const body = (await res.json()) as { embedding?: number[] }
    if (!body.embedding || !Array.isArray(body.embedding)) {
      throw new Error('Ollama embeddings response missing `embedding` array')
    }
    return body.embedding
  }

  // openai (or any future OpenAI-compatible provider — already gated by
  // ALLOWED_EMBEDDING_PROVIDERS at the connectionManager layer).
  let input = searchQuery.replace(/\n/g, ' ').trim()
  if (resolved.applyQwenInstruction && resolved.queryInstruction) {
    input = `Instruct: ${resolved.queryInstruction}\nQuery:${searchQuery}`
  }

  const {
    data: [result],
  } = await resolved.client.embeddings.create({
    model: resolved.model,
    input,
  })

  if (!result?.embedding) {
    throw new Error('No embedding returned from embedding API')
  }
  return result.embedding
}
