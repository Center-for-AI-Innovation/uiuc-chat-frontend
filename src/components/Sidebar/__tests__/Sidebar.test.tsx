import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'

import Sidebar from '../Sidebar'
import { renderWithProviders } from '~/test-utils/renderWithProviders'

vi.mock('~/components/UIUC-Components/runAuthCheck', () => ({
  get_user_permission: vi.fn(() => 'no_permission'),
}))

describe('Sidebar', () => {
  it('renders collapsed mode and opens on toggle', () => {
    const toggleOpen = vi.fn()

    const { container } = renderWithProviders(
      <Sidebar
        isOpen={false}
        addItemButtonTitle="New"
        side="left"
        items={[]}
        itemComponent={<div />}
        folderComponent={<div />}
        folders={[] as any}
        footerComponent={null}
        searchTerm=""
        handleSearchTerm={vi.fn()}
        toggleOpen={toggleOpen}
        handleCreateItem={vi.fn()}
        handleCreateFolder={vi.fn()}
        handleDrop={vi.fn()}
        onScroll={vi.fn()}
        courseName="chat"
        courseMetadata={null}
      />,
    )

    const openButton = container.querySelector('button')
    expect(openButton).toBeTruthy()
    fireEvent.click(openButton!)
    expect(toggleOpen).toHaveBeenCalled()
  })

  it('renders open mode, supports search and drop events, and navigates to dashboard when permitted', async () => {
    globalThis.__TEST_ROUTER__ = { push: vi.fn() }
    const { get_user_permission } = await import(
      '~/components/UIUC-Components/runAuthCheck'
    )
    vi.mocked(get_user_permission).mockReturnValue('edit' as any)

    const handleDrop = vi.fn()
    const onScroll = vi.fn()
    const handleSearchTerm = vi.fn()

    const { container } = renderWithProviders(
      <Sidebar
        isOpen
        addItemButtonTitle="New"
        side="left"
        items={[{ id: 1 }]}
        itemComponent={<div>Item</div>}
        folderComponent={<div>Folders</div>}
        folders={[] as any}
        footerComponent={null}
        searchTerm=""
        handleSearchTerm={handleSearchTerm}
        toggleOpen={vi.fn()}
        handleCreateItem={vi.fn()}
        handleCreateFolder={vi.fn()}
        handleDrop={handleDrop}
        onScroll={onScroll}
        courseName="CS101"
        courseMetadata={
          {
            project_description: 'desc',
            banner_image_s3: null,
          } as any
        }
      />,
    )

    // Search field wires through.
    fireEvent.change(screen.getByPlaceholderText('Search...'), {
      target: { value: 'hi' },
    })
    expect(handleSearchTerm).toHaveBeenCalledWith('hi')

    const scrollContainer = container.querySelector('.flex-grow') as HTMLElement
    fireEvent.scroll(scrollContainer)
    expect(onScroll).toHaveBeenCalled()

    // Drop handlers are active when items exist.
    const dropZone = screen.getByText('Item').parentElement as HTMLElement
    fireEvent.dragEnter(dropZone)
    expect(dropZone.style.background).toMatch(/#343541|rgb\(52, 53, 65\)/)
    fireEvent.dragLeave(dropZone)
    expect(['', 'none']).toContain(dropZone.style.background)
    fireEvent.drop(dropZone)
    expect(handleDrop).toHaveBeenCalled()

    // Dashboard navigation is enabled for edit permission.
    fireEvent.click(screen.getByRole('button', { name: /CS101/i }))
    expect(globalThis.__TEST_ROUTER__?.push).toHaveBeenCalledWith(
      '/CS101/dashboard',
    )

    // Also works via keyboard activation.
    fireEvent.keyDown(screen.getByRole('button', { name: /CS101/i }), {
      key: 'Enter',
    })
    expect(globalThis.__TEST_ROUTER__?.push).toHaveBeenCalled()
  })
})
