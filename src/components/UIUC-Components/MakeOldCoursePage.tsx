import Head from 'next/head'
import {
  Title,
  Flex,
  Blockquote,
  Text,
  List,
  Tabs,
  Indicator,
  Paper,
  Card,
} from '@mantine/core'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

import Navbar from './navbars/Navbar'
import GlobalFooter from './GlobalFooter'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import { fetchPresignedUrl } from '~/utils/apiUtils'
import { DocGroupsTable } from './DocGroupsTable'
import { ProjectFilesTable } from './ProjectFilesTable'
import { IconInfoCircle } from '@tabler/icons-react'

import { CannotEditCourse } from './CannotEditCourse'
import { type CourseMetadata } from '~/types/courseMetadata'
import { UploadCard } from './UploadCard'
import DocumentGroupsCard from './DocumentGroupsCard'
import DocumentsCard from './DocumentsCard'

const MakeOldCoursePage = ({
  course_name,
  metadata,
  current_email,
}: {
  course_name: string
  metadata: CourseMetadata
  current_email: string
}) => {
  // Check auth - https://clerk.com/docs/nextjs/read-session-and-user-data
  const [bannerUrl, setBannerUrl] = useState<string>('')

  const router = useRouter()
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (metadata == null) {
          console.error('No metadata found for course')
          return
        }
        // fetch banner image url
        if (metadata?.banner_image_s3 && metadata.banner_image_s3 !== '') {
          console.log('Getting banner image: ', metadata.banner_image_s3)
          try {
            const url = await fetchPresignedUrl(metadata.banner_image_s3)
            setBannerUrl(url as string)
            console.log('Got banner image: ', url)
          } catch (error) {
            console.error('Error fetching banner image: ', error)
          }
        }
      } catch (error) {
        console.error(error)
        // alert('An error occurred while fetching course metadata. Please try again later.')
      }
    }

    fetchData()
  }, [metadata])

  // TODO: update this check to consider Admins & participants.
  if (
    metadata &&
    current_email !== (metadata.course_owner as string) &&
    metadata.course_admins.indexOf(current_email) === -1
  ) {
    router.replace(`/${course_name}/not_authorized`)

    return <CannotEditCourse course_name={course_name as string} />
  }

  return (
    <>
      <Navbar course_name={course_name} bannerUrl={bannerUrl} />

      <Head>
        <title>{course_name} - Admin page - UIUC.chat</title>
        <meta
          name="description"
          content="The AI teaching assistant built for students at UIUC."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="course-page-main min-w-screen flex min-h-screen flex-col items-center">
        <div className="items-left flex w-full flex-col justify-center py-0">
          <Flex direction="column" align="center" w="100%">
            {/* Upload Card Section */}
            <UploadCard
              projectName={course_name}
              current_user_email={current_email}
              metadata={metadata}
            />

            {/* Document Groups Section */}
            <DocumentGroupsCard course_name={course_name} />

            {/* Project Files Section */}
            <DocumentsCard course_name={course_name} metadata={metadata} />
          </Flex>
        </div>
        <GlobalFooter />
      </main>
    </>
  )
}

export default MakeOldCoursePage
