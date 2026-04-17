export const CHATBOT_PROJECT_TYPES = [
  'Course',
  'Department',
  'Student Org.',
  'Entertainment',
] as const

export type ChatbotProjectType = (typeof CHATBOT_PROJECT_TYPES)[number]

export type ChatbotTagCategory = 'projectType' | 'organization'

export interface ChatbotTag {
  category: ChatbotTagCategory
  value: string
}

export const MAX_CHATBOT_TAGS = 5

export const CHATBOT_TAG_CATEGORY_LABEL: Record<ChatbotTagCategory, string> = {
  projectType: 'Project Type',
  organization: 'Organization',
}

export const COMMON_ORGANIZATIONS = [
  'Grainger Engineering',
  'Computer Science',
  'University Library',
  'Gies College of Business',
  'College of Liberal Arts & Sciences',
] as const

export function isChatbotTag(value: unknown): value is ChatbotTag {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<ChatbotTag>
  if (
    candidate.category !== 'projectType' &&
    candidate.category !== 'organization'
  ) {
    return false
  }
  if (typeof candidate.value !== 'string' || candidate.value.trim() === '') {
    return false
  }
  if (candidate.category === 'projectType') {
    return (CHATBOT_PROJECT_TYPES as readonly string[]).includes(
      candidate.value,
    )
  }
  return true
}

export function sanitizeChatbotTags(raw: unknown): ChatbotTag[] {
  if (!Array.isArray(raw)) return []
  const seen = new Set<string>()
  const result: ChatbotTag[] = []
  for (const item of raw) {
    if (!isChatbotTag(item)) continue
    const key = `${item.category}:${item.value}`
    if (seen.has(key)) continue
    seen.add(key)
    result.push({ category: item.category, value: item.value.trim() })
    if (result.length >= MAX_CHATBOT_TAGS) break
  }
  return result
}

export function chatbotTagKey(tag: ChatbotTag): string {
  return `${tag.category}:${tag.value}`
}

/**
 * Resolve a free-text tag input into a canonical ChatbotTag.
 * A value matching a project-type enum (case-insensitive) is canonicalized to
 * the enum's declared casing and categorized as `projectType`; anything else
 * is categorized as `organization` with whitespace trimmed.
 * Returns null when the trimmed value is empty.
 */
export function categorizeTagValue(raw: string): ChatbotTag | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const matched = CHATBOT_PROJECT_TYPES.find(
    (candidate) => candidate.toLowerCase() === trimmed.toLowerCase(),
  )
  if (matched) return { category: 'projectType', value: matched }
  return { category: 'organization', value: trimmed }
}
