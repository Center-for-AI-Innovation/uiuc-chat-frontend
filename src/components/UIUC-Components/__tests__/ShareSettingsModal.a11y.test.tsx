import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'

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

vi.mock('~/utils/apiUtils', async (importOriginal) => {
  const actual: any = await importOriginal()
  return {
    ...actual,
    callSetCourseMetadata: vi.fn(async () => true),
  }
})

describe('ShareSettingsModal - accessibility', () => {
  it('modal title shows "Sharing and Access"', async () => {
    const ShareSettingsModal = (await import('../ShareSettingsModal')).default
    renderWithProviders(
      <ShareSettingsModal
        opened={true}
        onClose={vi.fn()}
        projectName="CS101"
        metadata={{ is_private: true, allow_logged_in_users: false } as any}
      />,
      { homeContext: { dispatch: vi.fn() } },
    )
    expect(screen.getByText(/Sharing and Access/i)).toBeInTheDocument()
  })
})
