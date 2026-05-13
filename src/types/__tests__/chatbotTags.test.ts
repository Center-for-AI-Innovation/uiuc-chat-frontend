import { describe, expect, it } from 'vitest'

import {
  CHATBOT_PROJECT_TYPES,
  MAX_CHATBOT_TAGS,
  MAX_GENERAL_TAG_LENGTH,
  categorizeTagValue,
  isChatbotTag,
  isValidGeneralTagValue,
  sanitizeChatbotTags,
  sanitizeGeneralTagInput,
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

  it('keeps only the first tag per category (drops duplicates in the same category)', () => {
    const result = sanitizeChatbotTags([
      { category: 'projectType', value: 'Course' },
      { category: 'projectType', value: 'Department' },
      { category: 'organization', value: 'CS' },
      { category: 'organization', value: 'Grainger Engineering' },
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

  it(`caps the total number of tags at MAX_CHATBOT_TAGS (${MAX_CHATBOT_TAGS})`, () => {
    const inputs = Array.from({ length: MAX_CHATBOT_TAGS + 3 }, (_, i) => ({
      category: 'general' as const,
      value: `tag-${i}`,
    }))
    const result = sanitizeChatbotTags(inputs)
    expect(result).toHaveLength(MAX_CHATBOT_TAGS)
  })

  it('allows multiple general tags but keeps singleton categories unique', () => {
    const result = sanitizeChatbotTags([
      { category: 'general', value: 'beta' },
      { category: 'general', value: 'launch' },
      { category: 'projectType', value: 'Course' },
      { category: 'projectType', value: 'Department' },
      { category: 'organization', value: 'CS' },
      { category: 'organization', value: 'Grainger Engineering' },
    ])
    expect(result).toEqual([
      { category: 'general', value: 'beta' },
      { category: 'general', value: 'launch' },
      { category: 'projectType', value: 'Course' },
      { category: 'organization', value: 'CS' },
    ])
  })

  it('dedupes general tags case-insensitively', () => {
    const result = sanitizeChatbotTags([
      { category: 'general', value: 'Beta' },
      { category: 'general', value: 'beta' },
      { category: 'general', value: '  BETA  ' },
    ])
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ category: 'general', value: 'Beta' })
  })

  it('trims whitespace from organization values', () => {
    const result = sanitizeChatbotTags([
      { category: 'organization', value: '  Grainger  ' },
    ])
    expect(result).toEqual([{ category: 'organization', value: 'Grainger' }])
  })

  it('drops general tags with special characters but keeps orgs with punctuation', () => {
    const result = sanitizeChatbotTags([
      { category: 'general', value: 'C++' },
      { category: 'general', value: 'AI/ML' },
      { category: 'general', value: 'beta' },
      { category: 'organization', value: 'College of Liberal Arts & Sciences' },
    ])
    expect(result).toEqual([
      { category: 'general', value: 'beta' },
      {
        category: 'organization',
        value: 'College of Liberal Arts & Sciences',
      },
    ])
  })

  it('drops general tags longer than MAX_GENERAL_TAG_LENGTH', () => {
    const tooLong = 'a'.repeat(MAX_GENERAL_TAG_LENGTH + 1)
    const exact = 'a'.repeat(MAX_GENERAL_TAG_LENGTH)
    const result = sanitizeChatbotTags([
      { category: 'general', value: tooLong },
      { category: 'general', value: exact },
    ])
    expect(result).toEqual([{ category: 'general', value: exact }])
  })
})

describe('isValidGeneralTagValue', () => {
  it('accepts letters, digits, spaces, hyphens, underscores', () => {
    expect(isValidGeneralTagValue('beta')).toBe(true)
    expect(isValidGeneralTagValue('cs 101')).toBe(true)
    expect(isValidGeneralTagValue('ai-ml')).toBe(true)
    expect(isValidGeneralTagValue('ai_ml')).toBe(true)
    expect(isValidGeneralTagValue('Group 12')).toBe(true)
  })

  it('rejects punctuation and other special characters', () => {
    expect(isValidGeneralTagValue('C++')).toBe(false)
    expect(isValidGeneralTagValue('AI/ML')).toBe(false)
    expect(isValidGeneralTagValue('foo!')).toBe(false)
    expect(isValidGeneralTagValue('foo@bar')).toBe(false)
    expect(isValidGeneralTagValue('foo.bar')).toBe(false)
  })

  it('rejects empty / whitespace-only values', () => {
    expect(isValidGeneralTagValue('')).toBe(false)
    expect(isValidGeneralTagValue('   ')).toBe(false)
  })

  it(`rejects values longer than ${MAX_GENERAL_TAG_LENGTH} chars after trimming`, () => {
    expect(isValidGeneralTagValue('a'.repeat(MAX_GENERAL_TAG_LENGTH))).toBe(
      true,
    )
    expect(isValidGeneralTagValue('a'.repeat(MAX_GENERAL_TAG_LENGTH + 1))).toBe(
      false,
    )
  })
})

describe('sanitizeGeneralTagInput', () => {
  it('strips disallowed characters as the user types', () => {
    expect(sanitizeGeneralTagInput('hello!@#world')).toBe('helloworld')
    expect(sanitizeGeneralTagInput('a/b\\c')).toBe('abc')
  })

  it('truncates to MAX_GENERAL_TAG_LENGTH characters', () => {
    const long = 'a'.repeat(MAX_GENERAL_TAG_LENGTH + 10)
    expect(sanitizeGeneralTagInput(long).length).toBe(MAX_GENERAL_TAG_LENGTH)
  })

  it('preserves allowed characters and case', () => {
    expect(sanitizeGeneralTagInput('Beta_test-1')).toBe('Beta_test-1')
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
