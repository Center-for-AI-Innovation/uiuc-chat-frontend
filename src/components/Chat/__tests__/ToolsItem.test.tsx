import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, within } from '@testing-library/react'

import { ToolsItem } from '../ToolsItem'
import { renderWithProviders } from '~/test-utils/renderWithProviders'

describe('ToolsItem', () => {
  it('filters tools by search and toggles via HomeContext dispatch', () => {
    const dispatch = vi.fn()

    const tools = [
      { id: 't1', readableName: 'Tool One', enabled: true },
      { id: 't2', readableName: 'Another Tool', enabled: false },
    ]

    renderWithProviders(<ToolsItem />, {
      homeState: { tools } as any,
      homeContext: { dispatch } as any,
    })

    expect(screen.getByText('Tool One')).toBeInTheDocument()
    expect(screen.getByText('Another Tool')).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText('Search Tools'), {
      target: { value: 'another' },
    })

    expect(screen.queryByText('Tool One')).toBeNull()
    expect(screen.getByText('Another Tool')).toBeInTheDocument()

    const row = screen.getByText('Another Tool').closest('tr') as HTMLElement
    fireEvent.click(within(row).getByRole('switch'))

    expect(dispatch).toHaveBeenCalledWith({
      field: 'tools',
      value: expect.arrayContaining([
        expect.objectContaining({
          id: 't2',
          checked: true,
        }),
      ]),
    })
  })

  it('shows an empty state when tools list is empty', () => {
    renderWithProviders(<ToolsItem />, { homeState: { tools: [] } as any })
    expect(screen.getByText('No tools found')).toBeInTheDocument()
  })
})

