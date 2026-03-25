import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'

import { renderWithProviders } from '~/test-utils/renderWithProviders'
import { ChatInput } from '../ChatInput'

vi.mock('~/utils/toastUtils', () => ({
  showToast: vi.fn(),
  showErrorToast: vi.fn(),
  showWarningToast: vi.fn(),
  showInfoToast: vi.fn(),
}))

vi.mock('../VariableModal', () => ({
  VariableModal: ({ onSubmit, onClose }: any) => (
    <div>
      <button type="button" onClick={() => onSubmit()}>
        variable-submit
      </button>
      <button type="button" onClick={onClose}>
        variable-close
      </button>
    </div>
  ),
}))

vi.mock('~/utils/apiUtils', async (importOriginal) => {
  const actual: any = await importOriginal()
  return {
    ...actual,
    uploadToS3: vi.fn(async (file: File | null) => {
      if (!file) return undefined
      return `cs101/${file.name}`
    }),
    fetchPresignedUrl: vi.fn(async () => {
      return 'https://s3.amazonaws.com/bucket/file?X-Amz-Signature=abc&X-Amz-Date=20000101T000000Z&X-Amz-Expires=60'
    }),
  }
})

describe('ChatInput - accessibility', () => {
  it('textarea is identifiable by its placeholder text', () => {
    renderWithProviders(
      <ChatInput
        onSend={vi.fn()}
        onScrollDownClick={vi.fn()}
        stopConversationRef={{ current: false }}
        textareaRef={{ current: null }}
        showScrollDownButton={false}
        inputContent=""
        setInputContent={vi.fn()}
        user_id="u1"
        courseName="CS101"
      />,
      { homeContext: { dispatch: vi.fn() } },
    )

    const textarea = screen.getByPlaceholderText('Message Illinois Chat')
    expect(textarea).toBeInTheDocument()
    expect(textarea.tagName).toBe('TEXTAREA')
  })

  it('send button has aria-label="Send message"', () => {
    renderWithProviders(
      <ChatInput
        onSend={vi.fn()}
        onScrollDownClick={vi.fn()}
        stopConversationRef={{ current: false }}
        textareaRef={{ current: null }}
        showScrollDownButton={false}
        inputContent=""
        setInputContent={vi.fn()}
        user_id="u1"
        courseName="CS101"
      />,
      {
        homeState: { messageIsStreaming: false, prompts: [] } as any,
        homeContext: { dispatch: vi.fn() },
      },
    )

    expect(
      screen.getByRole('button', { name: /Send message/i }),
    ).toBeInTheDocument()
  })
})
