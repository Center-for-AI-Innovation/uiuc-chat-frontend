import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithProviders } from '~/test-utils/renderWithProviders'
import { ChatInput } from '../ChatInput'
import { http, HttpResponse } from 'msw'
import { server } from '~/test-utils/server'

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

describe('ChatInput', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })
  it('toggles model settings when clicking the model label', async () => {
    const user = userEvent.setup()
    const dispatch = vi.fn()

    const llmProviders = {
      OpenAI: {
        provider: 'OpenAI',
        enabled: true,
        apiKey: 'sk-test',
        models: [
          { id: 'm1', name: 'Model 1', enabled: true, default: true },
        ],
      },
    }

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
        homeState: {
          llmProviders,
          showModelSettings: false,
          messageIsStreaming: false,
          prompts: [],
        } as any,
        homeContext: { dispatch },
      },
    )

    await user.click(screen.getByText(/Model 1/i))
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        field: 'showModelSettings',
        value: true,
      }),
    )
  })

  it('alerts when exceeding the selected model character limit', async () => {
    const user = userEvent.setup()
    const alertSpy = vi.spyOn(globalThis, 'alert').mockImplementation(() => {})

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
        homeState: {
          selectedConversation: { model: { tokenLimit: 5 } },
          messageIsStreaming: false,
          prompts: [],
        } as any,
        homeContext: { dispatch: vi.fn() },
      },
    )

    await user.type(
      screen.getByPlaceholderText('Message Illinois.chat'),
      '123456',
    )
    expect(alertSpy).toHaveBeenCalled()
  })

  it('warns when attempting to send while files are still processing', async () => {
    const user = userEvent.setup()
    const { showWarningToast } = await import('~/utils/toastUtils')

    server.use(
      http.post('*/api/UIUC-api/chat-file-upload', async () => {
        return HttpResponse.json({ ok: true })
      }),
    )

    const onSend = vi.fn()
    const { container } = renderWithProviders(
      <ChatInput
        onSend={onSend as any}
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
        homeState: {
          messageIsStreaming: false,
          prompts: [],
        } as any,
        homeContext: { dispatch: vi.fn() },
      },
    )

    const fileInput = container.querySelector('input[type=\"file\"]') as HTMLInputElement
    await user.upload(fileInput, new File(['hello'], 'notes.txt', { type: 'text/plain' }))

    await user.type(
      screen.getByPlaceholderText('Message Illinois.chat'),
      'Question',
    )
    await user.click(screen.getByRole('button', { name: /Send message/i }))

    expect(onSend).not.toHaveBeenCalled()
    expect(showWarningToast).toHaveBeenCalled()
  })

  it('alerts when trying to send an empty message with no uploads', async () => {
    const user = userEvent.setup()
    const alertSpy = vi.spyOn(globalThis, 'alert').mockImplementation(() => {})

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

    await user.click(screen.getByRole('button', { name: /Send message/i }))
    expect(alertSpy).toHaveBeenCalled()
  })

  it('sets stopConversationRef when clicking Stop Generating', async () => {
    const stopConversationRef = { current: false }
    let timeoutCallback: (() => void) | null = null

    vi.spyOn(globalThis, 'setTimeout').mockImplementation(((cb: any) => {
      timeoutCallback = cb
      return 1 as any
    }) as any)

    renderWithProviders(
      <ChatInput
        onSend={vi.fn()}
        onScrollDownClick={vi.fn()}
        stopConversationRef={stopConversationRef}
        textareaRef={{ current: null }}
        showScrollDownButton={false}
        inputContent=""
        setInputContent={vi.fn()}
        user_id="u1"
        courseName="CS101"
      />,
      {
        homeState: { messageIsStreaming: true, prompts: [] } as any,
        homeContext: { dispatch: vi.fn() },
      },
    )

    fireEvent.click(screen.getByRole('button', { name: /Stop Generating/i }))
    expect(stopConversationRef.current).toBe(true)
    timeoutCallback?.()
    expect(stopConversationRef.current).toBe(false)
  })

  it('shows prompt list and selects a prompt via keyboard', async () => {
    const user = userEvent.setup()

    const prompts = [
      { id: 'p1', name: 'TestPrompt', content: 'Hello world' },
    ]
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
        homeState: { messageIsStreaming: false, prompts } as any,
        homeContext: { dispatch: vi.fn() },
      },
    )

    const input = screen.getByPlaceholderText('Message Illinois.chat')
    await user.type(input, '/t')
    expect(screen.getByText(/TestPrompt/i)).toBeInTheDocument()

    await user.keyboard('{Enter}')
    expect(screen.queryByText(/TestPrompt/i)).not.toBeInTheDocument()
  }, 20000)

  it('submits a variable prompt and shows a server error toast when /api/allNewRoutingChat fails', async () => {
    const user = userEvent.setup()
    const { showErrorToast } = await import('~/utils/toastUtils')

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Bad request' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      }),
    )

    const prompts = [
      { id: 'p1', name: 'VarPrompt', content: 'Hello {{name}}' },
    ]

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
        homeState: {
          selectedConversation: {
            id: 'c1',
            name: 'Test',
            messages: [],
            model: { id: 'gpt-4o-mini', name: 'GPT-4o mini', tokenLimit: 128000, enabled: true },
            prompt: 'p',
            temperature: 0.3,
            folderId: null,
          } as any,
          messageIsStreaming: false,
          prompts,
        } as any,
        homeContext: { dispatch: vi.fn() },
      },
    )

    const input = screen.getByPlaceholderText('Message Illinois.chat')
    await user.type(input, '/v')
    await user.keyboard('{Enter}')

    await user.click(screen.getByRole('button', { name: /variable-submit/i }))
    await waitFor(() => expect(showErrorToast).toHaveBeenCalledWith('Bad request'))
  })

  it('uploads an image and sends a structured message', async () => {
    const user = userEvent.setup()
    vi.spyOn(console, 'log').mockImplementation(() => {})

    const onSend = vi.fn()
      const { container } = renderWithProviders(
        <ChatInput
          onSend={onSend as any}
          onScrollDownClick={vi.fn()}
          stopConversationRef={{ current: false }}
          textareaRef={{ current: null }}
          showScrollDownButton={false}
          inputContent=""
          setInputContent={vi.fn()}
          user_id="u1"
          courseName="CS101"
          chat_ui={{ isModelLoading: () => false } as any}
        />,
        {
          homeState: {
            selectedConversation: undefined,
            messageIsStreaming: false,
            prompts: [],
          } as any,
          homeContext: { dispatch: vi.fn() },
        },
      )

      const fileInput = container.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement
      expect(fileInput).toBeTruthy()

      const image = new File(['img'], 'pic.png', { type: 'image/png' })

    await user.upload(fileInput, image)
    expect(await screen.findByText(/Ready for chat/i)).toBeInTheDocument()

      await user.type(
        screen.getByPlaceholderText('Message Illinois.chat'),
        'Hello with files',
      )
      await user.click(screen.getByRole('button', { name: /Send message/i }))

      expect(onSend).toHaveBeenCalledTimes(1)
      const message = onSend.mock.calls[0]?.[0]
      expect(Array.isArray(message.content)).toBe(true)
      const types = (message.content as any[]).map((c) => c.type)
      expect(types).toContain('text')
      expect(types).toContain('image_url')
  }, 20000)

  it('uploads a non-image file, attaches contexts, and sends a file message', async () => {
    const user = userEvent.setup()

    server.use(
      http.post('*/api/UIUC-api/chat-file-upload', async () => {
        return HttpResponse.json({ ok: true })
      }),
      http.post('*/api/getContexts', async ({ request }) => {
        const body: any = await request.json()
        return HttpResponse.json([
          {
            readable_filename: body.search_query,
            s3_path: `cs101/${body.search_query}`,
            url: '',
            content: 'context',
          },
        ])
      }),
    )

    const onSend = vi.fn()
    const { container } = renderWithProviders(
      <ChatInput
        onSend={onSend as any}
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
        homeState: {
          selectedConversation: undefined,
          messageIsStreaming: false,
          prompts: [],
        } as any,
        homeContext: { dispatch: vi.fn() },
      },
    )

    const fileInput = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement
    const file = new File(['hello'], 'notes.txt', { type: 'text/plain' })
    await user.upload(fileInput, file)

    // Advance the internal "backend processing" delay so contexts are fetched.
    await new Promise((resolve) => setTimeout(resolve, 2100))
    expect(screen.getByText(/Ready for chat/i)).toBeInTheDocument()

    await user.type(
      screen.getByPlaceholderText('Message Illinois.chat'),
      'Question about my file',
    )
    await user.click(screen.getByRole('button', { name: /Send message/i }))

    expect(onSend).toHaveBeenCalledTimes(1)
    const message = onSend.mock.calls[0]?.[0]
    expect(Array.isArray(message.content)).toBe(true)
    expect((message.content as any[]).some((c) => c.type === 'file')).toBe(true)
    expect(Array.isArray(message.contexts)).toBe(true)
    expect(message.contexts[0]?.readable_filename).toBe('notes.txt')
  }, 20000)

  it('warns on duplicate files', async () => {
    const user = userEvent.setup()
    const { showWarningToast } = await import('~/utils/toastUtils')

    const { container } = renderWithProviders(
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

    const fileInput = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement
    const file = new File(['x'], 'dup.txt', { type: 'text/plain' })

    await user.upload(fileInput, file)
    expect(await screen.findByText(/dup\.txt/i)).toBeInTheDocument()
    await user.upload(fileInput, file)

    expect(showWarningToast).toHaveBeenCalled()
  }, 20000)

  it('rejects too many files', async () => {
    const user = userEvent.setup()
    const { showToast } = await import('~/utils/toastUtils')
    const { container } = renderWithProviders(
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

    const fileInput = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement
    const files = Array.from({ length: 6 }).map(
      (_, i) => new File(['x'], `f${i}.txt`, { type: 'text/plain' }),
    )
    await user.upload(fileInput, files)

    expect(showToast).toHaveBeenCalled()
  }, 20000)

  it('rejects unsupported file types', async () => {
    const user = userEvent.setup()
    const { showToast } = await import('~/utils/toastUtils')

    const { container } = renderWithProviders(
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

    const fileInput = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement
    fireEvent.change(fileInput, {
      target: {
        files: [new File(['x'], 'malware.exe', { type: 'application/octet-stream' })],
      },
    })

    expect(showToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Unsupported File Type' }),
    )
  }, 20000)

  it('removes duplicates within the same selection and shows an info toast', async () => {
    const user = userEvent.setup()
    const { showInfoToast } = await import('~/utils/toastUtils')

    const { container } = renderWithProviders(
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

    const fileInput = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement
    await user.upload(fileInput, [
      new File(['x'], 'dup.txt', { type: 'text/plain' }),
      new File(['x'], 'dup.txt', { type: 'text/plain' }),
    ])

    expect(showInfoToast).toHaveBeenCalled()
  }, 20000)

  it('falls back to the S3 key when presigned URL generation fails for image files', async () => {
    const user = userEvent.setup()
    vi.spyOn(console, 'log').mockImplementation(() => {})

    const api = await import('~/utils/apiUtils')
    ;(api.fetchPresignedUrl as any).mockResolvedValueOnce(undefined)

    const { container } = renderWithProviders(
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

    const fileInput = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement
    await user.upload(fileInput, new File(['img'], 'pic.png', { type: 'image/png' }))

    expect(await screen.findByText(/Ready for chat/i)).toBeInTheDocument()
  }, 20000)

  it('marks image uploads as failed when uploadToS3 returns no key', async () => {
    const user = userEvent.setup()

    const api = await import('~/utils/apiUtils')
    ;(api.uploadToS3 as any).mockResolvedValueOnce(undefined)

    const { container } = renderWithProviders(
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

    const fileInput = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement
    await user.upload(fileInput, new File(['img'], 'pic.png', { type: 'image/png' }))

    expect(await screen.findByText(/Upload failed/i)).toBeInTheDocument()
  }, 20000)

  it('hides the prompt list on outside clicks', async () => {
    const user = userEvent.setup()

    const prompts = [{ id: 'p1', name: 'TestPrompt', content: 'Hello world' }]
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
      { homeState: { messageIsStreaming: false, prompts } as any, homeContext: { dispatch: vi.fn() } },
    )

    const input = screen.getByPlaceholderText('Message Illinois.chat')
    await user.type(input, '/t')
    expect(screen.getByText(/TestPrompt/i)).toBeInTheDocument()

    await user.click(document.body)
    await waitFor(() =>
      expect(screen.queryByText(/TestPrompt/i)).not.toBeInTheDocument(),
    )
  }, 20000)

  it('returns empty contexts when /api/getContexts responds with an object', async () => {
    const user = userEvent.setup()

    server.use(
      http.post('*/api/UIUC-api/chat-file-upload', async () => {
        return HttpResponse.json({ ok: true })
      }),
      http.post('*/api/getContexts', async () => {
        return HttpResponse.json({ contexts: [] })
      }),
    )

    const onSend = vi.fn()
    const { container } = renderWithProviders(
      <ChatInput
        onSend={onSend as any}
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
        homeState: {
          selectedConversation: undefined,
          messageIsStreaming: false,
          prompts: [],
        } as any,
        homeContext: { dispatch: vi.fn() },
      },
    )

    const fileInput = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement
    await user.upload(
      fileInput,
      new File(['hello'], 'notes.txt', { type: 'text/plain' }),
    )

    await new Promise((resolve) => setTimeout(resolve, 2100))
    await user.type(
      screen.getByPlaceholderText('Message Illinois.chat'),
      'Question about my file',
    )
    await user.click(screen.getByRole('button', { name: /Send message/i }))

    expect(onSend).toHaveBeenCalledTimes(1)
    const message = onSend.mock.calls[0]?.[0]
    expect(message.contexts).toBeUndefined()
  }, 20000)

  it('does not send on Enter for mobile user agents', async () => {
    const user = userEvent.setup()
    const onSend = vi.fn()

    const uaDesc = Object.getOwnPropertyDescriptor(
      window.navigator,
      'userAgent',
    )
    Object.defineProperty(window.navigator, 'userAgent', {
      configurable: true,
      get: () => 'iPhone',
    })

    try {
      renderWithProviders(
        <ChatInput
          onSend={onSend as any}
          onScrollDownClick={vi.fn()}
          stopConversationRef={{ current: false }}
          textareaRef={{ current: null }}
          showScrollDownButton={false}
          inputContent=""
          setInputContent={vi.fn()}
          user_id="u1"
          courseName="CS101"
        />,
        { homeState: { messageIsStreaming: false, prompts: [] } as any, homeContext: { dispatch: vi.fn() } },
      )

      const textarea = screen.getByPlaceholderText('Message Illinois.chat')
      await user.type(textarea, 'Hello{Enter}')
      expect(onSend).not.toHaveBeenCalled()
    } finally {
      if (uaDesc) Object.defineProperty(window.navigator, 'userAgent', uaDesc)
    }
  })

  it('handles prompt list navigation keys (arrows/tab/escape)', async () => {
    const user = userEvent.setup()
    const prompts = [
      { id: 'p1', name: 'One', content: 'one' },
      { id: 'p2', name: 'Two', content: 'two' },
    ]

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
      { homeState: { messageIsStreaming: false, prompts } as any, homeContext: { dispatch: vi.fn() } },
    )

    const textarea = screen.getByPlaceholderText('Message Illinois.chat')
    await user.type(textarea, '/')
    expect(screen.getByText(/One/i)).toBeInTheDocument()

    fireEvent.keyDown(textarea, { key: 'ArrowDown' })
    fireEvent.keyDown(textarea, { key: 'ArrowUp' })
    fireEvent.keyDown(textarea, { key: 'Tab' })
    fireEvent.keyDown(textarea, { key: 'x' })
    fireEvent.keyDown(textarea, { key: 'Escape' })

    await waitFor(() => expect(screen.queryByText(/One/i)).not.toBeInTheDocument())
  })

  it('toggles and closes the plugin select via keyboard', async () => {
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
      { homeState: { messageIsStreaming: false, prompts: [] } as any, homeContext: { dispatch: vi.fn() } },
    )

    const textarea = screen.getByPlaceholderText('Message Illinois.chat')
    fireEvent.keyDown(textarea, { key: '/', metaKey: true })

    const combo = await screen.findByRole('combobox')
    fireEvent.keyDown(combo, { key: 'Escape' })

    await waitFor(() => expect(screen.queryByRole('combobox')).not.toBeInTheDocument())
  })

  it('shows a regenerate button when the last message is a user message', async () => {
    const user = userEvent.setup()
    const onRegenerate = vi.fn()

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
        onRegenerate={onRegenerate as any}
      />,
      {
        homeState: {
          selectedConversation: { id: 'c1', messages: [{ id: 'u1', role: 'user', content: 'Q' }] } as any,
          messageIsStreaming: false,
          prompts: [],
        } as any,
        homeContext: { dispatch: vi.fn() },
      },
    )

    await user.click(await screen.findByRole('button', { name: /Regenerate Response/i }))
    expect(onRegenerate).toHaveBeenCalled()
  })

  it('shows and triggers the scroll-down button', async () => {
    const user = userEvent.setup()
    const onScrollDownClick = vi.fn()

    renderWithProviders(
      <ChatInput
        onSend={vi.fn()}
        onScrollDownClick={onScrollDownClick}
        stopConversationRef={{ current: false }}
        textareaRef={{ current: null }}
        showScrollDownButton={true}
        inputContent=""
        setInputContent={vi.fn()}
        user_id="u1"
        courseName="CS101"
      />,
      { homeState: { messageIsStreaming: false, prompts: [] } as any, homeContext: { dispatch: vi.fn() } },
    )

    const buttons = screen.getAllByRole('button')
    const scrollButton = buttons.find(
      (btn) =>
        !btn.getAttribute('aria-label') &&
        btn.className.includes('h-7') &&
        btn.className.includes('w-7'),
    ) as HTMLElement
    expect(scrollButton).toBeTruthy()
    await user.click(scrollButton)
    expect(onScrollDownClick).toHaveBeenCalled()
  })
})
