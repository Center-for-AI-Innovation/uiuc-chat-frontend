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

const PROJECT_TYPE_CHIP = /^project_type:$/i
const ORGANIZATION_CHIP = /^organization:$/i

describe('ChatbotTagsEditor', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the section heading and empty-state copy', () => {
    renderEditor()
    expect(screen.getByText('Tags')).toBeInTheDocument()
    expect(screen.getByText('No tags yet.')).toBeInTheDocument()
  })

  it('renders the free-text input and both picker chips by default', () => {
    renderEditor()
    expect(screen.getByLabelText('Tag')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: PROJECT_TYPE_CHIP }),
    ).toHaveAttribute('aria-expanded', 'false')
    expect(
      screen.getByRole('button', { name: ORGANIZATION_CHIP }),
    ).toHaveAttribute('aria-expanded', 'false')
    // Pickers are collapsed initially.
    expect(
      screen.queryByRole('group', { name: /Project type options/i }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('group', { name: /Organization options/i }),
    ).not.toBeInTheDocument()
  })

  it('renders tag badges identically regardless of category', () => {
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
    expect(screen.queryByText(/Project Type:/)).not.toBeInTheDocument()
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

  it('clicking the project_type chip opens the hardcoded project-type picker', async () => {
    const user = userEvent.setup()
    renderEditor()

    await user.click(screen.getByRole('button', { name: PROJECT_TYPE_CHIP }))

    const listbox = await screen.findByRole('group', {
      name: /Project type options/i,
    })
    expect(listbox).toBeInTheDocument()
    for (const value of [
      'Course',
      'Department',
      'Student Org.',
      'Entertainment',
    ]) {
      expect(
        screen.getByRole('button', {
          name: new RegExp(`Add project type ${value}`, 'i'),
        }),
      ).toBeInTheDocument()
    }
  })

  it('picking a project_type value adds it as a projectType tag and closes the picker', async () => {
    const user = userEvent.setup()
    const { callSetCourseMetadata } = await import('~/utils/apiUtils')
    renderEditor()

    await user.click(screen.getByRole('button', { name: PROJECT_TYPE_CHIP }))
    await user.click(
      screen.getByRole('button', { name: /Add project type Course/i }),
    )

    await waitFor(() => {
      expect(vi.mocked(callSetCourseMetadata)).toHaveBeenCalledWith(
        'TestProject',
        expect.objectContaining({
          tags: [{ category: 'projectType', value: 'Course' }],
        }),
      )
    })
    expect(
      screen.queryByRole('group', { name: /Project type options/i }),
    ).not.toBeInTheDocument()
  })

  it('disables the project_type chip when one project-type tag already exists', () => {
    renderEditor(
      makeMetadata({
        tags: [{ category: 'projectType', value: 'Course' }],
      }),
    )
    expect(
      screen.getByRole('button', { name: PROJECT_TYPE_CHIP }),
    ).toBeDisabled()
  })

  it('clicking the organization chip opens the hardcoded organization picker', async () => {
    const user = userEvent.setup()
    renderEditor()

    await user.click(screen.getByRole('button', { name: ORGANIZATION_CHIP }))

    const listbox = await screen.findByRole('group', {
      name: /Organization options/i,
    })
    expect(listbox).toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: /Add organization Grainger Engineering/i,
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: /Add organization Computer Science/i,
      }),
    ).toBeInTheDocument()
  })

  it('picking an organization value adds it as an organization tag and closes the picker', async () => {
    const user = userEvent.setup()
    const { callSetCourseMetadata } = await import('~/utils/apiUtils')
    renderEditor()

    await user.click(screen.getByRole('button', { name: ORGANIZATION_CHIP }))
    await user.click(
      screen.getByRole('button', {
        name: /Add organization Grainger Engineering/i,
      }),
    )

    await waitFor(() => {
      expect(vi.mocked(callSetCourseMetadata)).toHaveBeenCalledWith(
        'TestProject',
        expect.objectContaining({
          tags: [{ category: 'organization', value: 'Grainger Engineering' }],
        }),
      )
    })
    expect(
      screen.queryByRole('group', { name: /Organization options/i }),
    ).not.toBeInTheDocument()
  })

  it('disables the organization chip when one organization tag already exists', () => {
    renderEditor(
      makeMetadata({
        tags: [{ category: 'organization', value: 'Grainger Engineering' }],
      }),
    )
    expect(
      screen.getByRole('button', { name: ORGANIZATION_CHIP }),
    ).toBeDisabled()
  })

  it('disables the free-text Add button when total tag cap is reached', () => {
    const generalTags = Array.from({ length: MAX_CHATBOT_TAGS }, (_, i) => ({
      category: 'general' as const,
      value: `tag-${i}`,
    }))
    renderEditor(makeMetadata({ tags: generalTags }))
    expect(screen.getByLabelText('Tag')).toBeDisabled()
    expect(screen.getByRole('button', { name: /^Add tag$/i })).toBeDisabled()
    expect(
      screen.getByRole('button', { name: PROJECT_TYPE_CHIP }),
    ).toBeDisabled()
    expect(
      screen.getByRole('button', { name: ORGANIZATION_CHIP }),
    ).toBeDisabled()
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
        tags: [{ category: 'general', value: 'A' }],
      }),
    )

    await user.click(screen.getByRole('button', { name: /Remove tag Tag: A/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /Failed to save tags/i,
    )
  })
})
