import { type CourseMetadata } from '~/types/courseMetadata'

export type ChatbotAccessLevel = 'private' | 'unlisted' | 'public'
export type ChatbotUserRole = 'owner' | 'member'
export type ChatbotProjectType =
  | 'Course'
  | 'Department'
  | 'Student Org.'
  | 'Entertainment'

export type KnowledgeSource = {
  name: string
  description?: string
  doc_count: number
}

export type ChatbotCardData = {
  course_name: string
  title: string
  description: string
  organization?: string
  projectType?: string
  owner: string
  collaboratorCount: number
  userRole?: ChatbotUserRole
  accessLevel?: ChatbotAccessLevel
  isPrivate?: boolean
  bannerImageS3?: string
  metadata?: CourseMetadata
  knowledgeSources?: KnowledgeSource[]
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

/** Maps a project type to the section title it belongs to in the chatbots hub */
export const PROJECT_TYPE_TO_SECTION: Record<ChatbotProjectType, string> = {
  Course: 'Course Assistants',
  Department: 'Department Resources',
  'Student Org.': 'Public Bots',
  Entertainment: 'Public Bots',
}

/** Fallback section for accessible chatbots with unknown project types */
export const DEFAULT_ACCESSIBLE_SECTION = 'Public Bots'

/** Ordered list of accessible-chatbot section titles (matches Figma) */
export const ACCESSIBLE_SECTION_ORDER = [
  'Course Assistants',
  'Department Resources',
  'Public Bots',
]
