import { NextApiRequest } from 'next'
import { NextResponse } from 'next/server'

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
    console.log('body:', data)

    const { courseName, canvas_url, selectedCanvasOptions } = data

    console.log(
      '👉 Submitting to Canvas ingest queue:',
      canvas_url,
      courseName,
      selectedCanvasOptions,
    )

    if (!courseName || !canvas_url) {
      console.error('Missing body parameters')
      return NextResponse.json(
        { error: '❌❌ Missing body parameters' },
        { status: 400 },
      )
    }

    const response = await fetch(
      'https://app.beam.cloud/endpoint/canvas_ingest/latest',
      {
        method: 'POST',
        headers: {
          Accept: '*/*',
          'Accept-Encoding': 'gzip, deflate',
          Authorization: `Bearer ${process.env.BEAM_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // course_name: courseName,
          // readable_filename: readableFilename,
          // s3_paths: s3_filepath,

          canvas_url: canvas_url,
          course_name: courseName,
          files: selectedCanvasOptions.includes('files') ? 'true' : 'false',
          pages: selectedCanvasOptions.includes('pages') ? 'true' : 'false',
          modules: selectedCanvasOptions.includes('modules') ? 'true' : 'false',
          syllabus: selectedCanvasOptions.includes('syllabus')
            ? 'true'
            : 'false',
          assignments: selectedCanvasOptions.includes('assignments')
            ? 'true'
            : 'false',
          discussions: selectedCanvasOptions.includes('discussions')
            ? 'true'
            : 'false',
        }),
      },
    )

    const responseBody = await response.json()
    console.log(
      `📤 Submitted to ingest queue: ${canvas_url}. Response status: ${response.status}`,
      responseBody,
    )
    return NextResponse.json(responseBody, { status: 200 })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      {
        error: `❌❌ -- Bottom of /ingest -- Internal Server Error during ingest submission to Beam: ${error}`,
      },
      { status: 500 },
    )
  }
}
export default handler
