import { NextApiRequest } from 'next'
import { NextResponse } from 'next/server'
import { supabase } from '~/utils/supabaseClient'
import posthog from 'posthog-js'

export const config = {
  runtime: 'edge',
}

const handler = async (req: NextApiRequest) => {
  try {
    if (req.method !== 'POST') {
      console.error('Request method not allowed')
      return NextResponse.json(
        { error: '❌❌ Request method not allowed' },
        { status: 405 },
      )
    }

    // Assuming the body is a ReadableStream, we need to read it correctly.
    // First, we convert the stream into a Response object, then use .json() to parse it.
    const data = await new Response(req.body).json()

    const { uniqueFileName, courseName, readableFilename } = data

    console.log(
      '👉 Submitting to ingest queue:',
      uniqueFileName,
      courseName,
      readableFilename,
    )

    if (!uniqueFileName || !courseName || !readableFilename) {
      console.error('Missing body parameters')
      return NextResponse.json(
        { error: '❌❌ Missing body parameters' },
        { status: 400 },
      )
    }
    // Continue with your logic as before...
    const s3_filepath = `courses/${courseName}/${uniqueFileName}`

    // console.log('👉 Submitting to ingest queue/:', s3_filepath)

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

    return NextResponse.json(responseBody, { status: 200 })
  } catch (error) {
    const err = `❌❌ -- Bottom of /ingest -- Internal Server Error during ingest submission to Beam: ${error}`
    console.error(err)
    return NextResponse.json({ error: err }, { status: 500 })
  }
}
export default handler
