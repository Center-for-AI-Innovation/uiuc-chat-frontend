import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'

import { CodeBlock } from '../CodeBlock'

vi.mock('@/utils/cryptoRandom', () => ({
  generateSecureRandomString: () => 'abc',
}))

afterEach(() => {
  vi.useRealTimers()
})

describe('CodeBlock', () => {
  it('copies to clipboard and resets the copied state after a timeout', async () => {
    vi.useFakeTimers()

    const writeText = vi.fn(() => Promise.resolve())
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    })

    render(<CodeBlock language="javascript" value="console.log('x')" />)

    fireEvent.click(screen.getByRole('button', { name: /Copy code/i }))
    expect(writeText).toHaveBeenCalledWith("console.log('x')")

    await act(async () => {
      await Promise.resolve()
    })
    expect(screen.getByText('Copied!')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(screen.getByRole('button', { name: /Copy code/i })).toBeInTheDocument()
  })

  it('does not attempt to copy if clipboard API is unavailable', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: {},
      configurable: true,
    })

    render(<CodeBlock language="javascript" value="x" />)
    fireEvent.click(screen.getByRole('button', { name: /Copy code/i }))
    expect(screen.queryByText('Copied!')).toBeNull()
  })

  it('downloads content as a file when a name is provided', async () => {
    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('my.js')
    const createSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test')
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL')
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {})

    render(<CodeBlock language="javascript" value="console.log(1)" />)

    const buttons = screen.getAllByRole('button')
    const downloadButton = buttons[1]!
    fireEvent.click(downloadButton)

    expect(promptSpy).toHaveBeenCalledWith('Enter file name', 'file-abc.js')
    expect(createSpy).toHaveBeenCalled()
    expect(clickSpy).toHaveBeenCalled()
    expect(revokeSpy).toHaveBeenCalledWith('blob:test')
  })

  it('does not download if the prompt is cancelled', async () => {
    vi.spyOn(window, 'prompt').mockReturnValue(null)
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click')

    render(<CodeBlock language="javascript" value="x" />)
    fireEvent.click(screen.getAllByRole('button')[1]!)

    expect(clickSpy).not.toHaveBeenCalled()
  })
})
