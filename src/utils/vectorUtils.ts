// vectorUtils.ts — updates doc_groups in vector store via backend (pgvector).
import { type CourseDocument } from '~/types/courseMaterials'
import posthog from 'posthog-js'
import { getBackendUrl } from '~/utils/apiUtils'

/** Response shape from backend /update-doc-groups (for compatibility with callers). */
export interface UpdateDocGroupsResponse {
  status: 'completed'
}

/**
 * Update doc_groups for the given document in the vector store (pgvector) via backend.
 */
export async function updateDocGroupsInVectorStore(
  courseName: string,
  doc: CourseDocument,
): Promise<UpdateDocGroupsResponse> {
  try {
    const backendUrl = getBackendUrl()
    const response = await fetch(`${backendUrl}/update-doc-groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        courseName,
        s3_path: doc.s3_path ?? '',
        url: doc.url ?? '',
        doc_groups: doc.doc_groups ?? [],
      }),
    })
    if (!response.ok) {
      const text = await response.text()
      throw new Error(text || `update-doc-groups ${response.status}`)
    }
    const data = (await response.json()) as UpdateDocGroupsResponse
    return data
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
