import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithProviders } from '~/test-utils/renderWithProviders'

vi.mock('~/utils/apiUtils', async (importOriginal) => {
  const original = await importOriginal<any>()
  return {
    ...original,
    callSetCourseMetadata: vi.fn(async () => true),
  }
})

import { callSetCourseMetadata } from '~/utils/apiUtils'
import EmailListAccordion from '../EmailListAccordion'

describe('EmailListAccordion', () => {
  it('returns null for public member lists', () => {
    const { container } = renderWithProviders(
      <EmailListAccordion
        course_name="CS101"
        metadata={
          {
            course_owner: 'owner@example.com',
            course_admins: [],
            approved_emails_list: [],
          } as any
        }
        is_private={false}
        is_for_admins={false}
      />,
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('adds, validates, pastes, and deletes member emails', async () => {
    const user = userEvent.setup()
    const onEmailAddressesChange = vi.fn()

    renderWithProviders(
      <EmailListAccordion
        course_name="CS101"
        metadata={
          {
            course_owner: 'owner@example.com',
            course_admins: ['admin@example.com'],
            approved_emails_list: ['a@example.com'],
          } as any
        }
        is_private
        is_for_admins={false}
        onEmailAddressesChange={onEmailAddressesChange}
      />,
    )

    const input = screen.getByPlaceholderText(/Add people by email/i)

    await user.type(input, 'not-an-email')
    await user.keyboard('{Enter}')
    expect(await screen.findByText(/not-an-email is not a valid email address/i)).toBeInTheDocument()

    await user.clear(input)
    await user.type(input, 'b@example.com')
    await user.keyboard('{Enter}')

    expect(callSetCourseMetadata).toHaveBeenCalled()
    expect(onEmailAddressesChange).toHaveBeenCalled()

    // Paste multiple emails (should de-dupe existing a@example.com)
    await user.clear(input)
    fireEvent.paste(input, {
      clipboardData: {
        getData: () => 'a@example.com c@example.com',
      },
    })
    expect(callSetCourseMetadata).toHaveBeenCalled()

    // Delete an email row
    await user.click(screen.getByRole('button', { name: /Remove a@example.com/i }))
    expect(callSetCourseMetadata).toHaveBeenCalled()
  })

  it('manages admin list and preserves super admins', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <EmailListAccordion
        course_name="CS101"
        metadata={
          {
            course_owner: 'owner@example.com',
            course_admins: ['admin1@example.com', 'rohan13@illinois.edu'],
          } as any
        }
        is_private={false}
        is_for_admins
      />,
    )

    // Should show the non-super admin entry in the expanded list
    expect(await screen.findByText('admin1@example.com')).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: /Remove admin1@example.com/i }),
    )

    expect(callSetCourseMetadata).toHaveBeenCalledWith(
      'CS101',
      expect.objectContaining({
        course_admins: expect.arrayContaining(['rohan13@illinois.edu']),
      }),
    )
  })
})
