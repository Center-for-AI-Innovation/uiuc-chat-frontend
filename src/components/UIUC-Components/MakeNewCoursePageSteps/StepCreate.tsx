import { useEffect, useState } from 'react'

import { Loader, Textarea, TextInput } from '@mantine/core'

import HeaderStepNavigation from './HeaderStepNavigation'

const StepCreate = ({
  project_name,
  is_new_course = true,
  project_description,
  isCourseAvailable,
  isCheckingAvailability,

  onUpdateName,
  onUpdateDescription,
}: {
  project_name: string
  is_new_course?: boolean
  project_description?: string
  isCourseAvailable?: boolean
  isCheckingAvailability?: boolean

  onUpdateName: (name: string) => void
  onUpdateDescription: (description: string) => void
}) => {
  const [projectName, setProjectName] = useState(project_name || '')
  const [projectDescription, setProjectDescription] = useState(
    project_description || '',
  )

  useEffect(() => {
    onUpdateName(projectName)
  }, [projectName])

  useEffect(() => {
    onUpdateDescription(projectDescription)
  }, [projectDescription])

  return (
    <>
      <div className="step">
        <HeaderStepNavigation
          project_name="" //don't send project name for create page
          title="Create a new chatbot"
          description="What’s it all about?"
        />

        <div className="step_content mt-6">
          <TextInput
            type="text"
            value={projectName}
            label="Name"
            placeholder="example-project"
            description="The name will be used as part of the unique url across the entire campus chatbots."
            className="mt-4"
            classNames={componentClasses.input}
            autoComplete="off"
            data-lpignore="true"
            data-form-type="other"
            disabled={!is_new_course}
            radius={'md'}
            size={'md'}
            autoFocus
            withAsterisk
            onInput={(e) =>
              setProjectName(
                (e.target as HTMLInputElement).value.replaceAll(' ', '-'),
              )
            }
          />

          <div className="mt-1 hidden min-h-[1.35rem] text-sm">
            {projectName && (
              <div className="flex items-start gap-2">
                {/* NOTE: assuming this is the best / proper way to get the current server url */}
                <div>
                  {window.location.origin}/{projectName}
                </div>

                {isCheckingAvailability && (
                  <div className="flex items-center gap-1 text-[--foreground-faded]">
                    <Loader size="xs" />
                    <span>(checking...)</span>
                  </div>
                )}
                {!isCheckingAvailability &&
                  isCourseAvailable &&
                  projectName && (
                    <div className="text-green-500">(url available)</div>
                  )}
                {!isCheckingAvailability &&
                  (!isCourseAvailable || !projectName) && (
                    <div className="text-[--error]">(url not available)</div>
                  )}
              </div>
            )}
          </div>

          <div className="text-sm text-[--foreground-faded]"></div>

          <Textarea
            value={projectDescription}
            label="Description"
            placeholder="Describe your project, goals, expected impact etc...."
            description=""
            className="mt-6"
            classNames={componentClasses.input}
            radius={'md'}
            size={'md'}
            minRows={4}
            onChange={(e) => setProjectDescription(e.target.value)}
          />
        </div>
      </div>
    </>
  )
}

const componentClasses = {
  input: {
    label: 'font-semibold text-base text-[--foreground]',
    input: `
      mt-3
      px-3

      placeholder:text-[--foreground-faded]
      text-[--foreground] bg-[--background]

      border-[--foreground-faded] focus:border-[--foreground]
      overflow-ellipsis
    `,
    description: 'text-sm text-[--foreground-faded]',
  },
}

export default StepCreate
