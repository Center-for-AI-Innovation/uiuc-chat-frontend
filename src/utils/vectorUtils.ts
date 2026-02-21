// vectorUtils.ts — updates doc_groups in the vector store (pgvector) via Drizzle.
import { and, eq, or, sql } from 'drizzle-orm'
import { type CourseDocument } from '~/types/courseMaterials'
import posthog from 'posthog-js'
import { db } from '~/db/dbClient'
import { embeddings } from '~/db/schema'

/** Response shape for compatibility with callers. */
export interface UpdateDocGroupsResponse {
  status: 'completed'
}

/**
 * Update doc_groups for the given document in the embeddings table (pgvector) via Drizzle.
 * Matches backend logic: WHERE course_name AND s3_path AND (url = $url or url IS NULL/empty).
 */
export async function updateDocGroupsInVectorStore(
  courseName: string,
  doc: CourseDocument,
): Promise<UpdateDocGroupsResponse> {
  try {
    const s3_path = doc.s3_path ?? ''
    const url = doc.url ?? ''
    const doc_groups = doc.doc_groups ?? []

    const where =
      url !== ''
        ? and(
            eq(embeddings.course_name, courseName),
            eq(embeddings.s3_path, s3_path),
            eq(embeddings.url, url),
          )
        : and(
            eq(embeddings.course_name, courseName),
            eq(embeddings.s3_path, s3_path),
            or(sql`${embeddings.url} IS NULL`, eq(embeddings.url, '')),
          )

    await db
      .update(embeddings)
      .set({
        doc_groups,
        updated_at: new Date(),
      })
      .where(where)

    return { status: 'completed' }
  } catch (error) {
    console.error('Error in updateDocGroupsInVectorStore:', error)
    posthog.capture('add_doc_group', {
      course_name: courseName,
      doc_readable_filename: doc.readable_filename,
      doc_unique_identifier:
        doc.url && doc.url !== ''
          ? doc.url
          : doc.s3_path && doc.s3_path !== ''
            ? doc.s3_path
            : null,
      doc_groups: doc.doc_groups,
      error_logs: error,
    })
    throw error
  }
}
