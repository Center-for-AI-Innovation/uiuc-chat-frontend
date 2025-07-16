import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '~/utils/supabaseClient'
import { v4 as uuidv4 } from 'uuid'

type ChatFileUploadResponse = {
  success?: boolean
  fileUploadId?: string
  message?: string
  error?: string
  beam_task_id?: string
  details?: string
  chunks_created?: number
}

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<ChatFileUploadResponse>,
) => {
  try {
    if (req.method !== 'POST') {
      console.error('Request method not allowed')
      return res.status(405).json({
        error: ' Request method not allowed',
      })
    }

    const { conversationId, courseName, s3Key, fileName, fileType } = req.body

    // Validate required parameters
    if (!conversationId || !courseName || !s3Key || !fileName) {
      console.error('Missing required parameters')
      return res.status(400).json({
        error:
          ' Missing required parameters: conversationId, courseName, s3Key, fileName',
      })
    }

    // 1. Verify conversation exists
    const { data: existingConv, error: findError } = await supabase
      .from('conversations')
      .select('id, user_email')
      .eq('id', conversationId)
      .maybeSingle()

    if (!existingConv) {
      if (findError) {
        console.error('Error checking conversation:', findError)
        return res.status(500).json({ error: 'Database error' })
      }
      // Create conversation with ALL required fields
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({
          id: conversationId,
          name: 'File Upload Conversation', // ✅ Required field added
          user_email: 'placeholder@example.com',
          project_name: courseName, // ✅ Correct column name
          model: 'gpt-4o-mini',
          prompt: 'You are a helpful assistant.',
          temperature: 0.7,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('id, user_email')
        .single()

      if (convError || !newConv) {
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

    // 2. Create file_uploads record
    const fileUploadId = uuidv4()
    const { error: uploadError } = await supabase.from('file_uploads').insert({
      id: fileUploadId,
      conversation_id: conversationId,
      s3_path: s3Key,
      readable_filename: fileName,
      course_name: courseName,
      created_at: new Date().toISOString(),
    })

    if (uploadError) {
      console.error(' Failed to create file_upload record:', uploadError)
      return res.status(500).json({
        error: ' Failed to create file record',
      })
    }

    // 3. Call your new chat file processing endpoint
    const s3_filepath = s3Key // s3Key should already be the full path

    const response = await fetch(
      'https://flask-production-751b.up.railway.app/process-chat-file',
      //'http://localhost:8000/process-chat-file',
      {
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
          user_id: 'placeholder@example.com', // Placeholder, will be updated later
        }),
      },
    )

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

    // 4. Update file_uploads with success and task_id
    await supabase
      .from('file_uploads')
      .update({
        contexts: {
          status: 'completed',
          chunks_created: responseBody.chunks_created || 0,
          completed_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', fileUploadId)

    // ✅ Return success only after processing is complete
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

export default handler
