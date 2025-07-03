import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '~/utils/supabaseClient'
import { v4 as uuidv4 } from 'uuid'

type ChatFileUploadResponse = {
  success?: boolean
  fileUploadId?: string
  message?: string
  error?: string
  beam_task_id?: string
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

    console.log('Processing chat file upload:', {
      conversationId,
      courseName,
      s3Key,
      fileName,
      fileType,
    })

    // Validate required parameters
    if (!conversationId || !courseName || !s3Key || !fileName) {
      console.error('Missing required parameters')
      return res.status(400).json({
        error:
          ' Missing required parameters: conversationId, courseName, s3Key, fileName',
      })
    }

    // 1. Verify conversation exists
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id, user_email')
      .eq('id', conversationId)
      .single()

    if (convError || !conversation) {
      console.error('Conversation not found:', conversationId, convError)
      return res.status(404).json({
        error: ' Conversation not found',
      })
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

    // 3. Call your existing ingest endpoint with conversation context
    const s3_filepath = s3Key // s3Key should already be the full path

    const response = await fetch(
      'https://app.beam.cloud/taskqueue/ingest_task_queue/latest',
      {
        method: 'POST',
        headers: {
          Accept: '*/*',
          'Accept-Encoding': 'gzip, deflate',
          Authorization: `Bearer ${process.env.BEAM_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          course_name: courseName,
          readable_filename: fileName,
          s3_paths: s3_filepath,
          conversation_id: conversationId, // Pass to backend for chat context
          is_chat_upload: true, // Flag to indicate this is a chat upload
        }),
      },
    )

    const responseBody = await response.json()
    console.log('Submitted chat file to ingest queue', {
      s3_filepath,
      responseStatus: response.status,
      responseBody,
    })

    if (!response.ok) {
      // Mark as failed in file_uploads
      await supabase
        .from('file_uploads')
        .update({
          contexts: { error: 'Ingest failed', details: responseBody },
          updated_at: new Date().toISOString(),
        })
        .eq('id', fileUploadId)

      console.error('Ingest failed for chat file:', responseBody)
      return res.status(500).json({
        error: 'Failed to process file',
      })
    }

    // 4. Update file_uploads with success and task_id - use original pattern
    await supabase
      .from('file_uploads')
      .update({
        contexts: {
          status: 'processing',
          beam_task_id: responseBody.task_id,
          submitted_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', fileUploadId)

    console.log('Chat file upload successful:', fileUploadId)

    res.status(200).json({
      success: true,
      fileUploadId,
      message: 'File uploaded and processing started',
      beam_task_id: responseBody.task_id,
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
