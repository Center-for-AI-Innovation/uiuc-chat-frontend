import { type NextApiResponse } from 'next'
import { withCourseAccessFromRequest } from '~/pages/api/authorization'
import { type AuthenticatedRequest } from '~/utils/authMiddleware'
import type { DocumentSummary } from '~/components/UIUC-Components/chatbots-hub/chatbots.types'
import { db } from '~/db/dbClient'
import { documents } from '~/db/schema'
import { count, eq, sql } from 'drizzle-orm'

const fileTypeCase = sql<string>`
    CASE
      WHEN ${documents.url} IS NOT NULL AND (${documents.s3_path} IS NULL OR ${documents.s3_path} = '') THEN 'Websites-crawled'
      WHEN ${documents.readable_filename} ~* '\\.(mp4|mov|avi|mkv|webm)$'       THEN 'Video'
      WHEN ${documents.readable_filename} ~* '\\.pdf$'                           THEN 'PDF'
      WHEN ${documents.readable_filename} ~* '\\.(pptx?|key)$'                   THEN 'PowerPoint'
      WHEN ${documents.readable_filename} ~* '\\.(jpe?g|png|gif|webp|svg|bmp)$'  THEN 'Images'
      WHEN ${documents.readable_filename} ~* '\\.(txt|md|rtf|csv|srt|vtt)$'      THEN 'Text Files'
      WHEN ${documents.readable_filename} ~* '\\.(docx?)$'                       THEN 'Word Documents'
      WHEN ${documents.readable_filename} ~* '\\.(mp3|wav|ogg|flac|m4a)$'        THEN 'Audio'
      WHEN ${documents.readable_filename} ~* '\\.(xlsx?|numbers)$'               THEN 'Excel'
      WHEN ${documents.readable_filename} ~* '\\.(py|js|ts|jsx|tsx|java|c|cpp|go|rs|rb|sh)$' THEN 'Code'
      ELSE 'Other'
    END
  `

export default withCourseAccessFromRequest('any')(handler)

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res
      .status(405)
      .json({ success: false, error: `Method ${req.method} Not Allowed` })
  }

  const course_name = req.query.course_name as string

  if (!course_name) {
    return res
      .status(400)
      .json({ success: false, error: 'course_name is required' })
  }

  try {
    const data = await db
      .select({
        file_type: fileTypeCase,
        file_count: count(),
      })
      .from(documents)
      .where(eq(documents.course_name, course_name))
      .groupBy(fileTypeCase)

    // Include file size once supported
    const documentSummary = data.reduce(
      (prev: DocumentSummary, current) => {
        const { file_count = 0, file_type = '' } = current || {}

        return {
          total_file_count: prev.total_file_count + file_count,
          total_size_bytes: prev.total_size_bytes,
          by_type: [
            ...prev.by_type,
            {
              type: file_type,
              file_count,
              total_size_bytes: 0,
            },
          ],
        }
      },
      {
        total_file_count: 0,
        total_size_bytes: 0,
        by_type: [],
      } as DocumentSummary,
    )

    res.status(200).json({ success: true, documentSummary })
  } catch (error) {
    console.log('Error occurred while fetching document summary', error)
    res.status(500).json({ success: false, error: error })
  }
}
