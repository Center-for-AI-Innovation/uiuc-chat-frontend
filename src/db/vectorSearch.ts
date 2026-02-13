/**
 * Frontend vector search using Drizzle + pgvector.
 */

import { and, eq, or, sql } from 'drizzle-orm'
import { db } from './dbClient'
import { embeddings } from './schema'
import type { ContextWithMetadata } from '~/types/chat'

export interface VectorSearchParams {
  /** Query embedding from embedding API (e.g. backend or OpenAI). */
  queryEmbedding: number[]
  course_name: string
  doc_groups: string[]
  disabled_doc_groups: string[]
  public_doc_groups: { course_name: string; name: string; enabled: boolean }[]
  conversation_id?: string
  top_n?: number
}

/**
 * Run vector search on the embeddings table using Drizzle.
 * Filter logic mirrors backend _create_search_filter and conversation handling.
 */
export async function vectorSearchWithDrizzle(
  params: VectorSearchParams,
): Promise<ContextWithMetadata[]> {
  const {
    queryEmbedding,
    course_name,
    doc_groups,
    disabled_doc_groups,
    public_doc_groups,
    conversation_id,
    top_n = 100,
  } = params

  // Pass vector as single string to avoid Postgres "ROW expressions can have at most 1664 entries" (embedding has 4096 dims)
  const vectorLiteral = '[' + queryEmbedding.join(',') + ']'
  const scoreExpr = sql<number>`(1 - (${embeddings.embedding} <=> ${vectorLiteral}::vector))`
  const orderByDistance = sql`${embeddings.embedding} <=> ${vectorLiteral}::vector`

  if (conversation_id) {
    // Chat: (regular course chunks OR conversation-specific chunks)
    const regularCondition = and(
      or(
        sql`${embeddings.conversation_id} IS NULL`,
        eq(embeddings.conversation_id, ''),
      ),
      buildShouldCondition(
        embeddings,
        course_name,
        doc_groups,
        public_doc_groups,
      ),
      buildMustNotCondition(embeddings, disabled_doc_groups),
    )
    const conversationCondition = eq(
      embeddings.conversation_id,
      conversation_id,
    )
    const whereClause = or(regularCondition!, conversationCondition)!
    const rows = await db
      .select({
        id: embeddings.id,
        page_content: embeddings.page_content,
        readable_filename: embeddings.readable_filename,
        course_name: embeddings.course_name,
        s3_path: embeddings.s3_path,
        pagenumber: embeddings.pagenumber,
        url: embeddings.url,
        base_url: embeddings.base_url,
        score: scoreExpr,
      })
      .from(embeddings)
      .where(whereClause)
      .orderBy(orderByDistance)
      .limit(top_n)
    return rows.map((row) => rowToContext(row))
  }

  // No conversation: only course chunks (conversation_id empty)
  const whereClause = and(
    or(
      sql`${embeddings.conversation_id} IS NULL`,
      eq(embeddings.conversation_id, ''),
    ),
    buildShouldCondition(
      embeddings,
      course_name,
      doc_groups,
      public_doc_groups,
    ),
    buildMustNotCondition(embeddings, disabled_doc_groups),
  )

  const rows = await db
    .select({
      id: embeddings.id,
      page_content: embeddings.page_content,
      readable_filename: embeddings.readable_filename,
      course_name: embeddings.course_name,
      s3_path: embeddings.s3_path,
      pagenumber: embeddings.pagenumber,
      url: embeddings.url,
      base_url: embeddings.base_url,
      score: scoreExpr,
    })
    .from(embeddings)
    .where(whereClause)
    .orderBy(orderByDistance)
    .limit(top_n)

  return rows.map((row) => rowToContext(row))
}

/** JSONB overlap (row has any of these doc group names). Use @> containment since && is not supported for jsonb in PostgreSQL. */
function docGroupsOverlapCondition(table: typeof embeddings, names: string[]) {
  if (names.length === 0) return undefined
  if (names.length === 1)
    return sql`(${table.doc_groups} @> ${JSON.stringify([names[0]])}::jsonb)`
  return or(
    ...names.map(
      (n) => sql`(${table.doc_groups} @> ${JSON.stringify([n])}::jsonb)`,
    ),
  )!
}

function buildShouldCondition(
  table: typeof embeddings,
  course_name: string,
  doc_groups: string[],
  public_doc_groups: { course_name: string; name: string; enabled: boolean }[],
) {
  const ownCourse =
    doc_groups.length > 0 && !doc_groups.includes('All Documents')
      ? and(
          eq(table.course_name, course_name),
          docGroupsOverlapCondition(table, doc_groups),
        )
      : eq(table.course_name, course_name)

  const publicConditions = public_doc_groups
    .filter((p) => p.enabled)
    .map((p) =>
      and(
        eq(table.course_name, p.course_name),
        docGroupsOverlapCondition(table, [p.name]),
      ),
    )

  if (publicConditions.length === 0) return ownCourse!
  return or(ownCourse!, ...publicConditions)!
}

function buildMustNotCondition(
  table: typeof embeddings,
  disabled_doc_groups: string[],
) {
  if (disabled_doc_groups.length === 0) return undefined
  const overlap = docGroupsOverlapCondition(table, disabled_doc_groups)
  if (!overlap) return undefined
  return sql`NOT (${overlap})`
}

function rowToContext(row: {
  id: number
  page_content: string | null
  readable_filename: string | null
  course_name: string | null
  s3_path: string | null
  pagenumber: string | null
  url: string | null
  base_url: string | null
}): ContextWithMetadata {
  return {
    id: row.id,
    text: row.page_content ?? '',
    readable_filename: row.readable_filename ?? '',
    course_name: row.course_name ?? '',
    'course_name ': row.course_name ?? '',
    s3_path: row.s3_path ?? '',
    pagenumber: row.pagenumber ?? '',
    url: row.url ?? '',
    base_url: row.base_url ?? '',
  }
}
