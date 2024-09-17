import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '~/utils/supabaseClient'

// The beam function handles sending to Success and Failure cases. We just handle removing from in-progress.
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    if (req.method !== 'POST') {
      console.error('Request method not allowed')
      return res.status(405).json({ error: '❌❌ Request method not allowed' })
    }
    let data
    if (typeof req.body === 'string') {
      try {
        data = JSON.parse(req.body)
      } catch (error) {
        console.error('Error parsing JSON:', error)
        data = req.body // Use the raw body if parsing fails
      }
    } else {
      data = req.body // If it's already an object, use it directly
    }

    console.log('Received callback data:', data) // Log the received data for debugging
    console.log('req.headers', req.headers)
    let parsedData = data.data
    console.log('parsedData before parsing:', parsedData) // Log the data before parsing
    console.log('parsedData before parsing typeof:', typeof parsedData) // Log the type before parsing

    // Parse data.data if it's a string
    if (typeof parsedData === 'string') {
      try {
        parsedData = JSON.parse(parsedData)
      } catch (error) {
        console.error('Error parsing data.data:', error)
        // If parsing fails, keep the original string
      }
    }

    console.log('parsedData after parsing:', parsedData) // Log the parsed data
    console.log('parsedData after parsing typeof:', typeof parsedData) // Log the type after parsing

    // Data:  {
    //   success_ingest: 'courses/t/8885632f-b519-4610-b888-744aa4c2066d-6.pdf',
    //   failure_ingest: null
    // }
    // OR:
    // Data: { error: 'Task timed out' }

    // beam-task-status is SUCCESS (but ingest could have still failed)
    if (data.success_ingest) {
      console.debug('Ingest was SUCCESSFUL:', data)
      const { data: record, error: delErr } = await supabase
        .from('documents_in_progress')
        .delete()
        .eq('beam_task_id', req.headers['x-task-id'])
    } else {
      // If failure_ingest or Beam task is FAILED or TIMEOUT
      // assume failures if success is not explicity defined (above)
      //  if (
      //   data.failure_ingest ||
      //   req.headers['x-beam-task-status'] === 'FAILED' ||
      //   req.headers['x-beam-task-status'] === 'TIMEOUT'
      // )
      console.error('Ingest Task failed or timed out. Data:', data)
      // Remove from in progress, add to failed
      const { data: record, error: delErr } = await supabase
        .from('documents_in_progress')
        .delete()
        .eq('beam_task_id', req.headers['x-task-id'])
        .select()
      // remove a few fields from record, the beam_task_id is not needed
      delete record![0].beam_task_id
      delete record![0].created_at

      // Add error message, either specific one or "timeout" from Beam body.
      record![0].error = data.failure_ingest.error

      await supabase.from('documents_failed').insert(record![0])

      return res.status(200).json({ message: 'Success' })
    }
    // else {
    //   console.error(`No success/failure ingest in Beam callback data: ${data}`)
    // }

    return res.status(200).json({ message: 'Success' })
  } catch (error) {
    const err = `❌❌ -- Bottom of /ingestTaskCallback -- Internal Server Error during callback from Beam task completion: ${error}`
    console.error(err)
    return res.status(200).json({ error: err })
  }
}
export default handler
