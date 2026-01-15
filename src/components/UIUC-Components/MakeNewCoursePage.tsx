import Head from 'next/head'
import React, { useEffect, useMemo, useState } from 'react'

import {
  Button,
  Card,
  Flex,
  Group,
  Loader,
  Textarea,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { useQueryClient } from '@tanstack/react-query'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import router from 'next/router'
import { createProject } from '~/pages/api/UIUC-api/createProject'
import { fetchCourseMetadata } from '~/utils/apiUtils'
import { type CourseMetadata } from '~/types/courseMetadata'
import Navbar from './navbars/Navbar'
import UploadNotification, { type FileUpload } from './UploadNotification'

import StepCreate from './MakeNewCoursePageSteps/StepCreate'
import StepUpload from './MakeNewCoursePageSteps/StepUpload'
import StepLLM from './MakeNewCoursePageSteps/StepLLM'
import StepPrompt from './MakeNewCoursePageSteps/StepPrompt'
import StepBranding from './MakeNewCoursePageSteps/StepBranding'
import StepSuccess from './MakeNewCoursePageSteps/StepSuccess'

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
  const isSmallScreen = useMediaQuery('(max-width: 960px)')
  const queryClient = useQueryClient()

  const [canCreateProject, setCanCreateProject] = useState(false)

  const [projectName, setProjectName] = useState(project_name || '')
  const [projectDescription, setProjectDescription] = useState(
    project_description || '',
  )
  const [isCourseAvailable, setIsCourseAvailable] = useState<
    boolean | undefined
  >(undefined)
  const [isLoading, setIsLoading] = useState(false)
  const [allExistingCourseNames, setAllExistingCourseNames] = useState<
    string[]
  >([])
  const [hasCreatedProject, setHasCreatedProject] = useState(false)
  const [uploadFiles, setUploadFiles] = useState<FileUpload[]>([])
  const [showNotification, setShowNotification] = useState(false)
  const [currentStep, setStep] = useState(0)

  const useIllinoisChatConfig = useMemo(() => {
    return process.env.NEXT_PUBLIC_USE_ILLINOIS_CHAT_CONFIG === 'True'
  }, [])

  const checkCourseAvailability = () => {
    const courseExists =
      projectName != '' &&
      allExistingCourseNames &&
      allExistingCourseNames.includes(projectName)
    setIsCourseAvailable(!courseExists)
  }
  const checkIfNewCoursePage = () => {
    // `/new` --> `new`
    // `/new?course_name=mycourse` --> `new`
    return router.asPath.split('/')[1]?.split('?')[0] as string
  }

  const handleSetUploadFiles = (
    updateFn: React.SetStateAction<FileUpload[]>,
  ) => {
    setUploadFiles(updateFn)
    setShowNotification(true)
  }

  const handleCloseNotification = () => {
    setShowNotification(false)
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
      current_user_email={current_user_email}
      project_name={projectName}
      project_description={projectDescription}
      is_new_course={!hasCreatedProject}
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
    <StepBranding key="branding" project_name={projectName} />,
    <StepSuccess key="success" project_name={projectName} />,
  ]

  const totalSteps = allSteps.length
  const updateProject = (name: String, description: String) => {}
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === totalSteps - 1

  const goToPreviousStep = () => {
    setStep((prevStep) => Math.max(prevStep - 1, 0))
  }

  const goToNextStep = () => {
    setStep((prevStep) => Math.min(prevStep + 1, totalSteps - 1))
  }

  useEffect(() => {
    // only run when creating new courses.. otherwise VERY wasteful on DB.
    if (checkIfNewCoursePage() == 'new') {
      async function fetchGetAllCourseNames() {
        const response = await fetch(`/api/UIUC-api/getAllCourseNames`)

        if (response.ok) {
          const data = await response.json()
          setAllExistingCourseNames(data.all_course_names)
        } else {
          console.error(`Error fetching course metadata: ${response.status}`)
        }
      }

      fetchGetAllCourseNames().catch((error) => {
        console.error(error)
      })
    }
  }, [])

  useEffect(() => {
    checkCourseAvailability()
  }, [projectName, allExistingCourseNames])

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
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const onLinkClick = (index: number) => {
    setStep(index)
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
                    if (projectName === '' || isLoading || !isCourseAvailable) {
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
                  (projectName === '' || !isCourseAvailable || isLoading))
              }
              loading={isLoading && currentStep === 0}
            >
              Continue
            </Button>
          </div>
        </div>

        <div className="hidden">
          <Card
            shadow="xs"
            padding="none"
            withBorder={false}
            radius="lg"
            // style={{ maxWidth: '85%', width: '100%', marginTop: '4%' }}
            className="w-[96%] md:w-[90%] lg:max-w-[750px]"
            style={{
              backgroundColor: 'var(--dashboard-background-faded)',
            }}
          >
            <Flex direction={isSmallScreen ? 'column' : 'row'}>
              <div
                style={{
                  flex: isSmallScreen ? '1 1 100%' : '1 1 60%',
                  border: 'None',
                  color: 'var(--foreground)',
                }}
                className="min-h-full bg-[--dashboard-background-faded]"
              >
                <Group
                  m="2rem"
                  align="center"
                  style={{ justifyContent: 'center' }}
                >
                  {/* Flex just to left align title. */}
                  <Flex justify="flex-start" align="flex-start">
                    <Title
                      order={isSmallScreen ? 3 : 2}
                      className={`${montserrat_heading.variable} mt-4 font-montserratHeading text-3xl text-[--foreground]`}
                    >
                      {!is_new_course
                        ? `${projectName}`
                        : 'Create a new project'}
                    </Title>
                  </Flex>

                  <Flex
                    direction="column"
                    gap="md"
                    w={isSmallScreen ? '80%' : '60%'}
                  >
                    <TextInput
                      autoComplete="off"
                      data-lpignore="true"
                      data-form-type="other"
                      styles={{
                        input: {
                          backgroundColor: 'var(--background)',
                          paddingRight: '6rem',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          color:
                            isCourseAvailable && projectName != ''
                              ? 'var(--foreground)'
                              : 'red',
                          '&:focus-within': {
                            borderColor:
                              isCourseAvailable && projectName !== ''
                                ? 'green'
                                : 'red',
                          },
                          fontSize: isSmallScreen ? '12px' : '16px', // Added text styling
                          font: `${montserrat_paragraph.variable} font-montserratParagraph`,
                        },
                        label: {
                          fontWeight: 'bold',
                          fontSize: '1rem',
                          color: 'var(--foreground)',
                          marginBottom: '1rem',
                        },
                      }}
                      placeholder="Project name"
                      radius={'md'}
                      type="text"
                      value={projectName}
                      label="What is the project name?"
                      size={'lg'}
                      disabled={!is_new_course}
                      onChange={(e) =>
                        setProjectName(e.target.value.replaceAll(' ', '-'))
                      }
                      autoFocus
                      withAsterisk
                      className={`${montserrat_paragraph.variable} font-montserratParagraph`}
                      rightSectionWidth={isSmallScreen ? 'auto' : 'auto'}
                    />

                    <div className="text-sm text-[--foreground-faded]">
                      The project name will be used as part of the unique url
                      across the entire campus.
                    </div>

                    <Flex direction="row" align="flex-end">
                      <label
                        className={`${montserrat_paragraph.variable} mt-4 font-montserratParagraph font-bold text-[--foreground]`}
                      >
                        What do you want to achieve?
                      </label>
                      <label
                        className={`${montserrat_paragraph.variable} mt-5 pl-2 font-montserratParagraph text-[--foreground-faded]`}
                      >
                        (optional)
                      </label>
                    </Flex>
                    <Textarea
                      placeholder="Describe your project, goals, expected impact etc..."
                      radius={'md'}
                      value={projectDescription}
                      onChange={(e) => setProjectDescription(e.target.value)}
                      size={'lg'}
                      minRows={4}
                      styles={{
                        input: {
                          color: 'var(--foreground)',
                          backgroundColor: 'var(--background)',
                          fontSize: isSmallScreen ? '12px' : '16px', // Added text styling
                          font: `${montserrat_paragraph.variable} font-montserratParagraph`,
                          // borderColor: '#8e44ad', // Grape color
                          '&:focus': {
                            borderColor: 'var(--illinois-orange)', // Grape color when focused/selected
                          },
                        },
                        label: {
                          fontWeight: 'bold',
                          color: 'var(--foreground)',
                        },
                      }}
                      className={`${montserrat_paragraph.variable} font-montserratParagraph`}
                    />
                    <Flex direction={'row'}>
                      <Title
                        order={isSmallScreen ? 5 : 4}
                        className={`w-full pr-2 pr-7 ${montserrat_paragraph.variable} mt-2 font-montserratParagraph text-sm text-[--foreground]`}
                      >
                        Next: let&apos;s upload some documents
                      </Title>
                    </Flex>
                  </Flex>
                </Group>
              </div>
            </Flex>
          </Card>
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

  input: {
    label: 'font-semibold text-base text-[--foreground]',
    wrapper: '-ml-4',
    input: `
      mt-1

      placeholder:text-[--foreground-faded]
      text-[--foreground] bg-[--background]

      border-[--foreground-faded] focus:border-[--foreground]
      overflow-ellipsis
    `,
    description: 'text-sm text-[--foreground-faded]',
  },
}

export default MakeNewCoursePage
