import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, within } from '@testing-library/react'

import { DocumentGroupsItem } from '../DocumentGroupsItem'
import { renderWithProviders } from '~/test-utils/renderWithProviders'
import type { Action } from '~/types/chat'

const makeDocumentGroups = (overrides: Partial<Action>[] = []): Action[] => [
  { id: 'dg1', name: 'Lecture Notes', checked: true, ...overrides[0] },
  { id: 'dg2', name: 'Homework Solutions', checked: false, ...overrides[1] },
  { id: 'dg3', name: 'Lab Reports', checked: true, ...overrides[2] },
]

describe('DocumentGroupsItem', () => {
  it('renders the title and all document groups', () => {
    const documentGroups = makeDocumentGroups()

    renderWithProviders(<DocumentGroupsItem />, {
      homeState: { documentGroups } as any,
    })

    expect(screen.getByText('Document Groups')).toBeInTheDocument()
    expect(screen.getByText('Lecture Notes')).toBeInTheDocument()
    expect(screen.getByText('Homework Solutions')).toBeInTheDocument()
    expect(screen.getByText('Lab Reports')).toBeInTheDocument()
  })

  it('renders table headers for Document Group and Enabled', () => {
    renderWithProviders(<DocumentGroupsItem />, {
      homeState: { documentGroups: makeDocumentGroups() } as any,
    })

    expect(screen.getByText('Document Group')).toBeInTheDocument()
    expect(screen.getByText('Enabled')).toBeInTheDocument()
  })

  it('renders a switch for each document group reflecting its checked state', () => {
    const documentGroups = makeDocumentGroups()

    renderWithProviders(<DocumentGroupsItem />, {
      homeState: { documentGroups } as any,
    })

    const switches = screen.getAllByRole('switch')
    expect(switches).toHaveLength(3)

    // First group is checked
    expect(switches[0]).toBeChecked()
    // Second group is unchecked
    expect(switches[1]).not.toBeChecked()
    // Third group is checked
    expect(switches[2]).toBeChecked()
  })

  it('dispatches toggle action when a switch is clicked', () => {
    const dispatch = vi.fn()
    const documentGroups = makeDocumentGroups()

    renderWithProviders(<DocumentGroupsItem />, {
      homeState: { documentGroups } as any,
      homeContext: { dispatch } as any,
    })

    // Toggle the second group (Homework Solutions, currently unchecked)
    const row = screen
      .getByText('Homework Solutions')
      .closest('tr') as HTMLElement
    fireEvent.click(within(row).getByRole('switch'))

    expect(dispatch).toHaveBeenCalledWith({
      field: 'documentGroups',
      value: expect.arrayContaining([
        expect.objectContaining({ id: 'dg2', checked: true }),
      ]),
    })
  })

  it('toggles a checked group to unchecked', () => {
    const dispatch = vi.fn()
    const documentGroups = makeDocumentGroups()

    renderWithProviders(<DocumentGroupsItem />, {
      homeState: { documentGroups } as any,
      homeContext: { dispatch } as any,
    })

    // Toggle the first group (Lecture Notes, currently checked)
    const row = screen.getByText('Lecture Notes').closest('tr') as HTMLElement
    fireEvent.click(within(row).getByRole('switch'))

    expect(dispatch).toHaveBeenCalledWith({
      field: 'documentGroups',
      value: expect.arrayContaining([
        expect.objectContaining({ id: 'dg1', checked: false }),
      ]),
    })
  })

  it('does not mutate other document groups when toggling', () => {
    const dispatch = vi.fn()
    const documentGroups = makeDocumentGroups()

    renderWithProviders(<DocumentGroupsItem />, {
      homeState: { documentGroups } as any,
      homeContext: { dispatch } as any,
    })

    const row = screen
      .getByText('Homework Solutions')
      .closest('tr') as HTMLElement
    fireEvent.click(within(row).getByRole('switch'))

    const dispatchedValue = dispatch.mock.calls[0]![0].value as Action[]
    // Other groups remain unchanged
    expect(dispatchedValue.find((dg) => dg.id === 'dg1')?.checked).toBe(true)
    expect(dispatchedValue.find((dg) => dg.id === 'dg3')?.checked).toBe(true)
    // Toggled group is flipped
    expect(dispatchedValue.find((dg) => dg.id === 'dg2')?.checked).toBe(true)
  })

  describe('search filtering', () => {
    it('filters document groups by search term', () => {
      renderWithProviders(<DocumentGroupsItem />, {
        homeState: { documentGroups: makeDocumentGroups() } as any,
      })

      fireEvent.change(
        screen.getByPlaceholderText('Search by Document Group'),
        {
          target: { value: 'homework' },
        },
      )

      expect(screen.queryByText('Lecture Notes')).toBeNull()
      expect(screen.getByText('Homework Solutions')).toBeInTheDocument()
      expect(screen.queryByText('Lab Reports')).toBeNull()
    })

    it('performs case-insensitive search', () => {
      renderWithProviders(<DocumentGroupsItem />, {
        homeState: { documentGroups: makeDocumentGroups() } as any,
      })

      fireEvent.change(
        screen.getByPlaceholderText('Search by Document Group'),
        {
          target: { value: 'LECTURE' },
        },
      )

      expect(screen.getByText('Lecture Notes')).toBeInTheDocument()
      expect(screen.queryByText('Homework Solutions')).toBeNull()
    })

    it('shows all groups when search is cleared', () => {
      renderWithProviders(<DocumentGroupsItem />, {
        homeState: { documentGroups: makeDocumentGroups() } as any,
      })

      const searchInput = screen.getByPlaceholderText(
        'Search by Document Group',
      )

      // Type a filter
      fireEvent.change(searchInput, { target: { value: 'lecture' } })
      expect(screen.queryByText('Homework Solutions')).toBeNull()

      // Clear the filter
      fireEvent.change(searchInput, { target: { value: '' } })
      expect(screen.getByText('Lecture Notes')).toBeInTheDocument()
      expect(screen.getByText('Homework Solutions')).toBeInTheDocument()
      expect(screen.getByText('Lab Reports')).toBeInTheDocument()
    })

    it('shows empty state when search matches nothing', () => {
      renderWithProviders(<DocumentGroupsItem />, {
        homeState: { documentGroups: makeDocumentGroups() } as any,
      })

      fireEvent.change(
        screen.getByPlaceholderText('Search by Document Group'),
        {
          target: { value: 'nonexistent query' },
        },
      )

      expect(screen.getByText('No document groups found')).toBeInTheDocument()
    })

    it('matches partial names in search', () => {
      renderWithProviders(<DocumentGroupsItem />, {
        homeState: { documentGroups: makeDocumentGroups() } as any,
      })

      fireEvent.change(
        screen.getByPlaceholderText('Search by Document Group'),
        {
          target: { value: 'lab' },
        },
      )

      expect(screen.getByText('Lab Reports')).toBeInTheDocument()
      expect(screen.queryByText('Lecture Notes')).toBeNull()
      expect(screen.queryByText('Homework Solutions')).toBeNull()
    })
  })

  describe('empty and null states', () => {
    it('shows empty state when documentGroups is an empty array', () => {
      renderWithProviders(<DocumentGroupsItem />, {
        homeState: { documentGroups: [] } as any,
      })

      expect(screen.getByText('No document groups found')).toBeInTheDocument()
    })

    it('shows empty state when documentGroups is null/undefined', () => {
      renderWithProviders(<DocumentGroupsItem />, {
        homeState: { documentGroups: null } as any,
      })

      expect(screen.getByText('No document groups found')).toBeInTheDocument()
    })
  })

  describe('single document group', () => {
    it('renders and toggles a single document group', () => {
      const dispatch = vi.fn()
      const documentGroups: Action[] = [
        { id: 'only', name: 'Only Group', checked: false },
      ]

      renderWithProviders(<DocumentGroupsItem />, {
        homeState: { documentGroups } as any,
        homeContext: { dispatch } as any,
      })

      expect(screen.getByText('Only Group')).toBeInTheDocument()
      const switches = screen.getAllByRole('switch')
      expect(switches).toHaveLength(1)
      expect(switches[0]).not.toBeChecked()

      fireEvent.click(switches[0]!)

      expect(dispatch).toHaveBeenCalledWith({
        field: 'documentGroups',
        value: [expect.objectContaining({ id: 'only', checked: true })],
      })
    })
  })

  describe('accessibility', () => {
    it('has an accessible search input with aria-label', () => {
      renderWithProviders(<DocumentGroupsItem />, {
        homeState: { documentGroups: makeDocumentGroups() } as any,
      })

      const searchInput = screen.getByLabelText('Search by Document Group')
      expect(searchInput).toBeInTheDocument()
      expect(searchInput).toHaveAttribute('type', 'search')
    })

    it('has an accessible table with aria-label', () => {
      renderWithProviders(<DocumentGroupsItem />, {
        homeState: { documentGroups: makeDocumentGroups() } as any,
      })

      expect(
        screen.getByLabelText('Document groups configuration'),
      ).toBeInTheDocument()
    })
  })

  describe('many document groups', () => {
    it('renders a large list of document groups', () => {
      const documentGroups: Action[] = Array.from({ length: 10 }, (_, i) => ({
        id: `dg-${i}`,
        name: `Group ${i}`,
        checked: i % 2 === 0,
      }))

      renderWithProviders(<DocumentGroupsItem />, {
        homeState: { documentGroups } as any,
      })

      const switches = screen.getAllByRole('switch')
      expect(switches).toHaveLength(10)
      expect(screen.getByText('Group 0')).toBeInTheDocument()
      expect(screen.getByText('Group 9')).toBeInTheDocument()
    })
  })

  describe('special characters in names', () => {
    it('handles document groups with special characters', () => {
      const documentGroups: Action[] = [
        { id: 'sp1', name: 'Group (A) & B', checked: true },
        { id: 'sp2', name: 'Résumé / CV', checked: false },
      ]

      renderWithProviders(<DocumentGroupsItem />, {
        homeState: { documentGroups } as any,
      })

      expect(screen.getByText('Group (A) & B')).toBeInTheDocument()
      expect(screen.getByText('Résumé / CV')).toBeInTheDocument()
    })

    it('filters groups with special characters via search', () => {
      const documentGroups: Action[] = [
        { id: 'sp1', name: 'Group (A) & B', checked: true },
        { id: 'sp2', name: 'Résumé / CV', checked: false },
      ]

      renderWithProviders(<DocumentGroupsItem />, {
        homeState: { documentGroups } as any,
      })

      fireEvent.change(
        screen.getByPlaceholderText('Search by Document Group'),
        {
          target: { value: 'résumé' },
        },
      )

      expect(screen.queryByText('Group (A) & B')).toBeNull()
      expect(screen.getByText('Résumé / CV')).toBeInTheDocument()
    })
  })
})
