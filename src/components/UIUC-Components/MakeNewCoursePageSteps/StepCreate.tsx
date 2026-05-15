import { useEffect, useState } from 'react'

import { CheckCircle, LoaderCircle, XCircle } from 'lucide-react'

import {
  FormInput,
  type FormInputStatus,
} from '@/components/shadcn/ui/form-input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/shadcn/ui/tooltip'
import {
  CHATBOT_PROJECT_TYPES,
  COMMON_ORGANIZATIONS,
  type ChatbotProjectType,
} from '~/types/chatbotTags'

import HeaderStepNavigation from './HeaderStepNavigation'

// Sentinel for the "no selection" item, since Radix Select doesn't accept "".
const UNSET_VALUE = '__none__'

const StepCreate = ({
  project_name,
  is_new_course = true,
  project_description,
  project_type,
  organization,
  isCourseAvailable,
  isCheckingAvailability,

  onUpdateName,
  onUpdateDescription,
  onUpdateProjectType,
  onUpdateOrganization,
}: {
  project_name: string
  is_new_course?: boolean
  project_description?: string
  project_type?: ChatbotProjectType
  organization?: string
  isCourseAvailable?: boolean
  isCheckingAvailability?: boolean

  onUpdateName: (name: string) => void
  onUpdateDescription: (description: string) => void
  onUpdateProjectType?: (value: ChatbotProjectType | undefined) => void
  onUpdateOrganization?: (value: string | undefined) => void
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
              This name is already taken. Please choose a different name.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="step-create-project-type"
              className="text-sm font-medium text-[--foreground]"
            >
              Project Type{' '}
              <span className="font-normal text-[--foreground-faded]">
                (optional)
              </span>
            </label>
            <Select
              value={project_type ?? UNSET_VALUE}
              onValueChange={(value) =>
                onUpdateProjectType?.(
                  value === UNSET_VALUE
                    ? undefined
                    : (value as ChatbotProjectType),
                )
              }
            >
              <SelectTrigger
                id="step-create-project-type"
                aria-label="Project Type"
              >
                <SelectValue placeholder="Pick a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNSET_VALUE}>None</SelectItem>
                {CHATBOT_PROJECT_TYPES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-[--foreground-faded]">
              Helps people find your bot in the hub.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="step-create-organization"
              className="text-sm font-medium text-[--foreground]"
            >
              Organization{' '}
              <span className="font-normal text-[--foreground-faded]">
                (optional)
              </span>
            </label>
            <Select
              value={organization ?? UNSET_VALUE}
              onValueChange={(value) =>
                onUpdateOrganization?.(
                  value === UNSET_VALUE ? undefined : value,
                )
              }
            >
              <SelectTrigger
                id="step-create-organization"
                aria-label="Organization"
              >
                <SelectValue placeholder="Pick an organization" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNSET_VALUE}>None</SelectItem>
                {COMMON_ORGANIZATIONS.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-[--foreground-faded]">
              The college, department, or group running this bot.
            </p>
          </div>
        </div>

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
