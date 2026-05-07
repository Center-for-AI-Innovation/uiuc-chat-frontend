import { useEffect, useState } from 'react'

import { CheckCircle, LoaderCircle, XCircle } from 'lucide-react'

import {
  FormInput,
  type FormInputStatus,
} from '@/components/shadcn/ui/form-input'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/shadcn/ui/tooltip'

import HeaderStepNavigation from './HeaderStepNavigation'

const StepCreate = ({
  project_name,
  is_new_course = true,
  project_description,
  isCourseAvailable,
  isCourseNameValid,
  isCheckingAvailability,

  onUpdateName,
  onUpdateDescription,
}: {
  project_name: string
  is_new_course?: boolean
  project_description?: string
  isCourseAvailable?: boolean
  isCourseNameValid?: boolean
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
    <div className="step">
      <HeaderStepNavigation
        project_name=""
        title="Create a new chatbot"
        description="Give your chatbot a name and tell us what it's about."
      />

      <div className="step_content space-y-5">
        <TooltipProvider>
          <Tooltip
            open={
              !isCheckingAvailability &&
              isCourseAvailable === false &&
              projectName.length > 0
            }
          >
            <TooltipTrigger asChild>
              <FormInput
                as="input"
                value={projectName}
                label="Name"
                required
                placeholder="my-awesome-chatbot"
                description="This becomes part of your chatbot's unique URL."
                autoComplete="off"
                disabled={!is_new_course}
                autoFocus
                status={getNameStatus()}
                rightSlot={
                  isCheckingAvailability ? (
                    <span role="status">
                      <LoaderCircle
                        className="size-4 animate-spin text-[--foreground-faded]"
                        aria-hidden="true"
                      />
                      <span className="sr-only">
                        Checking name availability...
                      </span>
                    </span>
                  ) : !isCourseNameValid && projectName ? (
                    <span role="status">
                      <XCircle
                        className="size-4 text-red-500"
                        aria-hidden="true"
                      />
                      <span className="sr-only">Name is invalid</span>
                    </span>
                  ) : isCourseAvailable && projectName ? (
                    <span role="status">
                      <CheckCircle
                        className="size-4 text-green-500"
                        aria-hidden="true"
                      />
                      <span className="sr-only">Name is available</span>
                    </span>
                  ) : isCourseAvailable === false && projectName ? (
                    <span role="status">
                      <XCircle
                        className="size-4 text-red-500"
                        aria-hidden="true"
                      />
                      <span className="sr-only">Name is already taken</span>
                    </span>
                  ) : undefined
                }
                onInput={(e) =>
                  setProjectName(
                    (e.target as HTMLInputElement).value.replaceAll(' ', '-'),
                  )
                }
              />
            </TooltipTrigger>
            <TooltipContent
              side="right"
              className="border-red-500 bg-red-500 text-white"
            >
              {isCourseNameValid
                ? 'This name is already taken.'
                : 'This name is invalid.'}{' '}
              Please choose a different name.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <FormInput
          as="textarea"
          value={projectDescription}
          label="Description"
          placeholder="Describe your chatbot's purpose, target audience, and goals..."
          minRows={4}
          onChange={(e) => setProjectDescription(e.target.value)}
        />
      </div>
    </div>
  )
}

export default StepCreate
