import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithProviders } from '~/test-utils/renderWithProviders'

process.env.NEXT_PUBLIC_USE_ILLINOIS_CHAT_CONFIG = 'False'

vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get: () => (props: any) => React.createElement('div', props),
    },
  ),
}))

vi.mock('../EmailListAccordion', () => ({
  default: ({ is_for_admins }: any) =>
    React.createElement(
      'div',
      null,
      is_for_admins ? 'Admins accordion' : 'Members accordion',
    ),
}))

vi.mock('@/hooks/__internal__/setCourseMetadata', () => ({
  callSetCourseMetadata: vi.fn(async () => true),
}))

describe('ShareSettingsModal', () => {
  it('does not render when closed', async () => {
    const ShareSettingsModal = (await import('../ShareSettingsModal')).default
    renderWithProviders(
      <ShareSettingsModal
        opened={false}
        onClose={vi.fn()}
        projectName="CS101"
        metadata={{ is_private: true, allow_logged_in_users: false } as any}
      />,
      { homeContext: { dispatch: vi.fn() } },
    )
    expect(screen.queryByText(/Share your chatbot/i)).not.toBeInTheDocument()
  })

  it('copies share link and changes access level', async () => {
    const user = userEvent.setup()
    const { callSetCourseMetadata } = await import(
      '@/hooks/__internal__/setCourseMetadata'
    )
    const writeSpy = vi
      .spyOn((navigator as any).clipboard, 'writeText')
      .mockResolvedValue(undefined)

    const ShareSettingsModal = (await import('../ShareSettingsModal')).default
    const onClose = vi.fn()

    renderWithProviders(
      <ShareSettingsModal
        opened={true}
        onClose={onClose}
        projectName="CS101"
        metadata={{ is_private: true, allow_logged_in_users: false } as any}
      />,
      { homeContext: { dispatch: vi.fn() } },
    )

    await user.click(screen.getByRole('button', { name: /Copy share link/i }))
    expect(writeSpy).toHaveBeenCalled()

    // Change to public.
    await user.click(
      screen.getByRole('button', { name: /Change access|Access/i }),
    )
    await user.click(
      await screen.findByText(/Public \(anyone with the link\)/i),
    )

    await waitFor(() =>
      expect(callSetCourseMetadata as any).toHaveBeenCalledWith(
        'CS101',
        expect.objectContaining({
          is_private: false,
          allow_logged_in_users: false,
        }),
      ),
    )

    // Close button works.
    await user.click(screen.getByText('✕'))
    expect(onClose).toHaveBeenCalled()
  })

  it('shows member controls when transitioning back to invited access', async () => {
    const user = userEvent.setup()

    const ShareSettingsModal = (await import('../ShareSettingsModal')).default
    renderWithProviders(
      <ShareSettingsModal
        opened={true}
        onClose={vi.fn()}
        projectName="CS101"
        metadata={{ is_private: false, allow_logged_in_users: false } as any}
      />,
      { homeContext: { dispatch: vi.fn() } },
    )

    await user.click(
      screen.getByRole('button', { name: /Change access|Access/i }),
    )
    await user.click(
      await screen.findByText(/Private \(only invited members\)/i),
    )
    await new Promise((r) => setTimeout(r, 350))

    expect(screen.getByText(/Members accordion/i)).toBeInTheDocument()
    expect(screen.getByText(/Admins accordion/i)).toBeInTheDocument()
  })
})
