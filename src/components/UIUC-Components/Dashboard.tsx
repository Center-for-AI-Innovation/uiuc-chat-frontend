import Head from 'next/head'
import { useEffect, useState } from 'react'

import { Card, Title } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import router from 'next/router'
import { createProject } from '~/utils/apiUtils'
import Navbar from './navbars/Navbar'

import GlobalFooter from '~/components/UIUC-Components/GlobalFooter'
import ProjectTable from '~/components/UIUC-Components/ProjectTable'

const Dashboard = ({
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
        <meta name="description" content="My projects on UIUC.chat." />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main
        className="course-page-main mt-20"
        style={{
          minHeight: '100vh',
          padding: '1rem',
        }}
      >
        <div className="mx-auto mt-[2%] min-h-[70vh] w-[96%] md:w-[90%] 2xl:w-[90%]">
          <div className="px-8">
            <Title
              order={2}
              className={`
                text-2xl font-bold sm:pt-2 
                ${montserrat_heading.variable} font-montserratHeading
              `}
              style={{ color: 'var(--foreground)' }}
            >
              My Chatbots
            </Title>

            <p
              className={`
              text-md mt-2
              ${montserrat_paragraph.variable} font-montserratParagraph
            `}
              style={{ color: 'var(--foreground-faded)' }}
            >
              These are chatbots you&apos;ve created, or where you are an admin.
            </p>
          </div>

          <Card
            withBorder
            padding="none"
            radius="xl"
            className="mt-8 min-h-[10rem]"
            style={{
              backgroundColor: 'var(--background)',
              borderColor: 'var(--dashboard-border)',
            }}
          >
            <ProjectTable />
          </Card>
        </div>

        <GlobalFooter />
      </main>
    </>
  )
}

export default Dashboard
