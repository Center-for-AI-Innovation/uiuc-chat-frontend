import { describe, expect, it, vi } from 'vitest'
import { cleanConversationHistory, cleanSelectedConversation } from '../clean'
import {
  OpenAIModelID,
  OpenAIModels,
} from '~/utils/modelProviders/types/openai'
import { DEFAULT_SYSTEM_PROMPT, DEFAULT_TEMPERATURE } from '../const'
import { makeConversation } from '~/test-utils/mocks/chat'

describe('cleanSelectedConversation', () => {
  it('fills missing fields with defaults', () => {
    const conversation = makeConversation({
      model: undefined as any,
      prompt: undefined as any,
      temperature: undefined as any,
      folderId: undefined as any,
      messages: undefined as any,
      userEmail: '',
    })

    const cleaned = cleanSelectedConversation(conversation, 'me@illinois.edu')
    expect(cleaned.model).toEqual(OpenAIModels[OpenAIModelID.GPT_4])
    expect(cleaned.prompt).toBe(DEFAULT_SYSTEM_PROMPT)
    expect(cleaned.temperature).toBe(DEFAULT_TEMPERATURE)
    expect(cleaned.folderId).toBeNull()
    expect(cleaned.messages).toEqual([])
    expect(cleaned.userEmail).toBe('me@illinois.edu')
  })
})

describe('cleanConversationHistory', () => {
  it('returns an empty ConversationPage-like object when input is not an array', () => {
    const cleaned = cleanConversationHistory('nope' as any)
    expect(cleaned).toEqual({ conversations: [], nextCursor: null })
  })

  it('adds required defaults to each conversation record', () => {
    const history = [
      {
        id: '1',
        name: 'One',
        // intentionally missing model/prompt/temperature/messages/folderId
      },
    ]

    const cleaned = cleanConversationHistory(history as any)

    expect(cleaned.conversations).toHaveLength(1)
    expect(cleaned.conversations[0]).toMatchObject({
      id: '1',
      name: 'One',
      model: OpenAIModels[OpenAIModelID.GPT_4],
      prompt: DEFAULT_SYSTEM_PROMPT,
      temperature: DEFAULT_TEMPERATURE,
      folderId: null,
      messages: [],
    })
  })

  it('skips records that throw during normalization', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const frozen = Object.freeze({
      id: '1',
      name: 'One',
    })

    const cleaned = cleanConversationHistory([frozen] as any)
    expect(cleaned.conversations).toEqual([])
    expect(warnSpy).toHaveBeenCalled()
  })
})
