import React from 'react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import BrandingForm from '../BrandingForm'
import {
  renderWithProviders,
  createTestQueryClient,
} from '~/test-utils/renderWithProviders'
import type { CourseMetadata } from '~/types/courseMetadata'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('~/utils/apiUtils', () => ({
  callSetCourseMetadata: vi.fn(async () => true),
  uploadToS3: vi.fn(async () => 'https://s3.example.com/logo.png'),
}))

vi.mock('../SetExampleQuestions', () => ({
  default: ({ course_name }: { course_name: string }) => (
    <div data-testid="set-example-questions">{course_name}</div>
  ),
}))

async function getApiMocks() {
  const mod = await import('~/utils/apiUtils')
  return {
    callSetCourseMetadata: vi.mocked(mod.callSetCourseMetadata),
    uploadToS3: vi.mocked(mod.uploadToS3),
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PROJECT = 'test-project'
const USER_ID = 'user-123'

function makeCourseMetadata(
  overrides: Partial<CourseMetadata> = {},
): CourseMetadata {
  return {
    is_private: false,
    course_owner: 'owner@test.com',
    course_admins: [],
    approved_emails_list: [],
    example_questions: [],
    banner_image_s3: undefined,
    course_intro_message: undefined,
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
    ...overrides,
  }
}

function renderBrandingForm(metadata?: CourseMetadata) {
  const queryClient = createTestQueryClient()
  if (metadata) {
    queryClient.setQueryData(['courseMetadata', PROJECT], metadata)
  }
  return renderWithProviders(
    <BrandingForm project_name={PROJECT} user_id={USER_ID} />,
    { queryClient },
  )
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('BrandingForm', () => {
  beforeEach(async () => {
    const { callSetCourseMetadata, uploadToS3 } = await getApiMocks()
    callSetCourseMetadata.mockClear()
    callSetCourseMetadata.mockResolvedValue(true)
    uploadToS3.mockClear()
    uploadToS3.mockResolvedValue('https://s3.example.com/logo.png')
  })

  // -------------------------------------------------------------------------
  // Rendering — no cached metadata
  // -------------------------------------------------------------------------

  it('renders greeting section with empty textarea when no metadata cached', () => {
    renderBrandingForm()

    expect(screen.getByText('Greeting')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/enter a greeting/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/enter a greeting/i)).toHaveValue('')
  })

  it('renders the Update button disabled initially', () => {
    renderBrandingForm()

    const updateBtn = screen.getByRole('button', { name: /update/i })
    expect(updateBtn).toBeDisabled()
  })

  it('renders logo upload area with default text', () => {
    renderBrandingForm()

    expect(screen.getByText('Add a logo')).toBeInTheDocument()
    expect(screen.getByText(/select the logo to upload/i)).toBeInTheDocument()
  })

  it('does not render SetExampleQuestions when metadata is null', () => {
    renderBrandingForm()

    expect(
      screen.queryByTestId('set-example-questions'),
    ).not.toBeInTheDocument()
  })

  // -------------------------------------------------------------------------
  // Rendering — with cached metadata
  // -------------------------------------------------------------------------

  it('prefills greeting from cached metadata', () => {
    const metadata = makeCourseMetadata({
      course_intro_message: 'Hello, welcome!',
    })
    renderBrandingForm(metadata)

    expect(screen.getByPlaceholderText(/enter a greeting/i)).toHaveValue(
      'Hello, welcome!',
    )
  })

  it('shows check icon when greeting is already saved', () => {
    const metadata = makeCourseMetadata({
      course_intro_message: 'Hello!',
    })
    const { container } = renderBrandingForm(metadata)

    // The Check icon from lucide renders as an svg with a polyline/path
    const greetingSection = container.querySelector('.set_greeting')
    expect(greetingSection).toBeInTheDocument()
    // Check icon is rendered as an SVG
    const svgs = greetingSection?.querySelectorAll('svg')
    expect(svgs?.length).toBeGreaterThanOrEqual(1)
  })

  it('renders SetExampleQuestions when metadata is available', () => {
    const metadata = makeCourseMetadata()
    renderBrandingForm(metadata)

    expect(screen.getByTestId('set-example-questions')).toBeInTheDocument()
    expect(screen.getByTestId('set-example-questions')).toHaveTextContent(
      PROJECT,
    )
  })

  it('shows "Logo uploaded" and success icon when banner_image_s3 is set', () => {
    const metadata = makeCourseMetadata({
      banner_image_s3: 'https://s3.example.com/existing-logo.png',
    })
    renderBrandingForm(metadata)

    expect(screen.getByText('Logo uploaded')).toBeInTheDocument()
  })

  // -------------------------------------------------------------------------
  // Greeting interactions
  // -------------------------------------------------------------------------

  it('enables Update button after typing in the greeting', async () => {
    const metadata = makeCourseMetadata()
    renderBrandingForm(metadata)
    const user = userEvent.setup()

    const textarea = screen.getByPlaceholderText(/enter a greeting/i)
    await user.type(textarea, 'Hi there')

    const updateBtn = screen.getByRole('button', { name: /update/i })
    expect(updateBtn).toBeEnabled()
  })

  it('calls callSetCourseMetadata and disables button on successful save', async () => {
    const metadata = makeCourseMetadata()
    renderBrandingForm(metadata)
    const user = userEvent.setup()
    const { callSetCourseMetadata } = await getApiMocks()

    const textarea = screen.getByPlaceholderText(/enter a greeting/i)
    await user.type(textarea, 'Welcome!')

    const updateBtn = screen.getByRole('button', { name: /update/i })
    await user.click(updateBtn)

    await waitFor(() => {
      expect(callSetCourseMetadata).toHaveBeenCalledOnce()
    })

    expect(callSetCourseMetadata).toHaveBeenCalledWith(
      PROJECT,
      expect.objectContaining({ course_intro_message: 'Welcome!' }),
    )

    // Button should be disabled again after save
    expect(updateBtn).toBeDisabled()
  })

  it('does not update state when callSetCourseMetadata returns falsy', async () => {
    const metadata = makeCourseMetadata()
    renderBrandingForm(metadata)
    const user = userEvent.setup()
    const { callSetCourseMetadata } = await getApiMocks()
    callSetCourseMetadata.mockResolvedValueOnce(false as any)

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const textarea = screen.getByPlaceholderText(/enter a greeting/i)
    await user.type(textarea, 'Fail greeting')

    const updateBtn = screen.getByRole('button', { name: /update/i })
    await user.click(updateBtn)

    await waitFor(() => {
      expect(callSetCourseMetadata).toHaveBeenCalledOnce()
    })

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Error upserting'),
      PROJECT,
    )

    consoleSpy.mockRestore()
  })

  // -------------------------------------------------------------------------
  // Logo upload interactions
  // -------------------------------------------------------------------------

  it('uploads a logo file and shows success state', async () => {
    const metadata = makeCourseMetadata()
    renderBrandingForm(metadata)
    const user = userEvent.setup()
    const { uploadToS3 } = await getApiMocks()

    const fileInput = screen.getByLabelText('Upload logo')
    const file = new File(['logo-content'], 'my-logo.png', {
      type: 'image/png',
    })

    await user.upload(fileInput, file)

    await waitFor(() => {
      expect(uploadToS3).toHaveBeenCalledOnce()
    })

    expect(uploadToS3).toHaveBeenCalledWith(file, USER_ID, PROJECT)

    await waitFor(() => {
      expect(screen.getByText('my-logo.png')).toBeInTheDocument()
    })
  })

  it('shows error state when uploadToS3 returns null', async () => {
    const metadata = makeCourseMetadata()
    renderBrandingForm(metadata)
    const user = userEvent.setup()
    const { uploadToS3 } = await getApiMocks()
    uploadToS3.mockResolvedValueOnce(null as any)

    const fileInput = screen.getByLabelText('Upload logo')
    const file = new File(['bad'], 'bad-logo.png', { type: 'image/png' })

    await user.upload(fileInput, file)

    await waitFor(() => {
      expect(
        screen.getByText(/upload failed — click to retry/i),
      ).toBeInTheDocument()
    })
  })

  it('disables the upload button while uploading', async () => {
    const metadata = makeCourseMetadata()
    renderBrandingForm(metadata)
    const { uploadToS3 } = await getApiMocks()

    // Make upload hang so we can check the disabled state
    let resolveUpload!: (value: string) => void
    uploadToS3.mockReturnValueOnce(
      new Promise<string>((resolve) => {
        resolveUpload = resolve
      }),
    )

    const fileInput = screen.getByLabelText('Upload logo')
    const file = new File(['data'], 'logo.png', { type: 'image/png' })

    // Fire change event directly for synchronous control
    await userEvent.upload(fileInput, file)

    // The upload button should be disabled while uploading
    const uploadButton = screen
      .getByText('logo.png')
      .closest('button') as HTMLButtonElement
    expect(uploadButton).toBeDisabled()

    // Resolve the upload
    resolveUpload('https://s3.example.com/logo.png')

    await waitFor(() => {
      expect(uploadButton).toBeEnabled()
    })
  })

  it('clicking the upload button area triggers the hidden file input', async () => {
    const metadata = makeCourseMetadata()
    renderBrandingForm(metadata)
    const user = userEvent.setup()

    const uploadButton = screen
      .getByText(/select the logo to upload/i)
      .closest('button') as HTMLButtonElement
    expect(uploadButton).toBeInTheDocument()

    // Verify clicking opens the file dialog (file input click is called)
    const fileInput = screen.getByLabelText('Upload logo') as HTMLInputElement
    const clickSpy = vi.spyOn(fileInput, 'click')

    await user.click(uploadButton)
    expect(clickSpy).toHaveBeenCalled()

    clickSpy.mockRestore()
  })

  // -------------------------------------------------------------------------
  // Query cache subscription
  // -------------------------------------------------------------------------

  it('updates intro message when query cache changes', async () => {
    const metadata = makeCourseMetadata({
      course_intro_message: 'Initial',
    })
    const queryClient = createTestQueryClient()
    queryClient.setQueryData(['courseMetadata', PROJECT], metadata)

    renderWithProviders(
      <BrandingForm project_name={PROJECT} user_id={USER_ID} />,
      { queryClient },
    )

    expect(screen.getByPlaceholderText(/enter a greeting/i)).toHaveValue(
      'Initial',
    )

    // Simulate external cache update
    const updatedMetadata = makeCourseMetadata({
      course_intro_message: 'Updated externally',
    })
    queryClient.setQueryData(['courseMetadata', PROJECT], updatedMetadata)

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/enter a greeting/i)).toHaveValue(
        'Updated externally',
      )
    })
  })
})
