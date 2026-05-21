import { type CourseMetadata } from '~/types/courseMetadata'

export type ChatbotAccessLevel = 'private' | 'unlisted' | 'public'
/**
 * Visual tier of the current user's relationship with a chatbot.
 * - `owner`  — `course_owner` matches the caller. Full control.
 * - `admin`  — caller is in `course_admins`. Same edit/share permissions as
 *              the owner, surfaced with an orange rim + Settings gear, but a
 *              distinct badge so the actual owner is still identifiable.
 * - `member` — caller is on `approved_emails_list` only. View access; no
 *              edit shortcuts on the card.
 */
export type ChatbotUserRole = 'owner' | 'admin' | 'member'
export type ChatbotProjectType =
  | 'Course'
  | 'Department'
  | 'Research'
  | 'Student Org.'
  | 'Entertainment'

export type KnowledgeSource = {
  name: string
  description?: string
  doc_count: number
}

/** Per-type document statistics returned by the document-stats API */
export type DocumentTypeStat = {
  type: string
  file_count: number
  total_size_bytes: number
}

/** Aggregate document summary for a project */
export type DocumentSummary = {
  total_file_count: number
  total_size_bytes: number
  by_type: DocumentTypeStat[]
}

/** Profile info for a project maintainer */
export type MaintainerProfile = {
  email: string
  display_name?: string
  avatar_url?: string
}

export type ChatbotCardData = {
  course_name: string
  title: string
  description: string
  organization?: string
  projectType?: string
  generalTags?: string[]
  owner: string
  collaboratorCount: number
  userRole?: ChatbotUserRole
  accessLevel?: ChatbotAccessLevel
  isPrivate?: boolean
  bannerImageS3?: string
  metadata?: CourseMetadata
  knowledgeSources?: KnowledgeSource[]
  created_at?: string
  last_updated_at?: string
}

export type ChatbotSectionData = {
  title: string
  cards: ChatbotCardData[]
}

export type AccessibleChatbotData = {
  course_name: string
  title: string
  description: string
  owner: string
  collaboratorCount: number
  projectType: ChatbotProjectType
  accessLevel: ChatbotAccessLevel
  organization?: string
  bannerImageS3?: string
  metadata?: CourseMetadata
  knowledgeSources?: KnowledgeSource[]
}

/** Section that surfaces the user's own + member bots (any privacy). */
export const YOUR_BOTS_SECTION = 'Your Bots'

/**
 * Maps a project type to the section title it belongs to in the chatbots hub.
 * Only applies to PUBLIC bots the user has no direct relationship to —
 * owner/member bots short-circuit into {@link YOUR_BOTS_SECTION}.
 */
export const PROJECT_TYPE_TO_SECTION: Record<ChatbotProjectType, string> = {
  Course: 'Course Assistants',
  Department: 'Department Resources',
  Research: 'Public Bots',
  'Student Org.': 'Public Bots',
  Entertainment: 'Public Bots',
}

/** Fallback section for public chatbots with unknown project types */
export const DEFAULT_ACCESSIBLE_SECTION = 'Public Bots'

/**
 * Ordered list of section titles. "Your Bots" surfaces first so users see
 * their own + shared work before discovery sections. The discovery sections
 * are scoped to PUBLIC bots only — private/unlisted bots the user owns or is
 * a member of live in "Your Bots".
 */
export const ACCESSIBLE_SECTION_ORDER = [
  YOUR_BOTS_SECTION,
  'Course Assistants',
  'Department Resources',
  'Public Bots',
]

/** Query parameters accepted by the searchChatbots API */
export type SearchChatbotsParams = {
  q?: string
  category?: ChatbotProjectType
  privacy?: 'public' | 'private' | 'logged_in'
  my_bots?: boolean
}

/** Response shape from the searchChatbots API */
export type SearchChatbotsResponse = {
  results: ChatbotCardData[]
  total: number
}
