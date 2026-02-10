import React from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { LoadingSpinner } from '../LoadingSpinner'
import {
  LoadingPlaceholderForAdminPages,
  MainPageBackground,
} from '../MainPageBackground'

describe('UIUC-Components basics', () => {
  it('LoadingSpinner renders a status role', () => {
    render(<LoadingSpinner />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('MainPageBackground renders children', () => {
    render(
      <MainPageBackground>
        <div>child</div>
      </MainPageBackground>,
    )
    expect(screen.getByText('child')).toBeInTheDocument()
  })

  it('LoadingPlaceholderForAdminPages renders', () => {
    render(<LoadingPlaceholderForAdminPages />)
    expect(screen.getAllByRole('status').length).toBeGreaterThan(0)
  })
})
