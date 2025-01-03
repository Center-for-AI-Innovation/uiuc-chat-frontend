import { kv } from '@vercel/kv'
import { NextResponse } from 'next/server'
import { CourseMetadata } from '~/types/courseMetadata'
import { redisClient } from '~/utils/redisClient'

export const runtime = 'edge'

const removeUserFromCourse = async (req: any, res: any) => {
  // const { course_name, email_to_remove } = req.query

  const course_name = req.nextUrl.searchParams.get('course_name')
  const email_to_remove = req.nextUrl.searchParams.get('email_to_remove')

  console.log('removeUserFromCourse: course_name', course_name)
  console.log('removeUserFromCourse: email_to_remove', email_to_remove)

  try {
    const courseMetadataString = await redisClient.get(
      course_name + '_metadata',
    )
    if (!courseMetadataString) throw new Error('Course metadata not found')
    const course_metadata = JSON.parse(courseMetadataString) as CourseMetadata

    if (!course_metadata) {
      res.status(500).json({ success: false })
      return
    }

    // Remove just one email
    const remaining_email_addresses = course_metadata[
      'approved_emails_list'
    ].filter((i) => i !== email_to_remove)

    const updated_course_metadata: CourseMetadata = {
      ...course_metadata,
      approved_emails_list: remaining_email_addresses,
    }

    await redisClient.set(
      course_name + '_metadata',
      JSON.stringify(updated_course_metadata),
    )
    // res.status(200).json({ success: true })
    console.log('removeUserFromCourse about to return success')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.log(error)
    // res.status(500).json({ success: false })
    console.log('removeUserFromCourse FAILURE')
    return NextResponse.json({ success: false })
  }
}
export default removeUserFromCourse
