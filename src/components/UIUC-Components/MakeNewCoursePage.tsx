import Head from 'next/head'
import React, { useMemo, useState } from 'react'

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
import { useDebouncedValue, useMediaQuery } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import router from 'next/router'
import { createProject } from '~/utils/apiUtils'
import Navbar from './navbars/Navbar'
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
  const isSmallScreen = useMediaQuery('(max-width: 960px)')
  const [projectName, setProjectName] = useState(project_name || '')
  const [projectDescription, setProjectDescription] = useState(
    project_description || '',
  )
  const [isLoading, setIsLoading] = useState(false)
  const queryClient = useQueryClient()

  const useIllinoisChatConfig = useMemo(() => {
    return process.env.NEXT_PUBLIC_USE_ILLINOIS_CHAT_CONFIG === 'True'
  }, [])

  // Debounce project name input to avoid excessive API calls
  const [debouncedProjectName] = useDebouncedValue(projectName, 500)

  // Check project name availability using React Query
  const {
    data: courseExists,
    isLoading: isCheckingAvailability,
    isError: isAvailabilityError,
  } = useQuery<boolean>({
    queryKey: ['projectNameAvailability', debouncedProjectName],
    queryFn: async () => {
      if (!debouncedProjectName || debouncedProjectName.length === 0) {
        return false
      }
      const response = await fetch(
        `/api/UIUC-api/getCourseExists?course_name=${encodeURIComponent(debouncedProjectName)}`,
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

  // Check if we're waiting for debounce (user typed but debounce hasn't completed)
  // This handles cases where user types, backspaces, or changes the input while debounce is in progress
  const isWaitingForDebounce =
    projectName !== debouncedProjectName

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
            err.message || 'An error occurred while creating the project. Please try again.',
          color: 'red',
          autoClose: 5000,
        })
      }
    } finally {
      setIsLoading(false)
    }
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
        <div className="flex w-full flex-1 flex-col items-center justify-center py-0 pb-20">
          <Card
            shadow="xs"
            padding="none"
            withBorder={false}
            radius="xl"
            // style={{ maxWidth: '85%', width: '100%', marginTop: '4%' }}
            className="w-[96%] md:w-[90%] lg:max-w-[750px]"
            style={{
              backgroundColor: 'var(--background-faded)',
            }}
          >
            <Flex direction={isSmallScreen ? 'column' : 'row'}>
              <div
                style={{
                  flex: isSmallScreen ? '1 1 100%' : '1 1 60%',
                  border: 'None',
                  color: 'white',
                }}
                className="min-h-full bg-[--background-faded]"
              >
                <Group
                  m="3rem"
                  align="center"
                  style={{ justifyContent: 'center' }}
                >
                  {/* Flex just to left align title. */}
                  <Flex
                    justify="flex-start"
                    align="flex-start"
                    w={isSmallScreen ? '80%' : '60%'}
                  >
                    <Title
                      order={isSmallScreen ? 3 : 2}
                      className={`${montserrat_heading.variable} text-left font-montserratHeading text-[--foreground]`}
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
                            isCheckingAvailability
                              ? 'var(--foreground)'
                              : isCourseAvailable && projectName != ''
                                ? 'var(--foreground)'
                                : projectName !== '' && isCourseAvailable === false
                                  ? 'red'
                                  : 'var(--foreground)',
                          '&:focus-within': {
                            borderColor: isCheckingAvailability
                              ? 'var(--foreground)'
                              : isCourseAvailable && projectName !== ''
                                ? 'green'
                                : projectName !== '' && isCourseAvailable === false
                                  ? 'red'
                                  : 'var(--foreground)',
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
                      rightSection={
                        isCheckingAvailability && projectName.length > 0 ? (
                          <Loader size="xs" />
                        ) : null
                      }
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
                      <Tooltip
                        label={
                          projectName === ''
                            ? 'Add a project name above :)'
                            : isWaitingForDebounce || isCheckingAvailability
                              ? 'Checking availability...'
                              : !isCourseAvailable
                                ? 'This project name is already taken!'
                                : ''
                        }
                        withArrow
                        disabled={
                          projectName !== '' &&
                          !isWaitingForDebounce &&
                          !isCheckingAvailability &&
                          isCourseAvailable
                        }
                        styles={{
                          tooltip: {
                            color: 'var(--tooltip)',
                            backgroundColor: 'var(--tooltip-background)',
                          },
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
                            size="sm"
                            radius={'sm'}
                            className={`${isCourseAvailable && projectName !== '' && !isCheckingAvailability && !isWaitingForDebounce ? 'bg-[--illinois-orange] text-white hover:bg-[--illinois-orange] hover:text-white' : 'disabled:bg-[--button-disabled] disabled:text-[--button-disabled-text-color]'}
                        mt-2 min-w-[5-rem] transform overflow-ellipsis text-ellipsis p-2 focus:shadow-none focus:outline-none lg:min-w-[8rem]`}
                            // w={`${isSmallScreen ? '5rem' : '50%'}`}
                            style={{
                              alignSelf: 'flex-end',
                            }}
                            disabled={
                              projectName === '' ||
                              isLoading ||
                              isWaitingForDebounce ||
                              isCheckingAvailability ||
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
        <GlobalFooter />
      </main>
    </>
  )
}

export default MakeNewCoursePage
