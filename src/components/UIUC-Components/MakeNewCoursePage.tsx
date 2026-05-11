import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { useMemo, useRef, useState } from 'react'

import { Card, Flex, Title } from '@mantine/core'
import { Button } from '@/components/shadcn/ui/button'
import { LoaderCircle } from 'lucide-react'
import { useDebouncedValue } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createProject } from '~/utils/apiUtils'
import { fetchCourseMetadata } from '~/utils/apiUtils'
import { type CourseMetadata } from '~/types/courseMetadata'
import { ChatbotsGlobalNav } from './chatbots-hub/ChatbotsGlobalNav'
import UploadNotification, { type FileUpload } from './UploadNotification'

import StepCreate from './MakeNewCoursePageSteps/StepCreate'
import StepUpload from './MakeNewCoursePageSteps/StepUpload'
import StepLLM from './MakeNewCoursePageSteps/StepLLM'
import StepPrompt from './MakeNewCoursePageSteps/StepPrompt'
import StepBranding from './MakeNewCoursePageSteps/StepBranding'
import StepSuccess from './MakeNewCoursePageSteps/StepSuccess'
import { useAuth } from 'react-oidc-context'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import GlobalFooter from './GlobalFooter'

/**
 * Build a safe relative URL for navigating to a project's chat page.
 * Guards against open-redirect attacks by ensuring the project name
 * is converted into a single, safe path segment and cannot influence
 * the host, protocol, or parent path.
 */
const buildProjectChatPath = (name: string): string => {
  // Normalize to string and trim whitespace
  const raw = String(name || '').trim()

  // Allow only URL-safe characters for a single path segment:
  // letters, numbers, dash, underscore. Replace others with '-'.
  let safeSegment = raw.replace(/[^a-zA-Z0-9_-]+/g, '-')

  // Remove any leading dots or slashes to avoid path traversal or
  // protocol-relative URL patterns like "../" or "//evil.com".
  safeSegment = safeSegment.replace(/^[./\\]+/, '')

  // Fallback to a safe placeholder if nothing remains
  if (!safeSegment) {
    return '/chat'
  }

  return `/${safeSegment}/chat`
}

