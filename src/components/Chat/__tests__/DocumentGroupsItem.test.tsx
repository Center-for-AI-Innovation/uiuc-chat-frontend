import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithProviders } from '~/test-utils/renderWithProviders'
import { DocumentGroupsItem } from '../DocumentGroupsItem'

vi.mock('@mantine/hooks', () => ({
  useMediaQuery: () => false,
}))

describe('DocumentGroupsItem', () => {
  it('renders document groups and filters by search', async () => {
    const user = userEvent.setup()
    const dispatch = vi.fn()
    const documentGroups = [
      { id: 'g1', name: 'Lectures', checked: true },
      { id: 'g2', name: 'Assignments', checked: false },
      { id: 'g3', name: 'Readings', checked: true },
    ] as any[]

    renderWithProviders(<DocumentGroupsItem />, {
      homeState: { documentGroups },
      homeContext: { dispatch } as any,
    })

    expect(screen.getByText('Document Groups')).toBeInTheDocument()
    expect(screen.getByText('Lectures')).toBeInTheDocument()
    expect(screen.getByText('Assignments')).toBeInTheDocument()
    expect(screen.getByText('Readings')).toBeInTheDocument()

    const searchInput = screen.getByPlaceholderText('Search by Document Group')
    await user.type(searchInput, 'lect')
    expect(screen.getByText('Lectures')).toBeInTheDocument()
    expect(screen.queryByText('Assignments')).not.toBeInTheDocument()
    expect(screen.queryByText('Readings')).not.toBeInTheDocument()
  })

  it('dispatches when toggle is clicked', async () => {
    const user = userEvent.setup()
    const dispatch = vi.fn()
    const documentGroups = [
      { id: 'g1', name: 'Lectures', checked: true },
    ] as any[]

    renderWithProviders(<DocumentGroupsItem />, {
      homeState: { documentGroups },
      homeContext: { dispatch } as any,
    })

    const checkboxes = screen.queryAllByRole('checkbox')
    const switches = screen.queryAllByRole('switch')
    const toggle = checkboxes[0] ?? switches[0]
    expect(toggle).toBeTruthy()
    await user.click(toggle!)
    expect(dispatch).toHaveBeenCalledWith({
      field: 'documentGroups',
      value: [{ id: 'g1', name: 'Lectures', checked: false }],
    })
  })

  it('shows no document groups found when filtered list is empty', async () => {
    const user = userEvent.setup()
    const documentGroups = [
      { id: 'g1', name: 'Only One', checked: true },
    ] as any[]

    renderWithProviders(<DocumentGroupsItem />, {
      homeState: { documentGroups },
      homeContext: { dispatch: vi.fn() } as any,
    })

    const searchInput = screen.getByPlaceholderText('Search by Document Group')
    await user.type(searchInput, 'xyz')
    expect(screen.getByText('No document groups found')).toBeInTheDocument()
  })
})
