import { describe, expect, it } from 'vitest'

import type { ChatbotTag } from '~/types/chatbotTags'
import {
  compareChatbotTagPrecedence,
  getPrimaryTag,
  sortByChatbotTagPrecedence,
} from '~/utils/chatbotTagSort'

const org = (value: string): ChatbotTag => ({ category: 'organization', value })
const type = (value: string): ChatbotTag => ({ category: 'projectType', value })

describe('getPrimaryTag', () => {
  it('returns null for missing or empty tags', () => {
    expect(getPrimaryTag(undefined)).toBeNull()
    expect(getPrimaryTag(null)).toBeNull()
    expect(getPrimaryTag([])).toBeNull()
  })

  it('picks organization tag over project type tag', () => {
    const tags = [type('Course'), org('Grainger Engineering')]
    expect(getPrimaryTag(tags)).toEqual(org('Grainger Engineering'))
  })

  it('falls back to project type tag when no organization tag exists', () => {
    expect(getPrimaryTag([type('Department')])).toEqual(type('Department'))
  })
})

describe('compareChatbotTagPrecedence', () => {
  it('ranks organization-tagged chatbots before project-type-tagged chatbots', () => {
    expect(
      compareChatbotTagPrecedence([org('A')], [type('Course')]),
    ).toBeLessThan(0)
    expect(
      compareChatbotTagPrecedence([type('Course')], [org('A')]),
    ).toBeGreaterThan(0)
  })

  it('ranks tagged chatbots before untagged ones', () => {
    expect(compareChatbotTagPrecedence([type('Course')], [])).toBeLessThan(0)
    expect(compareChatbotTagPrecedence(undefined, [org('A')])).toBeGreaterThan(
      0,
    )
  })

  it('within project-type tags uses declared enum order', () => {
    // Course(0) < Department(1) < Student Org.(2) < Entertainment(3)
    expect(
      compareChatbotTagPrecedence([type('Course')], [type('Department')]),
    ).toBeLessThan(0)
    expect(
      compareChatbotTagPrecedence(
        [type('Student Org.')],
        [type('Entertainment')],
      ),
    ).toBeLessThan(0)
  })

  it('within organization tags sorts alphabetically', () => {
    expect(
      compareChatbotTagPrecedence(
        [org('Grainger Engineering')],
        [org('University Library')],
      ),
    ).toBeLessThan(0)
  })

  it('treats two untagged entries as equal', () => {
    expect(compareChatbotTagPrecedence([], undefined)).toBe(0)
  })
})

describe('sortByChatbotTagPrecedence', () => {
  it('orders a mixed list: orgs → project types (enum order) → untagged', () => {
    const items = [
      { id: 'untagged', tags: [] },
      { id: 'entertainment', tags: [type('Entertainment')] },
      { id: 'library', tags: [org('University Library')] },
      { id: 'course', tags: [type('Course')] },
      { id: 'grainger', tags: [org('Grainger Engineering')] },
      { id: 'department', tags: [type('Department')] },
    ]

    const sorted = sortByChatbotTagPrecedence(items).map((i) => i.id)
    expect(sorted).toEqual([
      'grainger',
      'library',
      'course',
      'department',
      'entertainment',
      'untagged',
    ])
  })

  it('puts a chatbot with both an org and project-type tag in the org group', () => {
    const items = [
      { id: 'org+type', tags: [type('Course'), org('Computer Science')] },
      { id: 'type-only', tags: [type('Course')] },
    ]
    const sorted = sortByChatbotTagPrecedence(items).map((i) => i.id)
    expect(sorted).toEqual(['org+type', 'type-only'])
  })

  it('does not mutate the input array', () => {
    const items = [
      { id: 'a', tags: [type('Course')] },
      { id: 'b', tags: [org('A')] },
    ]
    const snapshot = items.map((i) => i.id)
    sortByChatbotTagPrecedence(items)
    expect(items.map((i) => i.id)).toEqual(snapshot)
  })
})
