import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '~/utils/supabaseClient'
import posthog from 'posthog-js'

type IngestResponse = {
  task_id?: string
  error?: string
}

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<IngestResponse>
) => {
  try {
    if (req.method !== 'POST') {
      console.error('Request method not allowed')
      return res.status(405).json({
        error: '❌❌ Request method not allowed'
      })
    }

    const { uniqueFileName, courseName, readableFilename } = req.body

    console.log(
      '👉 Submitting to ingest queue:',
      uniqueFileName,
      courseName,
      readableFilename,
    )

    if (!uniqueFileName || !courseName || !readableFilename) {
      console.error('Missing body parameters')
      return res.status(400).json({
        error: '❌❌ Missing body parameters'
      })
    }

    const s3_filepath = `courses/${courseName}/${uniqueFileName}`

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
          readable_filename: readableFilename,
          s3_paths: s3_filepath,
        }),
      },
    )

    const responseBody = await response.json()
    console.log(
      `📤 Submitted to ingest queue: ${s3_filepath}. Response status: ${response.status}`,
      responseBody,
    )

    // Send to ingest-in-progress table
    const { error } = await supabase.from('documents_in_progress').insert({
      s3_path: s3_filepath,
      course_name: courseName,
      readable_filename: readableFilename,
      beam_task_id: responseBody.task_id,
    })

    if (error) {
      console.error(
        '❌❌ Supabase failed to insert into `documents_in_progress`:',
        error,
      )
      posthog.capture('supabase_failure_insert_documents_in_progress', {
        s3_path: s3_filepath,
        course_name: courseName,
        readable_filename: readableFilename,
        error: error.message,
        beam_task_id: responseBody.task_id,
      })
    }

    return res.status(200).json(responseBody)
  } catch (error) {
    const err = `❌❌ -- Bottom of /ingest -- Internal Server Error during ingest submission to Beam: ${error}`
    console.error(err)
    return res.status(500).json({ error: err })
  }
}

export default handler
