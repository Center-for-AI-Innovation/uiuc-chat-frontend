import { type ContextWithMetadata } from '~/types/chat'
import { vectorSearchWithDrizzle } from '~/db/vectorSearch'
import { embedQuery } from '~/utils/embedQuery'
import { getDocGroupsForVectorSearch } from '~/db/dbHelpers'

/** Fetch query embedding (frontend) + doc groups from frontend DB, then run vector search (Drizzle/pgvector). */
export async function fetchContextsViaDrizzleVectorSearch(
  course_name: string,
  search_query: string,
  doc_groups: string[] = [],
  conversation_id?: string,
  top_n = 100,
): Promise<ContextWithMetadata[]> {
  const [embedding, { disabled_doc_groups, public_doc_groups }] =
    await Promise.all([
      embedQuery(search_query),
      getDocGroupsForVectorSearch(course_name),
    ])

  return vectorSearchWithDrizzle({
    queryEmbedding: embedding,
    course_name,
    doc_groups,
    disabled_doc_groups,
    public_doc_groups,
    conversation_id,
    top_n,
  })
}
