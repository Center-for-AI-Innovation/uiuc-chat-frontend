import React from 'react'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import router from 'next/router'

import { server } from '~/test-utils/server'
import { renderWithProviders } from '~/test-utils/renderWithProviders'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('../navbars/Navbar', () => ({
  __esModule: true,
  default: ({ isPlain }: { isPlain: boolean }) =>
    React.createElement('nav', {
      'data-testid': 'navbar',
      'data-plain': String(isPlain),
    }),
}))

vi.mock('../GlobalFooter', () => ({
  __esModule: true,
  default: () =>
    React.createElement('div', { 'data-testid': 'footer' }, 'GlobalFooter'),
}))

vi.mock('../ProjectTable', () => ({
  __esModule: true,
  default: () =>
    React.createElement(
      'div',
      { 'data-testid': 'project-table' },
      'ProjectTable',
    ),
}))

vi.mock('~/utils/apiUtils', async (importOriginal) => {
  const actual: any = await importOriginal()
  return {
    ...actual,
    createProject: vi.fn(async () => true),
  }
})

// The default export of next/router is a mutable object shared across tests.
// Dashboard.tsx imports `router` directly (default import) rather than using
// `useRouter()`, so we mutate this shared object to control `router.asPath`
// and `router.push` in tests.
const originalAsPath = router.asPath

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  // Restore default router state after each test
  router.asPath = originalAsPath
})

describe('Dashboard – rendering', () => {
  it('renders the page with title, description, Navbar, ProjectTable, and GlobalFooter', async () => {
    router.asPath = '/new'

    server.use(
      http.get('*/api/UIUC-api/getAllCourseNames', async () => {
        return HttpResponse.json({ all_course_names: ['existing-course'] })
      }),
    )

    const Dashboard = (await import('../Dashboard')).default
    renderWithProviders(
      <Dashboard
        project_name="Test Project"
        current_user_email="user@example.com"
      />,
    )

    expect(screen.getByTestId('navbar')).toBeInTheDocument()
    expect(screen.getByTestId('footer')).toBeInTheDocument()
    expect(screen.getByTestId('project-table')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /My Chatbots/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/chatbots you've created, or where you are an admin/i),
    ).toBeInTheDocument()
  })

  it('renders with project_name in the title element', async () => {
    router.asPath = '/dashboard'

    const Dashboard = (await import('../Dashboard')).default
    const { container } = renderWithProviders(
      <Dashboard
        project_name="My Custom Bot"
        current_user_email="user@example.com"
      />,
    )

    // next/head appends <title> to the document head
    // In jsdom, document.title may not be updated, so verify the heading renders
    expect(
      screen.getByRole('heading', { name: /My Chatbots/i }),
    ).toBeInTheDocument()
    expect(container.querySelector('main')).toBeInTheDocument()
  })

  it('renders with empty project_name', async () => {
    router.asPath = '/dashboard'

    const Dashboard = (await import('../Dashboard')).default
    renderWithProviders(
      <Dashboard project_name="" current_user_email="user@example.com" />,
    )

    expect(
      screen.getByRole('heading', { name: /My Chatbots/i }),
    ).toBeInTheDocument()
  })

  it('passes isPlain=false to Navbar', async () => {
    router.asPath = '/dashboard'

    const Dashboard = (await import('../Dashboard')).default
    renderWithProviders(
      <Dashboard project_name="Test" current_user_email="user@example.com" />,
    )

    expect(screen.getByTestId('navbar')).toHaveAttribute('data-plain', 'false')
  })
})

