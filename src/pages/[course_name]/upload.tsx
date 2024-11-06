import { type NextPage } from 'next'
import MakeNomicVisualizationPage from '~/components/UIUC-Components/MakeQueryAnalysisPage'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useUser } from '@clerk/nextjs'
import { CannotEditGPT4Page } from '~/components/UIUC-Components/CannotEditGPT4'
import { LoadingSpinner } from '~/components/UIUC-Components/LoadingSpinner'
import {
  LoadingPlaceholderForAdminPages,
  MainPageBackground,
} from '~/components/UIUC-Components/MainPageBackground'
import { AuthComponent } from '~/components/UIUC-Components/AuthToEditCourse'
import { fetchCourseMetadata } from '~/utils/apiUtils'
import { CourseMetadata } from '~/types/courseMetadata'
import LargeDropzone from '~/components/UIUC-Components/LargeDropzone'
import { extractEmailsFromClerk } from '~/components/UIUC-Components/clerkHelpers'
import Navbar from '~/components/UIUC-Components/navbars/Navbar'
import Head from 'next/head'
import { Card, Flex, SimpleGrid, Title } from '@mantine/core'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import GlobalFooter from '~/components/UIUC-Components/GlobalFooter'
import CanvasIngestForm from '~/components/UIUC-Components/CanvasIngestForm'
import WebsiteIngestForm from '~/components/UIUC-Components/WebsiteIngestForm'
import GitHubIngestForm from '~/components/UIUC-Components/GitHubIngestForm'
import UploadNotification from '~/components/UIUC-Components/UploadNotification'
import MITIngestForm from '~/components/UIUC-Components/MITIngestForm'
import CourseraIngestForm from '~/components/UIUC-Components/CourseraIngestForm'
import SupportedFileUploadTypes from '~/components/UIUC-Components/SupportedFileUploadTypes'

const CourseMain: NextPage = () => {
  const router = useRouter()
  const [projectName, setProjectName] = useState<string | null>(null)
  const { user, isLoaded, isSignedIn } = useUser()
  const [isFetchingCourseMetadata, setIsFetchingCourseMetadata] = useState(true)
  const user_emails = extractEmailsFromClerk(user)
  const [metadata, setProjectMetadata] = useState<CourseMetadata | null>()
  const getCurrentPageName = () => {
    return router.query.course_name as string
  }

  useEffect(() => {
    if (!router.isReady) return
    const fetchCourseData = async () => {
      const local_course_name = getCurrentPageName()

      // Check exists
      const metadata: CourseMetadata =
        await fetchCourseMetadata(local_course_name)
      if (metadata === null) {
        await router.push('/new?course_name=' + local_course_name)
        return
      }
      setProjectName(local_course_name)
      setIsFetchingCourseMetadata(false)
      setProjectMetadata(metadata)
    }
    fetchCourseData()
  }, [router.isReady])

  // Check auth - https://clerk.com/docs/nextjs/read-session-and-user-data
  if (!isLoaded || isFetchingCourseMetadata || projectName == null) {
    return <LoadingPlaceholderForAdminPages />
  }

  if (!isSignedIn) {
    console.log('User not logged in', isSignedIn, isLoaded, projectName)
    return <AuthComponent course_name={projectName as string} />
  }

  // Don't edit certain special pages (no context allowed)
  if (
    projectName.toLowerCase() == 'gpt4' ||
    projectName.toLowerCase() == 'global' ||
    projectName.toLowerCase() == 'extreme'
  ) {
    return <CannotEditGPT4Page course_name={projectName as string} />
  }

  return (
    <>  <Navbar course_name={projectName} />

      <Head>
        <title>{projectName}/upload</title>
        <meta
          name="UIUC.chat"
          content="The AI teaching assistant built for students at UIUC."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="course-page-main min-w-screen flex min-h-screen flex-col items-center">
        <div className="items-left flex w-full flex-col justify-center py-0">
          <Flex
            direction="column"
            align="center"
            w="100%"
            className="mt-8 lg:mt-4"
          >
            <Card
              shadow="xs"
              padding="none"
              radius="xl"
              style={{ maxWidth: '90%', width: '100%', marginTop: '2%' }}
            >
              {/* <Flex className="flex-col md:flex-row"> */}
              <div
                style={{
                  border: 'None',
                  color: 'white',
                }}
                className="min-h-full flex-[1_1_100%] bg-gradient-to-r from-purple-900 via-indigo-800 to-blue-800 md:flex-[1_1_70%]"
              >
                {/* <Flex
                  gap="md"
                  direction="column"
                  justify="flex-start"
                  align="flex-start"
                  className="lg:ml-8"
                > */}
                <Title
                  order={2}
                  variant="gradient"
                  align="center"
                  gradient={{ from: 'gold', to: 'white', deg: 50 }}
                  className={`pl-8 pt-8 ${montserrat_heading.variable} font-montserratHeading`}
                >
                  {/* API Keys: Add LLMs to your Chatbot */}
                  {projectName}
                </Title>

                <LargeDropzone
                  courseName={projectName}
                  current_user_email={user_emails[0] as string}
                  redirect_to_gpt_4={false}
                  isDisabled={false}
                  courseMetadata={metadata as CourseMetadata}
                  is_new_course={false}
                />
                {/* <div className='grid justify-center'>
                </div> */}

                <SimpleGrid
                  cols={3}
                  spacing="lg"
                  breakpoints={[
                    { maxWidth: 1192, cols: 2, spacing: 'md' },
                    { maxWidth: 768, cols: 1, spacing: 'sm' },
                  ]}
                  style={{ width: '80%', margin: '0 auto', paddingTop: '30px', paddingBottom: '30px' }}
                >
                  {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-[80%]"> */}

                  <CanvasIngestForm project_name={projectName} />

                  <WebsiteIngestForm project_name={projectName} />

                  <GitHubIngestForm />

                  <MITIngestForm project_name={projectName} />

                  <CourseraIngestForm />
                </SimpleGrid>
                {/* </div> */}
              </div>

            </Card>

          </Flex>
        </div >
        <GlobalFooter />
      </main >
    </>
  )
}
export default CourseMain

