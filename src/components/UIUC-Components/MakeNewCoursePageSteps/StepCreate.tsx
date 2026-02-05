import { useEffect, useState } from 'react'

import { LoaderCircle } from 'lucide-react'

import {
  FormInput,
  type FormInputStatus,
} from '@/components/shadcn/ui/form-input'

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

  const getNameStatus = (): FormInputStatus => {
    if (!projectName) return 'default'
    if (isCheckingAvailability) return 'loading'
    if (isCourseAvailable) return 'success'
    return 'error'
  }

  return (
    <>
      <div className="step">
        <HeaderStepNavigation
          project_name="" //don't send project name for create page
          title="Create a new chatbot"
          description="What's it all about?"
        />

        <div className="step_content mt-6">
          <FormInput
            as="input"
            value={projectName}
            label="Name"
            required
            placeholder="example-project"
            description="The name will be used as part of the unique url across the entire campus chatbots."
            className="mt-4"
            autoComplete="off"
            disabled={!is_new_course}
            autoFocus
            status={getNameStatus()}
            rightSlot={
              isCheckingAvailability ? (
                <LoaderCircle className="size-4 animate-spin text-[--foreground-faded]" />
              ) : undefined
            }
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
                    <LoaderCircle className="size-3 animate-spin" />
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

          <FormInput
            as="textarea"
            value={projectDescription}
            label="Description"
            placeholder="Describe your project, goals, expected impact etc...."
            className="mt-6"
            minRows={4}
            onChange={(e) => setProjectDescription(e.target.value)}
          />
        </div>
      </div>
    </>
  )
}

export default StepCreate
