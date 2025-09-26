import { type NextApiResponse } from 'next'
import { withAuth, type AuthenticatedRequest } from '~/utils/authMiddleware'
import { NextResponse } from 'next/server'
import { type CourseMetadata } from '~/types/courseMetadata'
import { ensureRedisConnected } from '~/utils/redisClient'
import { withCourseOwnerOrAdminAccess } from '~/pages/api/authorization'

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' })
    return res.status(500).json({
      success: false,
      message: 'Method not allowed, only POST requests.',
    })
  }

  const course_name = req.query.course_name as string
  const course_owner = req.query.course_owner as string
  const course_intro_message = req.query.course_intro_message as string
  const banner_image_s3 = req.query.banner_image_s3 as string
  const is_private = JSON.parse((req.query.is_private as string) || 'false')
  const course_admins = JSON.parse(
    (req.query.course_admins as string) || '["rohan13@illinois.edu"]',
  )
  const approved_emails_list = JSON.parse(
    (req.query.approved_emails_list as string) || '[]',
  )
  const openai_api_key = (req.query.openai_api_key as string) || ''
  const example_questions = JSON.parse(
    (req.query.example_questions as string) || '[]',
  )
  const system_prompt = JSON.parse((req.query.system_prompt as string) || '[]')
  const disabled_models = JSON.parse(
    (req.query.disabled_models as string) || '[]',
  )
  const project_description = JSON.parse(
    (req.query.project_description as string) || '[]',
  )
  const documentsOnly = JSON.parse(
    (req.query.documentsOnly as string) || 'false',
  )
  const guidedLearning = JSON.parse(
    (req.query.guidedLearning as string) || 'false',
  )
  const systemPromptOnly = JSON.parse(
    (req.query.systemPromptOnly as string) || 'false',
  )
  const vector_search_rewrite_disabled = JSON.parse(
    (req.query.vector_search_rewrite_disabled as string) || 'false',
  )
  const allow_logged_in_users = JSON.parse(
    (req.query.allow_logged_in_users as string) || 'false',
  )

  try {
    const course_metadata: CourseMetadata = {
      is_private,
      course_owner,
      course_admins,
      approved_emails_list,
      course_intro_message,
      banner_image_s3,
      openai_api_key,
      example_questions,
      system_prompt,
      disabled_models,
      project_description,
      documentsOnly,
      guidedLearning,
      systemPromptOnly,
      vector_search_rewrite_disabled,
      allow_logged_in_users,
    }
    console.log('Right before setting course_metadata with: ', course_metadata)
    const redisClient = await ensureRedisConnected()
    await redisClient.hSet('course_metadatas', {
      [course_name]: JSON.stringify(course_metadata),
    })

    return res.status(200).json({ success: true })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ success: false })
  }
}

export default withCourseOwnerOrAdminAccess()(handler)
