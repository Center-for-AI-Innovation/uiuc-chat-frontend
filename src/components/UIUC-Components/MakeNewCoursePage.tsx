import Head from 'next/head'
import React, { useMemo, useState } from 'react'

import { Button, Card, Flex, Title } from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { useQueryClient } from '@tanstack/react-query'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import { useCreateProjectMutation } from '~/hooks/queries/useCreateProject'
import { type CourseMetadata } from '~/types/courseMetadata'
import Navbar from './navbars/Navbar'
import UploadNotification, { type FileUpload } from './UploadNotification'

import StepCreate from './MakeNewCoursePageSteps/StepCreate'
import StepUpload from './MakeNewCoursePageSteps/StepUpload'
import StepLLM from './MakeNewCoursePageSteps/StepLLM'
import StepPrompt from './MakeNewCoursePageSteps/StepPrompt'
import StepBranding from './MakeNewCoursePageSteps/StepBranding'
import StepSuccess from './MakeNewCoursePageSteps/StepSuccess'
import { useAuth } from 'react-oidc-context'
import { useFetchCourseMetadata } from '~/hooks/queries/useFetchCourseMetadata'
import { useFetchCourseExists } from '~/hooks/queries/useFetchCourseExists'
import GlobalFooter from './GlobalFooter'

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
  const auth = useAuth()
  const user_id = auth.user?.profile.email || current_user_email

  const [projectName, setProjectName] = useState(project_name || '')
  const [projectDescription, setProjectDescription] = useState(
    project_description || '',
  )
  const createProjectMutation = useCreateProjectMutation()
  const [isLoading, setIsLoading] = useState(false)
  const [hasCreatedProject, setHasCreatedProject] = useState(false)
  const [uploadFiles, setUploadFiles] = useState<FileUpload[]>([])
  const [currentStep, setStep] = useState(0)

  const { refetch: refetchCourseMetadata } = useFetchCourseMetadata({
    courseName: projectName,
    enabled: false,
  })

  const useIllinoisChatConfig = useMemo(() => {
    return process.env.NEXT_PUBLIC_USE_ILLINOIS_CHAT_CONFIG === 'True'
  }, [])

  // Debounce project name input to avoid excessive API calls
  const [debouncedProjectName] = useDebouncedValue(projectName, 500)

  // Check project name availability using React Query
  const { data: courseExists, isFetching: isCheckingAvailability } =
    useFetchCourseExists({
      courseName: debouncedProjectName,
      enabled: debouncedProjectName.length > 0 && is_new_course,
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
    <StepLLM key="llm" project_name={projectName} />,
    <StepPrompt key="prompt" project_name={projectName} />,
    <StepBranding
      key="branding"
      project_name={projectName}
      user_id={user_id}
    />,
    <StepSuccess key="success" project_name={projectName} />,
  ]

  const totalSteps = allSteps.length
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === totalSteps - 1

  const goToPreviousStep = () => {
    setStep((prevStep) => Math.max(prevStep - 1, 0))
  }

  const goToNextStep = () => {
    setStep((prevStep) => Math.min(prevStep + 1, totalSteps - 1))
  }

  const handleSubmit = async (
    project_name: string,
    project_description: string | undefined,
    current_user_email: string,
    is_private = false,
  ): Promise<boolean> => {
    setIsLoading(true)
    try {
      const result = await createProjectMutation.mutateAsync({
        project_name,
        project_description,
        project_owner_email: current_user_email,
        is_private,
      })
      if (!result) {
        return false
      }

      if (is_new_course) {
        try {
          await refetchCourseMetadata({ throwOnError: true })
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
          queryKey: ['courseExists', project_name],
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
  if (!useIllinoisChatConfig) {
    return (
      <>
        <Navbar isPlain={false} />
        <Head>
          <title>{project_name}</title>
          <meta
            name="description"
            content="Create a new project on UIUC.chat."
          />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <main className="course-page-main min-w-screen flex min-h-screen flex-col items-center">
          <div className="flex w-full flex-1 flex-col items-center justify-center py-0 pb-20">
            <Card
              shadow="xs"
              padding="none"
              withBorder={false}
              radius="xl"
              className="w-[96%] md:w-[90%] lg:max-w-[750px]"
              style={{ backgroundColor: 'var(--background-faded)' }}
            >
              <Flex direction="column" className="p-6 sm:p-10">
                <Title
                  order={3}
                  className={`${montserrat_heading.variable} font-montserratHeading text-[--foreground]`}
                >
                  New project creation is currently disabled
                </Title>
                <div
                  className={`mt-3 text-sm sm:text-base ${montserrat_paragraph.variable} font-montserratParagraph text-[--foreground]`}
                >
                  We’re getting ready to transition to{' '}
                  <a
                    href="https://chat.illinois.edu"
                    className="text-[--illinois-orange] underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    chat.illinois.edu
                  </a>
                  . You can create new chatbots there. If you have any
                  questions, please email us at{' '}
                  <a
                    href="mailto:genaisupport@mx.uillinois.edu"
                    className="text-[--illinois-orange] underline"
                  >
                    genaisupport@mx.uillinois.edu
                  </a>
                  .
                </div>
              </Flex>
            </Card>
          </div>
          <GlobalFooter />
        </main>
      </>
    )
  }

  return (
    <>
      <Navbar isPlain={false} />
      <Head>
        <title>{project_name}</title>
        <meta name="description" content="Create a new project on UIUC.chat." />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main
        className="course-page-main min-w-screen flex min-h-screen flex-col items-center"
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          padding: '1rem',
        }}
      >
        {/* TODO change wrapper and card mt- settings to not have to skip past the top header...will require change to global nav and page structure  */}
        <div className="mt-12 flex w-full flex-1 flex-col items-center justify-start py-0 pb-20">
          <Card
            padding="none"
            withBorder={true}
            radius="md"
            className="mt-16 w-[96%] !border-[--dashboard-border] bg-[--background] p-8 text-[--foreground] md:w-[90%] lg:max-w-[860px]"
          >
            <div className="step_container min-h-[16rem]">
              {allSteps[currentStep]}
            </div>
            <UploadNotification
              files={uploadFiles}
              onClose={handleCloseNotification}
              projectName={projectName}
            />
          </Card>
        </div>

        {/* Sticky Footer Navigation */}
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[--dashboard-border] bg-[--background]">
          <div className="mx-auto flex max-w-[860px] items-center justify-between px-4 py-4">
            <Button
              size="sm"
              radius="sm"
              classNames={componentClasses.button}
              onClick={goToPreviousStep}
              disabled={isFirstStep || shouldBlockNavigation}
            >
              Back
            </Button>

            {/* Pagination Dots */}
            <div className="flex items-center gap-2">
              {allSteps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 w-2 rounded-full transition-colors ${
                    currentStep === index ? 'bg-[#13294B]' : 'bg-[#13294B]/40'
                  }`}
                />
              ))}
            </div>

            <Button
              size="sm"
              radius="sm"
              className={isLastStep ? 'opacity-0' : ''}
              classNames={componentClasses.buttonPrimary}
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

                if (!isLastStep) {
                  goToNextStep()
                }
              }}
              disabled={
                isLastStep ||
                shouldBlockNavigation ||
                (currentStep === 0 &&
                  !hasCreatedProject &&
                  (projectName === '' ||
                    !isCourseAvailable ||
                    isLoading ||
                    isWaitingForAvailabilityCheck))
              }
              loading={isLoading && currentStep === 0}
            >
              Continue
            </Button>
          </div>
        </div>
      </main>
    </>
  )
}

const componentClasses = {
  button: {
    root: `
      !text-[#13294B]
      bg-transparent
      border-[#13294B]

      hover:!text-[#13294B]
      hover:bg-[#13294B]/10
      hover:border-[#13294B]

      disabled:bg-transparent
      disabled:border-[--button-disabled]
      disabled:!text-[--button-disabled-text-color]
    `,
  },

  buttonPrimary: {
    root: `
      !text-white
      bg-[#13294B]

      hover:!text-white
      hover:bg-[#13294B]/90

      disabled:bg-[#13294B]/50
      disabled:!text-white/50
    `,
  },
}

export default MakeNewCoursePage
