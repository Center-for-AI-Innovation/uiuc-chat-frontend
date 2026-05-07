// vectorUtils.ts — dispatches doc_groups payload writes to either an
// external Qdrant (per-project override or shared) or to host pgvector
// (Drizzle UPDATE on the embeddings table). The engine is decided per
// project by ConnectionManager.resolveVectorEngine.
import { and, eq, or, sql } from 'drizzle-orm'
import { type CourseDocument } from '~/types/courseMaterials'
import posthog from 'posthog-js'
import { connectionManager } from '~/utils/connectionManager'
import { embeddings } from '~/db/schema'

export interface UpdateDocGroupsResponse {
  status: 'completed'
}

export async function updateDocGroupsInVectorStore(
  courseName: string,
  doc: CourseDocument,
): Promise<UpdateDocGroupsResponse> {
  try {
    const engine = await connectionManager.resolveVectorEngine(courseName)
    if (engine.kind === 'qdrant') {
      await setQdrantDocGroupsPayload(
        engine.client,
        engine.collection,
        courseName,
        doc,
      )
    } else {
      await setPgvectorDocGroups(courseName, doc)
    }
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

async function setQdrantDocGroupsPayload(
  client: { setPayload: (collection: string, body: any) => Promise<unknown> },
  collection: string,
  courseName: string,
  doc: CourseDocument,
): Promise<void> {
  const searchFilter = {
    must: [
      { key: 'course_name', match: { value: courseName } },
      ...(doc.url ? [{ key: 'url', match: { value: doc.url } }] : []),
      { key: 's3_path', match: { value: doc.s3_path ? doc.s3_path : '' } },
    ],
  }
  await client.setPayload(collection, {
    payload: { doc_groups: doc.doc_groups },
    filter: searchFilter,
  })
}

async function setPgvectorDocGroups(
  courseName: string,
  doc: CourseDocument,
): Promise<void> {
  // Drizzle UPDATE on the host embeddings table.
  // Match backend logic: WHERE course_name AND s3_path AND (url = $url or url IS NULL/empty).
  const db = connectionManager.getHostDb()
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
}
