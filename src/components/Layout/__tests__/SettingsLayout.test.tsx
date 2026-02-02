import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import SettingsLayout, { getInitialCollapsedState } from '../SettingsLayout'

vi.mock('~/components/UIUC-Components/navbars/Navbar', () => ({
  default: () => <div data-testid="navbar" />,
}))

vi.mock('~/components/Sidebar/NavigationSidebar', () => ({
  default: (props: any) => (
    <div>
      <div data-testid="active-link">{props.activeLink}</div>
      <div data-testid="is-open">{String(props.isOpen)}</div>
      <div data-testid="is-collapsed">{String(props.isCollapsed)}</div>
      <button onClick={props.onToggle}>toggle</button>
      <button onClick={props.onCollapseToggle}>collapse</button>
    </div>
  ),
}))

describe('SettingsLayout', () => {
  it('getInitialCollapsedState reads localStorage and falls back safely on errors', () => {
    localStorage.removeItem('sidebar-collapsed')
    expect(getInitialCollapsedState()).toBe(false)

    localStorage.setItem('sidebar-collapsed', JSON.stringify(true))
    expect(getInitialCollapsedState()).toBe(true)

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const getSpy = vi
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation(() => {
        throw new Error('boom')
      })

    expect(getInitialCollapsedState()).toBe(false)
    expect(warnSpy).toHaveBeenCalled()

    getSpy.mockRestore()
  })

  it('wires collapse + open toggles into NavigationSidebar', async () => {
    globalThis.__TEST_ROUTER__ = { asPath: '/CS101/dashboard?x=1', isReady: true }

    const setSidebarCollapsed = vi.fn()

    const setSpy = vi.spyOn(Storage.prototype, 'setItem')

    render(
      <SettingsLayout
        course_name="CS101"
        sidebarCollapsed={false}
        setSidebarCollapsed={setSidebarCollapsed}
      >
        <div>content</div>
      </SettingsLayout>,
    )

    expect(screen.getByTestId('active-link')).toHaveTextContent('/CS101/dashboard')

    // Sidebar auto-opens on desktop.
    await waitFor(() => expect(screen.getByTestId('is-open')).toHaveTextContent('true'))

    fireEvent.click(screen.getByRole('button', { name: 'collapse' }))
    expect(setSidebarCollapsed).toHaveBeenCalledWith(true)
    expect(setSpy).toHaveBeenCalledWith('sidebar-collapsed', 'true')

    fireEvent.click(screen.getByRole('button', { name: 'toggle' }))
    await waitFor(() => expect(screen.getByTestId('is-open')).toHaveTextContent('false'))
  })

  it('still updates state when localStorage.setItem throws', () => {
    const setSidebarCollapsed = vi.fn()
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('boom')
    })

    render(
      <SettingsLayout
        course_name="CS101"
        sidebarCollapsed={false}
        setSidebarCollapsed={setSidebarCollapsed}
      >
        <div>content</div>
      </SettingsLayout>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'collapse' }))
    expect(setSidebarCollapsed).toHaveBeenCalledWith(true)
    expect(warnSpy).toHaveBeenCalled()
  })
})

