import { describe, expect, it } from 'vitest'

import {
  CHATBOT_PROJECT_TYPES,
  MAX_CHATBOT_TAGS,
  categorizeTagValue,
  isChatbotTag,
  sanitizeChatbotTags,
} from '~/types/chatbotTags'

describe('isChatbotTag', () => {
  it('accepts valid project-type tags from the enum', () => {
    for (const pt of CHATBOT_PROJECT_TYPES) {
      expect(isChatbotTag({ category: 'projectType', value: pt })).toBe(true)
    }
  })

  it('rejects project-type tags with values outside the enum', () => {
    expect(
      isChatbotTag({ category: 'projectType', value: 'Totally Fake' }),
    ).toBe(false)
  })

  it('accepts organization tags with any non-empty string', () => {
    expect(
      isChatbotTag({ category: 'organization', value: 'Grainger Engineering' }),
    ).toBe(true)
  })

  it('rejects empty-string values', () => {
    expect(isChatbotTag({ category: 'organization', value: '' })).toBe(false)
  })

  it('rejects malformed shapes', () => {
    expect(isChatbotTag(null)).toBe(false)
    expect(isChatbotTag(undefined)).toBe(false)
    expect(isChatbotTag('projectType:Course')).toBe(false)
    expect(isChatbotTag({ category: 'unknown', value: 'x' })).toBe(false)
    expect(isChatbotTag({ category: 'organization' })).toBe(false)
    expect(isChatbotTag({ category: 'organization', value: 42 })).toBe(false)
  })
})

describe('sanitizeChatbotTags', () => {
  it('returns [] for non-arrays', () => {
    expect(sanitizeChatbotTags(undefined)).toEqual([])
    expect(sanitizeChatbotTags(null)).toEqual([])
    expect(sanitizeChatbotTags('not an array')).toEqual([])
    expect(sanitizeChatbotTags({ foo: 'bar' })).toEqual([])
  })

  it('drops malformed entries but keeps valid ones', () => {
    const result = sanitizeChatbotTags([
      { category: 'projectType', value: 'Course' },
      { category: 'projectType', value: 'Bogus' },
      { category: 'organization', value: 'CS' },
      'not-a-tag',
      null,
    ])
    expect(result).toEqual([
      { category: 'projectType', value: 'Course' },
      { category: 'organization', value: 'CS' },
    ])
  })

  it('dedupes identical tags', () => {
    const result = sanitizeChatbotTags([
      { category: 'projectType', value: 'Course' },
      { category: 'projectType', value: 'Course' },
      { category: 'organization', value: 'CS' },
    ])
    expect(result).toHaveLength(2)
  })

  it(`caps results at MAX_CHATBOT_TAGS (${MAX_CHATBOT_TAGS})`, () => {
    const many = [
      { category: 'organization' as const, value: 'Org 1' },
      { category: 'organization' as const, value: 'Org 2' },
      { category: 'organization' as const, value: 'Org 3' },
      { category: 'organization' as const, value: 'Org 4' },
      { category: 'organization' as const, value: 'Org 5' },
      { category: 'organization' as const, value: 'Org 6' },
      { category: 'organization' as const, value: 'Org 7' },
    ]
    const result = sanitizeChatbotTags(many)
    expect(result).toHaveLength(MAX_CHATBOT_TAGS)
    expect(result[MAX_CHATBOT_TAGS - 1]!.value).toBe('Org 5')
  })

  it('trims whitespace from organization values', () => {
    const result = sanitizeChatbotTags([
      { category: 'organization', value: '  Grainger  ' },
    ])
    expect(result).toEqual([{ category: 'organization', value: 'Grainger' }])
  })
})

describe('categorizeTagValue', () => {
  it('returns null for empty or whitespace-only input', () => {
    expect(categorizeTagValue('')).toBeNull()
    expect(categorizeTagValue('   ')).toBeNull()
  })

  it('categorizes exact project-type matches as projectType', () => {
    expect(categorizeTagValue('Course')).toEqual({
      category: 'projectType',
      value: 'Course',
    })
    expect(categorizeTagValue('Student Org.')).toEqual({
      category: 'projectType',
      value: 'Student Org.',
    })
  })

  it('matches project-type values case-insensitively and canonicalizes casing', () => {
    expect(categorizeTagValue('course')).toEqual({
      category: 'projectType',
      value: 'Course',
    })
    expect(categorizeTagValue('DEPARTMENT')).toEqual({
      category: 'projectType',
      value: 'Department',
    })
  })

  it('categorizes free-text values as organization and trims whitespace', () => {
    expect(categorizeTagValue('  Grainger Engineering  ')).toEqual({
      category: 'organization',
      value: 'Grainger Engineering',
    })
  })
})
