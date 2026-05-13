// upsertCourseMetadata.ts
import {
  type CourseMetadata,
  type CourseMetadataOptionalForUpsert,
} from '~/types/courseMetadata'
import { chatbotTagKey, sanitizeChatbotTags } from '~/types/chatbotTags'
import { type NextApiResponse } from 'next'
import { withAuth, type AuthenticatedRequest } from '~/utils/authMiddleware'
import { encrypt, isEncrypted } from '~/utils/crypto'
import { getCourseMetadata } from './getCourseMetadata'
import { writeCourseMetadata } from '~/utils/courseMetadataStore'
import { upsertChatbotTags } from '~/utils/chatbotTagsRegistry'
import { superAdmins } from '~/utils/superAdmins'
import { withCourseOwnerOrAdminAccess } from '~/pages/api/authorization'

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { courseName, courseMetadata } = req.body as {
    courseName: string
    courseMetadata: CourseMetadataOptionalForUpsert
  }

  // Check if courseName is not null or undefined
  if (!courseName) {
    console.error('Error: courseName is null or undefined')
    return res.status(400).json({ success: false, error: 'Missing courseName' })
  }

  try {
    const existing_metadata = await getCourseMetadata(courseName)

    // Combine the existing metadata with the new metadata, prioritizing the new values (order matters!)
    const combined_metadata = { ...existing_metadata, ...courseMetadata }

    // Normalize tags: cap length, drop malformed entries, one per category.
    // Track which tags are newly added (vs the previous save) so the registry
    // only counts each distinct (chatbot, tag) pair once.
    let newlyAddedTags: ReturnType<typeof sanitizeChatbotTags> = []
    if (combined_metadata.tags !== undefined) {
      const sanitized = sanitizeChatbotTags(combined_metadata.tags)
      combined_metadata.tags = sanitized

      const previousTagKeys = new Set(
        sanitizeChatbotTags(existing_metadata?.tags).map(chatbotTagKey),
      )
      newlyAddedTags = sanitized.filter(
        (tag) => !previousTagKeys.has(chatbotTagKey(tag)),
      )
    }

    // Check if combined_metadata doesn't have anything in the field course_admins
    if (
      !combined_metadata.course_admins ||
      combined_metadata.course_admins.length === 0
    ) {
      combined_metadata.course_admins = superAdmins
      console.log('course_admins field was empty. Added default admin emails.')
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

    // Save the combined metadata (Postgres + Redis, atomic)
    await writeCourseMetadata(courseName, combined_metadata as CourseMetadata)

    // Register newly-added tags into the autocomplete registry. Best-effort:
    // failures are logged inside the helper and never bubble up.
    if (newlyAddedTags.length > 0) {
      void upsertChatbotTags(newlyAddedTags)
    }

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Error setting course metadata:', error)
    return res.status(500).json({ success: false, error: error })
  }
}

export default withCourseOwnerOrAdminAccess()(handler)
