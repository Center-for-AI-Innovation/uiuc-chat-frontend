// ~/src/pages/api/UIUC-api/getAllCourseNames.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { redisClient } from '~/utils/redisClient'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const all_course_names = await redisClient.hKeys('course_metadatas')
    return res.status(200).json({ all_course_names })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ success: false })
  }
}
