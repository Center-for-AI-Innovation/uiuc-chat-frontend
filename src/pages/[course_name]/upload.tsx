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
import { CannotEditCourse } from '~/components/UIUC-Components/CannotEditCourse'

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

  if (
    metadata &&
    user_emails[0] !== (metadata.course_owner as string) &&
    metadata.course_admins.indexOf(getCurrentPageName()) === -1
  ) {
    router.replace(`/${getCurrentPageName()}/not_authorized`)

    return <CannotEditCourse course_name={getCurrentPageName() as string} />
  }
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
    <>
      {' '}
      <Navbar course_name={projectName} />
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
          ></Flex>
        </div>
        <GlobalFooter />
      </main>
    </>
  )
}
export default CourseMain
