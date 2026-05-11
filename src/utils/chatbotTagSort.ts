import {
  CHATBOT_PROJECT_TYPES,
  type ChatbotTag,
  type ChatbotTagCategory,
} from '~/types/chatbotTags'

const CATEGORY_RANK: Record<ChatbotTagCategory, number> = {
  organization: 0,
  projectType: 1,
}

const UNTAGGED_RANK = CATEGORY_RANK.projectType + 1

const PROJECT_TYPE_RANK: Record<string, number> = CHATBOT_PROJECT_TYPES.reduce(
  (acc, value, index) => ({ ...acc, [value]: index }),
  {} as Record<string, number>,
)

export function getPrimaryTag(
  tags: ChatbotTag[] | undefined | null,
): ChatbotTag | null {
  if (!tags || tags.length === 0) return null
  const organization = tags.find((tag) => tag.category === 'organization')
  if (organization) return organization
  const projectType = tags.find((tag) => tag.category === 'projectType')
  return projectType ?? null
}

function secondaryRank(tag: ChatbotTag): number {
  if (tag.category === 'projectType') {
    const rank = PROJECT_TYPE_RANK[tag.value]
    return rank ?? Number.MAX_SAFE_INTEGER
  }
  return 0
}

export function compareChatbotTagPrecedence(
  aTags: ChatbotTag[] | undefined | null,
  bTags: ChatbotTag[] | undefined | null,
): number {
  const aTag = getPrimaryTag(aTags)
  const bTag = getPrimaryTag(bTags)

  const aRank = aTag ? CATEGORY_RANK[aTag.category] : UNTAGGED_RANK
  const bRank = bTag ? CATEGORY_RANK[bTag.category] : UNTAGGED_RANK

  if (aRank !== bRank) return aRank - bRank
  if (!aTag || !bTag) return 0

  const aSecondary = secondaryRank(aTag)
  const bSecondary = secondaryRank(bTag)
  if (aSecondary !== bSecondary) return aSecondary - bSecondary

  return aTag.value.localeCompare(bTag.value)
}

export function sortByChatbotTagPrecedence<
  T extends { tags?: ChatbotTag[] | undefined | null },
>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => compareChatbotTagPrecedence(a.tags, b.tags))
}
