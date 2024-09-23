import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '~/utils/supabaseClient'

// The beam function handles sending to Success and Failure cases. We just handle removing from in-progress.
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    if (req.method !== 'POST') {
      console.error('Request method not allowed')
      return res.status(405).json({ error: '❌❌ Request method not allowed' })
    }

    const parseJSON = (str: string) => {
      try {
        return JSON.parse(str)
      } catch (error) {
        console.error('Error parsing JSON:', error)
        return str
      }
    }

    // Somehow JSON.parse() does not do it recursively... idk.
    const data = typeof req.body === 'string' ? parseJSON(req.body) : req.body
    const parsedData =
      typeof data.data === 'string' ? parseJSON(data.data) : data.data

    // Data:  {
    //   success_ingest: 'courses/t/8885632f-b519-4610-b888-744aa4c2066d-6.pdf',
    //   failure_ingest: null
    // }
    // OR:
    // Data: { error: 'Task timed out' }

    // beam-task-status is SUCCESS (but ingest could have still failed)
    if (parsedData.success_ingest) {
      console.debug('Ingest was SUCCESSFUL:', parsedData)
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
      console.error('Ingest Task failed or timed out. Data:', parsedData)
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
      record![0].error = parsedData.failure_ingest.error

      await supabase.from('documents_failed').insert(record![0])

      return res.status(200).json({ message: 'Success' })
    }
    // else {
    //   console.error(`No success/failure ingest in Beam callback data: ${parsedData}`)
    // }

    return res.status(200).json({ message: 'Success' })
  } catch (error) {
    const err = `❌❌ -- Bottom of /ingestTaskCallback -- Internal Server Error during callback from Beam task completion: ${error}`
    console.error(err)
    return res.status(200).json({ error: err })
  }
}
export default handler
