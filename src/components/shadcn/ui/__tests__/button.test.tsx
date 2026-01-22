import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Link from 'next/link'
import { Button } from '../button'

describe('Button', () => {
  it('renders a button and handles clicks', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()

    render(<Button onClick={onClick}>Click me</Button>)
    await user.click(screen.getByRole('button', { name: 'Click me' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('supports asChild rendering', () => {
    render(
      <Button asChild>
        <Link href="/test">Go</Link>
      </Button>,
    )

    expect(screen.getByRole('link', { name: 'Go' })).toHaveAttribute(
      'href',
      '/test',
    )
  })
})
