import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithProviders } from '~/test-utils/renderWithProviders'
import Search from '../Search'

describe('Search', () => {
  it('renders input with placeholder and value and calls onSearch on change', async () => {
    const user = userEvent.setup()
    const onSearch = vi.fn()

    renderWithProviders(
      <Search
        placeholder="Search conversations"
        searchTerm=""
        onSearch={onSearch}
      />,
    )

    const input = screen.getByRole('textbox', { name: '' })
    expect(input).toHaveValue('')
    await user.type(input, 'hello')
    expect(onSearch).toHaveBeenCalledWith('h')
    expect(onSearch).toHaveBeenCalledTimes(5)
    expect(onSearch).toHaveBeenLastCalledWith('o')
  })

  it('shows clear icon when searchTerm is non-empty', () => {
    renderWithProviders(
      <Search placeholder="Search" searchTerm="foo" onSearch={vi.fn()} />,
    )
    const input = screen.getByRole('textbox')
    expect(input).toHaveValue('foo')
    const wrapper = input.closest('div')
    const clearIcon = wrapper?.querySelector('[class*="cursor-pointer"]')
    expect(clearIcon).toBeTruthy()
  })

  it('calls onSearch with empty string when clear icon is clicked', async () => {
    const user = userEvent.setup()
    const onSearch = vi.fn()

    renderWithProviders(
      <Search placeholder="Search" searchTerm="x" onSearch={onSearch} />,
    )
    const input = screen.getByPlaceholderText('Search')
    const wrapper = input.closest('div')
    const clearIcon = wrapper?.querySelector('[class*="cursor-pointer"]')
    expect(clearIcon).toBeTruthy()
    await user.click(clearIcon as HTMLElement)
    expect(onSearch).toHaveBeenCalledWith('')
  })
})
