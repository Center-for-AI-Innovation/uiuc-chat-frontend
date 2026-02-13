import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '~/test-utils/renderWithProviders'
import { fireEvent, screen, within } from '@testing-library/react'

import { DocGroupsTable } from '../DocGroupsTable'

const hooks = vi.hoisted(() => ({
  useFetchDocumentGroups: vi.fn(),
  useUpdateDocGroup: vi.fn(),
}))

vi.mock('@/hooks/queries/useFetchDocumentGroups', () => ({
  useFetchDocumentGroups: hooks.useFetchDocumentGroups,
}))

vi.mock('@/hooks/queries/useUpdateDocGroup', () => ({
  useUpdateDocGroup: hooks.useUpdateDocGroup,
}))

describe('DocGroupsTable', () => {
  it('filters document groups by search and toggles enabled via mutation', async () => {
    const groups = [
      { name: 'Week 1', doc_count: 2, enabled: true },
      { name: 'Final Review', doc_count: 5, enabled: false },
    ]

    const mutate = vi.fn()
    vi.mocked(hooks.useUpdateDocGroup).mockReturnValue({ mutate } as any)
    vi.mocked(hooks.useFetchDocumentGroups).mockReturnValue({
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
    vi.mocked(hooks.useUpdateDocGroup).mockReturnValue({
      mutate: vi.fn(),
    } as any)
    vi.mocked(hooks.useFetchDocumentGroups).mockReturnValue({
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
