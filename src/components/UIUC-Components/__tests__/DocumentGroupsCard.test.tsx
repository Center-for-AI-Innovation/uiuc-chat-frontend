import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'

import { renderWithProviders } from '~/test-utils/renderWithProviders'

vi.mock('framer-motion', () => {
  const motion = new Proxy(
    {},
    {
      get: () => (props: any) => React.createElement('div', props),
    },
  )
  return {
    motion,
    AnimatePresence: ({ children }: any) =>
      React.createElement(React.Fragment, null, children),
  }
})

vi.mock('../DocGroupsTable', () => ({
  DocGroupsTable: ({ course_name }: any) => (
    <div data-testid="doc-groups-table">{course_name}</div>
  ),
}))

import DocumentGroupsCard from '../DocumentGroupsCard'

describe('DocumentGroupsCard', () => {
  it('toggles the info accordion and renders the table', () => {
    renderWithProviders(<DocumentGroupsCard course_name="CS101" />)

    expect(screen.getByTestId('doc-groups-table')).toHaveTextContent('CS101')
    expect(screen.queryByText(/Document Groups help you organize/i)).toBeNull()

    fireEvent.click(screen.getByTitle(/More info on document groups/i))
    expect(
      screen.getByText(/Document Groups help you organize/i),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByTitle(/More info on document groups/i))
    expect(screen.queryByText(/Document Groups help you organize/i)).toBeNull()
  })
})
