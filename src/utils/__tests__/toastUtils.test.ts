import { describe, expect, it, vi } from 'vitest'

describe('toastUtils', () => {
  it('showToast uses default config by type', async () => {
    const show = vi.fn()
    vi.doMock('@mantine/notifications', () => ({ notifications: { show } }))

    vi.resetModules()
    const { showToast } = await import('../toastUtils')

    showToast({ message: 'm', type: 'success' })
    expect(show).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'm', color: 'green', autoClose: 5000 }),
    )
  })

  it('showToast allows overriding icon + autoClose', async () => {
    const show = vi.fn()
    vi.doMock('@mantine/notifications', () => ({ notifications: { show } }))

    vi.resetModules()
    const { showToast } = await import('../toastUtils')

    const customIcon = { type: 'icon' } as any
    showToast({ message: 'm', type: 'error', autoClose: 123, icon: customIcon })
    expect(show).toHaveBeenCalledWith(
      expect.objectContaining({
        color: 'red',
        autoClose: 123,
        icon: customIcon,
        styles: expect.any(Object),
      }),
    )
  })

  it('convenience helpers call showToast with correct types', async () => {
    const show = vi.fn()
    vi.doMock('@mantine/notifications', () => ({ notifications: { show } }))

    vi.resetModules()
    const { showSuccessToast, showErrorToast, showWarningToast, showInfoToast } =
      await import('../toastUtils')

    showSuccessToast('a')
    showErrorToast('b')
    showWarningToast('c')
    showInfoToast('d')

    expect(show).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'a', color: 'green' }),
    )
    expect(show).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'b', color: 'red' }),
    )
    expect(show).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'c', color: 'yellow' }),
    )
    expect(show).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'd', color: 'blue' }),
    )
  })
})

