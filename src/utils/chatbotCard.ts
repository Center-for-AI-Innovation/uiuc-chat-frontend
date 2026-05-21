import type { CourseMetadata } from '~/types/courseMetadata'
import type { ChatbotCardData } from '~/components/UIUC-Components/chatbots-hub/chatbots.types'
import { sanitizeChatbotTags } from '~/types/chatbotTags'

const DEFAULT_ADMIN_EMAIL = process.env.DEFAULT_ADMIN_EMAIL ?? ''

function getAccessLevel(
  metadata: CourseMetadata,
): 'public' | 'private' | 'logged_in' {
  if (!metadata.is_private) return 'public'
  if (metadata.allow_logged_in_users) return 'logged_in'
  return 'private'
}

function isUserBot(metadata: CourseMetadata, userEmail: string): boolean {
  return (
    metadata.course_owner === userEmail ||
    (metadata.course_admins ?? []).includes(userEmail)
  )
}

/**
 * Build a safe card payload from a raw course_metadata row.
 * Only attaches raw metadata for bots the caller owns or admins.
 */
export function toChatbotCardData(
  courseName: string,
  metadata: CourseMetadata,
  userEmail: string,
): ChatbotCardData {
  const isOwner = metadata.course_owner === userEmail
  const isAdmin = !isOwner && (metadata.course_admins ?? []).includes(userEmail)
  const admins = (metadata.course_admins ?? []).filter(
    (a) => a !== metadata.course_owner && a !== DEFAULT_ADMIN_EMAIL,
  )

  const accessLevel = getAccessLevel(metadata)
  const callerIsUserBot = isUserBot(metadata, userEmail)

  const tags = sanitizeChatbotTags(metadata.tags)
  const organization = tags.find((t) => t.category === 'organization')?.value
  const projectType = tags.find((t) => t.category === 'projectType')?.value
  const generalTags = tags
    .filter((t) => t.category === 'general')
    .map((t) => t.value)

  return {
    course_name: courseName,
    title: courseName,
    description: metadata.project_description ?? '',
    organization,
    projectType,
    generalTags,
    owner: isOwner ? 'You' : metadata.course_owner,
    collaboratorCount: admins.length,
    userRole: isOwner
      ? 'owner'
      : isAdmin
        ? 'admin'
        : callerIsUserBot
          ? 'member'
          : undefined,
    accessLevel: accessLevel === 'logged_in' ? 'unlisted' : accessLevel,
    isPrivate: metadata.is_private,
    bannerImageS3: metadata.banner_image_s3,
    metadata: callerIsUserBot ? metadata : undefined,
  }
}

/** Rank a card by user-role tier: owner=0, admin=1, other=2. */
export function chatbotUserTier(
  metadata: CourseMetadata,
  userEmail: string,
): number {
  if (metadata.course_owner === userEmail) return 0
  if ((metadata.course_admins ?? []).includes(userEmail)) return 1
  return 2
}
