import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithProviders } from '~/test-utils/renderWithProviders'
import Folder from '../Folder'

describe('Folder', () => {
  it('opens on searchTerm and supports rename + delete flows', async () => {
    const user = userEvent.setup()
    const handleUpdateFolder = vi.fn()
    const handleDeleteFolder = vi.fn()

    const { rerender, container } = renderWithProviders(
      <Folder
        currentFolder={{ id: 'f1', name: 'Folder 1', type: 'chat' } as any}
        searchTerm=""
        handleDrop={vi.fn()}
        folderComponent={[<div key="c">child</div>]}
      />,
      {
        homeContext: { handleUpdateFolder, handleDeleteFolder } as any,
      },
    )

    // Closed by default, opens when searchTerm is set.
    expect(screen.queryByText('child')).not.toBeInTheDocument()
    rerender(
      <Folder
        currentFolder={{ id: 'f1', name: 'Folder 1', type: 'chat' } as any}
        searchTerm="x"
        handleDrop={vi.fn()}
        folderComponent={[<div key="c">child</div>]}
      />,
    )
    expect(await screen.findByText('child')).toBeInTheDocument()

    // Rename: click the first action button (pencil) -> input -> Enter triggers update.
    const actionButtons = Array.from(
      container.querySelectorAll('button'),
    ).filter((b) => b !== screen.getByRole('button', { name: /folder 1/i }))
    expect(actionButtons.length).toBeGreaterThanOrEqual(2)
    await user.click(actionButtons[0]!)
    const input = await screen.findByRole('textbox')
    await user.clear(input)
    await user.type(input, 'Renamed{enter}')
    expect(handleUpdateFolder).toHaveBeenCalledWith('f1', 'Renamed')

    // Delete: click trash action then confirm check.
    const buttonsAfterRename = Array.from(
      container.querySelectorAll('button'),
    ).filter((b) => b !== screen.getByRole('button', { name: /folder 1/i }))
    await user.click(buttonsAfterRename.at(-1)!)
    const confirmButtons = Array.from(
      container.querySelectorAll('button'),
    ).filter((b) => b !== screen.getByRole('button', { name: /folder 1/i }))
    // click until delete is called (check then cancel).
    for (const b of confirmButtons) {
      await user.click(b)
      if (handleDeleteFolder.mock.calls.length > 0) break
    }
    expect(handleDeleteFolder).toHaveBeenCalledWith('f1')
  })
})
