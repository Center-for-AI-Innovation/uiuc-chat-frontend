import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'

import { server } from '~/test-utils/server'
import { renderWithProviders } from '~/test-utils/renderWithProviders'

vi.mock('@mantine/notifications', () => ({
  notifications: {
    show: vi.fn(),
    update: vi.fn(),
    hide: vi.fn(),
    clean: vi.fn(),
  },
  showNotification: vi.fn(),
}))

vi.mock('axios', () => ({
  default: {
    delete: vi.fn(async () => ({})),
    post: vi.fn(async () => ({ data: {} })),
    get: vi.fn(async () => ({ data: {} })),
  },
}))

vi.mock('mantine-datatable', () => ({
  DataTable: (props: any) => {
    const records = props.records ?? []
    const columns = props.columns ?? []
    return (
      <div>
        <button
          type="button"
          onClick={() =>
            props.onSortStatusChange?.({
              ...props.sortStatus,
              direction: props.sortStatus?.direction === 'asc' ? 'desc' : 'asc',
            })
          }
        >
          sort-toggle
        </button>
        <button
          type="button"
          onClick={() => props.onSelectedRecordsChange?.([records[0]])}
        >
          select-first
        </button>
        <button
          type="button"
          onClick={() =>
            props.onSelectedRecordsChange?.(
              Array.from({ length: 101 }).map((_, i) => ({ id: i + 1 })),
            )
          }
        >
          select-many
        </button>
        <div>
          {columns.map((col: any, idx: number) => (
            <div key={idx}>{col.filter ?? null}</div>
          ))}
        </div>
        <div>
          {records.length === 0 ? (props.noRecordsIcon ?? null) : null}
          {records.map((record: any, index: number) => (
            <div key={record.id ?? record.s3_path ?? record.url ?? index}>
              {columns.map((col: any, cIdx: number) => (
                <div key={cIdx}>
                  {col.render
                    ? col.render(record, index)
                    : (record[col.accessor] ?? null)}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  },
}))

vi.mock('@mantine/core', async (importOriginal) => {
  const actual: any = await importOriginal()
  return {
    ...actual,
    MultiSelect: (props: any) => (
      <div>
        <div aria-label="multiselect-kind">{props.sx ? 'row' : 'bulk'}</div>
        <div aria-label="multiselect-value">
          {(props.value ?? []).join(',')}
        </div>
        <button
          type="button"
          onClick={() => props.onChange?.([...(props.value ?? []), 'Group B'])}
        >
          {props.sx ? 'set-groups-row' : 'set-groups-bulk'}
        </button>
        <button type="button" onClick={() => props.onChange?.([])}>
          {props.sx ? 'clear-groups-row' : 'clear-groups-bulk'}
        </button>
      </div>
    ),
  }
})

vi.mock('@/hooks/queries/useFetchDocumentGroups', () => ({
  useFetchDocumentGroups: () => ({
    data: [
      { id: 1, name: 'Group A', doc_count: 1, enabled: true },
      { id: 2, name: 'Group B', doc_count: 0, enabled: true },
    ],
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
}))

vi.mock('@/hooks/queries/useAppendToDocGroup', () => ({
  useAppendToDocGroup: () => ({
    mutate: vi.fn(async () => undefined),
    isPending: false,
  }),
}))

vi.mock('@/hooks/queries/useDeleteFromDocGroup', () => ({
  useDeleteFromDocGroup: () => ({
    mutate: vi.fn(async () => undefined),
    isPending: false,
  }),
}))

vi.mock('@/hooks/__internal__/downloadPresignedUrl', () => ({
  fetchPresignedUrl: vi.fn(async () => 'http://localhost/presigned'),
}))

vi.mock('~/hooks/__internal__/handleExport', () => ({
  default: vi.fn(async () => ({ message: 'export started' })),
}))

describe('ProjectFilesTable', () => {
  it('renders success tab, filters/sorts, views and deletes documents, and opens export modal', async () => {
    const user = userEvent.setup()
    vi.spyOn(console, 'debug').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})

    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    server.use(
      http.get(
        '*/api/materialsTable/fetchProjectMaterials*',
        async ({ request }) => {
          const url = new URL(request.url)
          const filterKey = url.searchParams.get('filter_key') ?? ''
          const filterValue = url.searchParams.get('filter_value') ?? ''
          const sortDir = url.searchParams.get('sort_direction') ?? 'desc'

          return HttpResponse.json({
            final_docs: [
              {
                id: 1,
                course_name: 'CS101',
                readable_filename: `file1-${filterKey}-${filterValue}-${sortDir}.txt`,
                url: '',
                s3_path: 'cs101/file1.txt',
                base_url: 'http://base',
                created_at: new Date('2024-01-01T00:00:00.000Z').toISOString(),
                doc_groups: ['Group A'],
              },
            ],
            total_count: 1,
          })
        },
      ),
      http.get('*/api/materialsTable/fetchFailedDocuments*', async () => {
        return HttpResponse.json({
          final_docs: [],
          total_count: 0,
          recent_fail_count: 0,
        })
      }),
    )

    globalThis.__TEST_ROUTER__ = { asPath: '/CS101/dashboard' }

    const { ProjectFilesTable } = await import('../ProjectFilesTable')

    const onTabChange = vi.fn()
    renderWithProviders(
      <ProjectFilesTable
        course_name="CS101"
        tabValue="success"
        onTabChange={onTabChange}
        setFailedCount={vi.fn()}
        failedCount={0}
      />,
      { homeContext: { dispatch: vi.fn() } },
    )

    expect(await screen.findByText(/Success/i)).toBeInTheDocument()
    expect(await screen.findByText(/file1-/i)).toBeInTheDocument()

    // Row-level document group change path.
    await user.click(screen.getByRole('button', { name: /set-groups-row/i }))

    // Filter (updates queryKey and triggers refetch).
    await user.type(screen.getByLabelText('File Name'), 'hello')
    await waitFor(() =>
      expect(
        fetchSpy.mock.calls.some(([url]) =>
          /filter_key=readable_filename/.test(String(url)),
        ),
      ).toBe(true),
    )

    // Sort (updates queryKey and triggers refetch).
    await user.click(screen.getByRole('button', { name: /sort-toggle/i }))
    await waitFor(() =>
      expect(
        fetchSpy.mock.calls.some(([url]) =>
          /sort_direction=asc|sort_direction=desc/.test(String(url)),
        ),
      ).toBe(true),
    )

    // View action uses presigned URL and window.open.
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    await user.click(screen.getByRole('button', { name: /view document/i }))
    await waitFor(() => expect(openSpy).toHaveBeenCalled())

    // Select and open bulk multi-select; exercise group-change handler.
    await user.click(screen.getByRole('button', { name: /select-first/i }))
    await user.click(
      screen.getByRole('button', { name: /Add Document to Groups/i }),
    )
    await user.click(screen.getByRole('button', { name: /set-groups-bulk/i }))

    // Delete action opens modal.
    await user.click(screen.getByRole('button', { name: /Delete document/i }))
    expect(
      await screen.findByText(/Please confirm your action/i),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^Delete$/ }))

    const axiosMod = await import('axios')
    await waitFor(() =>
      expect((axiosMod as any).default.delete).toHaveBeenCalled(),
    )

    // Export modal is wired and openable.
    await user.click(screen.getByRole('button', { name: /^Export$/ }))
    expect(
      await screen.findByText(/export all the documents and embeddings/i),
    ).toBeInTheDocument()
  }, 20_000)

  it('shows a toast when attempting to delete more than 100 selected records', async () => {
    const user = userEvent.setup()
    const { notifications } = await import('@mantine/notifications')
    ;(notifications as any).show.mockClear()

    server.use(
      http.get('*/api/materialsTable/fetchProjectMaterials*', async () => {
        return HttpResponse.json({
          final_docs: [
            {
              id: 1,
              readable_filename: 'f.txt',
              s3_path: 'cs101/f.txt',
              url: '',
              base_url: '',
              created_at: new Date().toISOString(),
              doc_groups: [],
            },
          ],
          total_count: 1,
        })
      }),
      http.get('*/api/materialsTable/fetchFailedDocuments*', async () => {
        return HttpResponse.json({
          final_docs: [],
          total_count: 0,
          recent_fail_count: 0,
        })
      }),
    )

    globalThis.__TEST_ROUTER__ = { asPath: '/CS101/dashboard' }

    const { ProjectFilesTable } = await import('../ProjectFilesTable')
    renderWithProviders(
      <ProjectFilesTable
        course_name="CS101"
        tabValue="success"
        onTabChange={vi.fn()}
        setFailedCount={vi.fn()}
        failedCount={0}
      />,
      { homeContext: { dispatch: vi.fn() } },
    )

    await user.click(
      await screen.findByRole('button', { name: /select-many/i }),
    )
    const deleteLabels = await screen.findAllByText(/Delete 101/i)
    await user.click(deleteLabels[0]!.closest('button') as HTMLElement)

    expect((notifications as any).show).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Selection Limit Exceeded' }),
    )
  })

  it('renders failed tab and shows error details modal via "Read more"', async () => {
    const user = userEvent.setup()

    const scrollHeight = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'scrollHeight',
    )
    const clientHeight = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'clientHeight',
    )
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
      configurable: true,
      get: () => 100,
    })
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
      configurable: true,
      get: () => 1,
    })

    server.use(
      http.get('*/api/materialsTable/fetchProjectMaterials*', async () => {
        return HttpResponse.json({
          final_docs: [],
          total_count: 0,
        })
      }),
      http.get('*/api/materialsTable/fetchFailedDocuments*', async () => {
        return HttpResponse.json({
          final_docs: [
            {
              id: 10,
              course_name: 'CS101',
              readable_filename: 'bad.pdf',
              url: '',
              s3_path: 'cs101/bad.pdf',
              base_url: '',
              created_at: new Date('2024-01-01T00:00:00.000Z').toISOString(),
              error: 'This is a long error that should overflow in the UI.',
              doc_groups: [],
            },
          ],
          total_count: 1,
          recent_fail_count: 1,
        })
      }),
    )

    globalThis.__TEST_ROUTER__ = { asPath: '/CS101/dashboard' }
    const { ProjectFilesTable } = await import('../ProjectFilesTable')
    renderWithProviders(
      <ProjectFilesTable
        course_name="CS101"
        tabValue="failed"
        onTabChange={vi.fn()}
        setFailedCount={vi.fn()}
        failedCount={1}
      />,
      { homeContext: { dispatch: vi.fn() } },
    )

    await user.click(await screen.findByText(/Read more/i))
    expect(await screen.findByText(/Error Details/i)).toBeInTheDocument()

    if (scrollHeight)
      Object.defineProperty(HTMLElement.prototype, 'scrollHeight', scrollHeight)
    else delete (HTMLElement.prototype as any).scrollHeight
    if (clientHeight)
      Object.defineProperty(HTMLElement.prototype, 'clientHeight', clientHeight)
    else delete (HTMLElement.prototype as any).clientHeight
  }, 20_000)

  it('renders an error-state table when document fetch fails', async () => {
    const { showNotification } = await import('@mantine/notifications')

    server.use(
      http.get('*/api/materialsTable/fetchProjectMaterials*', async () => {
        return new HttpResponse(null, { status: 500 })
      }),
      http.get('*/api/materialsTable/fetchFailedDocuments*', async () => {
        return HttpResponse.json({
          final_docs: [],
          total_count: 0,
          recent_fail_count: 0,
        })
      }),
    )

    globalThis.__TEST_ROUTER__ = { asPath: '/CS101/dashboard' }
    const { ProjectFilesTable } = await import('../ProjectFilesTable')

    renderWithProviders(
      <ProjectFilesTable
        course_name="CS101"
        tabValue="success"
        onTabChange={vi.fn()}
        setFailedCount={vi.fn()}
        failedCount={0}
      />,
      { homeContext: { dispatch: vi.fn() } },
    )

    await waitFor(() => expect(showNotification as any).toHaveBeenCalled())
    expect(
      await screen.findByText(
        /Ah! We hit a wall when fetching your documents/i,
      ),
    ).toBeInTheDocument()
  })
})
