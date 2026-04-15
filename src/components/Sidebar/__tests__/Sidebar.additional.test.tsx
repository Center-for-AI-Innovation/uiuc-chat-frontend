import React from 'react'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import Sidebar from '../Sidebar'
import { renderWithProviders } from '~/test-utils/renderWithProviders'

vi.mock('~/components/UIUC-Components/runAuthCheck', () => ({
  get_user_permission: vi.fn(() => 'no_permission'),
}))

const defaultProps = {
  addItemButtonTitle: 'New',
  side: 'left' as const,
  itemComponent: <div>Item Content</div>,
  folderComponent: <div>Folder Content</div>,
  footerComponent: <div>Footer Content</div>,
  searchTerm: '',
  handleSearchTerm: vi.fn(),
  toggleOpen: vi.fn(),
  handleCreateItem: vi.fn(),
  handleCreateFolder: vi.fn(),
  handleDrop: vi.fn(),
  onScroll: vi.fn(),
}

function renderSidebar(overrides: Record<string, any> = {}) {
  return renderWithProviders(
    <Sidebar
      {...defaultProps}
      isOpen={true}
      items={[{ id: 1 }]}
      folders={[] as any}
      courseName="CS101"
      courseMetadata={null}
      {...overrides}
    />,
  )
}

describe('Sidebar – additional coverage', () => {
  beforeEach(() => {
    globalThis.__TEST_ROUTER__ = { push: vi.fn() }
  })

  afterEach(() => {
    globalThis.__TEST_ROUTER__ = undefined
  })

  // -------------------------------------------------------------------
  // Collapsed sidebar – "Open Sidebar" button
  // -------------------------------------------------------------------
  it('renders only the open button when isOpen is false', () => {
    renderSidebar({ isOpen: false })

    const openBtn = screen.getByRole('button', { name: /Open Sidebar/i })
    expect(openBtn).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /Close Sidebar/i }),
    ).not.toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Search...')).not.toBeInTheDocument()
  })

  it('calls toggleOpen when the open button is clicked in collapsed mode', async () => {
    const toggleOpen = vi.fn()
    renderSidebar({ isOpen: false, toggleOpen })

    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: /Open Sidebar/i }))
    expect(toggleOpen).toHaveBeenCalledTimes(1)
  })

  // -------------------------------------------------------------------
  // Close sidebar button
  // -------------------------------------------------------------------
  it('calls toggleOpen when Close Sidebar is clicked', async () => {
    const toggleOpen = vi.fn()
    renderSidebar({ toggleOpen })

    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: /Close Sidebar/i }))
    expect(toggleOpen).toHaveBeenCalledTimes(1)
  })

  // -------------------------------------------------------------------
  // Add Folder button
  // -------------------------------------------------------------------
  it('calls handleCreateFolder when Add Folder is clicked', async () => {
    const handleCreateFolder = vi.fn()
    renderSidebar({ handleCreateFolder })

    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: /Add Folder/i }))
    expect(handleCreateFolder).toHaveBeenCalledTimes(1)
  })

  // -------------------------------------------------------------------
  // Edit button – creates item and clears search
  // -------------------------------------------------------------------
  it('calls handleCreateItem and clears search on Edit click', async () => {
    const handleCreateItem = vi.fn()
    const handleSearchTerm = vi.fn()
    renderSidebar({ handleCreateItem, handleSearchTerm })

    await userEvent.setup().click(screen.getByRole('button', { name: /Edit/i }))
    expect(handleCreateItem).toHaveBeenCalledTimes(1)
    expect(handleSearchTerm).toHaveBeenCalledWith('')
  })

  // -------------------------------------------------------------------
  // Course name = 'chat' (Illinois flagship chatbot)
  // -------------------------------------------------------------------
  it('displays Illinois flagship chatbot text when courseName is chat', () => {
    renderSidebar({ courseName: 'chat' })

    expect(screen.getByText('Illinois flagship chatbot')).toBeInTheDocument()
  })

  it('displays Illinois logo image when courseName is chat', () => {
    renderSidebar({ courseName: 'chat' })

    const img = screen.getByAltText('Illinois logo')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', '/media/logo_illinois.png')
  })

  // -------------------------------------------------------------------
  // Course name normalization
  // -------------------------------------------------------------------
  it('normalizes course name with hyphens to title case', () => {
    renderSidebar({ courseName: 'intro-to-cs' })

    expect(screen.getByText('Intro To Cs')).toBeInTheDocument()
  })

  it('preserves all-uppercase acronyms in course name', () => {
    renderSidebar({ courseName: 'CS-101-UIUC' })

    expect(screen.getByText('CS 101 UIUC')).toBeInTheDocument()
  })

  it('handles empty course name gracefully', () => {
    renderSidebar({ courseName: '' })

    // Should render without crashing
    expect(
      screen.getByRole('button', { name: /Close Sidebar/i }),
    ).toBeInTheDocument()
  })

  // -------------------------------------------------------------------
  // Project description
  // -------------------------------------------------------------------
  it('displays project description from courseMetadata', () => {
    renderSidebar({
      courseMetadata: {
        project_description: 'A great course about CS',
        banner_image_s3: null,
        is_private: false,
        course_owner: 'admin@test.com',
        course_admins: [],
        approved_emails_list: [],
      } as any,
    })

    expect(screen.getByText('A great course about CS')).toBeInTheDocument()
  })

  it('renders empty description when courseMetadata has no project_description', () => {
    renderSidebar({
      courseMetadata: {
        banner_image_s3: null,
        is_private: false,
        course_owner: 'admin@test.com',
        course_admins: [],
        approved_emails_list: [],
      } as any,
    })

    // Should not crash, just shows empty description
    expect(
      screen.getByRole('button', { name: /Close Sidebar/i }),
    ).toBeInTheDocument()
  })

  // -------------------------------------------------------------------
  // Folders section – shown when folders.length > 0
  // -------------------------------------------------------------------
  it('renders folder component section when folders exist', () => {
    renderSidebar({
      folders: [{ id: 'f1', name: 'My Folder', type: 'chat' }],
    })

    expect(screen.getByText('Folder Content')).toBeInTheDocument()
  })

  it('does not render folder section border when folders are empty', () => {
    const { container } = renderSidebar({ folders: [] })

    const folderBorder = container.querySelector(
      '.border-b.border-\\[--dashboard-border\\]',
    )
    expect(folderBorder).toBeNull()
  })

  // -------------------------------------------------------------------
  // Items section – empty state ("No data")
  // -------------------------------------------------------------------
  it('shows "No data." when items array is empty', () => {
    renderSidebar({ items: [] })

    expect(screen.getByText('No data.')).toBeInTheDocument()
  })

  it('does not show "No data." when items exist', () => {
    renderSidebar({ items: [{ id: 1 }] })

    expect(screen.queryByText('No data.')).not.toBeInTheDocument()
  })

  // -------------------------------------------------------------------
  // Drag and drop events
  // -------------------------------------------------------------------
  it('allows drag over the drop zone (prevents default)', () => {
    renderSidebar()

    const dropZone = screen.getByText('Item Content')
      .parentElement as HTMLElement
    const dragOverEvent = new Event('dragover', {
      bubbles: true,
      cancelable: true,
    })
    const preventDefaultSpy = vi.spyOn(dragOverEvent, 'preventDefault')
    dropZone.dispatchEvent(dragOverEvent)

    expect(preventDefaultSpy).toHaveBeenCalled()
  })

  it('highlights drop zone on drag enter and removes on drag leave', () => {
    renderSidebar()

    const dropZone = screen.getByText('Item Content')
      .parentElement as HTMLElement

    fireEvent.dragEnter(dropZone)
    expect(dropZone.style.background).toMatch(/#343541|rgb\(52, 53, 65\)/)

    fireEvent.dragLeave(dropZone)
    expect(['', 'none']).toContain(dropZone.style.background)
  })

  it('calls handleDrop on drop event', () => {
    const handleDrop = vi.fn()
    renderSidebar({ handleDrop })

    const dropZone = screen.getByText('Item Content')
      .parentElement as HTMLElement
    fireEvent.drop(dropZone)

    expect(handleDrop).toHaveBeenCalled()
  })

  // -------------------------------------------------------------------
  // Scroll event
  // -------------------------------------------------------------------
  it('fires onScroll when the conversation region is scrolled', () => {
    const onScroll = vi.fn()
    const { container } = renderSidebar({ onScroll })

    const scrollArea = container.querySelector(
      '.flex-grow.overflow-auto',
    ) as HTMLElement
    fireEvent.scroll(scrollArea)

    expect(onScroll).toHaveBeenCalled()
  })

  // -------------------------------------------------------------------
  // Permission = 'edit' – Admin Dashboard navigation
  // -------------------------------------------------------------------
  describe('when permission is edit', () => {
    beforeEach(async () => {
      const { get_user_permission } = await import(
        '~/components/UIUC-Components/runAuthCheck'
      )
      vi.mocked(get_user_permission).mockReturnValue('edit' as any)
    })

    it('renders the admin dashboard settings button', () => {
      renderSidebar({
        courseMetadata: {
          project_description: 'Test',
          banner_image_s3: null,
          is_private: false,
          course_owner: 'admin@test.com',
          course_admins: [],
          approved_emails_list: [],
        } as any,
      })

      // The settings icon button has title="Admin Dashboard"
      const settingsBtns = screen.getAllByTitle('Admin Dashboard')
      expect(settingsBtns.length).toBeGreaterThanOrEqual(1)
    })

    it('navigates to dashboard when admin settings icon button is clicked', async () => {
      renderSidebar({
        courseMetadata: {
          project_description: 'Test',
          banner_image_s3: null,
          is_private: false,
          course_owner: 'admin@test.com',
          course_admins: [],
          approved_emails_list: [],
        } as any,
      })

      // Use the Mantine Button with title="Admin Dashboard" (the settings icon)
      const settingsBtn = screen.getAllByTitle('Admin Dashboard')[0]!
      await userEvent.setup().click(settingsBtn)

      expect(globalThis.__TEST_ROUTER__?.push).toHaveBeenCalledWith(
        '/CS101/dashboard',
      )
    })

    it('navigates to dashboard on space key press', () => {
      renderSidebar({
        courseMetadata: {
          project_description: 'Test',
          banner_image_s3: null,
          is_private: false,
          course_owner: 'admin@test.com',
          course_admins: [],
          approved_emails_list: [],
        } as any,
      })

      const dashboardDiv = screen.getByRole('button', {
        name: /Open Admin Dashboard/i,
      })
      fireEvent.keyDown(dashboardDiv, { key: ' ' })

      expect(globalThis.__TEST_ROUTER__?.push).toHaveBeenCalledWith(
        '/CS101/dashboard',
      )
    })

    it('navigates to dashboard on Enter key press', () => {
      renderSidebar({
        courseMetadata: {
          project_description: 'Test',
          banner_image_s3: null,
          is_private: false,
          course_owner: 'admin@test.com',
          course_admins: [],
          approved_emails_list: [],
        } as any,
      })

      const dashboardDiv = screen.getByRole('button', {
        name: /Open Admin Dashboard/i,
      })
      fireEvent.keyDown(dashboardDiv, { key: 'Enter' })

      expect(globalThis.__TEST_ROUTER__?.push).toHaveBeenCalledWith(
        '/CS101/dashboard',
      )
    })

    it('does not navigate when courseName is undefined', () => {
      renderSidebar({
        courseName: undefined,
        courseMetadata: {
          project_description: 'Test',
          banner_image_s3: null,
          is_private: false,
          course_owner: 'admin@test.com',
          course_admins: [],
          approved_emails_list: [],
        } as any,
      })

      const dashboardDiv = screen.getByRole('button', {
        name: /Open Admin Dashboard/i,
      })
      fireEvent.click(dashboardDiv)

      expect(globalThis.__TEST_ROUTER__?.push).not.toHaveBeenCalled()
    })
  })

  // -------------------------------------------------------------------
  // Permission = 'no_permission' – Admin elements hidden
  // -------------------------------------------------------------------
  describe('when permission is no_permission', () => {
    beforeEach(async () => {
      const { get_user_permission } = await import(
        '~/components/UIUC-Components/runAuthCheck'
      )
      vi.mocked(get_user_permission).mockReturnValue('no_permission' as any)
    })

    it('marks admin dashboard as aria-hidden and non-focusable', () => {
      renderSidebar({
        courseMetadata: {
          project_description: 'Test',
          banner_image_s3: null,
          is_private: false,
          course_owner: 'admin@test.com',
          course_admins: [],
          approved_emails_list: [],
        } as any,
      })

      // aria-hidden elements are excluded from the default accessibility tree,
      // so we query by aria-label directly on the DOM
      const adminDashboard = screen.getByLabelText('Open Admin Dashboard')
      expect(adminDashboard).toHaveAttribute('aria-hidden', 'true')
      expect(adminDashboard).toHaveAttribute('tabIndex', '-1')
    })

    it('does not navigate on click when not an editor', () => {
      renderSidebar({
        courseMetadata: {
          project_description: 'Test',
          banner_image_s3: null,
          is_private: false,
          course_owner: 'admin@test.com',
          course_admins: [],
          approved_emails_list: [],
        } as any,
      })

      const dashboardDiv = screen.getByLabelText('Open Admin Dashboard')
      fireEvent.click(dashboardDiv)

      expect(globalThis.__TEST_ROUTER__?.push).not.toHaveBeenCalled()
    })

    it('does not navigate on keyboard when not an editor', () => {
      renderSidebar({
        courseMetadata: {
          project_description: 'Test',
          banner_image_s3: null,
          is_private: false,
          course_owner: 'admin@test.com',
          course_admins: [],
          approved_emails_list: [],
        } as any,
      })

      const dashboardDiv = screen.getByLabelText('Open Admin Dashboard')
      fireEvent.keyDown(dashboardDiv, { key: 'Enter' })
      fireEvent.keyDown(dashboardDiv, { key: ' ' })

      expect(globalThis.__TEST_ROUTER__?.push).not.toHaveBeenCalled()
    })
  })

  // -------------------------------------------------------------------
  // Permission = 'view' – no edit controls
  // -------------------------------------------------------------------
  describe('when permission is view', () => {
    beforeEach(async () => {
      const { get_user_permission } = await import(
        '~/components/UIUC-Components/runAuthCheck'
      )
      vi.mocked(get_user_permission).mockReturnValue('view' as any)
    })

    it('hides admin dashboard and has aria-hidden set', () => {
      renderSidebar({
        courseMetadata: {
          project_description: 'Viewable',
          banner_image_s3: null,
          is_private: false,
          course_owner: 'admin@test.com',
          course_admins: [],
          approved_emails_list: [],
        } as any,
      })

      const dashboardDiv = screen.getByLabelText('Open Admin Dashboard')
      expect(dashboardDiv).toHaveAttribute('aria-hidden', 'true')
    })
  })

  // -------------------------------------------------------------------
  // No courseMetadata at all
  // -------------------------------------------------------------------
  it('renders without courseMetadata (defaults to no_permission)', () => {
    renderSidebar({ courseMetadata: null })

    expect(
      screen.getByRole('button', { name: /Close Sidebar/i }),
    ).toBeInTheDocument()
  })

  it('renders without courseMetadata or courseName', () => {
    renderSidebar({ courseMetadata: undefined, courseName: undefined })

    expect(
      screen.getByRole('button', { name: /Close Sidebar/i }),
    ).toBeInTheDocument()
  })

  // -------------------------------------------------------------------
  // Footer component rendering
  // -------------------------------------------------------------------
  it('renders the footer component', () => {
    renderSidebar({ footerComponent: <div>Custom Footer</div> })

    expect(screen.getByText('Custom Footer')).toBeInTheDocument()
  })

  it('renders without a footer component', () => {
    renderSidebar({ footerComponent: null })

    expect(
      screen.getByRole('button', { name: /Close Sidebar/i }),
    ).toBeInTheDocument()
  })

  // -------------------------------------------------------------------
  // Search interaction
  // -------------------------------------------------------------------
  it('calls handleSearchTerm when search input changes', () => {
    const handleSearchTerm = vi.fn()
    renderSidebar({ handleSearchTerm })

    fireEvent.change(screen.getByPlaceholderText('Search...'), {
      target: { value: 'hello' },
    })

    expect(handleSearchTerm).toHaveBeenCalledWith('hello')
  })

  // -------------------------------------------------------------------
  // Banner image from presigned URL (non-chat course)
  // -------------------------------------------------------------------
  it('renders course banner alt text for non-chat courses', () => {
    renderSidebar({
      courseName: 'CS101',
      courseMetadata: {
        banner_image_s3: null,
        project_description: 'A CS course',
        is_private: false,
        course_owner: 'admin@test.com',
        course_admins: [],
        approved_emails_list: [],
      } as any,
    })

    // When there's no presigned URL, no image is rendered
    expect(screen.queryByAltText('Course banner')).not.toBeInTheDocument()
  })

  // -------------------------------------------------------------------
  // title attribute on course name
  // -------------------------------------------------------------------
  it('sets correct title for chat course', () => {
    renderSidebar({ courseName: 'chat' })

    const nameDiv = screen.getByText('Illinois flagship chatbot')
    expect(nameDiv).toHaveAttribute('title', 'Illinois flagship chatbot')
  })

  it('sets correct title for regular course', () => {
    renderSidebar({ courseName: 'my-course' })

    const nameDiv = screen.getByText('My Course')
    expect(nameDiv).toHaveAttribute('title', 'my course')
  })
})
