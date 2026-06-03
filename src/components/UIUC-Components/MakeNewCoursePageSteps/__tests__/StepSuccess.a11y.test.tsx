/**
 * Accessibility tests for the StepSuccess component.
 *
 * Tests WCAG AA compliance via axe-core and verifies semantic structure,
 * ARIA attributes, and keyboard accessibility.
 *
 * Run with: npm run test:a11y
 */
import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

vi.mock('next/router', () => ({
  __esModule: true,
  default: { push: vi.fn() },
}))

vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    const { fill, priority, ...rest } = props
    return <img {...rest} />
  },
}))

import StepSuccess from '../StepSuccess'

describe('StepSuccess - accessibility', () => {
  const defaultProps = {
    project_name: 'test-project',
    onContinueDesigning: vi.fn(),
  }

  // -------------------------------------------------------------------------
  // axe-core automated audit
  // -------------------------------------------------------------------------
  it('has no axe violations', async () => {
    const { container } = render(<StepSuccess {...defaultProps} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  // -------------------------------------------------------------------------
  // Semantic structure
  // -------------------------------------------------------------------------
  describe('semantic structure', () => {
    it('renders success heading at h2 level', () => {
      render(<StepSuccess {...defaultProps} />)
      const heading = screen.getByRole('heading', { level: 2 })
      expect(heading).toHaveTextContent(/success/i)
    })

    it('renders card headings at h3 level', () => {
      render(<StepSuccess {...defaultProps} />)
      const headings = screen.getAllByRole('heading', { level: 3 })
      expect(headings).toHaveLength(2)
      expect(headings[0]).toHaveTextContent('Dive Right In!')
      expect(headings[1]).toHaveTextContent('Fine Tune')
    })

    it('uses section elements with aria-labels for cards', () => {
      render(<StepSuccess {...defaultProps} />)

      const startSection = screen.getByRole('region', {
        name: /start chatting now/i,
      })
      const customizeSection = screen.getByRole('region', {
        name: /customize your chatbot/i,
      })

      expect(startSection).toBeInTheDocument()
      expect(customizeSection).toBeInTheDocument()
    })

    it('renders feature list as ul with li items', () => {
      render(<StepSuccess {...defaultProps} />)

      const list = screen.getByRole('list', {
        name: /available customization options/i,
      })
      expect(list).toBeInTheDocument()

      const items = within(list).getAllByRole('listitem')
      expect(items).toHaveLength(4)
    })
  })

  // -------------------------------------------------------------------------
  // ARIA attributes
  // -------------------------------------------------------------------------
  describe('ARIA attributes', () => {
    it('has a separator between cards', () => {
      render(<StepSuccess {...defaultProps} />)
      const separator = screen.getByRole('separator')
      expect(separator).toHaveAttribute('aria-label', 'or')
    })

    it('decorative image has empty alt and presentation role', () => {
      render(<StepSuccess {...defaultProps} />)
      const img = screen.getByRole('presentation')
      expect(img).toHaveAttribute('alt', '')
    })

    it('decorative icons have aria-hidden', () => {
      const { container } = render(<StepSuccess {...defaultProps} />)
      const hiddenIcons = container.querySelectorAll('[aria-hidden="true"]')
      // MessageSquare, Settings, 3x ArrowRight, "or" text, 4x FeatureItem icons = 10+
      expect(hiddenIcons.length).toBeGreaterThanOrEqual(5)
    })
  })

  // -------------------------------------------------------------------------
  // Interactive elements
  // -------------------------------------------------------------------------
  describe('interactive elements', () => {
    it('Start Chatting button is keyboard-accessible', () => {
      render(<StepSuccess {...defaultProps} />)
      const btn = screen.getByRole('button', { name: /start chatting now/i })
      expect(btn).toBeInTheDocument()
      expect(btn.tagName).toBe('BUTTON')
    })

    it('Continue Designing button is keyboard-accessible', () => {
      render(<StepSuccess {...defaultProps} />)
      const btn = screen.getByRole('button', { name: /continue designing/i })
      expect(btn).toBeInTheDocument()
      expect(btn.tagName).toBe('BUTTON')
    })

    it('Continue Designing calls onContinueDesigning on click', async () => {
      const onContinue = vi.fn()
      render(
        <StepSuccess
          project_name="test-project"
          onContinueDesigning={onContinue}
        />,
      )

      const btn = screen.getByRole('button', { name: /continue designing/i })
      btn.click()
      expect(onContinue).toHaveBeenCalledOnce()
    })
  })
})
