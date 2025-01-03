import { NextResponse } from 'next/server'
import { type CourseMetadata } from '~/types/courseMetadata'
import { redisClient } from '~/utils/redisClient'

const setCourseMetadata = async (req: any, res: any) => {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' })
    return NextResponse.json({
      success: false,
      message: 'Method not allowed, only POST requests.',
    })
  }

  const course_name = req.nextUrl.searchParams.get('course_name')
  const course_owner = req.nextUrl.searchParams.get('course_owner')
  const course_intro_message = req.nextUrl.searchParams.get(
    'course_intro_message',
  )
  const banner_image_s3 = req.nextUrl.searchParams.get('banner_image_s3')
  const is_private = JSON.parse(
    req.nextUrl.searchParams.get('is_private') || 'false',
  )
  const course_admins = JSON.parse(
    req.nextUrl.searchParams.get('course_admins') || '["kvday2@illinois.edu"]',
  )
  const approved_emails_list = JSON.parse(
    req.nextUrl.searchParams.get('approved_emails_list') || '[]',
  )
  const openai_api_key = req.nextUrl.searchParams.get('openai_api_key') || ''
  const example_questions = JSON.parse(
    req.nextUrl.searchParams.get('example_questions') || '[]',
  )
  const system_prompt = JSON.parse(
    req.nextUrl.searchParams.get('system_prompt') || '[]',
  )
  const disabled_models = JSON.parse(
    req.nextUrl.searchParams.get('disabled_models') || '[]',
  )
  const project_description = JSON.parse(
    req.nextUrl.searchParams.get('project_description') || '[]',
  )
  const documentsOnly = JSON.parse(
    req.nextUrl.searchParams.get('documentsOnly') || 'false',
  )
  const guidedLearning = JSON.parse(
    req.nextUrl.searchParams.get('guidedLearning') || 'false',
  )
  const systemPromptOnly = JSON.parse(
    req.nextUrl.searchParams.get('systemPromptOnly') || 'false',
  )
  const vector_search_rewrite_disabled = JSON.parse(
    req.nextUrl.searchParams.get('vector_search_rewrite_disabled') || 'false',
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
    }
    console.log('Right before setting course_metadata with: ', course_metadata)
    await redisClient.hSet('course_metadatas', {
      [course_name]: JSON.stringify(course_metadata),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.log(error)
    return NextResponse.json({ success: false })
  }
}

export default setCourseMetadata
