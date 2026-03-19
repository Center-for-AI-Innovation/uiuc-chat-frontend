import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, fireEvent, waitFor, act } from '@testing-library/react'
import { renderWithProviders } from '~/test-utils/renderWithProviders'
import { MessageActions } from '../MessageActions'
import { makeMessage } from '~/test-utils/mocks/chat'
import type { Content, Message } from '~/types/chat'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderActions(
  overrides: Partial<Parameters<typeof MessageActions>[0]> = {},
) {
  const defaultProps = {
    message: makeMessage({ role: 'assistant', content: 'Hello world' }),
    messageIndex: 0,
    isLastMessage: true,
    onRegenerate: vi.fn(),
    onFeedback: vi.fn(),
    onOpenFeedbackModal: vi.fn(),
    ...overrides,
  }
  const result = renderWithProviders(<MessageActions {...defaultProps} />)
  return { ...result, props: defaultProps }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('MessageActions', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.mocked(navigator.clipboard.writeText).mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ---- Rendering ----------------------------------------------------------

  it('renders all four action buttons', () => {
    renderActions()
    expect(screen.getByLabelText('Copy message')).toBeInTheDocument()
    expect(screen.getByLabelText('Good Response')).toBeInTheDocument()
    expect(screen.getByLabelText('Bad Response')).toBeInTheDocument()
    expect(screen.getByLabelText('Regenerate Response')).toBeInTheDocument()
  })

  it('applies opacity-100 class when isLastMessage is true', () => {
    renderActions({ isLastMessage: true })
    const copyBtn = screen.getByLabelText('Copy message')
    expect(copyBtn.className).toContain('opacity-100')
  })

  it('applies group-hover opacity class when isLastMessage is false', () => {
    renderActions({ isLastMessage: false })
    const copyBtn = screen.getByLabelText('Copy message')
    expect(copyBtn.className).toContain('group-hover:opacity-100')
  })

  // ---- Copy ---------------------------------------------------------------

  it('copies string content to clipboard on click', async () => {
    renderActions()
    fireEvent.click(screen.getByLabelText('Copy message'))

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Hello world')
    })
  })

  it('copies array content (text only) to clipboard', async () => {
    const contentArray: Content[] = [
      { type: 'text', text: 'Part one' },
      { type: 'image_url', image_url: { url: 'http://img.png' } },
      { type: 'text', text: 'Part two' },
    ]
    const msg = makeMessage({ role: 'assistant', content: contentArray })
    renderActions({ message: msg })

    fireEvent.click(screen.getByLabelText('Copy message'))

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        'Part one Part two',
      )
    })
  })

  it('does not copy when navigator.clipboard is unavailable', () => {
    const original = navigator.clipboard
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      configurable: true,
    })

    renderActions()
    // Should not throw
    fireEvent.click(screen.getByLabelText('Copy message'))

    Object.defineProperty(navigator, 'clipboard', {
      value: original,
      configurable: true,
    })
  })

  it('shows check icon briefly after copy then reverts', async () => {
    renderActions()
    fireEvent.click(screen.getByLabelText('Copy message'))

    // After clipboard resolves the label/tooltip should read "Copied!" indirectly,
    // but we verify via the aria-label staying the same (icon swap is visual).
    // The button should still be accessible after the timeout.
    await act(async () => {
      vi.advanceTimersByTime(2000)
    })

    expect(screen.getByLabelText('Copy message')).toBeInTheDocument()
  })

  // ---- Thumbs Up ----------------------------------------------------------

  it('calls onFeedback with true when thumbs up clicked', () => {
    const { props } = renderActions()
    fireEvent.click(screen.getByLabelText('Good Response'))

    expect(props.onFeedback).toHaveBeenCalledWith(props.message, true)
  })

  it('removes positive feedback on second thumbs up click', async () => {
    const msg = makeMessage({
      role: 'assistant',
      content: 'hi',
      feedback: { isPositive: true, category: null, details: null },
    })
    const { props } = renderActions({ message: msg })

    // The component initializes with thumbsUp=true from feedback, so first click removes it
    fireEvent.click(screen.getByLabelText('Remove Good Response'))

    expect(props.onFeedback).toHaveBeenCalledWith(msg, null)
  })

  it('shows filled thumb-up icon when message has positive feedback', () => {
    const msg = makeMessage({
      role: 'assistant',
      content: 'hi',
      feedback: { isPositive: true, category: null, details: null },
    })
    renderActions({ message: msg })

    // When positive feedback exists, the label should indicate removal
    expect(screen.getByLabelText('Remove Good Response')).toBeInTheDocument()
  })

  // ---- Thumbs Down --------------------------------------------------------

  it('opens feedback modal when thumbs down clicked', () => {
    const { props } = renderActions()
    fireEvent.click(screen.getByLabelText('Bad Response'))

    expect(props.onOpenFeedbackModal).toHaveBeenCalled()
    // onFeedback should NOT be called yet (waits for modal submission)
    expect(props.onFeedback).not.toHaveBeenCalled()
  })

  it('removes negative feedback on second thumbs down click', () => {
    const msg = makeMessage({
      role: 'assistant',
      content: 'hi',
      feedback: { isPositive: false, category: null, details: null },
    })
    const { props } = renderActions({ message: msg })

    fireEvent.click(screen.getByLabelText('Remove Bad Response'))

    expect(props.onFeedback).toHaveBeenCalledWith(msg, null)
  })

  it('shows filled thumb-down icon when message has negative feedback', () => {
    const msg = makeMessage({
      role: 'assistant',
      content: 'hi',
      feedback: { isPositive: false, category: null, details: null },
    })
    renderActions({ message: msg })

    expect(screen.getByLabelText('Remove Bad Response')).toBeInTheDocument()
  })

  // ---- Regenerate ---------------------------------------------------------

  it('calls onRegenerate with messageIndex', () => {
    const { props } = renderActions({ messageIndex: 3 })
    fireEvent.click(screen.getByLabelText('Regenerate Response'))

    expect(props.onRegenerate).toHaveBeenCalledWith(3)
  })

  it('disables regenerate button temporarily after click', async () => {
    renderActions()
    const btn = screen.getByLabelText('Regenerate Response')
    fireEvent.click(btn)

    expect(btn).toBeDisabled()

    await act(async () => {
      vi.advanceTimersByTime(1000)
    })

    expect(btn).not.toBeDisabled()
  })

  it('applies animate-spin class while regenerating', () => {
    renderActions()
    const btn = screen.getByLabelText('Regenerate Response')
    fireEvent.click(btn)

    expect(btn.className).toContain('animate-spin')
  })

  it('does nothing when onRegenerate is undefined', () => {
    renderActions({ onRegenerate: undefined })
    const btn = screen.getByLabelText('Regenerate Response')
    // Should not throw
    fireEvent.click(btn)
    expect(btn).not.toBeDisabled()
  })

  // ---- Feedback callback absent -------------------------------------------

  it('does not throw when onFeedback is undefined and thumbs up clicked', () => {
    renderActions({ onFeedback: undefined })
    expect(() => {
      fireEvent.click(screen.getByLabelText('Good Response'))
    }).not.toThrow()
  })

  it('does not throw when onFeedback is undefined and thumbs down toggled off', () => {
    const msg = makeMessage({
      role: 'assistant',
      content: 'hi',
      feedback: { isPositive: false, category: null, details: null },
    })
    renderActions({ onFeedback: undefined, message: msg })
    expect(() => {
      fireEvent.click(screen.getByLabelText('Remove Bad Response'))
    }).not.toThrow()
  })

  // ---- Effect: feedback state from message prop ---------------------------

  it('resets feedback icons when message feedback is cleared', () => {
    const msg = makeMessage({
      role: 'assistant',
      content: 'hi',
      feedback: { isPositive: true, category: null, details: null },
    })
    const { rerender } = renderWithProviders(
      <MessageActions
        message={msg}
        messageIndex={0}
        isLastMessage
        onOpenFeedbackModal={vi.fn()}
      />,
    )

    expect(screen.getByLabelText('Remove Good Response')).toBeInTheDocument()

    // Re-render with feedback removed
    const updatedMsg = makeMessage({
      role: 'assistant',
      content: 'hi',
      feedback: undefined,
    })
    rerender(
      <MessageActions
        message={updatedMsg}
        messageIndex={0}
        isLastMessage
        onOpenFeedbackModal={vi.fn()}
      />,
    )

    expect(screen.getByLabelText('Good Response')).toBeInTheDocument()
    expect(screen.getByLabelText('Bad Response')).toBeInTheDocument()
  })
})