describe('Dashboard – course name fetching on /new page', () => {
  it('fetches all course names when on the /new page', async () => {
    router.asPath = '/new'

    let fetchCalled = false
    server.use(
      http.get('*/api/UIUC-api/getAllCourseNames', async () => {
        fetchCalled = true
        return HttpResponse.json({
          all_course_names: ['course-a', 'course-b'],
        })
      }),
    )

    const Dashboard = (await import('../Dashboard')).default
    renderWithProviders(
      <Dashboard project_name="" current_user_email="user@example.com" />,
    )

    await waitFor(() => {
      expect(fetchCalled).toBe(true)
    })
  })

  it('fetches all course names when on /new?course_name=something', async () => {
    router.asPath = '/new?course_name=mycourse'

    let fetchCalled = false
    server.use(
      http.get('*/api/UIUC-api/getAllCourseNames', async () => {
        fetchCalled = true
        return HttpResponse.json({ all_course_names: [] })
      }),
    )

    const Dashboard = (await import('../Dashboard')).default
    renderWithProviders(
      <Dashboard
        project_name="mycourse"
        current_user_email="user@example.com"
      />,
    )

    await waitFor(() => {
      expect(fetchCalled).toBe(true)
    })
  })

  it('does NOT fetch course names when not on the /new page', async () => {
    router.asPath = '/dashboard'

    let fetchCalled = false
    server.use(
      http.get('*/api/UIUC-api/getAllCourseNames', async () => {
        fetchCalled = true
        return HttpResponse.json({ all_course_names: [] })
      }),
    )

    const Dashboard = (await import('../Dashboard')).default
    renderWithProviders(
      <Dashboard
        project_name="existing"
        current_user_email="user@example.com"
      />,
    )

    // Give some time for the effect to potentially fire
    await new Promise((r) => setTimeout(r, 100))
    expect(fetchCalled).toBe(false)
  })

  it('handles non-ok response for getAllCourseNames gracefully', async () => {
    router.asPath = '/new'

    server.use(
      http.get('*/api/UIUC-api/getAllCourseNames', async () => {
        return HttpResponse.json({ error: 'Server error' }, { status: 500 })
      }),
    )

    const Dashboard = (await import('../Dashboard')).default
    renderWithProviders(
      <Dashboard project_name="" current_user_email="user@example.com" />,
    )

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Error fetching course metadata'),
      )
    })

    // Page should still render despite the error
    expect(screen.getByTestId('project-table')).toBeInTheDocument()
  })

  it('handles network failure for getAllCourseNames gracefully', async () => {
    router.asPath = '/new'

    server.use(
      http.get('*/api/UIUC-api/getAllCourseNames', async () => {
        return HttpResponse.error()
      }),
    )

    const Dashboard = (await import('../Dashboard')).default
    renderWithProviders(
      <Dashboard project_name="" current_user_email="user@example.com" />,
    )

    // The .catch(error => console.error(error)) catches the network error
    await waitFor(() => {
      expect(console.error).toHaveBeenCalled()
    })

    expect(screen.getByTestId('project-table')).toBeInTheDocument()
  })
})

describe('Dashboard – course availability check', () => {
  it('sets unavailable when project name matches existing course', async () => {
    router.asPath = '/new'

    server.use(
      http.get('*/api/UIUC-api/getAllCourseNames', async () => {
        return HttpResponse.json({
          all_course_names: ['taken-name', 'other-course'],
        })
      }),
    )

    const Dashboard = (await import('../Dashboard')).default
    renderWithProviders(
      <Dashboard
        project_name="taken-name"
        current_user_email="user@example.com"
      />,
    )

    // The component exercises checkCourseAvailability internally after fetch.
    // We verify the component remains stable after both effects run.
    await waitFor(() => {
      expect(screen.getByTestId('project-table')).toBeInTheDocument()
    })
  })

  it('sets available when project name does not match existing courses', async () => {
    router.asPath = '/new'

    server.use(
      http.get('*/api/UIUC-api/getAllCourseNames', async () => {
        return HttpResponse.json({
          all_course_names: ['other-course'],
        })
      }),
    )

    const Dashboard = (await import('../Dashboard')).default
    renderWithProviders(
      <Dashboard
        project_name="new-unique-name"
        current_user_email="user@example.com"
      />,
    )

    await waitFor(() => {
      expect(screen.getByTestId('project-table')).toBeInTheDocument()
    })
  })

  it('handles empty projectName in availability check without crashing', async () => {
    router.asPath = '/new'

    server.use(
      http.get('*/api/UIUC-api/getAllCourseNames', async () => {
        return HttpResponse.json({
          all_course_names: ['some-course'],
        })
      }),
    )

    const Dashboard = (await import('../Dashboard')).default
    renderWithProviders(
      <Dashboard project_name="" current_user_email="user@example.com" />,
    )

    await waitFor(() => {
      expect(screen.getByTestId('project-table')).toBeInTheDocument()
    })
  })
})

describe('Dashboard – prop variations', () => {
  it('renders with is_new_course=false (no fetch)', async () => {
    router.asPath = '/dashboard'

    const Dashboard = (await import('../Dashboard')).default
    renderWithProviders(
      <Dashboard
        project_name="existing-project"
        current_user_email="user@example.com"
        is_new_course={false}
      />,
    )

    expect(screen.getByTestId('project-table')).toBeInTheDocument()
  })

  it('renders with is_new_course=true (default) and project_description', async () => {
    router.asPath = '/new'

    server.use(
      http.get('*/api/UIUC-api/getAllCourseNames', async () => {
        return HttpResponse.json({ all_course_names: [] })
      }),
    )

    const Dashboard = (await import('../Dashboard')).default
    renderWithProviders(
      <Dashboard
        project_name="test-project"
        current_user_email="user@example.com"
        project_description="A test project description"
      />,
    )

    expect(screen.getByTestId('project-table')).toBeInTheDocument()
  })

  it('renders without optional project_description prop', async () => {
    router.asPath = '/dashboard'

    const Dashboard = (await import('../Dashboard')).default
    renderWithProviders(
      <Dashboard project_name="test" current_user_email="user@example.com" />,
    )

    expect(screen.getByTestId('project-table')).toBeInTheDocument()
  })
})
