import React from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MainPageBackground } from '~/components/UIUC-Components/MainPageBackground'

describe('MainPageBackground', () => {
  it('renders an H1 element for WCAG 2.4.1 compliance', () => {
    render(
      <MainPageBackground>
        <p>Child content</p>
      </MainPageBackground>,
    )

    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1).toBeTruthy()
    expect(h1.textContent).toContain('Illinois')
    expect(h1.textContent).toContain('Chat')
  })

  it('renders children inside main landmark', () => {
    render(
      <MainPageBackground>
        <p>Test child</p>
      </MainPageBackground>,
    )

    expect(screen.getByText('Test child')).toBeTruthy()
    expect(screen.getByRole('main')).toBeTruthy()
  })
})
