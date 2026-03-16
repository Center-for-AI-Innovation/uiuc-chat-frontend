import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { PluginSelect } from '../PluginSelect'
import { PluginList } from '~/types/plugin'

describe('PluginSelect', () => {
  it('focuses the select on mount and calls onPluginChange on change', async () => {
    const user = userEvent.setup()
    const onPluginChange = vi.fn()
    const onKeyDown = vi.fn()

    render(
      <PluginSelect
        plugin={null}
        onPluginChange={onPluginChange}
        onKeyDown={onKeyDown}
      />,
    )

    const select = screen.getByRole('combobox')
    expect(select).toHaveFocus()

    const firstPlugin = PluginList[0]
    expect(firstPlugin).toBeTruthy()
    await user.selectOptions(select, firstPlugin!.id)
    expect(onPluginChange).toHaveBeenCalledWith(
      expect.objectContaining({ id: firstPlugin!.id }),
    )
  })

  it('cycles options with meta+/ and meta+shift+/', () => {
    const onPluginChange = vi.fn()
    const onKeyDown = vi.fn()

    render(
      <PluginSelect
        plugin={null}
        onPluginChange={onPluginChange}
        onKeyDown={onKeyDown}
      />,
    )

    const select = screen.getByRole('combobox') as HTMLSelectElement

    // meta+/ moves to next option and dispatches change.
    fireEvent.keyDown(select, { key: '/', metaKey: true })
    expect(onPluginChange).toHaveBeenCalled()

    // meta+shift+/ moves back.
    onPluginChange.mockClear()
    fireEvent.keyDown(select, { key: '/', metaKey: true, shiftKey: true })
    expect(onPluginChange).toHaveBeenCalled()
  })

  it('dispatches change and selects by name on Enter; delegates other keys to onKeyDown', () => {
    const onPluginChange = vi.fn()
    const onKeyDown = vi.fn()

    render(
      <PluginSelect
        plugin={null}
        onPluginChange={onPluginChange}
        onKeyDown={onKeyDown}
      />,
    )

    const select = screen.getByRole('combobox') as HTMLSelectElement

    // Ensure the first plugin option (after ChatGPT) is selected by index.
    select.selectedIndex = 1
    fireEvent.keyDown(select, { key: 'Enter' })
    expect(onPluginChange).toHaveBeenCalledWith(
      expect.objectContaining({ id: select.value }),
    )

    fireEvent.keyDown(select, { key: 'ArrowDown' })
    expect(onKeyDown).toHaveBeenCalled()
  })
})