const MakeNewCoursePage = ({
  project_name,
  current_user_email,
  is_new_course = true,
  project_description,
}: {
  project_name: string
  current_user_email: string
  is_new_course?: boolean
  project_description?: string
}) => {
  const queryClient = useQueryClient()
  const router = useRouter()
  const auth = useAuth()
  const user_id = auth.user?.profile.email || current_user_email

  const [projectName, setProjectName] = useState(project_name || '')
  const [projectDescription, setProjectDescription] = useState(
    project_description || '',
  )
  const [isLoading, setIsLoading] = useState(false)
  const [hasCreatedProject, setHasCreatedProject] = useState(false)
  const [uploadFiles, setUploadFiles] = useState<FileUpload[]>([])
  const [currentStep, setStep] = useState(0)

  const useIllinoisChatConfig = useMemo(() => {
    return process.env.NEXT_PUBLIC_USE_ILLINOIS_CHAT_CONFIG === 'True'
  }, [])

  // Debounce project name input to avoid excessive API calls
  const [debouncedProjectName] = useDebouncedValue(projectName, 1000)

  // Check project name availability using React Query
  const { data: courseExists, isFetching: isCheckingAvailability } =
    useQuery<boolean>({
      queryKey: ['projectNameAvailability', debouncedProjectName],
      queryFn: async () => {
        if (!debouncedProjectName || debouncedProjectName.length === 0) {
          return false
        }
        const response = await fetch(
          `/api/UIUC-api/getCourseExists?course_name=${encodeURIComponent(
            debouncedProjectName,
          )}`,
        )
        if (!response.ok) {
          throw new Error('Failed to check project name availability')
        }
        return response.json() as Promise<boolean>
      },
      enabled: debouncedProjectName.length > 0 && is_new_course,
      retry: 1,
    })

  // Calculate availability: course exists = not available
  const isCourseAvailable =
    debouncedProjectName.length === 0
      ? undefined
      : courseExists === false
        ? true
        : courseExists === true
          ? false
          : undefined

  // Check if we're waiting for debounce or API response
  const isWaitingForAvailabilityCheck =
    (projectName !== debouncedProjectName && projectName.length > 0) ||
    isCheckingAvailability

  const handleSetUploadFiles = (
    updateFn: React.SetStateAction<FileUpload[]>,
  ) => {
    setUploadFiles(updateFn)
  }

  const handleCloseNotification = () => {
    setUploadFiles([])
  }

  // Check if any files are still in "uploading" status (not yet ingesting)
  const hasFilesUploading = uploadFiles.some(
    (file) => file.status === 'uploading',
  )

  // Check if we're on a step that should block navigation when uploading
  const isUploadStep = currentStep === 1 // StepUpload (combined with Import)
  const shouldBlockNavigation = isUploadStep && hasFilesUploading

  const allSteps = [
    <StepCreate
      key="create"
      project_name={projectName}
      project_description={projectDescription}
      is_new_course={!hasCreatedProject}
      isCourseAvailable={isCourseAvailable}
      isCheckingAvailability={isWaitingForAvailabilityCheck}
      onUpdateName={setProjectName}
      onUpdateDescription={setProjectDescription}
    />,
    <StepSuccess
      key="success"
      project_name={projectName}
      onContinueDesigning={() => setStep((s) => s + 1)}
    />,
    <StepUpload
      key="upload"
      project_name={projectName}
      setUploadFiles={handleSetUploadFiles}
      courseMetadata={
        queryClient.getQueryData(['courseMetadata', projectName]) as
          | CourseMetadata
          | undefined
      }
    />,
    <StepBranding
      key="branding"
      project_name={projectName}
      user_id={user_id}
    />,
    <StepLLM key="llm" project_name={projectName} />,
    <StepPrompt key="prompt" project_name={projectName} />,
  ]

  const totalSteps = allSteps.length
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === totalSteps - 1

  const stepNames = [
    'Create a new chatbot',
    'Success',
    'Add Content',
    'Branding',
    'AI Models',
    'Prompt',
  ]

  const [stepAnnouncement, setStepAnnouncement] = useState('')
  const stepContainerRef = useRef<HTMLDivElement>(null)

  const goToPreviousStep = () => {
    setStep((prevStep) => {
      const next = Math.max(prevStep - 1, 0)
      setStepAnnouncement(
        `Step ${next + 1} of ${totalSteps}: ${stepNames[next]}`,
      )
      return next
    })
  }

  const goToNextStep = () => {
    setStep((prevStep) => {
      const next = Math.min(prevStep + 1, totalSteps - 1)
      setStepAnnouncement(
        `Step ${next + 1} of ${totalSteps}: ${stepNames[next]}`,
      )
      return next
    })
  }

  const handleSubmit = async (
    project_name: string,
    project_description: string | undefined,
    current_user_email: string,
    is_private = false,
  ): Promise<boolean> => {
    setIsLoading(true)
    try {
      const result = await createProject(
        project_name,
        project_description,
        current_user_email,
        is_private,
      )
      if (!result) {
        return false
      }

      if (is_new_course) {
        try {
          const metadata = (await fetchCourseMetadata(
            project_name,
          )) as CourseMetadata
          queryClient.setQueryData(['courseMetadata', project_name], metadata)
        } catch (metadataError) {
          console.error(
            'Error fetching course metadata after creation:',
            metadataError,
          )
          const fallbackMetadata: CourseMetadata = {
            is_frozen: false,
            is_private: Boolean(is_private),
            course_owner: current_user_email,
            course_admins: [],
            approved_emails_list: [],
            example_questions: undefined,
            banner_image_s3: undefined,
            course_intro_message: undefined,
            system_prompt: undefined,
            openai_api_key: undefined,
            disabled_models: undefined,
            project_description,
            documentsOnly: undefined,
            guidedLearning: undefined,
            systemPromptOnly: undefined,
            vector_search_rewrite_disabled: undefined,
            allow_logged_in_users: undefined,
          }
          queryClient.setQueryData(
            ['courseMetadata', project_name],
            fallbackMetadata,
          )
        }
      }
      return true
    } catch (error) {
      console.error('Error creating project:', error)
      // Handle specific error cases
      const err = error as Error & { status?: number; error?: string }
      if (err.status === 409) {
        // Project name already exists - race condition caught by server
        notifications.show({
          title: 'Project name already taken',
          message:
            err.message ||
            `A project with the name "${project_name}" already exists. Please choose a different name.`,
          color: 'red',
          autoClose: 5000,
        })
        // Invalidate the query to refresh availability check
        // This will trigger a re-check of the project name
        queryClient.invalidateQueries({
          queryKey: ['projectNameAvailability', project_name],
        })
      } else {
        // Other errors
        notifications.show({
          title: 'Failed to create project',
          message:
            err.message ||
            'An error occurred while creating the project. Please try again.',
          color: 'red',
          autoClose: 5000,
        })
      }
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // If Illinois Chat config is NOT enabled, disable UI-based project creation
  // if (!useIllinoisChatConfig) {
  // {
  //   return (
  // <>
  // <Navbar isPlain={false} />
  // <Head>
  // <title>{project_name || 'New Project'} — Illinois Chat</title>
  // <meta
  // name="description"
  // content="Create a new project on UIUC.chat."
  // />
  // <link rel="icon" href="/favicon.ico" />
  // </Head>
  // <main
  // id="main-content"
  // tabIndex={-1}
  // className="course-page-main min-w-screen flex min-h-screen flex-col items-center"
  // >
  // <h1 className="sr-only">Create New Project</h1>
  // <div className="flex w-full flex-1 flex-col items-center justify-center py-0 pb-20">
  // <Card
  // shadow="xs"
  // padding="none"
  // withBorder={false}
  // radius="xl"
  // className="w-[96%] md:w-[90%] lg:max-w-[750px]"
  // style={{ backgroundColor: 'var(--background-faded)' }}
  // >
  // <Flex direction="column" className="p-6 sm:p-10">
  // <Title
  // order={3}
  // className={`${montserrat_heading.variable} font-montserratHeading text-[--foreground]`}
  // >
  // New project creation is currently disabled
  // </Title>
  // <div
  // className={`mt-3 text-sm sm:text-base ${montserrat_paragraph.variable} font-montserratParagraph text-[--foreground]`}
  // >
  // We’re getting ready to transition to{' '}
  // <a
  // href="https://chat.illinois.edu"
  // className="text-[--illinois-orange] underline"
  // target="_blank"
  // rel="noopener noreferrer"
  // >
  // chat.illinois.edu
  // </a>
  // . You can create new chatbots there. If you have any
  // questions, please email us at{' '}
  // <a
  // href="mailto:genaisupport@mx.uillinois.edu"
  // className="text-[--illinois-orange] underline"
  // >
  // genaisupport@mx.uillinois.edu
  // </a>
  // .
  // </div>
  // </Flex>
  // </Card>
  // </div>
  // <GlobalFooter />
  // </main>
  // </>
  // )
  // }

  return (
    <>
      <ChatbotsGlobalNav />
      <Head>
        <title>{project_name || 'New Project'} — Illinois Chat</title>
        <meta name="description" content="Create a new project on UIUC.chat." />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main
        id="main-content"
        tabIndex={-1}
        className="course-page-main flex min-h-screen w-full flex-col items-center px-4 pb-28 pt-20 sm:px-6"
      >
        <h1 className="sr-only">Create New Project</h1>
        <div className="flex w-full flex-1 flex-col items-center py-6">
          <Card
            padding="none"
            withBorder={true}
            radius="lg"
            className="my-auto flex w-full max-w-[720px] flex-col !border-[--dashboard-border] bg-[--background] px-6 py-8 text-[--foreground] sm:px-10 sm:py-10"
          >
            <div
              ref={stepContainerRef}
              className="step_container flex min-h-[22rem] flex-col"
              aria-label={`Step ${currentStep + 1} of ${totalSteps}: ${
                stepNames[currentStep]
              }`}
            >
              {allSteps[currentStep]}
            </div>
            <div className="sr-only" aria-live="polite" aria-atomic="true">
              {stepAnnouncement}
            </div>
            <UploadNotification
              files={uploadFiles}
              onClose={handleCloseNotification}
              projectName={projectName}
            />
          </Card>
        </div>

        {/* Sticky Footer Navigation */}
        <nav
          aria-label="Wizard navigation"
          className="fixed bottom-0 left-0 right-0 z-40 border-t border-[--dashboard-border] bg-[--background]"
        >
          <div className="mx-auto flex max-w-[720px] items-center justify-between px-4 py-3 sm:px-6">
            <Button
              variant="outline"
              size="sm"
              className="hover:bg-[--illinois-blue]/10 border-[--illinois-blue] text-[--illinois-blue] hover:text-[--illinois-blue]"
              onClick={goToPreviousStep}
              disabled={isFirstStep || shouldBlockNavigation}
              aria-label="Go to previous step"
            >
              Back
            </Button>

            {/* Pagination Dots */}
            <div
              className="flex items-center gap-2"
              role="list"
              aria-label="Wizard progress"
            >
              {allSteps.map((_, index) => (
                <div
                  key={index}
                  role="listitem"
                  aria-label={`Step ${index + 1} of ${totalSteps}: ${
                    stepNames[index]
                  }${currentStep === index ? ' (current)' : ''}`}
                  aria-current={currentStep === index ? 'step' : undefined}
                  className={`rounded-full bg-[--illinois-blue] transition-all duration-200 ${currentStep === index ? 'h-2.5 w-2.5 opacity-100' : 'h-2 w-2 opacity-25'}`}
                />
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="hover:bg-[--illinois-blue]/10 border-[--illinois-blue] text-[--illinois-blue] hover:text-[--illinois-blue]"
              aria-label={
                isLastStep
                  ? 'Start chatting with your new chatbot'
                  : 'Continue to next step'
              }
              onClick={async () => {
                if (currentStep === 0) {
                  if (!hasCreatedProject) {
                    if (
                      projectName === '' ||
                      isLoading ||
                      !isCourseAvailable ||
                      isWaitingForAvailabilityCheck
                    ) {
                      return
                    }

                    const isCreated = await handleSubmit(
                      projectName,
                      projectDescription,
                      current_user_email,
                      useIllinoisChatConfig,
                    )

                    if (!isCreated) {
                      return
                    }

                    setHasCreatedProject(true)
                  }
                }

                if (isLastStep) {
                  const chatPath = buildProjectChatPath(projectName)
                  router.push(chatPath)
                } else {
                  goToNextStep()
                }
              }}
              disabled={
                shouldBlockNavigation ||
                (currentStep === 0 &&
                  !hasCreatedProject &&
                  (projectName === '' ||
                    !isCourseAvailable ||
                    isLoading ||
                    isWaitingForAvailabilityCheck))
              }
            >
              {isLoading && currentStep === 0 && (
                <LoaderCircle
                  className="size-4 animate-spin"
                  aria-hidden="true"
                />
              )}
              {isLoading && currentStep === 0 && (
                <span className="sr-only">Creating project...</span>
              )}
              {isLastStep ? 'Start Chatting' : 'Continue'}
            </Button>
          </div>
        </nav>
      </main>
    </>
  )
}

export default MakeNewCoursePage
