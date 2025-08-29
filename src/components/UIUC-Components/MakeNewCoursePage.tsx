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
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import router from 'next/router'
import { createProject } from '~/pages/api/UIUC-api/createProject'
import Navbar from './navbars/Navbar'
import GlobalFooter from './GlobalFooter'

import NewCourseNavigation from './MakeNewCoursePageSteps/NewCourseNavigation'

import StepCreate from './MakeNewCoursePageSteps/StepCreate'
import StepUpload from './MakeNewCoursePageSteps/StepUpload'
import StepImport from './MakeNewCoursePageSteps/StepImport'
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
  const [currentStep, setStep] = useState(0)

  const allSteps = [
    <StepCreate
      project_name={projectName}
      project_description={projectDescription}
      onUpdateName={setProjectName}
      onUpdateDescription={setProjectDescription}
    />,
    <StepUpload project_name={projectName} />,
    <StepImport project_name={projectName} />,
    <StepBranding project_name={projectName} />,
    <StepSuccess project_name={projectName} />,
  ]

  const updateProject = (name: String, description: String) => {}

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
  ) => {
    setIsLoading(true)
    try {
      const result = await createProject(
        project_name,
        project_description,
        current_user_email,
        is_private,
      )
      console.log('Project created successfully:', result)
      if (is_new_course) {
        await router.push(`/${projectName}/dashboard`)
        return
      }
    } catch (error) {
      console.error('Error creating project:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const onLinkClick = (index: Number) => {
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
        // style={{
        //   justifyContent: 'center',
        //   alignItems: 'center',
        //   minHeight: '100vh',
        //   padding: '1rem',
        // }}
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
          </Card>

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
                      gap="sm"
                      w={isSmallScreen ? '100%' : '70%'}
                    >
                      <TextInput
                        autoComplete="off"
                        data-lpignore="true"
                        data-form-type="other"
                        styles={{
                          input: {
                            color: 'var(--foreground)',
                            backgroundColor: 'var(--background)',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            fontSize: '1rem',
                            marginTop: '.5rem',
                            borderWidth: '2px',

                            borderColor:
                              isCourseAvailable && projectName !== ''
                                ? '#0c0'
                                : 'var(--background-dark)',

                            '&:focus': {
                              borderColor:
                                isCourseAvailable && projectName !== ''
                                  ? '#0c0'
                                  : 'red',
                            },
                          },
                          label: {
                            fontWeight: 'bold',
                            color: 'var(--foreground)',
                            fontSize: '1rem',
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
                      <Flex
                        direction="row"
                        align="flex-end"
                        gap="xs"
                        className="text-[--foreground]"
                      >
                        <label
                          className={`${montserrat_paragraph.variable} mt-4 font-montserratParagraph font-bold`}
                        >
                          What do you want to achieve?
                        </label>
                        <label
                          className={`${montserrat_paragraph.variable} font-montserratParagraph text-[--foreground-faded]`}
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
                            borderColor: 'var(--background-dark)',

                            font: `${montserrat_paragraph.variable} font-montserratParagraph`,
                            fontSize: '1rem',
                            // borderColor: '#8e44ad', // Grape color
                            '&:focus': {
                              borderColor: 'var(--background-dark)', // Grape color when focused/selected
                            },
                          },
                          label: {
                            fontWeight: 'bold',
                            color: 'var(--foreground)',
                          },
                        }}
                        className={`${montserrat_paragraph.variable} font-montserratParagraph`}
                      />
                      <Flex direction={'row'} align={'center'}>
                        <Title
                          order={isSmallScreen ? 5 : 4}
                          className={`w-full pr-4 text-right ${montserrat_paragraph.variable} mt-2 font-montserratParagraph text-sm`}
                        >
                          Next: let&apos;s upload some documents
                        </Title>
                        <Tooltip
                          label={
                            projectName === ''
                              ? 'Add a project name above :)'
                              : !isCourseAvailable
                                ? 'This project name is already taken!'
                                : ''
                          }
                          withArrow
                          disabled={projectName !== '' && isCourseAvailable}
                          style={{
                            color: 'var(--tooltip)',
                            backgroundColor: 'var(--tooltip-background)',
                          }}
                        >
                          <span>
                            <Button
                              onClick={async (e) => {
                                await handleSubmit(
                                  projectName,
                                  projectDescription,
                                  current_user_email,
                                  useIllinoisChatConfig, // isPrivate: illinois chat project default to private
                                )
                              }}
                              size="md"
                              radius={'md'}
                              className={`${isCourseAvailable && projectName !== '' ? 'pointer bg-[--dashboard-button]' : 'border-[--dashboard-button]'}
                        overflow-ellipsis text-ellipsis p-2 ${isCourseAvailable && projectName !== '' ? 'text-[--dashboard-button-foreground]' : 'text-[--foreground-faded]'}
                        mt-2 min-w-[5-rem] transform hover:border-[--dashboard-button-hover] hover:bg-[--dashboard-button-hover] hover:text-[--dashboard-button-foreground] focus:shadow-none focus:outline-none disabled:cursor-not-allowed
                        disabled:bg-[--background-faded] disabled:text-[--foreground-faded] lg:min-w-[8rem]`}
                              // w={`${isSmallScreen ? '5rem' : '50%'}`}
                              style={{
                                alignSelf: 'flex-end',
                              }}
                              disabled={
                                projectName === '' ||
                                isLoading ||
                                !isCourseAvailable
                              }
                              leftIcon={
                                isLoading ? (
                                  <Loader size="xs" color="white" />
                                ) : null
                              }
                            >
                              {isLoading ? 'Creating...' : 'Create'}
                            </Button>
                          </span>
                        </Tooltip>
                      </Flex>
                    </Flex>
                  </Group>
                </div>
              </Flex>
            </Card>
          </div>
        </div>

        <NewCourseNavigation
          currentStep={currentStep}
          allSteps={allSteps}
          project_name={projectName}
          canCreateProject={canCreateProject}
          onSetCreated={canCreateProject}
          onSetStep={setStep}
        ></NewCourseNavigation>
      </main>
    </>
  )
}

const componentClasses = {
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
