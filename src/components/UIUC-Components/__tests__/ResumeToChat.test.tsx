import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

import ResumeToChat from '../ResumeToChat'
import { renderWithProviders } from '~/test-utils/renderWithProviders'

describe('ResumeToChat', () => {
  it('returns null when course_name is missing', () => {
    const { container } = render(<ResumeToChat course_name={undefined} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('navigates to the course chat and shows loading state after click', () => {
    const push = vi.fn()
    globalThis.__TEST_ROUTER__ = { push }

    renderWithProviders(<ResumeToChat course_name="CS101" />)

    const button = screen.getByRole('button', {
      name: /Back to Chat with Documents/i,
    })
    fireEvent.click(button)

    expect(push).toHaveBeenCalledWith('/CS101/chat')
    expect(document.querySelector('.loading-spinner')).toBeTruthy()
  })

  it('changes background color on hover', () => {
    renderWithProviders(<ResumeToChat course_name="CS101" />)

    const button = screen.getByRole('button', {
      name: /Back to Chat with Documents/i,
    })
    fireEvent.mouseEnter(button)
    expect(button).toHaveStyle({ backgroundColor: 'var(--button-hover)' })

    fireEvent.mouseLeave(button)
    expect(['', 'transparent']).toContain(
      (button as HTMLButtonElement).style.backgroundColor,
    )
  })
})
