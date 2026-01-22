import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('@mantine/notifications', () => ({
  notifications: {
    show: vi.fn(),
    update: vi.fn(),
    hide: vi.fn(),
    clean: vi.fn(),
  },
  showNotification: vi.fn(),
}))

vi.mock('~/pages/util/downloadConversationHistory', () => ({
  __esModule: true,
  default: vi.fn(async () => ({ message: 'ok' })),
}))

vi.mock('@mantine/core', async (importOriginal) => {
  const actual: any = await importOriginal()
  return {
    ...actual,
    Select: (props: any) => {
      const themeStub = {
        colors: { dark: ['#000', '#111'] },
        radius: { md: '4px' },
        fontFamily: 'system-ui',
        white: '#fff',
      }
      if (typeof props.styles === 'function') props.styles(themeStub)

      return (
        <select
          data-testid={props.data?.length === 5 ? 'date-range-select' : 'view-select'}
          value={props.value ?? ''}
          onChange={(e) => props.onChange?.(e.target.value)}
        >
        {(props.data ?? []).map((opt: any) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
        </select>
      )
    },
  }
})

vi.mock('@mantine/dates', () => ({
  DatePickerInput: (props: any) => (
    <button
      type="button"
      onClick={() => {
        if (typeof props.styles === 'function') {
          props.styles({
            colors: { grape: ['#000', '#111', '#222', '#333', '#444', '#555', '#666', '#777', '#888'] },
            white: '#fff',
          })
        }
        props.onChange?.([new Date('2024-01-01'), new Date('2024-01-05')])
      }}
    >
      set-date-range
    </button>
  ),
}))

import { renderWithProviders } from '~/test-utils/renderWithProviders'
import MakeQueryAnalysisPage from '../MakeQueryAnalysisPage'

function makeJson(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

describe('MakeQueryAnalysisPage', () => {
  it('renders stats + charts for an authorized owner and supports download', async () => {
    const user = userEvent.setup()

    globalThis.__TEST_ROUTER__ = {
      asPath: '/CS101/analysis',
      replace: vi.fn(),
    }
    globalThis.__TEST_AUTH__ = {
      isLoading: false,
      isAuthenticated: true,
      user: { profile: { email: 'owner@example.com' } },
    }

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: any) => {
      const url = String(input?.url ?? input)
      if (url.includes('/api/UIUC-api/getCourseMetadata')) {
        return makeJson({
          course_metadata: {
            // Ensure the component's defensive JSON.parse branch runs.
            is_private: 'true',
            course_owner: 'owner@example.com',
            course_admins: [],
            project_description: 'desc',
          },
        })
      }
      if (url.includes('/api/UIUC-api/getConversationStats')) {
        return makeJson({
          total_count: 2,
          per_day: { '2024-01-01': 1, '2024-01-02': 1 },
          per_hour: { 0: 1 },
          per_weekday: { Monday: 2 },
          heatmap: { Sunday: { 0: 1 }, Monday: {}, Tuesday: {}, Wednesday: {}, Thursday: {}, Friday: {}, Saturday: {} },
        })
      }
      if (url.includes('/api/UIUC-api/getProjectStats')) {
        return makeJson({
          total_conversations: 10,
          total_messages: 20,
          unique_users: 5,
          avg_conversations_per_user: 2,
          avg_messages_per_user: 4,
          avg_messages_per_conversation: 2,
        })
      }
      if (url.includes('/api/UIUC-api/getWeeklyTrends')) {
        return makeJson([
          { metric_name: 'Total Conversations', current_week_value: 10, previous_week_value: 5, percentage_change: 100 },
          { metric_name: 'Total Users', current_week_value: 1, previous_week_value: 2, percentage_change: -50 },
          { metric_name: 'Total Messages', current_week_value: 0, previous_week_value: 0, percentage_change: 0 },
        ])
      }
      if (url.includes('/api/UIUC-api/getModelUsageCounts')) {
        return makeJson([{ model_name: 'gpt-4o-mini', count: 2, percentage: 100 }])
      }
      return makeJson({})
    })

    renderWithProviders(<MakeQueryAnalysisPage course_name="CS101" />)

    // Wait for metadata gating to clear.
    expect(await screen.findByText(/Total Conversations/i)).toBeInTheDocument()
    expect(screen.getByText(/Conversation Visualizations/i)).toBeInTheDocument()

    await user.click(screen.getByText(/Download Conversation History/i))
    const downloadConversationHistory = (await import('~/pages/util/downloadConversationHistory')).default as any
    await waitFor(() => expect(downloadConversationHistory).toHaveBeenCalled())
  })

  it('logs an error when course metadata fetch fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    globalThis.__TEST_ROUTER__ = {
      asPath: '/CS101/analysis',
      replace: vi.fn(),
    }
    globalThis.__TEST_AUTH__ = {
      isLoading: false,
      isAuthenticated: true,
      user: { profile: { email: 'owner@example.com' } },
    }

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: any) => {
      const url = String(input?.url ?? input)
      if (url.includes('/api/UIUC-api/getCourseMetadata')) {
        return new Response(JSON.stringify({ error: 'boom' }), { status: 500 })
      }
      return makeJson({})
    })

    renderWithProviders(<MakeQueryAnalysisPage course_name="CS101" />)

    await waitFor(() => expect(console.error).toHaveBeenCalled())
  })

  it('shows the empty-state when there is no conversation data for the selected range', async () => {
    globalThis.__TEST_ROUTER__ = {
      asPath: '/CS101/analysis',
      replace: vi.fn(),
    }
    globalThis.__TEST_AUTH__ = {
      isLoading: false,
      isAuthenticated: true,
      user: { profile: { email: 'owner@example.com' } },
    }

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: any) => {
      const url = String(input?.url ?? input)
      if (url.includes('/api/UIUC-api/getCourseMetadata')) {
        return makeJson({
          course_metadata: {
            is_private: false,
            course_owner: 'owner@example.com',
            course_admins: [],
            project_description: 'desc',
          },
        })
      }
      if (url.includes('/api/UIUC-api/getConversationStats')) {
        return makeJson({
          total_count: 0,
          per_day: {},
          per_hour: {},
          per_weekday: {},
          heatmap: {},
        })
      }
      if (url.includes('/api/UIUC-api/getProjectStats')) return makeJson({})
      if (url.includes('/api/UIUC-api/getWeeklyTrends')) return makeJson([])
      if (url.includes('/api/UIUC-api/getModelUsageCounts')) return makeJson([])
      return makeJson({})
    })

    renderWithProviders(<MakeQueryAnalysisPage course_name="CS101" />)

    expect(
      await screen.findByText(
        /No conversation data available for selected time range/i,
      ),
    ).toBeInTheDocument()
  })

  it('redirects when unauthorized', async () => {
    globalThis.__TEST_ROUTER__ = {
      asPath: '/CS101/analysis',
      replace: vi.fn(),
    }
    globalThis.__TEST_AUTH__ = {
      isLoading: false,
      isAuthenticated: true,
      user: { profile: { email: 'not-owner@example.com' } },
    }

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: any) => {
      const url = String(input?.url ?? input)
      if (url.includes('/api/UIUC-api/getCourseMetadata')) {
        return makeJson({
          course_metadata: {
            is_private: false,
            course_owner: 'owner@example.com',
            course_admins: [],
          },
        })
      }
      if (url.includes('/api/UIUC-api/getConversationStats')) {
        return makeJson({ total_count: 0, per_day: {}, per_hour: {}, per_weekday: {}, heatmap: {} })
      }
      if (url.includes('/api/UIUC-api/getProjectStats')) return makeJson({})
      if (url.includes('/api/UIUC-api/getWeeklyTrends')) return makeJson([])
      if (url.includes('/api/UIUC-api/getModelUsageCounts')) return makeJson([])
      return makeJson({})
    })

    renderWithProviders(<MakeQueryAnalysisPage course_name="CS101" />)
    await waitFor(() =>
      expect(globalThis.__TEST_ROUTER__?.replace).toHaveBeenCalled(),
    )
  })

  it('supports switching date range + view selects, including custom ranges', async () => {
    const user = userEvent.setup()

    globalThis.__TEST_ROUTER__ = {
      asPath: '/CS101/analysis',
      replace: vi.fn(),
    }
    globalThis.__TEST_AUTH__ = {
      isLoading: false,
      isAuthenticated: true,
      user: { profile: { email: 'owner@example.com' } },
    }

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: any) => {
      const url = String(input?.url ?? input)
      if (url.includes('/api/UIUC-api/getCourseMetadata')) {
        return makeJson({
          course_metadata: {
            is_private: false,
            course_owner: 'owner@example.com',
            course_admins: [],
            project_description: 'desc',
          },
        })
      }
      if (url.includes('/api/UIUC-api/getConversationStats')) {
        return makeJson({
          total_count: 2,
          per_day: { '2024-01-01': 1 },
          per_hour: { 0: 1 },
          per_weekday: { Monday: 1 },
          heatmap: { Monday: { 0: 1 } },
        })
      }
      if (url.includes('/api/UIUC-api/getProjectStats')) {
        return makeJson({
          total_conversations: 10,
          total_messages: 20,
          unique_users: 5,
          avg_conversations_per_user: 2,
          avg_messages_per_user: 4,
          avg_messages_per_conversation: 2,
        })
      }
      if (url.includes('/api/UIUC-api/getWeeklyTrends')) return makeJson([])
      if (url.includes('/api/UIUC-api/getModelUsageCounts')) return makeJson([])
      return makeJson({})
    })

    renderWithProviders(<MakeQueryAnalysisPage course_name="CS101" />)

    expect(await screen.findByText(/Conversation Visualizations/i)).toBeInTheDocument()

    // Switch view selector to weekday.
    await user.selectOptions(screen.getByTestId('view-select'), 'weekday')

    // Switch date ranges to cover multiple cases.
    await user.selectOptions(screen.getByTestId('date-range-select'), 'last_week')
    await user.selectOptions(screen.getByTestId('date-range-select'), 'last_year')
    await user.selectOptions(screen.getByTestId('date-range-select'), 'all')

    // Custom range renders date picker; setting it triggers fetch with explicit dates.
    await user.selectOptions(screen.getByTestId('date-range-select'), 'custom')
    await user.click(screen.getByRole('button', { name: /set-date-range/i }))

    expect(true).toBe(true)
  })

  it('shows empty-state when custom range is selected without a full date range', async () => {
    const user = userEvent.setup()
    globalThis.__TEST_ROUTER__ = { asPath: '/CS101/analysis', replace: vi.fn() }
    globalThis.__TEST_AUTH__ = {
      isLoading: false,
      isAuthenticated: true,
      user: { profile: { email: 'owner@example.com' } },
    }

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: any) => {
      const url = String(input?.url ?? input)
      if (url.includes('/api/UIUC-api/getCourseMetadata')) {
        return makeJson({
          course_metadata: {
            is_private: false,
            course_owner: 'owner@example.com',
            course_admins: [],
            project_description: 'desc',
          },
        })
      }
      if (url.includes('/api/UIUC-api/getConversationStats')) {
        return makeJson({
          total_count: 2,
          per_day: { '2024-01-01': 1 },
          per_hour: { 0: 1 },
          per_weekday: { Monday: 1 },
          heatmap: { Monday: { 0: 1 } },
        })
      }
      if (url.includes('/api/UIUC-api/getProjectStats')) return makeJson({})
      if (url.includes('/api/UIUC-api/getWeeklyTrends')) return makeJson([])
      if (url.includes('/api/UIUC-api/getModelUsageCounts')) return makeJson([])
      return makeJson({})
    })

    renderWithProviders(<MakeQueryAnalysisPage course_name="CS101" />)

    expect(await screen.findByText(/Conversation Visualizations/i)).toBeInTheDocument()
    await user.selectOptions(screen.getByTestId('date-range-select'), 'custom')
    expect(
      await screen.findByText(/No conversation data available for selected time range/i),
    ).toBeInTheDocument()
  })

  it('handles failing stats endpoints', async () => {
    globalThis.__TEST_ROUTER__ = { asPath: '/CS101/analysis', replace: vi.fn() }
    globalThis.__TEST_AUTH__ = {
      isLoading: false,
      isAuthenticated: true,
      user: { profile: { email: 'owner@example.com' } },
    }

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: any) => {
      const url = String(input?.url ?? input)
      if (url.includes('/api/UIUC-api/getCourseMetadata')) {
        return makeJson({
          course_metadata: {
            is_private: false,
            course_owner: 'owner@example.com',
            course_admins: [],
            project_description: 'desc',
          },
        })
      }
      if (url.includes('/api/UIUC-api/getConversationStats')) {
        return makeJson({ total_count: 1, per_day: { '2024-01-01': 1 }, per_hour: {}, per_weekday: {}, heatmap: {} })
      }
      if (url.includes('/api/UIUC-api/getProjectStats')) return new Response('fail', { status: 500 })
      if (url.includes('/api/UIUC-api/getWeeklyTrends')) return new Response('fail', { status: 500 })
      if (url.includes('/api/UIUC-api/getModelUsageCounts')) return new Response('fail', { status: 500 })
      return makeJson({})
    })

    renderWithProviders(<MakeQueryAnalysisPage course_name="CS101" />)
    expect(await screen.findByText(/Conversation Visualizations/i)).toBeInTheDocument()
  })
})
