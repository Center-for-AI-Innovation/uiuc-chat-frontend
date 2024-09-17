import { kv } from '@vercel/kv'
import { NextResponse } from 'next/server'
import { type CourseMetadata } from '~/types/courseMetadata'

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
  const is_private = req.nextUrl.searchParams.get('is_private') || 'false'
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
  try {
    const course_metadata: CourseMetadata = {
      is_private: is_private,
      course_owner: course_owner,
      course_admins: course_admins,
      approved_emails_list: approved_emails_list,
      course_intro_message: course_intro_message,
      banner_image_s3: banner_image_s3,
      openai_api_key: openai_api_key,
      example_questions: example_questions,
      system_prompt: system_prompt,
      disabled_models: disabled_models,
      project_description: project_description,
    }
    console.log('Right before setting course_metadata with: ', course_metadata)
    await kv.hset('course_metadatas', { [course_name]: course_metadata })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.log(error)
    return NextResponse.json({ success: false })
  }
}

export default setCourseMetadata
