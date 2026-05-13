import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => {
  const onConflictDoUpdate = vi.fn(() => Promise.resolve(undefined))
  const values = vi.fn(() => ({ onConflictDoUpdate }))
  const insert = vi.fn(() => ({ values }))

  return {
    db: { insert },
    insert,
    values,
    onConflictDoUpdate,
    reset() {
      insert.mockClear()
      values.mockClear()
      onConflictDoUpdate.mockClear()
      onConflictDoUpdate.mockImplementation(() => Promise.resolve(undefined))
    },
  }
})

vi.mock('~/db/dbClient', async () => {
  const schema = await import('~/db/schema')
  return {
    db: hoisted.db,
    chatbotTags: schema.chatbotTags,
  }
})

import { upsertChatbotTags } from '~/utils/chatbotTagsRegistry'

describe('upsertChatbotTags', () => {
  beforeEach(() => {
    hoisted.reset()
  })

  it('no-ops on an empty input', async () => {
    await upsertChatbotTags([])
    expect(hoisted.insert).not.toHaveBeenCalled()
  })

  it('inserts rows with lowercased value and an onConflict update', async () => {
    await upsertChatbotTags([
      { category: 'general', value: 'Beta' },
      { category: 'organization', value: 'Grainger Engineering' },
    ])
    expect(hoisted.insert).toHaveBeenCalledTimes(1)
    expect(hoisted.values).toHaveBeenCalledWith([
      {
        category: 'general',
        value: 'Beta',
        value_lower: 'beta',
        usage_count: 1,
      },
      {
        category: 'organization',
        value: 'Grainger Engineering',
        value_lower: 'grainger engineering',
        usage_count: 1,
      },
    ])
    expect(hoisted.onConflictDoUpdate).toHaveBeenCalledTimes(1)
    const conflictArg = hoisted.onConflictDoUpdate.mock.calls[0]?.[0]
    expect(conflictArg).toBeDefined()
    // ON CONFLICT (category, value_lower) DO UPDATE ...
    expect(Array.isArray(conflictArg.target)).toBe(true)
    expect(conflictArg.target).toHaveLength(2)
    expect(conflictArg.set).toBeDefined()
  })

  it('swallows db errors so a registry failure never blocks a save', async () => {
    hoisted.onConflictDoUpdate.mockRejectedValueOnce(new Error('boom'))
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    await expect(
      upsertChatbotTags([{ category: 'general', value: 'beta' }]),
    ).resolves.toBeUndefined()

    expect(consoleError).toHaveBeenCalled()
    consoleError.mockRestore()
  })
})
