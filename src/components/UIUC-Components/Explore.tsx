import { useCreateProjectMutation } from '~/hooks/queries/useCreateProject'
import { useFetchAllCourseNames } from '~/hooks/queries/useFetchAllCourseNames'

import Head from 'next/head'
import { useEffect, useState } from 'react'

import { Card } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import router from 'next/router'
import Navbar from './navbars/Navbar'

import GlobalFooter from '~/components/UIUC-Components/GlobalFooter'

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
  const createProjectMutation = useCreateProjectMutation()

  const checkIfNewCoursePage = () => {
    // `/new` --> `new`
    // `/new?course_name=mycourse` --> `new`
    return router.asPath.split('/')[1]?.split('?')[0] as string
  }

  const { data: allExistingCourseNames = [] } = useFetchAllCourseNames({
    enabled: checkIfNewCoursePage() === 'new',
  })

  const isSmallScreen = useMediaQuery('(max-width: 960px)')
  const [projectName, setProjectName] = useState(project_name || '')
  const [projectDescription, setProjectDescription] = useState(
    project_description || '',
  )
  const [isCourseAvailable, setIsCourseAvailable] = useState<
    boolean | undefined
  >(undefined)
  const [isLoading, setIsLoading] = useState(false)

  const checkCourseAvailability = () => {
    const courseExists =
      projectName != '' &&
      allExistingCourseNames &&
      allExistingCourseNames.includes(projectName)
    setIsCourseAvailable(!courseExists)
  }

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
      const result = await createProjectMutation.mutateAsync({
        project_name,
        project_description,
        project_owner_email: current_user_email,
      })
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
        <Card
          withBorder
          padding="none"
          radius="xl"
          className="mx-auto mt-[2%] w-[96%] md:w-[90%] 2xl:w-[90%]"
          style={{
            backgroundColor: 'var(--background)',
            borderColor: 'var(--dashboard-border)',
          }}
        >
          <div className="flex min-h-[70vh] flex-col items-center justify-center">
            <div className="text-2xl text-[--illinois-orange]">
              [[ coming soon ]]
            </div>

            <div className="mt-4 text-[--foreground-faded]">
              LLMs, chatbots, and AI…oh my!
            </div>
          </div>
        </Card>
      </main>

      <GlobalFooter />
    </>
  )
}

export default Dashboard
