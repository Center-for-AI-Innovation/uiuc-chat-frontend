import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  COUNTRY_OF_CONCERN_INFO_URL,
  CountryOfConcern,
  getCountryOfConcern,
  getCountryOfConcernLongMessage,
  getCountryOfConcernShortMessage,
  isCocBannerDismissed,
  isCountryOfConcern,
  isChatbotCocAcknowledged,
  markChatbotCocAcknowledged,
  markCocBannerDismissed,
} from '~/utils/modelProviders/countriesOfConcern'

const CHAT_KEY = 'coc-acknowledged-chatbots'
const BANNER_KEY = 'coc-banner-dismissed-pairs'

describe('getCountryOfConcern / isCountryOfConcern', () => {
  it('returns null for missing input', () => {
    expect(getCountryOfConcern(null)).toBeNull()
    expect(getCountryOfConcern(undefined)).toBeNull()
    expect(getCountryOfConcern('')).toBeNull()
    expect(isCountryOfConcern(null)).toBe(false)
  })

  it('returns null for unrecognized model ids', () => {
    expect(getCountryOfConcern('totally-not-a-real-model')).toBeNull()
    expect(isCountryOfConcern('totally-not-a-real-model')).toBe(false)
  })

  it('returns the country for a known flagged model id', () => {
    expect(getCountryOfConcern('deepseek/deepseek-chat-v3-0324')).toBe(
      CountryOfConcern.China,
    )
    expect(isCountryOfConcern('deepseek/deepseek-chat-v3-0324')).toBe(true)
  })
})

describe('message helpers', () => {
  it('short message does not include the country name', () => {
    const message = getCountryOfConcernShortMessage(CountryOfConcern.China)
    expect(message).toContain('country of concern')
    expect(message).not.toContain('China')
  })

  it('long message names the model and country', () => {
    const message = getCountryOfConcernLongMessage(
      'DeepSeek V3',
      CountryOfConcern.China,
    )
    expect(message).toContain('DeepSeek V3')
    expect(message).toContain('China')
    expect(message).toContain('U.S. Department of Commerce')
  })

  it('exposes a canonical info URL', () => {
    expect(COUNTRY_OF_CONCERN_INFO_URL).toMatch(/^https:\/\//)
  })
})

describe('isChatbotCocAcknowledged / markChatbotCocAcknowledged', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('returns false for missing chatbot id', () => {
    expect(isChatbotCocAcknowledged(null)).toBe(false)
    expect(isChatbotCocAcknowledged(undefined)).toBe(false)
    expect(isChatbotCocAcknowledged('')).toBe(false)
  })

  it('returns false when storage is empty', () => {
    expect(isChatbotCocAcknowledged('bot-a')).toBe(false)
  })

  it('mark + read round-trip persists', () => {
    markChatbotCocAcknowledged('bot-a')
    expect(isChatbotCocAcknowledged('bot-a')).toBe(true)
    expect(isChatbotCocAcknowledged('bot-b')).toBe(false)
  })

  it('marking is idempotent (early return when already in set)', () => {
    markChatbotCocAcknowledged('bot-a')
    markChatbotCocAcknowledged('bot-a')
    const raw = window.localStorage.getItem(CHAT_KEY)
    expect(raw && JSON.parse(raw)).toEqual(['bot-a'])
  })

  it('mark is a no-op for empty id', () => {
    markChatbotCocAcknowledged('')
    expect(window.localStorage.getItem(CHAT_KEY)).toBeNull()
  })

  it('treats corrupt JSON in storage as empty set', () => {
    window.localStorage.setItem(CHAT_KEY, '{not json')
    expect(isChatbotCocAcknowledged('bot-a')).toBe(false)
  })

  it('treats non-array JSON in storage as empty set', () => {
    window.localStorage.setItem(CHAT_KEY, JSON.stringify({ foo: 'bar' }))
    expect(isChatbotCocAcknowledged('bot-a')).toBe(false)
  })

  it('filters out non-string entries when reading', () => {
    window.localStorage.setItem(CHAT_KEY, JSON.stringify(['bot-a', 42, null]))
    expect(isChatbotCocAcknowledged('bot-a')).toBe(true)
  })

  it('swallows localStorage.setItem failures', () => {
    const spy = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('quota exceeded')
      })
    expect(() => markChatbotCocAcknowledged('bot-a')).not.toThrow()
    spy.mockRestore()
  })
})

