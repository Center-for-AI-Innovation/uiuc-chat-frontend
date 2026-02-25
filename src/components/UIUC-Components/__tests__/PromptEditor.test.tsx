import React from 'react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PromptEditor, {
  showPromptToast,
  showToastNotification,
  showToastOnPromptUpdate,
} from '../PromptEditor'

const mocks = vi.hoisted(() => ({
  fetchCourseMetadata: vi.fn(),
  updateCourseMetadata: vi.fn(),
  mutateCourseMetadata: vi.fn(),
  fetchLLMProviders: vi.fn(),
  fetchDefaultPostPrompt: vi.fn(),
  routeChat: vi.fn(),
  routeMutate: vi.fn(),
  notificationsShow: vi.fn(),
  queryClient: { invalidateQueries: vi.fn() },
}))

vi.mock('~/hooks/queries/useFetchCourseMetadata', () => ({
  useFetchCourseMetadata: (...args: any[]) =>
    mocks.fetchCourseMetadata(...args),
}))

vi.mock('@/hooks/queries/useUpdateCourseMetadata', () => ({
  useUpdateCourseMetadata: (...args: any[]) =>
    mocks.updateCourseMetadata(...args),
}))

vi.mock('~/hooks/queries/useFetchLLMProviders', () => ({
  useFetchLLMProviders: (...args: any[]) => mocks.fetchLLMProviders(...args),
}))

vi.mock('@/hooks/queries/useFetchDefaultPostPrompt', () => ({
  useFetchDefaultPostPrompt: (...args: any[]) =>
    mocks.fetchDefaultPostPrompt(...args),
}))

vi.mock('@/hooks/queries/useRouteChat', () => ({
  useRouteChat: (...args: any[]) => mocks.routeChat(...args),
}))

vi.mock('@mantine/notifications', () => ({
  notifications: {
    show: (...args: any[]) => mocks.notificationsShow(...args),
  },
}))

vi.mock('@mantine/core', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>
  return {
    ...actual,
    Modal: ({ opened, children }: any) =>
      opened ? <div>{children}</div> : null,
    Collapse: ({ in: isOpen, children }: any) =>
      isOpen ? <div>{children}</div> : null,
  }
})

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>
  return {
    ...actual,
    useQueryClient: () => mocks.queryClient,
  }
})

vi.mock('use-debounce', () => ({
  useDebouncedCallback: (fn: (...args: any[]) => any) => fn,
}))

vi.mock('~/components/Chat/ModelSelect', () => ({
  getModelLogo: () => 'logo.png',
}))

vi.mock(
  '~/components/UIUC-Components/api-inputs/LLMsApiKeyInputForm',
  async (importOriginal) => {
    const actual = (await importOriginal()) as Record<string, unknown>
    return {
      ...actual,
      findDefaultModel: () => ({ id: 'gpt-4o-mini', name: 'GPT-4o mini' }),
    }
  },
)

vi.mock('~/components/Modals/LinkGeneratorModal', () => ({
  LinkGeneratorModal: ({ opened, onClose }: any) =>
    opened ? (
      <button type="button" onClick={onClose}>
        Close Share Modal
      </button>
    ) : null,
}))

vi.mock('~/components/Switches/CustomSwitch', () => ({
  default: ({ label, checked, onChange }: any) => (
    <label>
      <input
        type="checkbox"
        role="switch"
        aria-label={label}
        checked={checked}
        onChange={(e) => onChange(e.currentTarget.checked)}
      />
      {label}
    </label>
  ),
}))

vi.mock('~/components/Buttons/CustomCopyButton', () => ({
  default: ({ label, onClick }: any) => (
    <button type="button" onClick={onClick}>
      {label}
    </button>
  ),
}))

function makeCourseMetadata() {
  return {
    is_private: false,
    course_owner: 'owner@example.com',
    course_admins: [],
    approved_emails_list: [],
    example_questions: [],
    banner_image_s3: undefined,
    course_intro_message: undefined,
    system_prompt: 'Initial prompt',
    openai_api_key: 'sk-test',
    disabled_models: [],
    project_description: 'desc',
    documentsOnly: false,
    guidedLearning: false,
    systemPromptOnly: false,
    vector_search_rewrite_disabled: false,
    allow_logged_in_users: true,
    is_frozen: false,
  }
}

function makeProviders() {
  return {
    OpenAI: {
      provider: 'OpenAI',
      enabled: true,
      apiKey: 'sk-test',
      models: [
        {
          id: 'gpt-4o-mini',
          name: 'GPT-4o mini',
          enabled: true,
          tokenLimit: 128000,
        },
      ],
    },
  } as any
}

function makeStreamResponse(text: string) {
  return new Response(
    new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(text))
        controller.close()
      },
    }),
  )
}

