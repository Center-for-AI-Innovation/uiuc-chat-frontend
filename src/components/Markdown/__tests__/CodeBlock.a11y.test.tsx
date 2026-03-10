import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import { CodeBlock } from '../CodeBlock'

vi.mock('@/utils/cryptoRandom', () => ({
  generateSecureRandomString: () => 'abc',
}))

describe('CodeBlock - accessibility', () => {
  it('download button has aria-label="Download code"', () => {
    render(<CodeBlock language="javascript" value="x" />)
    expect(
      screen.getByRole('button', { name: /Download code/i }),
    ).toBeInTheDocument()
  })

  it('applies light-mode colors when dark class is absent', () => {
    document.documentElement.classList.remove('dark')
    const { container } = render(
      <CodeBlock language="javascript" value="const x = 1" />,
    )
    const header = container.querySelector('.flex.items-center.justify-between')
    expect(header).toBeTruthy()
    expect((header as HTMLElement).style.backgroundColor).toBe(
      'rgb(240, 241, 243)',
    )
  })

  it('applies dark-mode colors when dark class is present', () => {
    document.documentElement.classList.add('dark')
    const { container } = render(
      <CodeBlock language="javascript" value="const x = 1" />,
    )
    const header = container.querySelector('.flex.items-center.justify-between')
    expect(header).toBeTruthy()
    expect((header as HTMLElement).style.backgroundColor).toBe(
      'rgb(33, 37, 43)',
    )
    document.documentElement.classList.remove('dark')
  })
})
