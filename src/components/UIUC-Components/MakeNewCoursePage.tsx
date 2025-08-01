import Head from 'next/head'
import { useEffect, useState } from 'react'

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
  const [isCourseAvailable, setIsCourseAvailable] = useState<
    boolean | undefined
  >(undefined)
  const [isLoading, setIsLoading] = useState(false)
  const [allExistingCourseNames, setAllExistingCourseNames] = useState<
    string[]
  >([])
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
  ) => {
    setIsLoading(true)
    try {
      const result = await createProject(
        project_name,
        project_description,
        current_user_email,
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
                              )
                            }}
                            size="sm"
                            radius={'sm'}
                            className={`${isCourseAvailable && projectName !== '' ? 'bg-[--illinois-orange] text-white hover:bg-[--illinois-orange] hover:text-white' : 'disabled:bg-[--button-disabled] disabled:text-[--button-disabled-text-color]'}
                        mt-2 min-w-[5-rem] transform overflow-ellipsis text-ellipsis p-2 focus:shadow-none focus:outline-none lg:min-w-[8rem]`}
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
        <GlobalFooter />
      </main>
    </>
  )
}

export default MakeNewCoursePage
