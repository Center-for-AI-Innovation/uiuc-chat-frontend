import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'

vi.mock('~/components/UIUC-Components/GlobalFooter', () => ({
  default: () => <footer data-testid="footer" />,
}))

vi.mock('~/components/UIUC-Components/navbars/GlobalHeader', () => ({
  LandingPageHeader: () => <header data-testid="header" />,
}))

import Home from '~/pages/index'

describe('Landing page (src/pages/index.tsx)', () => {
  const renderPage = () =>
    render(
      <MantineProvider>
        <Home />
      </MantineProvider>,
    )

  it('renders an H1 element for WCAG 2.4.1 compliance', () => {
    renderPage()

    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1).toBeTruthy()
    expect(h1.textContent).toContain('Create a chatbot')
  })

  it('has a main landmark', () => {
    renderPage()

    expect(screen.getByRole('main')).toBeTruthy()
  })
})
