import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '~/test-utils/renderWithProviders'
import { fireEvent, screen, within } from '@testing-library/react'

import { DocGroupsTable } from '../DocGroupsTable'

vi.mock('~/hooks/docGroupsQueries', () => ({
  useGetDocumentGroups: vi.fn(),
  useUpdateDocGroup: vi.fn(),
}))

describe('DocGroupsTable', () => {
  it('filters document groups by search and toggles enabled via mutation', async () => {
    const { useGetDocumentGroups, useUpdateDocGroup } = await import(
      '~/hooks/docGroupsQueries'
    )

    const groups = [
      { name: 'Week 1', doc_count: 2, enabled: true },
      { name: 'Final Review', doc_count: 5, enabled: false },
    ]

    const mutate = vi.fn()
    vi.mocked(useUpdateDocGroup).mockReturnValue({ mutate } as any)
    vi.mocked(useGetDocumentGroups).mockReturnValue({
      data: groups,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as any)

    renderWithProviders(<DocGroupsTable course_name="CS101" />)

    expect(screen.getByText('Week 1')).toBeInTheDocument()
    expect(screen.getByText('Final Review')).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText('Search by Document Group'), {
      target: { value: 'final' },
    })
    expect(screen.queryByText('Week 1')).toBeNull()
    expect(screen.getByText('Final Review')).toBeInTheDocument()

    const row = screen.getByText('Final Review').closest('tr') as HTMLElement
    const toggle = within(row).getByRole('switch')
    fireEvent.click(toggle)
    expect(mutate).toHaveBeenCalledWith({
      doc_group_obj: groups[1],
      enabled: true,
    })
  })

  it('shows an empty state when no results match the search', async () => {
    const { useGetDocumentGroups, useUpdateDocGroup } = await import(
      '~/hooks/docGroupsQueries'
    )

    vi.mocked(useUpdateDocGroup).mockReturnValue({ mutate: vi.fn() } as any)
    vi.mocked(useGetDocumentGroups).mockReturnValue({
      data: [{ name: 'Week 1', doc_count: 1, enabled: true }],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as any)

    renderWithProviders(<DocGroupsTable course_name="CS101" />)

    fireEvent.change(screen.getByPlaceholderText('Search by Document Group'), {
      target: { value: 'zzz' },
    })
    expect(screen.getByText('No document groups found')).toBeInTheDocument()
  })
})
