import { describe, expect, it } from 'vitest'
import {
  deriveAgentModeEnabled,
  shouldShowChatLoader,
} from '~/utils/app/agentMode'

describe('agentMode utils', () => {
  it('deriveAgentModeEnabled prefers explicit conversation.agentModeEnabled', () => {
    expect(deriveAgentModeEnabled({ agentModeEnabled: true } as any)).toBe(true)
    expect(deriveAgentModeEnabled({ agentModeEnabled: false } as any)).toBe(
      false,
    )
  })

  it('deriveAgentModeEnabled falls back to agentEvents presence', () => {
    expect(
      deriveAgentModeEnabled({
        messages: [{ agentEvents: [{ id: 'e1' }] }],
      } as any),
    ).toBe(true)

    expect(
      deriveAgentModeEnabled({ messages: [{ agentEvents: [] }] } as any),
    ).toBe(false)
  })

  it('shouldShowChatLoader only shows while loading and last message is not assistant', () => {
    expect(shouldShowChatLoader(false, { messages: [] } as any)).toBe(false)
    expect(
      shouldShowChatLoader(true, { messages: [{ role: 'assistant' }] } as any),
    ).toBe(false)
    expect(
      shouldShowChatLoader(true, { messages: [{ role: 'user' }] } as any),
    ).toBe(true)
  })
})