describe('PromptEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.fetchCourseMetadata.mockReturnValue({
      data: makeCourseMetadata(),
      isLoading: false,
    })
    mocks.mutateCourseMetadata = vi.fn().mockResolvedValue({ ok: true })
    mocks.updateCourseMetadata.mockImplementation(() => ({
      mutateAsync: mocks.mutateCourseMetadata,
    }))
    mocks.fetchLLMProviders.mockReturnValue({
      data: makeProviders(),
      isLoading: false,
    })
    mocks.fetchDefaultPostPrompt.mockReturnValue({
      data: 'Default post prompt text',
      refetch: vi.fn().mockResolvedValue({ data: 'Default post prompt text' }),
    })
    mocks.routeMutate = vi.fn().mockImplementation(async () => {
      return makeStreamResponse('Optimized prompt')
    })
    mocks.routeChat.mockImplementation(() => ({
      mutateAsync: mocks.routeMutate,
    }))
  })

  it('renders loading state while metadata/providers are loading', () => {
    mocks.fetchCourseMetadata.mockImplementation(() => ({
      data: null,
      isLoading: true,
    }))
    mocks.fetchLLMProviders.mockImplementation(() => ({
      data: null,
      isLoading: true,
    }))

    render(<PromptEditor project_name="CS101" />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('supports optimize flow and updates prompt from modal', async () => {
    const user = userEvent.setup()
    mocks.routeMutate.mockImplementation(async () => {
      return makeStreamResponse('Optimized prompt body')
    })

    render(<PromptEditor project_name="CS101" userEmail="me@example.com" />)

    await user.click(
      screen.getByRole('button', { name: /optimize system prompt/i }),
    )

    await waitFor(() => expect(mocks.routeMutate).toHaveBeenCalled())
  })

  it('handles embedded settings actions including copy/reset/share', async () => {
    const user = userEvent.setup()
    mocks.fetchCourseMetadata.mockReturnValueOnce({
      data: { ...makeCourseMetadata(), systemPromptOnly: true },
      isLoading: false,
    })
    const clipboardSpy = vi
      .spyOn(navigator.clipboard, 'writeText')
      .mockResolvedValue()

    render(<PromptEditor project_name="CS101" isEmbedded={true} />)

    await user.click(
      screen.getByRole('switch', {
        name: /bypass illinois chat's internal prompting/i,
      }),
    )

    await user.click(
      await screen.findByRole('button', {
        name: /copy illinois chat's internal prompt/i,
      }),
    )
    expect(clipboardSpy).toHaveBeenCalledWith('Default post prompt text')

    await user.click(
      screen.getByRole('button', { name: /reset prompting settings/i }),
    )
    await user.click(screen.getByRole('button', { name: /confirm/i }))
    await waitFor(() => expect(mocks.mutateCourseMetadata).toHaveBeenCalled())

    await user.click(
      screen.getByRole('button', { name: /generate share link/i }),
    )
    await screen.findByRole('button', { name: /close share modal/i })
  })

  it('handles non-embedded sidebar controls and prompt update/reset actions', async () => {
    const user = userEvent.setup()

    render(<PromptEditor project_name="CS101" userEmail="me@example.com" />)

    await user.click(
      screen.getByRole('button', { name: /update system prompt/i }),
    )
    await waitFor(() => expect(mocks.mutateCourseMetadata).toHaveBeenCalled())

    await user.click(
      screen.getByRole('button', { name: /reset prompting settings/i }),
    )
    await user.click(screen.getByRole('button', { name: /confirm/i }))

    await waitFor(() =>
      expect(mocks.mutateCourseMetadata.mock.calls.length).toBeGreaterThan(1),
    )
  })

  it('shows optimize error path when stream body is absent', async () => {
    const user = userEvent.setup()

    // No stream body branch
    mocks.fetchLLMProviders.mockReturnValue({
      data: makeProviders(),
      isLoading: false,
    })
    mocks.routeMutate.mockImplementationOnce(async () => new Response(null))
    render(<PromptEditor project_name="CS101" userEmail="me@example.com" />)
    await user.click(
      screen.getByRole('button', { name: /optimize system prompt/i }),
    )
    await waitFor(() =>
      expect(mocks.notificationsShow).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Error' }),
      ),
    )
  })

  it('handles default prompt copy success', async () => {
    const user = userEvent.setup()
    const clipboardSpy = vi
      .spyOn(navigator.clipboard, 'writeText')
      .mockResolvedValue()

    mocks.fetchCourseMetadata.mockReturnValueOnce({
      data: { ...makeCourseMetadata(), systemPromptOnly: true },
      isLoading: false,
    })
    mocks.fetchDefaultPostPrompt.mockReturnValueOnce({
      data: undefined,
      refetch: vi.fn().mockResolvedValue({ data: 'Fetched default prompt' }),
    })

    render(<PromptEditor project_name="CS101" isEmbedded={true} />)
    await user.click(
      screen.getByRole('switch', {
        name: /bypass illinois chat's internal prompting/i,
      }),
    )
    await user.click(
      await screen.findByRole('button', {
        name: /copy illinois chat's internal prompt/i,
      }),
    )
    expect(clipboardSpy).toHaveBeenCalled()
  })

  it('shows error paths for failed update and failed reset', async () => {
    const user = userEvent.setup()
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    mocks.mutateCourseMetadata.mockRejectedValueOnce(new Error('update failed'))
    mocks.mutateCourseMetadata.mockRejectedValueOnce(new Error('reset failed'))

    render(<PromptEditor project_name="CS101" userEmail="me@example.com" />)

    await user.click(
      screen.getByRole('button', { name: /update system prompt/i }),
    )
    await waitFor(() =>
      expect(mocks.notificationsShow).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Error Updating Prompt' }),
      ),
    )

    await user.click(
      screen.getByRole('button', { name: /reset prompting settings/i }),
    )
    await user.click(screen.getByRole('button', { name: /confirm/i }))
    await waitFor(() => expect(alertSpy).toHaveBeenCalled())
  })
})

describe('PromptEditor toast helpers', () => {
  it('emits prompt-related notifications with expected titles', () => {
    const fakeTheme = {} as any

    showPromptToast(fakeTheme, 'Saved', 'Prompt saved')
    showToastOnPromptUpdate(fakeTheme, false, true)
    showToastOnPromptUpdate(fakeTheme, true, false)
    showToastNotification('Info', 'Details', false)

    expect(mocks.notificationsShow).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Saved' }),
    )
    expect(mocks.notificationsShow).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Prompt Reset to Default' }),
    )
    expect(mocks.notificationsShow).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Error Updating Prompt' }),
    )
    expect(mocks.notificationsShow).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Info' }),
    )
  })
})
