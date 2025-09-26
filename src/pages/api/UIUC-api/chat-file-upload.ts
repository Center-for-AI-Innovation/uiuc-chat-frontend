import { type NextApiResponse } from 'next'
import { type AuthenticatedRequest } from '~/utils/authMiddleware'
import {
  db,
  conversations as conversationsTable,
  fileUploads,
} from '~/db/dbClient'
import { v4 as uuidv4 } from 'uuid'
import { getBackendUrl } from '~/utils/apiUtils'
import { eq } from 'drizzle-orm'
import { withCourseAccessFromRequest } from '~/pages/api/authorization'

type ChatFileUploadResponse = {
  success?: boolean
  fileUploadId?: string
  message?: string
  error?: string
  details?: string
  chunks_created?: number
}

const handler = async (
  req: AuthenticatedRequest,
  res: NextApiResponse<ChatFileUploadResponse>,
) => {
  try {
    if (req.method !== 'POST') {
      console.error('Request method not allowed')
      return res.status(405).json({
        error: ' Request method not allowed',
      })
    }

    const {
      conversationId,
      courseName,
      user_id,
      s3Key,
      fileName,
      fileType,
      model,
    } = req.body

    // Validate required parameters
    if (!conversationId || !courseName || !user_id || !s3Key || !fileName) {
      console.error('Missing required parameters')
      return res.status(400).json({
        error:
          ' Missing required parameters: conversationId, courseName, user_id s3Key, fileName',
      })
    }

    // 1. Verify conversation exists
    const existingConv = await db
      .select({
        id: conversationsTable.id,
        user_email: conversationsTable.user_email,
      })
      .from(conversationsTable)
      .where(eq(conversationsTable.id, conversationId))
      .limit(1)

    if (existingConv.length === 0) {
      // Create conversation with ALL required fields
      try {
        await db.insert(conversationsTable).values({
          id: conversationId,
          name: 'File Upload Conversation', // Required field added
          user_email: user_id,
          project_name: courseName, // Correct column name
          model: model || 'gpt-4o-mini',
          prompt: 'You are a helpful assistant.',
          temperature: 0.7,
          created_at: new Date(),
          updated_at: new Date(),
        })
      } catch (convError) {
        console.error(
          'Failed to create conversation:',
          conversationId,
          convError,
        )
        return res.status(500).json({
          error: 'Failed to create conversation',
        })
      }
    }

    // 2. Create file_uploads record for chat file tracking
    const fileUploadId = uuidv4()
    try {
      await db.insert(fileUploads).values({
        id: fileUploadId,
        conversation_id: conversationId,
        s3_path: s3Key,
        readable_filename: fileName,
        course_name: courseName,
        contexts: {
          status: 'processing_for_chat',
          user_id: user_id,
          created_at: new Date().toISOString(),
        },
        created_at: new Date(),
      })
    } catch (uploadError) {
      console.error(' Failed to create file_uploads record:', uploadError)
      return res.status(500).json({
        error: ' Failed to create file upload record',
      })
    }

    // 3. Call your new chat file processing endpoint
    const s3_filepath = s3Key // s3Key should already be the full path
    // Get user email from the conversation record we already fetched
    const userEmail = existingConv[0]?.user_email || user_id

    const backendUrl = getBackendUrl()
    //const backendUrl = 'http://localhost:8000';

    const response = await fetch(`${backendUrl}/process-chat-file`, {
      method: 'POST',
      headers: {
        Accept: '*/*',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversation_id: conversationId,
        s3_path: s3_filepath,
        readable_filename: fileName,
        user_id: userEmail,
        course_name: courseName,
      }),
    })

    if (!response.ok) {
      console.error(
        `Flask backend error: ${response.status} ${response.statusText}`,
      )
      const errorText = await response.text()
      console.error('Backend response:', errorText.substring(0, 500))

      return res.status(500).json({
        error: `Backend processing failed: ${response.status}`,
        details: response.statusText,
      })
    }

    let responseBody
    try {
      responseBody = await response.json()
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      return res.status(500).json({
        error: 'Failed to parse backend response',
        details:
          parseError instanceof Error ? parseError.message : String(parseError),
      })
    }

    // 4. Update file_uploads with completion status
    try {
      await db
        .update(fileUploads)
        .set({
          contexts: {
            status: 'completed',
            chunks_created: responseBody.chunks_created || 0,
            completed_at: new Date().toISOString(),
          },
        })
        .where(eq(fileUploads.id, fileUploadId))
    } catch (updateError) {
      console.error('Failed to update file upload status:', updateError)
      // Continue anyway since the main processing was successful
    }

    // Return success only after processing is complete
    res.status(200).json({
      success: true,
      fileUploadId,
      message: 'File processed and ready for chat',
      chunks_created: responseBody.chunks_created,
    })
  } catch (error) {
    // Fix: Avoid string interpolation with potentially unsafe content
    console.error(
      'Bottom of /chat-file-upload -- Internal Server Error:',
      error,
    )

    return res.status(500).json({
      error: 'Internal Server Error occurred in chat file upload',
    })
  }
}

export default withCourseAccessFromRequest('any')(handler)
