import { describe, expect, it } from 'vitest'
import type { CourseMetadata } from '~/types/courseMetadata'
import { toChatbotCardData, chatbotUserTier } from '~/utils/chatbotCard'

function makeMetadata(over: Partial<CourseMetadata> = {}): CourseMetadata {
  return {
    is_private: false,
    course_owner: 'owner@example.com',
    course_admins: [],
    approved_emails_list: [],
    course_intro_message: '',
    banner_image_s3: undefined,
    is_frozen: false,
    allow_logged_in_users: false,
    project_description: undefined,
    tags: [],
    ...over,
  } as CourseMetadata
}

describe('toChatbotCardData', () => {
  it('marks a public bot as accessLevel "public"', () => {
    const card = toChatbotCardData(
      'cs101',
      makeMetadata({ is_private: false }),
      'someone@example.com',
    )
    expect(card.accessLevel).toBe('public')
  })

  it('maps is_private + allow_logged_in_users to "unlisted" (logged_in)', () => {
    const card = toChatbotCardData(
      'cs101',
      makeMetadata({ is_private: true, allow_logged_in_users: true }),
      'someone@example.com',
    )
    expect(card.accessLevel).toBe('unlisted')
  })

  it('marks a fully private bot as accessLevel "private"', () => {
    const card = toChatbotCardData(
      'cs101',
      makeMetadata({ is_private: true, allow_logged_in_users: false }),
      'someone@example.com',
    )
    expect(card.accessLevel).toBe('private')
  })

  it('flags the caller as owner and exposes raw metadata to them', () => {
    const meta = makeMetadata({ course_owner: 'me@example.com' })
    const card = toChatbotCardData('cs101', meta, 'me@example.com')
    expect(card.userRole).toBe('owner')
    expect(card.owner).toBe('You')
    expect(card.metadata).toBe(meta)
  })

  it('flags the caller as admin (in course_admins) and exposes raw metadata', () => {
    const meta = makeMetadata({
      course_owner: 'other@example.com',
      course_admins: ['me@example.com'],
    })
    const card = toChatbotCardData('cs101', meta, 'me@example.com')
    expect(card.userRole).toBe('admin')
    expect(card.owner).toBe('other@example.com')
    expect(card.metadata).toBe(meta)
  })

  it('hides raw metadata from callers who are neither owner nor admin', () => {
    const meta = makeMetadata({
      course_owner: 'other@example.com',
      course_admins: [],
    })
    const card = toChatbotCardData('cs101', meta, 'me@example.com')
    expect(card.userRole).toBeUndefined()
    expect(card.metadata).toBeUndefined()
  })

  it('extracts organization, projectType, and general tags', () => {
    const card = toChatbotCardData(
      'cs101',
      makeMetadata({
        tags: [
          { category: 'organization', value: 'Grainger Engineering' },
          { category: 'projectType', value: 'Course' },
          { category: 'general', value: 'ml' },
          { category: 'general', value: 'beta' },
        ],
      }),
      'me@example.com',
    )
    expect(card.organization).toBe('Grainger Engineering')
    expect(card.projectType).toBe('Course')
    expect(card.generalTags).toEqual(['ml', 'beta'])
  })

  it('counts only non-owner, non-default admins in collaboratorCount', () => {
    const card = toChatbotCardData(
      'cs101',
      makeMetadata({
        course_owner: 'owner@example.com',
        course_admins: ['owner@example.com', 'alice@example.com'],
      }),
      'me@example.com',
    )
    // The owner himself is filtered out of admins.
    expect(card.collaboratorCount).toBe(1)
  })
})

describe('chatbotUserTier', () => {
  it('returns 0 for the owner', () => {
    const meta = makeMetadata({ course_owner: 'me@example.com' })
    expect(chatbotUserTier(meta, 'me@example.com')).toBe(0)
  })

  it('returns 1 for an admin', () => {
    const meta = makeMetadata({
      course_owner: 'other@example.com',
      course_admins: ['me@example.com'],
    })
    expect(chatbotUserTier(meta, 'me@example.com')).toBe(1)
  })

  it('returns 2 for anyone else', () => {
    const meta = makeMetadata({
      course_owner: 'other@example.com',
      course_admins: [],
    })
    expect(chatbotUserTier(meta, 'me@example.com')).toBe(2)
  })
})
