import type { NextApiRequest, NextApiResponse } from 'next'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    if (req.method !== 'POST') {
      console.error('Request method not allowed')
      return res.status(405).json({ error: '❌❌ Request method not allowed' })
    }

    const { courseName, canvas_url, selectedCanvasOptions } = req.body

    console.log(
      '👉 Submitting to Canvas ingest queue:',
      canvas_url,
      courseName,
      selectedCanvasOptions,
    )

    if (!courseName || !canvas_url) {
      console.error('Missing body parameters')
      return res.status(400).json({ error: '❌❌ Missing body parameters' })
    }

    console.log("About to send transactional email")

    // Send email to kastan alerting that he needs to approve a canvas course 
    const sendEmailResponse = await fetch(
      `https://flask-production-751b.up.railway.app/send-transactional-email`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to_recipients_list: ['kvday2@illinois.edu', 'rohan13@illinois.edu', 'avd6@illinois.edu'],
          bcc_recipients_list: [],
          sender: 'kvday2@illinois.edu',
          subject: 'New Canvas Course Ingestion Request',
          body_text: `New Canvas course ingestion request received:
Course Name: ${courseName}
Canvas URL: ${canvas_url}
Selected Options: ${selectedCanvasOptions.join(', ')}
Please review and approve at https://canvas.illinois.edu/ using account uiuc.chat@ad.uillinois.edu.`
        }),
      },
    )
    // const emailResponseBody = await sendEmailResponse.json()
    // Add error checking for the response
    if (!sendEmailResponse.ok) {
      console.error(`Email API responded with status: ${sendEmailResponse.status}`);
    }
    // console.debug("Sent email to Kastan to alert him of new Canvas ingest")

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
    return res.status(200).json(responseBody)
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      error: `❌❌ -- Bottom of /ingest -- Internal Server Error during ingest submission to Beam: ${error}`,
    })
  }
}

export default handler
