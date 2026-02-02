import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithProviders } from '~/test-utils/renderWithProviders'

vi.mock('@mantine/notifications', () => ({
  notifications: { show: vi.fn() },
}))

vi.mock('mantine-datatable', () => ({
  DataTable: ({ records = [], columns = [], onPageChange, page, totalRecords }: any) => (
    <div>
      <div data-testid="datatable-meta">
        page:{page} total:{totalRecords} records:{records.length}
      </div>
      <button type="button" onClick={() => onPageChange?.(2)}>
        next-page
      </button>
      <div data-testid="datatable">
        {records.map((r: any) => (
          <div key={String(r.id ?? r.name)}>
            {columns.map((c: any) => (
              <div key={String(c.accessor ?? c.title)}>
                {typeof c.render === 'function'
                  ? c.render(r)
                  : String(r?.[c.accessor] ?? '')}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  ),
}))

vi.mock('~/utils/functionCalling/handleFunctionCalling', () => ({
  useFetchAllWorkflows: () => ({
    data: [
      {
        id: 'w1',
        name: 'Workflow A',
        active: true,
        enabled: true,
        tags: [{ name: 't1' }, { name: 't2' }],
        createdAt: '2024-01-02T03:04:05Z',
        updatedAt: '2024-01-03T03:04:05Z',
      },
    ],
    isLoading: false,
    isSuccess: true,
    isError: false,
    refetch: vi.fn(),
  }),
}))

const mutateSpy = vi.fn()
vi.mock('@tanstack/react-query', async (importOriginal) => {
  const original = await importOriginal<any>()
  return {
    ...original,
    useMutation: (options: any) => ({
      mutate: (variables: any) => {
        mutateSpy(variables)
        // Drive error + settled callbacks for coverage.
        const ctx = options?.onMutate?.(variables)
        options?.onError?.(new Error('boom'), variables, ctx)
        options?.onSettled?.(undefined, new Error('boom'), variables, ctx)
      },
    }),
  }
})

import { N8nWorkflowsTable } from '../N8nWorkflowsTable'

describe('N8nWorkflowsTable', () => {
  it('renders records and toggles workflow activation', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <N8nWorkflowsTable
        n8nApiKey="key"
        course_name="CS101"
        isEmptyWorkflowTable={false}
        sidebarCollapsed
      />,
    )

    expect(await screen.findByText(/These tools can be automatically invoked/i)).toBeInTheDocument()
    expect(screen.getByTestId('datatable')).toBeInTheDocument()

    // Toggle switch triggers mutate with id + checked
    const checkbox = screen.getByRole('switch')
    await user.click(checkbox)
    expect(mutateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'w1', checked: false }),
    )

    // Pagination callback wired
    await user.click(screen.getByRole('button', { name: /next-page/i }))
    expect(screen.getByTestId('datatable-meta')).toHaveTextContent('page:2')
  })
})
