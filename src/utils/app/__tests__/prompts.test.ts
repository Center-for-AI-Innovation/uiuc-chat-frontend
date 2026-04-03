import { describe, expect, it, vi } from 'vitest'
import {
  OpenAIModelID,
  OpenAIModels,
} from '~/utils/modelProviders/types/openai'
import { savePrompts, updatePrompt } from '../prompts'
import type { Prompt } from '~/types/prompt'

function makePrompt(overrides: Partial<Prompt> = {}): Prompt {
  return {
    id: 'p1',
    name: 'Prompt 1',
    description: 'desc',
    content: 'content',
    model: OpenAIModels[OpenAIModelID.GPT_4o_mini],
    folderId: null,
    ...overrides,
  }
}

describe('prompt utilities', () => {
  it('savePrompts writes prompts to localStorage', () => {
    const prompts = [makePrompt({ id: 'a' }), makePrompt({ id: 'b' })]
    savePrompts(prompts)
    expect(JSON.parse(localStorage.getItem('prompts') || '[]')).toEqual(prompts)
  })

  it('updatePrompt replaces a matching prompt and persists', () => {
    const prompts = [
      makePrompt({ id: 'a' }),
      makePrompt({ id: 'b', name: 'Old' }),
    ]
    const updated = makePrompt({ id: 'b', name: 'New' })

    const result = updatePrompt(updated, prompts)
    expect(result.single).toEqual(updated)
    expect(result.all.find((p) => p.id === 'b')?.name).toBe('New')
    expect(JSON.parse(localStorage.getItem('prompts') || '[]')).toEqual(
      result.all,
    )
  })
})
