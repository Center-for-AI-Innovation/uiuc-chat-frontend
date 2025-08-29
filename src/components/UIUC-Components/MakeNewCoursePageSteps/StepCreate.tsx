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
//import { useMediaQuery } from '@mantine/hooks'
//import { montserrat_heading, montserrat_paragraph } from 'fonts'
import router from 'next/router'
import { createProject } from '~/pages/api/UIUC-api/createProject'

import HeaderStepNavigation from './HeaderStepNavigation'

const StepCreate = ({
  project_name,
  current_user_email,
  is_new_course = true,
  project_description,

  onUpdateName,
  onUpdateDescription,
}: {
  project_name: string
  current_user_email: string
  is_new_course?: boolean
  project_description?: string

  onUpdateName: Function
  onUpdateDescription: Function
}) => {
  //  const isSmallScreen = useMediaQuery('(max-width: 960px)')
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
  const [currentStep, setStep] = useState(0)

  //************** watchers **************

  useEffect(() => {
    onUpdateName(projectName)
  }, [projectName])
  useEffect(() => {
    onUpdateDescription(projectDescription)
  }, [projectDescription])

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

  //************** functions **************

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

  //**************  **************

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
            onInput={(e) => setProjectName(e.target.value.replaceAll(' ', '-'))}
          />

          <div className="mt-1 min-h-[1.35rem] text-sm">
            {projectName && (
              <div className="flex items-start gap-2">
                {/* NOTE: assuming this is the best / proper way to get the current server url */}
                <div>
                  {window.location.origin}/{projectName}
                </div>

                {isCourseAvailable && projectName && (
                  <div className="text-green-500">(url available)</div>
                )}
                {(!isCourseAvailable || !projectName) && (
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

        <div
          className={`
          create_navigation
          mt-8 flex items-center justify-end
          gap-2
        `}
        >
          <Button
            size="sm"
            radius="sm"
            leftIcon={isLoading ? <Loader size="xs" color="white" /> : null}
            classNames={componentClasses.button}
            disabled={projectName === '' || isLoading || !isCourseAvailable}
            onClick={async (e) => {
              await handleSubmit(
                projectName,
                projectDescription,
                current_user_email,
              )
            }}
          >
            {isLoading ? 'Creating...' : 'Create'}
          </Button>
        </div>
      </div>
    </>
  )
}

const componentClasses = {
  button: {
    root: `
      !text-[--dashboard-button-foreground]
      bg-[--dashboard-button]
      border-[--dashboard-button]

      hover:!text-[--dashboard-button-foreground]
      hover:bg-[--dashboard-button-hover]
      hover:border-[--dashboard-button-hover]

      disabled:bg-transparent
      disabled:border-[--button-disabled]
      disabled:!text-[--button-disabled-text-color]
    `,
  },

  input: {
    label: 'font-semibold text-base text-[--foreground]',
    wrapper: '-ml-3',
    input: `
      mt-2
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
