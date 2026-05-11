import React from 'react'
import { afterEach, describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithProviders } from '~/test-utils/renderWithProviders'
import { makeMessage } from '~/test-utils/mocks/chat'
import { MessageActions } from '../MessageActions'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createDefaultProps(overrides: Record<string, unknown> = {}) {
  return {
    message: makeMessage({
      id: 'a1',
      role: 'assistant' as const,
      content: 'Hello world',
    }),
    messageIndex: 0,
    isLastMessage: true,
    onRegenerate: vi.fn(),
    onFeedback: vi.fn(),
    onOpenFeedbackModal: vi.fn(),
    ...overrides,
  }
}

function renderActions(overrides: Record<string, unknown> = {}) {
  const props = createDefaultProps(overrides)
  return {
    ...renderWithProviders(<MessageActions {...props} />),
    props,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('MessageActions', () => {
  let clipboardWriteText: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    // Re-assign clipboard.writeText before each test because restoreMocks
    // in vitest config can clear the global mock set in vitest.setup.ts.
    clipboardWriteText = vi.fn(() => Promise.resolve())
    Object.assign(navigator.clipboard, { writeText: clipboardWriteText })
  })

  // Restore real timers after each test so cleanup is not affected
  afterEach(() => {
    vi.useRealTimers()
  })

  // ---------- Rendering ----------------------------------------------------

  describe('rendering', () => {
    it('renders all four action buttons', () => {
      renderActions()
      expect(
        screen.getByRole('button', { name: /Copy message/i }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /Good Response/i }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /Bad Response/i }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /Regenerate Response/i }),
      ).toBeInTheDocument()
    })

    it('renders for a user-role message', () => {
      renderActions({
        message: makeMessage({
          id: 'u1',
          role: 'user',
          content: 'User question',
        }),
      })
      expect(
        screen.getByRole('button', { name: /Copy message/i }),
      ).toBeInTheDocument()
    })

    it('renders for an assistant-role message', () => {
      renderActions({
        message: makeMessage({
          id: 'a1',
          role: 'assistant',
          content: 'Bot reply',
        }),
      })
      expect(
        screen.getByRole('button', { name: /Copy message/i }),
      ).toBeInTheDocument()
    })
  })

  // ---------- Copy to clipboard --------------------------------------------

  describe('copy to clipboard', () => {
    it('copies string content to clipboard on click', async () => {
      renderActions({
        message: makeMessage({ content: 'Copy me' }),
      })

      fireEvent.click(screen.getByRole('button', { name: /Copy message/i }))

      await waitFor(() => {
        expect(clipboardWriteText).toHaveBeenCalledWith('Copy me')
      })
    })

    it('copies text from Content[] array (filters only text type)', async () => {
      const contentArray = [
        { type: 'text' as const, text: 'first' },
        { type: 'image_url' as const, image_url: { url: 'http://img' } },
        { type: 'text' as const, text: 'second' },
      ]
      renderActions({
        message: makeMessage({ content: contentArray }),
      })

      fireEvent.click(screen.getByRole('button', { name: /Copy message/i }))

      await waitFor(() => {
        expect(clipboardWriteText).toHaveBeenCalledWith('first second')
      })
    })

    it('shows check icon after copy then reverts after 2 seconds', async () => {
      renderActions()

      const copyBtn = screen.getByRole('button', { name: /Copy message/i })
      fireEvent.click(copyBtn)

      // After copy the icon should be a check (green class)
      await waitFor(() => {
        expect(copyBtn.querySelector('.text-green-500')).toBeTruthy()
      })

      // Advance 2000ms so the copied state resets
      vi.advanceTimersByTime(2000)

      await waitFor(() => {
        expect(copyBtn.querySelector('.text-green-500')).toBeNull()
      })
    })

    it('does nothing when navigator.clipboard is unavailable', () => {
      const original = navigator.clipboard
      // Temporarily remove clipboard
      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        configurable: true,
      })

      renderActions()

      // Should not throw
      fireEvent.click(screen.getByRole('button', { name: /Copy message/i }))

      // Restore clipboard
      Object.defineProperty(navigator, 'clipboard', {
        value: original,
        configurable: true,
      })
    })
  })

  // ---------- Thumbs up (positive feedback) --------------------------------

  describe('thumbs up', () => {
    it('calls onFeedback with true when clicked', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      const { props } = renderActions()

      await user.click(screen.getByRole('button', { name: /Good Response/i }))

      expect(props.onFeedback).toHaveBeenCalledWith(props.message, true)
    })

    it('toggles to filled icon on click', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      renderActions()

      await user.click(screen.getByRole('button', { name: /Good Response/i }))

      // After clicking, the label changes to "Remove Good Response"
      expect(
        screen.getByRole('button', { name: /Remove Good Response/i }),
      ).toBeInTheDocument()
    })

    it('removes feedback (passes null) when toggling off', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      const { props } = renderActions()

      const btn = screen.getByRole('button', { name: /Good Response/i })
      await user.click(btn) // like

      // Second click un-likes
      const removeBtn = screen.getByRole('button', {
        name: /Remove Good Response/i,
      })
      await user.click(removeBtn)

      expect(props.onFeedback).toHaveBeenCalledTimes(2)
      expect(props.onFeedback).toHaveBeenLastCalledWith(props.message, null)
    })

    it('clears thumbs down when thumbs up is clicked', async () => {
      // Pre-set negative feedback on the message
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      renderActions({
        message: makeMessage({
          id: 'a1',
          role: 'assistant',
          content: 'test',
          feedback: { isPositive: false, category: null, details: null },
        }),
      })

      // Thumbs down should initially be active
      expect(
        screen.getByRole('button', { name: /Remove Bad Response/i }),
      ).toHaveAttribute('aria-pressed', 'true')

      // Click thumbs up
      await user.click(screen.getByRole('button', { name: /Good Response/i }))

      // Now thumbs up should be active, thumbs down should not
      expect(
        screen.getByRole('button', { name: /Remove Good Response/i }),
      ).toHaveAttribute('aria-pressed', 'true')
    })

    it('works without onFeedback callback', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      renderActions({ onFeedback: undefined })

      // Should not throw
      await user.click(screen.getByRole('button', { name: /Good Response/i }))

      expect(
        screen.getByRole('button', { name: /Remove Good Response/i }),
      ).toBeInTheDocument()
    })
  })

  // ---------- Thumbs down (negative feedback) ------------------------------

  describe('thumbs down', () => {
    it('opens the feedback modal on click', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      const { props } = renderActions()

      await user.click(screen.getByRole('button', { name: /Bad Response/i }))

      expect(props.onOpenFeedbackModal).toHaveBeenCalledTimes(1)
    })

    it('does NOT immediately set thumbs down to true (waits for modal submission)', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      renderActions()

      await user.click(screen.getByRole('button', { name: /Bad Response/i }))

      // aria-pressed should still be false because the state is set only on modal submission
      const btn = screen.getByRole('button', { name: /Bad Response/i })
      expect(btn).toHaveAttribute('aria-pressed', 'false')
    })

    it('removes negative feedback when toggling off (when already thumbs down)', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      const msg = makeMessage({
        id: 'a1',
        role: 'assistant',
        content: 'test',
        feedback: { isPositive: false, category: 'wrong', details: 'bad' },
      })
      const { props } = renderActions({ message: msg })

      // The message has negative feedback, so thumbs down starts active
      const removeBtn = screen.getByRole('button', {
        name: /Remove Bad Response/i,
      })
      expect(removeBtn).toHaveAttribute('aria-pressed', 'true')

      await user.click(removeBtn)

      // Should call onFeedback with null
      expect(props.onFeedback).toHaveBeenCalledWith(msg, null)
    })
  })

  // ---------- Regenerate ---------------------------------------------------

  describe('regenerate', () => {
    it('calls onRegenerate with the messageIndex', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      const { props } = renderActions({ messageIndex: 3 })

      await user.click(
        screen.getByRole('button', { name: /Regenerate Response/i }),
      )

      expect(props.onRegenerate).toHaveBeenCalledWith(3)
    })

    it('disables the button while regenerating', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      renderActions()

      const btn = screen.getByRole('button', { name: /Regenerate Response/i })
      await user.click(btn)

      expect(btn).toBeDisabled()
    })

    it('applies the spin animation while regenerating', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      renderActions()

      const btn = screen.getByRole('button', { name: /Regenerate Response/i })
      await user.click(btn)

      expect(btn.className).toContain('animate-spin')
    })

    it('re-enables the button after 1 second', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      renderActions()

      const btn = screen.getByRole('button', { name: /Regenerate Response/i })
      await user.click(btn)

      expect(btn).toBeDisabled()

      vi.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(btn).not.toBeDisabled()
      })
    })

    it('does not call onRegenerate if it is undefined', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      renderActions({ onRegenerate: undefined })

      const btn = screen.getByRole('button', { name: /Regenerate Response/i })
      // Should not throw
      await user.click(btn)

      // Button should NOT be disabled because the handler exits early
      expect(btn).not.toBeDisabled()
    })
  })

  // ---------- Feedback state initialization from message -------------------

  describe('feedback state initialization', () => {
    it('initializes thumbs up when message has positive feedback', () => {
      renderActions({
        message: makeMessage({
          id: 'a1',
          role: 'assistant',
          content: 'test',
          feedback: { isPositive: true, category: null, details: null },
        }),
      })

      const thumbsUpBtn = screen.getByRole('button', {
        name: /Remove Good Response/i,
      })
      expect(thumbsUpBtn).toHaveAttribute('aria-pressed', 'true')

      const thumbsDownBtn = screen.getByRole('button', {
        name: /Bad Response/i,
      })
      expect(thumbsDownBtn).toHaveAttribute('aria-pressed', 'false')
    })

    it('initializes thumbs down when message has negative feedback', () => {
      renderActions({
        message: makeMessage({
          id: 'a1',
          role: 'assistant',
          content: 'test',
          feedback: { isPositive: false, category: null, details: null },
        }),
      })

      const thumbsUpBtn = screen.getByRole('button', { name: /Good Response/i })
      expect(thumbsUpBtn).toHaveAttribute('aria-pressed', 'false')

      const thumbsDownBtn = screen.getByRole('button', {
        name: /Remove Bad Response/i,
      })
      expect(thumbsDownBtn).toHaveAttribute('aria-pressed', 'true')
    })

    it('initializes with no feedback when feedback is undefined', () => {
      renderActions({
        message: makeMessage({
          id: 'a1',
          role: 'assistant',
          content: 'test',
        }),
      })

      expect(
        screen.getByRole('button', { name: /Good Response/i }),
      ).toHaveAttribute('aria-pressed', 'false')
      expect(
        screen.getByRole('button', { name: /Bad Response/i }),
      ).toHaveAttribute('aria-pressed', 'false')
    })

    it('initializes with no feedback when isPositive is null', () => {
      renderActions({
        message: makeMessage({
          id: 'a1',
          role: 'assistant',
          content: 'test',
          feedback: { isPositive: null, category: null, details: null },
        }),
      })

      expect(
        screen.getByRole('button', { name: /Good Response/i }),
      ).toHaveAttribute('aria-pressed', 'false')
      expect(
        screen.getByRole('button', { name: /Bad Response/i }),
      ).toHaveAttribute('aria-pressed', 'false')
    })
  })

  // ---------- Props variations ---------------------------------------------

  describe('props variations', () => {
    it('renders when isLastMessage is false', () => {
      renderActions({ isLastMessage: false })
      expect(
        screen.getByRole('button', { name: /Regenerate Response/i }),
      ).toBeInTheDocument()
    })

    it('handles messageIndex 0', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      const { props } = renderActions({ messageIndex: 0 })

      await user.click(
        screen.getByRole('button', { name: /Regenerate Response/i }),
      )
      expect(props.onRegenerate).toHaveBeenCalledWith(0)
    })

    it('handles large messageIndex', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      const { props } = renderActions({ messageIndex: 99 })

      await user.click(
        screen.getByRole('button', { name: /Regenerate Response/i }),
      )
      expect(props.onRegenerate).toHaveBeenCalledWith(99)
    })

    it('renders with empty string content', async () => {
      renderActions({
        message: makeMessage({ content: '' }),
      })

      fireEvent.click(screen.getByRole('button', { name: /Copy message/i }))

      await waitFor(() => {
        expect(clipboardWriteText).toHaveBeenCalledWith('')
      })
    })

    it('renders with empty Content[] array', async () => {
      renderActions({
        message: makeMessage({ content: [] }),
      })

      fireEvent.click(screen.getByRole('button', { name: /Copy message/i }))

      await waitFor(() => {
        expect(clipboardWriteText).toHaveBeenCalledWith('')
      })
    })
  })

  // ---------- Combined interactions ----------------------------------------

  describe('combined interactions', () => {
    it('switching from thumbs up to thumbs down opens modal and clears up', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      const { props } = renderActions()

      // First click thumbs up
      await user.click(screen.getByRole('button', { name: /Good Response/i }))
      expect(props.onFeedback).toHaveBeenCalledWith(props.message, true)

      // Then click thumbs down
      await user.click(screen.getByRole('button', { name: /Bad Response/i }))
      expect(props.onOpenFeedbackModal).toHaveBeenCalledTimes(1)

      // Thumbs up should no longer be active
      const upBtn = screen.getByRole('button', { name: /Good Response/i })
      expect(upBtn).toHaveAttribute('aria-pressed', 'false')
    })

    it('can copy and give feedback in sequence', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      const { props } = renderActions()

      fireEvent.click(screen.getByRole('button', { name: /Copy message/i }))
      await waitFor(() => {
        expect(clipboardWriteText).toHaveBeenCalled()
      })

      await user.click(screen.getByRole('button', { name: /Good Response/i }))
      expect(props.onFeedback).toHaveBeenCalledWith(props.message, true)
    })
  })
})
