import React from 'react'
import { describe, expect, it, vi, beforeAll, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('../HeaderStepNavigation', () => ({
  __esModule: true,
  default: ({ title, description }: any) => (
    <div data-testid="header">
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  ),
}))

// Radix Select relies on DOM methods jsdom doesn't implement. Polyfill the
// minimum needed so the listbox actually opens when the trigger is clicked.
beforeAll(() => {
  if (!HTMLElement.prototype.scrollIntoView) {
    HTMLElement.prototype.scrollIntoView = vi.fn()
  }
  if (!HTMLElement.prototype.hasPointerCapture) {
    HTMLElement.prototype.hasPointerCapture = vi
      .fn()
      .mockReturnValue(false) as any
  }
  if (!HTMLElement.prototype.releasePointerCapture) {
    HTMLElement.prototype.releasePointerCapture = vi.fn() as any
  }
})

import StepCreate from '../StepCreate'

describe('StepCreate', () => {
  const defaultProps = {
    project_name: '',
    is_new_course: true,
    project_description: '',
    isCourseAvailable: undefined as boolean | undefined,
    isCheckingAvailability: false,
    onUpdateName: vi.fn(),
    onUpdateDescription: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the header with title and description', () => {
    render(<StepCreate {...defaultProps} />)
    expect(screen.getByText('Create a new chatbot')).toBeInTheDocument()
    expect(
      screen.getByText("Give your chatbot a name and tell us what it's about."),
    ).toBeInTheDocument()
  })

  it('renders the name input with label and placeholder', () => {
    render(<StepCreate {...defaultProps} />)
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText('my-awesome-chatbot'),
    ).toBeInTheDocument()
  })

  it('renders the description textarea', () => {
    render(<StepCreate {...defaultProps} />)
    expect(
      screen.getByPlaceholderText(/describe your chatbot/i),
    ).toBeInTheDocument()
  })

  it('initializes with provided project_name', () => {
    render(<StepCreate {...defaultProps} project_name="my-project" />)
    const input = screen.getByDisplayValue('my-project')
    expect(input).toBeInTheDocument()
  })

  it('initializes with provided project_description', () => {
    render(
      <StepCreate {...defaultProps} project_description="A test project" />,
    )
    expect(screen.getByDisplayValue('A test project')).toBeInTheDocument()
  })

  it('calls onUpdateName when name input changes', async () => {
    const onUpdateName = vi.fn()
    render(<StepCreate {...defaultProps} onUpdateName={onUpdateName} />)

    const input = screen.getByPlaceholderText('my-awesome-chatbot')
    await userEvent.type(input, 'test')

    await waitFor(() => expect(onUpdateName).toHaveBeenCalledWith('test'))
  })

  it('replaces spaces with hyphens in project name', async () => {
    const onUpdateName = vi.fn()
    render(<StepCreate {...defaultProps} onUpdateName={onUpdateName} />)

    const input = screen.getByPlaceholderText('my-awesome-chatbot')
    await userEvent.type(input, 'my project')

    await waitFor(() => expect(onUpdateName).toHaveBeenCalledWith('my-project'))
  })

  it('calls onUpdateDescription when description changes', async () => {
    const onUpdateDescription = vi.fn()
    render(
      <StepCreate
        {...defaultProps}
        onUpdateDescription={onUpdateDescription}
      />,
    )

    const textarea = screen.getByPlaceholderText(/describe your chatbot/i)
    await userEvent.type(textarea, 'desc')

    await waitFor(() =>
      expect(onUpdateDescription).toHaveBeenCalledWith('desc'),
    )
  })

  it('disables name input when is_new_course is false', () => {
    render(<StepCreate {...defaultProps} is_new_course={false} />)
    const input = screen.getByPlaceholderText('my-awesome-chatbot')
    expect(input).toHaveAttribute('disabled')
  })

  // -------------------------------------------------------------------------
  // Status icons with screen reader text
  // -------------------------------------------------------------------------
  it('shows loading status when checking availability', () => {
    render(
      <StepCreate
        {...defaultProps}
        project_name="test"
        isCheckingAvailability={true}
      />,
    )
    expect(
      screen.getByText('Checking name availability...'),
    ).toBeInTheDocument()
  })

  it('shows available status when name is available', () => {
    render(
      <StepCreate
        {...defaultProps}
        project_name="test"
        isCourseAvailable={true}
        isCheckingAvailability={false}
      />,
    )
    expect(screen.getByText('Name is available')).toBeInTheDocument()
  })

  it('shows taken status when name is not available', () => {
    render(
      <StepCreate
        {...defaultProps}
        project_name="test"
        isCourseAvailable={false}
        isCheckingAvailability={false}
      />,
    )
    expect(screen.getByText('Name is already taken')).toBeInTheDocument()
  })

  it('renders error status icon when name is taken', () => {
    const { container } = render(
      <StepCreate
        {...defaultProps}
        project_name="test"
        isCourseAvailable={false}
        isCheckingAvailability={false}
      />,
    )
    // The error status icon and sr-only text are rendered
    expect(screen.getByText('Name is already taken')).toBeInTheDocument()
    // Status container has role="status"
    const statusEl = container.querySelector('[role="status"]')
    expect(statusEl).toBeInTheDocument()
  })

  it('does not show tooltip when name is available', () => {
    render(
      <StepCreate
        {...defaultProps}
        project_name="test"
        isCourseAvailable={true}
        isCheckingAvailability={false}
      />,
    )
    expect(
      screen.queryByText(/this name is already taken/i),
    ).not.toBeInTheDocument()
  })

  // -------------------------------------------------------------------------
  // Project type + organization selects (moved here from the tag editor).
  // -------------------------------------------------------------------------
  it('renders optional Project Type and Organization selects', () => {
    render(<StepCreate {...defaultProps} />)
    expect(
      screen.getByRole('combobox', { name: /^Project Type$/ }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('combobox', { name: /^Organization$/ }),
    ).toBeInTheDocument()
    // Both fields are labelled optional.
    expect(screen.getAllByText(/\(optional\)/i).length).toBeGreaterThanOrEqual(
      2,
    )
  })

  it('reflects the controlled project_type and organization values', () => {
    render(
      <StepCreate
        {...defaultProps}
        project_type="Course"
        organization="Grainger Engineering"
      />,
    )
    expect(
      screen.getByRole('combobox', { name: /^Project Type$/ }),
    ).toHaveTextContent('Course')
    expect(
      screen.getByRole('combobox', { name: /^Organization$/ }),
    ).toHaveTextContent('Grainger Engineering')
  })

  it('fires onUpdateProjectType when a project type is picked', async () => {
    const onUpdateProjectType = vi.fn()
    render(
      <StepCreate
        {...defaultProps}
        onUpdateProjectType={onUpdateProjectType}
      />,
    )

    await userEvent.click(
      screen.getByRole('combobox', { name: /^Project Type$/ }),
    )
    await userEvent.click(screen.getByRole('option', { name: 'Department' }))

    expect(onUpdateProjectType).toHaveBeenCalledWith('Department')
  })

  it('fires onUpdateOrganization when an organization is picked', async () => {
    const onUpdateOrganization = vi.fn()
    render(
      <StepCreate
        {...defaultProps}
        onUpdateOrganization={onUpdateOrganization}
      />,
    )

    await userEvent.click(
      screen.getByRole('combobox', { name: /^Organization$/ }),
    )
    await userEvent.click(
      screen.getByRole('option', { name: 'Computer Science' }),
    )

    expect(onUpdateOrganization).toHaveBeenCalledWith('Computer Science')
  })

  it('passes undefined when the user picks "None" to clear a selection', async () => {
    const onUpdateProjectType = vi.fn()
    render(
      <StepCreate
        {...defaultProps}
        project_type="Course"
        onUpdateProjectType={onUpdateProjectType}
      />,
    )

    await userEvent.click(
      screen.getByRole('combobox', { name: /^Project Type$/ }),
    )
    await userEvent.click(screen.getByRole('option', { name: 'None' }))

    expect(onUpdateProjectType).toHaveBeenCalledWith(undefined)
  })
})
