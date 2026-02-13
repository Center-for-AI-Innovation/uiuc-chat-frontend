import { type ContextWithMetadata } from '~/types/chat'
import { getBackendUrl } from '~/utils/apiUtils'
import { vectorSearchWithDrizzle } from '~/db/vectorSearch'

/** Fetch embedding + disabled/public doc groups from backend, then run vector search on frontend DB (Drizzle/pgvector). */
export async function fetchContextsViaFrontendVectorSearch(
  course_name: string,
  search_query: string,
  doc_groups: string[] = [],
  conversation_id?: string,
  top_n = 100,
): Promise<ContextWithMetadata[]> {
  const backendUrl = getBackendUrl()
  const embedRes = await fetch(`${backendUrl}/embedAndMetadata`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ search_query, course_name }),
  })
  if (!embedRes.ok) {
    throw new Error(
      `Failed to get embedding/metadata. Status: ${embedRes.status}`,
    )
  }
  const { embedding, disabled_doc_groups, public_doc_groups } =
    await embedRes.json()

  return vectorSearchWithDrizzle({
    queryEmbedding: embedding,
    course_name,
    doc_groups,
    disabled_doc_groups: disabled_doc_groups ?? [],
    public_doc_groups: public_doc_groups ?? [],
    conversation_id,
    top_n,
  })
}