describe('isCocBannerDismissed / markCocBannerDismissed', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('returns false for missing chatbot id or model id', () => {
    expect(isCocBannerDismissed(null, 'm')).toBe(false)
    expect(isCocBannerDismissed('c', null)).toBe(false)
    expect(isCocBannerDismissed(null, null)).toBe(false)
    expect(isCocBannerDismissed('', 'm')).toBe(false)
    expect(isCocBannerDismissed('c', '')).toBe(false)
  })

  it('returns false when storage is empty', () => {
    expect(isCocBannerDismissed('bot-a', 'qwen/qwen3-32b')).toBe(false)
  })

  it('mark + read round-trip persists per pair', () => {
    markCocBannerDismissed('bot-a', 'qwen/qwen3-32b')
    expect(isCocBannerDismissed('bot-a', 'qwen/qwen3-32b')).toBe(true)
    // different model on same chatbot — banner should still fire
    expect(isCocBannerDismissed('bot-a', 'deepseek/deepseek-chat-v3.1')).toBe(
      false,
    )
    // same model on different chatbot — banner should still fire
    expect(isCocBannerDismissed('bot-b', 'qwen/qwen3-32b')).toBe(false)
  })

  it('marking is idempotent (early return when pair already dismissed)', () => {
    markCocBannerDismissed('bot-a', 'qwen/qwen3-32b')
    markCocBannerDismissed('bot-a', 'qwen/qwen3-32b')
    const raw = window.localStorage.getItem(BANNER_KEY)
    expect(raw && JSON.parse(raw)).toEqual(['bot-a::qwen/qwen3-32b'])
  })

  it('mark is a no-op for empty inputs', () => {
    markCocBannerDismissed('', 'm')
    markCocBannerDismissed('c', '')
    expect(window.localStorage.getItem(BANNER_KEY)).toBeNull()
  })

  it('treats corrupt JSON in storage as empty set', () => {
    window.localStorage.setItem(BANNER_KEY, 'totally not json')
    expect(isCocBannerDismissed('bot-a', 'qwen/qwen3-32b')).toBe(false)
  })

  it('treats non-array JSON in storage as empty set', () => {
    window.localStorage.setItem(BANNER_KEY, JSON.stringify({ foo: 'bar' }))
    expect(isCocBannerDismissed('bot-a', 'qwen/qwen3-32b')).toBe(false)
  })

  it('filters out non-string entries when reading', () => {
    window.localStorage.setItem(
      BANNER_KEY,
      JSON.stringify(['bot-a::qwen/qwen3-32b', 99]),
    )
    expect(isCocBannerDismissed('bot-a', 'qwen/qwen3-32b')).toBe(true)
  })

  it('swallows localStorage.setItem failures', () => {
    const spy = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('quota exceeded')
      })
    expect(() =>
      markCocBannerDismissed('bot-a', 'qwen/qwen3-32b'),
    ).not.toThrow()
    spy.mockRestore()
  })
})

describe('SSR-safe behavior (no window)', () => {
  const originalWindowDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    'window',
  )

  afterEach(() => {
    if (originalWindowDescriptor) {
      Object.defineProperty(globalThis, 'window', originalWindowDescriptor)
    }
  })

  it('isChatbotCocAcknowledged returns false when window is undefined', () => {
    // @ts-expect-error - intentionally removing window for SSR simulation
    delete globalThis.window
    expect(isChatbotCocAcknowledged('bot-a')).toBe(false)
  })

  it('markChatbotCocAcknowledged is a no-op when window is undefined', () => {
    // @ts-expect-error - intentionally removing window for SSR simulation
    delete globalThis.window
    expect(() => markChatbotCocAcknowledged('bot-a')).not.toThrow()
  })

  it('isCocBannerDismissed returns false when window is undefined', () => {
    // @ts-expect-error - intentionally removing window for SSR simulation
    delete globalThis.window
    expect(isCocBannerDismissed('bot-a', 'qwen/qwen3-32b')).toBe(false)
  })

  it('markCocBannerDismissed is a no-op when window is undefined', () => {
    // @ts-expect-error - intentionally removing window for SSR simulation
    delete globalThis.window
    expect(() =>
      markCocBannerDismissed('bot-a', 'qwen/qwen3-32b'),
    ).not.toThrow()
  })
})
