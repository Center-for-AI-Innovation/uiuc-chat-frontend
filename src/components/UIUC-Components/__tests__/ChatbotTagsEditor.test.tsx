import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import ChatbotTagsEditor from '../ChatbotTagsEditor'
import {
  createTestQueryClient,
  renderWithProviders,
} from '~/test-utils/renderWithProviders'
import type { CourseMetadata } from '~/types/courseMetadata'
import { MAX_CHATBOT_TAGS } from '~/types/chatbotTags'

vi.mock('~/utils/apiUtils', () => ({
  callSetCourseMetadata: vi.fn(async () => true),
}))

function makeMetadata(overrides: Partial<CourseMetadata> = {}): CourseMetadata {
  return {
    is_private: false,
    course_owner: 'owner@test.com',
    course_admins: [],
    approved_emails_list: [],
    example_questions: [],
    banner_image_s3: undefined,
    course_intro_message: '',
    system_prompt: undefined,
    openai_api_key: undefined,
    disabled_models: undefined,
    project_description: undefined,
    documentsOnly: undefined,
    guidedLearning: undefined,
    systemPromptOnly: undefined,
    vector_search_rewrite_disabled: undefined,
    allow_logged_in_users: undefined,
    is_frozen: undefined,
    tags: [],
    ...overrides,
  }
}

function renderEditor(metadata: CourseMetadata = makeMetadata()) {
  const queryClient = createTestQueryClient()
  queryClient.setQueryData(['courseMetadata', 'TestProject'], metadata)
  return renderWithProviders(
    <ChatbotTagsEditor course_name="TestProject" course_metadata={metadata} />,
    { queryClient },
  )
}

describe('ChatbotTagsEditor', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the section heading and empty-state copy', () => {
    renderEditor()
    expect(screen.getByText('Tags')).toBeInTheDocument()
    expect(screen.getByText('No tags yet.')).toBeInTheDocument()
  })

  it('renders the free-text input and no projectType/organization pickers', () => {
    renderEditor()
    expect(screen.getByLabelText('Tag')).toBeInTheDocument()
    // The hardcoded project_type and organization pickers have moved to the
    // bot wizard's first page — they should no longer appear in the editor.
    expect(
      screen.queryByRole('button', { name: /^project_type:$/i }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /^organization:$/i }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('group', { name: /Project type options/i }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('group', { name: /Organization options/i }),
    ).not.toBeInTheDocument()
  })

  it('renders tag badges for every category that is already on the bot', () => {
    renderEditor(
      makeMetadata({
        tags: [
          { category: 'organization', value: 'Grainger Engineering' },
          { category: 'projectType', value: 'Course' },
          { category: 'general', value: 'beta' },
        ],
      }),
    )
    expect(screen.getByText('Grainger Engineering')).toBeInTheDocument()
    expect(screen.getByText('Course')).toBeInTheDocument()
    expect(screen.getByText('beta')).toBeInTheDocument()
  })

  it('typing free text and clicking Add creates a general tag', async () => {
    const user = userEvent.setup()
    const { callSetCourseMetadata } = await import('~/utils/apiUtils')
    renderEditor()

    await user.type(screen.getByLabelText('Tag'), 'beta-cohort')
    await user.click(screen.getByRole('button', { name: /^Add tag$/i }))

    await waitFor(() => {
      expect(vi.mocked(callSetCourseMetadata)).toHaveBeenCalledWith(
        'TestProject',
        expect.objectContaining({
          tags: [{ category: 'general', value: 'beta-cohort' }],
        }),
      )
    })
  })

  it('pressing Enter in the input adds a general tag', async () => {
    const user = userEvent.setup()
    const { callSetCourseMetadata } = await import('~/utils/apiUtils')
    renderEditor()

    await user.type(screen.getByLabelText('Tag'), 'launch{enter}')

    await waitFor(() => {
      expect(vi.mocked(callSetCourseMetadata)).toHaveBeenCalledWith(
        'TestProject',
        expect.objectContaining({
          tags: [{ category: 'general', value: 'launch' }],
        }),
      )
    })
  })

  it('rejects duplicate general tags case-insensitively', async () => {
    const user = userEvent.setup()
    const { callSetCourseMetadata } = await import('~/utils/apiUtils')

    renderEditor(
      makeMetadata({
        tags: [{ category: 'general', value: 'Beta' }],
      }),
    )

    await user.type(screen.getByLabelText('Tag'), 'beta')
    await user.click(screen.getByRole('button', { name: /^Add tag$/i }))

    expect(
      await screen.findByText(/That tag is already added/i),
    ).toBeInTheDocument()
    expect(vi.mocked(callSetCourseMetadata)).not.toHaveBeenCalled()
  })

  it('validates that the input is not empty before adding', async () => {
    const user = userEvent.setup()
    const { callSetCourseMetadata } = await import('~/utils/apiUtils')
    renderEditor()

    await user.click(screen.getByRole('button', { name: /^Add tag$/i }))

    expect(await screen.findByText(/Enter a tag name/i)).toBeInTheDocument()
    expect(vi.mocked(callSetCourseMetadata)).not.toHaveBeenCalled()
  })

  it('disables the input and Add button when the total tag cap is reached', () => {
    const generalTags = Array.from({ length: MAX_CHATBOT_TAGS }, (_, i) => ({
      category: 'general' as const,
      value: `tag-${i}`,
    }))
    renderEditor(makeMetadata({ tags: generalTags }))
    expect(screen.getByLabelText('Tag')).toBeDisabled()
    expect(screen.getByRole('button', { name: /^Add tag$/i })).toBeDisabled()
  })

  it('removing a tag (including an organization/projectType badge) calls the API without it', async () => {
    const user = userEvent.setup()
    const { callSetCourseMetadata } = await import('~/utils/apiUtils')

    renderEditor(
      makeMetadata({
        tags: [
          { category: 'organization', value: 'Grainger Engineering' },
          { category: 'projectType', value: 'Course' },
        ],
      }),
    )

    await user.click(
      screen.getByRole('button', {
        name: /Remove tag Organization: Grainger Engineering/i,
      }),
    )

    await waitFor(() => {
      expect(vi.mocked(callSetCourseMetadata)).toHaveBeenCalledWith(
        'TestProject',
        expect.objectContaining({
          tags: [{ category: 'projectType', value: 'Course' }],
        }),
      )
    })
  })

  it('surfaces an error message when the API rejects the update', async () => {
    const user = userEvent.setup()
    const { callSetCourseMetadata } = await import('~/utils/apiUtils')
    vi.mocked(callSetCourseMetadata).mockResolvedValueOnce(false)

    renderEditor(
      makeMetadata({
        tags: [{ category: 'general', value: 'A' }],
      }),
    )

    await user.click(screen.getByRole('button', { name: /Remove tag Tag: A/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /Failed to save tags/i,
    )
  })
})
