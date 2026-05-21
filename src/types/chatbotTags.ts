export const CHATBOT_PROJECT_TYPES = [
  'Course',
  'Department',
  'Research',
  'Student Org.',
  'Entertainment',
] as const

export type ChatbotProjectType = (typeof CHATBOT_PROJECT_TYPES)[number]

/**
 * Tag categories:
 * - `projectType`: constrained to {@link CHATBOT_PROJECT_TYPES}. One per chatbot.
 * - `organization`: constrained at the UI to {@link COMMON_ORGANIZATIONS}, but
 *   accepted server-side as any non-empty string so the curated list can grow
 *   without breaking historic data. One per chatbot.
 * - `general`: free-text tags. Multiple allowed up to {@link MAX_CHATBOT_TAGS}
 *   total across all categories.
 */
export type ChatbotTagCategory = 'projectType' | 'organization' | 'general'

export interface ChatbotTag {
  category: ChatbotTagCategory
  value: string
}

export const MAX_CHATBOT_TAGS = 5

/**
 * Validation rules for the free-text general-tag input. The constrained
 * pickers (projectType enum, organization curated list) are not subject to
 * these rules because their values come from fixed vocabularies that may
 * legitimately contain punctuation (e.g. "Student Org.").
 */
export const MAX_GENERAL_TAG_LENGTH = 16
export const GENERAL_TAG_VALUE_REGEX = /^[A-Za-z0-9 _-]+$/

export function isValidGeneralTagValue(raw: string): boolean {
  const trimmed = raw.trim()
  if (trimmed.length === 0) return false
  if (trimmed.length > MAX_GENERAL_TAG_LENGTH) return false
  return GENERAL_TAG_VALUE_REGEX.test(trimmed)
}

/**
 * Strip disallowed characters from a user-typed general-tag value as the user
 * types. Truncates to MAX_GENERAL_TAG_LENGTH. Used by the editor's onChange
 * so users can't paste or type invalid characters into the input.
 */
export function sanitizeGeneralTagInput(raw: string): string {
  return raw.replace(/[^A-Za-z0-9 _-]/g, '').slice(0, MAX_GENERAL_TAG_LENGTH)
}

export const CHATBOT_TAG_CATEGORY_LABEL: Record<ChatbotTagCategory, string> = {
  projectType: 'Project Type',
  organization: 'Organization',
  general: 'Tag',
}

/** Categories that are limited to one tag per chatbot. */
export const SINGLETON_TAG_CATEGORIES: ReadonlySet<ChatbotTagCategory> =
  new Set(['projectType', 'organization'])

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
    candidate.category !== 'organization' &&
    candidate.category !== 'general'
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
  // General tags are subject to the alphanumeric + space/underscore/hyphen
  // rule and a 16-char cap. Org tags pass through unrestricted so the curated
  // list can contain punctuation like "Student Org." or "Arts & Sciences".
  if (candidate.category === 'general') {
    return isValidGeneralTagValue(candidate.value)
  }
  return true
}

export function sanitizeChatbotTags(raw: unknown): ChatbotTag[] {
  if (!Array.isArray(raw)) return []
  const seenSingletons = new Set<ChatbotTagCategory>()
  const seenKeys = new Set<string>()
  const result: ChatbotTag[] = []
  for (const item of raw) {
    if (!isChatbotTag(item)) continue
    // One tag per category for project_type and organization; general allows many.
    if (SINGLETON_TAG_CATEGORIES.has(item.category)) {
      if (seenSingletons.has(item.category)) continue
      seenSingletons.add(item.category)
    }
    const trimmed = item.value.trim()
    const key = `${item.category}:${trimmed.toLowerCase()}`
    if (seenKeys.has(key)) continue
    seenKeys.add(key)
    result.push({ category: item.category, value: trimmed })
    if (result.length >= MAX_CHATBOT_TAGS) break
  }
  return result
}

export function chatbotTagKey(tag: ChatbotTag): string {
  return `${tag.category}:${tag.value}`
}

/**
 * Legacy helper retained for any callers that auto-classify a raw string.
 * Not used by the editor anymore — the editor now records the category
 * explicitly. Returns null for empty input.
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
