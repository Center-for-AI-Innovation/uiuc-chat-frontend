import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/utils/supabaseClient'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  console.log('In deleteMessages handler')
  const { method } = req
  if (method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE'])
    res.status(405).end(`Method ${method} Not Allowed`)
    return
  }
  const {
    messageIds,
    user_email: userEmail,
    course_name: courseName,
  } = req.body as {
    messageIds: string[]
    user_email: string
    course_name: string
  }
  console.log('Deleting messages: ', messageIds)

  if (!messageIds || !Array.isArray(messageIds) || !messageIds.length) {
    res.status(400).json({ error: 'No valid message ids provided' })
    return
  }
  if (!userEmail || typeof userEmail !== 'string') {
    res.status(400).json({ error: 'No valid user email provided' })
    return
  }
  if (!courseName || typeof courseName !== 'string') {
    res.status(400).json({ error: 'No valid course name provided' })
    return
  }

  try {
    const { data, error } = await supabase
      .from('messages')
      .delete()
      .in('id', messageIds)

    if (error) throw error

    res.status(200).json({ message: 'Messages deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
}
