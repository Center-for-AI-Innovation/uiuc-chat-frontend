import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'

import { server } from '~/test-utils/server'
import { renderWithProviders } from '~/test-utils/renderWithProviders'

vi.mock('../navbars/GlobalHeader', () => ({
  default: () => React.createElement('div', null, 'GlobalHeader'),
}))
vi.mock('../GlobalFooter', () => ({
  default: () => React.createElement('div', null, 'GlobalFooter'),
}))
vi.mock('../CannotEditCourse', () => ({
  CannotEditCourse: ({ course_name }: any) =>
    React.createElement('div', null, `CannotEditCourse:${course_name}`),
}))

describe('Course access pages', () => {
  it('CanViewOnlyCourse renders a link to chat and contact emails', async () => {
    const { CanViewOnlyCourse } = await import('../CanViewOnlyCourse')
    renderWithProviders(
      <CanViewOnlyCourse
        course_name="CS101"
        course_metadata={
          {
            course_owner: 'owner@example.com',
            course_admins: ['a@example.com'],
          } as any
        }
      />,
    )

    expect(screen.getByText(/You cannot edit this page/i)).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /uiuc\.chat\/CS101/i }),
    ).toHaveAttribute('href', '/CS101/chat')
    expect(screen.getByText(/owner@example\.com/i)).toBeInTheDocument()
    expect(screen.getByText(/a@example\.com/i)).toBeInTheDocument()
  })

  it('CannotViewCourse renders CannotEditCourse for owners/admins', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    globalThis.__TEST_AUTH__ = {
      isLoading: false,
      isAuthenticated: true,
      user: { profile: { email: 'owner@example.com' } },
    }
    server.use(
      http.get('*/api/UIUC-api/getCourseMetadata', async () => {
        return HttpResponse.json({
          course_metadata: {
            course_owner: 'owner@example.com',
            course_admins: [],
          },
        })
      }),
    )

    const { CannotViewCourse } = await import('../CannotViewCourse')
    renderWithProviders(<CannotViewCourse course_name="CS101" />)

    expect(await screen.findByText(/CannotEditCourse/i)).toBeInTheDocument()
  })

  it('CannotViewCourse shows unauthorized message for non-owners', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    globalThis.__TEST_AUTH__ = {
      isLoading: false,
      isAuthenticated: true,
      user: { profile: { email: 'student@example.com' } },
    }
    server.use(
      http.get('*/api/UIUC-api/getCourseMetadata', async () => {
        return HttpResponse.json({
          course_metadata: {
            course_owner: 'owner@example.com',
            course_admins: [],
          },
        })
      }),
    )

    const { CannotViewCourse } = await import('../CannotViewCourse')
    renderWithProviders(<CannotViewCourse course_name="CS101" />)

    expect(
      await screen.findByText(/You are not authorized to view this page/i),
    ).toBeInTheDocument()
  })
})
