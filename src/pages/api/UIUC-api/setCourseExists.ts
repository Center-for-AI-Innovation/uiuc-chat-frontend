import { redisClient } from '~/utils/redisClient'

// export const runtime = "edge";
// doesn't seem to work...

const setCourseExists = async (req: any, res: any) => {
  console.log('the req body:')
  console.log(req.body)
  const { course_name } = req.body

  try {
    await redisClient.set(course_name, 'true')
    res.status(200).json({ success: true })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false })
  }
}

export default setCourseExists
