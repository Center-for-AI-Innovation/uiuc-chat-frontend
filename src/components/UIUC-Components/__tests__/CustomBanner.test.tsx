import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

import BannerComponent from '../CustomBanner'

describe('CustomBanner', () => {
  it('returns null when bannerUrl is empty', () => {
    const { container } = render(<BannerComponent bannerUrl="" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders an image and updates min-height based on loaded image height', async () => {
    const OriginalImage = globalThis.Image

    class TestImage {
      height = 50
      _src = ''
      _onload: null | (() => void) = null

      set src(v: string) {
        this._src = v
        if (this._onload) this._onload()
      }
      get src() {
        return this._src
      }
      set onload(fn: any) {
        this._onload = fn
        if (this._src) this._onload?.()
      }
      get onload() {
        return this._onload
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(globalThis as any).Image = TestImage as any

    const { container } = render(
      <BannerComponent bannerUrl="https://example.com/banner.png" />,
    )

    expect(
      screen.getByAltText('Banner image of course'),
    ).toBeInTheDocument()

    await waitFor(() =>
      expect(container.firstChild).toHaveStyle({ minHeight: '50px' }),
    )

    globalThis.Image = OriginalImage
  })
})

