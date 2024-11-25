// upsertCourseMetadata.ts
import { kv } from '@vercel/kv'
import { type CourseMetadataOptionalForUpsert } from '~/types/courseMetadata'
import { type NextRequest, NextResponse } from 'next/server'
import { encrypt, isEncrypted } from '~/utils/crypto'
import { getCourseMetadata } from './getCourseMetadata'

export const runtime = 'edge'

export default async function handler(req: NextRequest, res: NextResponse) {
  const requestBody = await req.text()
  const {
    courseName,
    courseMetadata,
  }: { courseName: string; courseMetadata: CourseMetadataOptionalForUpsert } =
    JSON.parse(requestBody)

  // console.log('API Request:', requestBody)
  // console.log('courseName:', courseName)
  // console.log('courseMetadata:', courseMetadata)

  // Check if courseName is not null or undefined
  if (!courseName) {
    console.error('Error: courseName is null or undefined')
    return
  }

  try {
    const existing_metadata = await getCourseMetadata(courseName)

    // Combine the existing metadata with the new metadata, prioritizing the new values (order matters!)
    const combined_metadata = { ...existing_metadata, ...courseMetadata }

    console.log('-----------------------------------------')
    console.log('EXISTING course metadata:', existing_metadata)
    console.log('passed into upsert metadata:', courseMetadata)
    console.log('FINAL COMBINED course metadata:', combined_metadata)
    console.log('^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^')

    // Check if combined_metadata doesn't have anything in the field course_admins
    if (
      !combined_metadata.course_admins ||
      combined_metadata.course_admins.length === 0
    ) {
      combined_metadata.course_admins = ['kvday2@illinois.edu']
      console.log('course_admins field was empty. Added default admin email.')
    }

    // Check if combined_metadata doesn't have anything in the field is_private
    if (!combined_metadata.is_private) {
      combined_metadata.is_private = false
      console.log('is_private field was empty. Set to false.')
    }

    // Check if openai_api_key is present and if it is a plain string
    if (
      combined_metadata.openai_api_key &&
      !isEncrypted(combined_metadata.openai_api_key)
    ) {
      // Encrypt the openai_api_key
      console.log('Encrypting api key')
      combined_metadata.openai_api_key = await encrypt(
        combined_metadata.openai_api_key,
        process.env.NEXT_PUBLIC_SIGNING_KEY as string,
      )
      // console.log('Signed api key: ', combined_metadata.openai_api_key)
    }

    // Save the combined metadata
    await kv.hset('course_metadatas', { [courseName]: combined_metadata })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error setting course metadata:', error)
    return NextResponse.json({ success: false })
  }
}
