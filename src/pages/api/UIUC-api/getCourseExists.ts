import type { NextApiRequest, NextApiResponse } from 'next'
import { redisClient } from '~/utils/redisClient'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const course_name = req.query.course_name as string

  try {
    const courseExists = await redisClient.hExists(
      'course_metadatas',
      course_name,
    )
    return res.status(200).json(courseExists)
  } catch (error) {
    console.log(error)
    return res.status(500).json(false)
  }
}
