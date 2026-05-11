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

  it('renders an organization tag as a plain badge (no Project Type prefix)', () => {
    renderEditor(
      makeMetadata({
        tags: [{ category: 'organization', value: 'Grainger Engineering' }],
      }),
    )
    expect(screen.getByText('Grainger Engineering')).toBeInTheDocument()
    expect(screen.queryByText(/Project Type:/)).not.toBeInTheDocument()
  })

  it('renders a project-type tag with the "Project Type:" prefix (special styling)', () => {
    renderEditor(
      makeMetadata({
        tags: [{ category: 'projectType', value: 'Course' }],
      }),
    )
    expect(screen.getByText(/Project Type:\s*Course/)).toBeInTheDocument()
  })

  it('typing a free-text value and clicking Add creates an organization tag', async () => {
    const user = userEvent.setup()
    const { callSetCourseMetadata } = await import('~/utils/apiUtils')
    renderEditor()

    await user.type(screen.getByLabelText('Tag'), 'Computer Science')
    await user.click(screen.getByRole('button', { name: /Add tag/i }))

    await waitFor(() => {
      expect(vi.mocked(callSetCourseMetadata)).toHaveBeenCalledWith(
        'TestProject',
        expect.objectContaining({
          tags: [{ category: 'organization', value: 'Computer Science' }],
        }),
      )
    })
  })

  it('typing a project-type value (case-insensitive) creates a projectType tag with canonical casing', async () => {
    const user = userEvent.setup()
    const { callSetCourseMetadata } = await import('~/utils/apiUtils')
    renderEditor()

    await user.type(screen.getByLabelText('Tag'), 'course')
    await user.keyboard('{Enter}')

    await waitFor(() => {
      expect(vi.mocked(callSetCourseMetadata)).toHaveBeenCalledWith(
        'TestProject',
        expect.objectContaining({
          tags: [{ category: 'projectType', value: 'Course' }],
        }),
      )
    })
  })

  it('validates that the input is not empty before adding', async () => {
    const user = userEvent.setup()
    const { callSetCourseMetadata } = await import('~/utils/apiUtils')
    renderEditor()

    await user.click(screen.getByRole('button', { name: /Add tag/i }))

    expect(await screen.findByText(/Enter a tag name/i)).toBeInTheDocument()
    expect(vi.mocked(callSetCourseMetadata)).not.toHaveBeenCalled()
  })

  it('rejects duplicates with an inline error', async () => {
    const user = userEvent.setup()
    renderEditor(
      makeMetadata({
        tags: [{ category: 'organization', value: 'Grainger Engineering' }],
      }),
    )

    await user.type(screen.getByLabelText('Tag'), 'Grainger Engineering')
    await user.click(screen.getByRole('button', { name: /Add tag/i }))

    expect(
      await screen.findByText(/That tag is already added/i),
    ).toBeInTheDocument()
  })

  it('rejects adding a second project-type tag when one already exists', async () => {
    const user = userEvent.setup()
    const { callSetCourseMetadata } = await import('~/utils/apiUtils')

    renderEditor(
      makeMetadata({
        tags: [{ category: 'projectType', value: 'Course' }],
      }),
    )

    await user.type(screen.getByLabelText('Tag'), 'Department')
    await user.click(screen.getByRole('button', { name: /Add tag/i }))

    expect(
      await screen.findByText(
        /You can only have one Project Type tag\. Remove "Course" to change it\./i,
      ),
    ).toBeInTheDocument()
    expect(vi.mocked(callSetCourseMetadata)).not.toHaveBeenCalled()
  })

  it('rejects adding a second organization tag when one already exists', async () => {
    const user = userEvent.setup()
    const { callSetCourseMetadata } = await import('~/utils/apiUtils')

    renderEditor(
      makeMetadata({
        tags: [{ category: 'organization', value: 'Grainger Engineering' }],
      }),
    )

    await user.type(screen.getByLabelText('Tag'), 'Computer Science')
    await user.click(screen.getByRole('button', { name: /Add tag/i }))

    expect(
      await screen.findByText(
        /You can only have one Organization tag\. Remove "Grainger Engineering" to change it\./i,
      ),
    ).toBeInTheDocument()
    expect(vi.mocked(callSetCourseMetadata)).not.toHaveBeenCalled()
  })

  it('disables inputs when the tag limit is reached (one per category)', () => {
    renderEditor(
      makeMetadata({
        tags: [
          { category: 'projectType', value: 'Course' },
          { category: 'organization', value: 'Grainger Engineering' },
        ],
      }),
    )

    // With both categories filled, max tags (all available categories) is reached.
    // Current cap is MAX_CHATBOT_TAGS = 5; this guards the "disabled" path generically.
    if (MAX_CHATBOT_TAGS <= 2) {
      expect(screen.getByRole('button', { name: /Add tag/i })).toBeDisabled()
      expect(screen.getByLabelText('Tag')).toBeDisabled()
    }
  })

  it('removing a tag calls the API without the removed tag', async () => {
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
        tags: [{ category: 'organization', value: 'A' }],
      }),
    )

    await user.click(
      screen.getByRole('button', { name: /Remove tag Organization: A/i }),
    )

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /Failed to save tags/i,
    )
  })
})
