import Link from 'next/link'
import { Text, Title, Flex } from '@mantine/core'
import GlobalHeader from './navbars/GlobalHeader'
import { type CourseMetadata } from '~/types/courseMetadata'
import React, { useState, useEffect } from 'react'
import { LoadingSpinner } from './LoadingSpinner'
import { useRouter } from 'next/router'
import { useAuth } from 'react-oidc-context'
import { CannotEditCourse } from './CannotEditCourse'
import GlobalFooter from './GlobalFooter'
import { montserrat_heading } from 'fonts'
import { useTranslation } from 'next-i18next'

export const GetCurrentPageName = () => {
  // /CS-125/dashboard --> CS-125
  return useRouter().asPath.slice(1).split('/')[0] as string
}

export const CannotViewCourse = ({
  course_name,
}: // creator_email_address,
// admins_email_addresses,
{
  course_name: string
  // creator_email_address: string
  // admins_email_addresses: string
}) => {
  const auth = useAuth()
  const curr_user_email = auth.user?.profile.email
  const { t } = useTranslation()

  const [courseMetadata, setCourseMetadata] = useState<CourseMetadata | null>(
    null,
  )

  useEffect(() => {
    async function fetchCourseMetadata(course_name: string) {
      try {
        const response = await fetch(
          `/api/UIUC-api/getCourseMetadata?course_name=${course_name}`,
        )

        if (response.ok) {
          const data = await response.json()
          if (data.success === false) {
            console.error('An error occurred while fetching course metadata')
            return null
          }
          return data.course_metadata
        } else {
          console.error(`Error fetching course metadata: ${response.status}`)
          return null
        }
      } catch (error) {
        console.error('Error fetching course metadata:', error)
        return null
      }
    }

    fetchCourseMetadata(course_name).then((metadata) => {
      setCourseMetadata(metadata)
    })
  }, [course_name])

  // if user is not signed in or is not the creator or an admin, then they cannot view the course

  if (!courseMetadata) {
    return <></>
  }

  if (
    curr_user_email &&
    (courseMetadata.course_owner === curr_user_email ||
      courseMetadata.course_admins.includes(curr_user_email))
  ) {
    // CAN view course
    // Cannot edit course
    console.log('CAN view course, cannot EDIT course')
    console.log('curr_user_email: ', curr_user_email)
    console.log('courseMetadata.course_owner: ', courseMetadata.course_owner)
    console.log('courseMetadata.course_admins: ', courseMetadata.course_admins)

    return (
      <>
        <CannotEditCourse course_name={GetCurrentPageName()} />
      </>
    )
  }

  return (
    <>
      <GlobalHeader />
      <main className="justify-center; course-page-main flex min-h-screen flex-col items-center">
        <div className="container flex flex-col items-center justify-center gap-8 px-4 py-8 ">
          <Link href="/">
            <h2 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
              {' '}
              UIUC.
              <span className="${inter.style.fontFamily} text-[hsl(280,100%,70%)]">
                chat
              </span>{' '}
            </h2>
          </Link>
        </div>
        <div className="items-left container flex flex-col justify-center gap-2 py-0">
          <Flex direction="column" align="center" justify="center">
            <Title
              className={`${montserrat_heading.variable} font-montserratHeading`}
              variant="gradient"
              gradient={{ from: 'gold', to: 'white', deg: 50 }}
              order={2}
              p="xl"
              // size={20}
            >
              {' '}
              {t('not_authorized_title')}
            </Title>
            <div
              style={{
                display: 'inline-block',
                border: '1px solid gold',
                borderRadius: '4px',
                padding: '1rem',
              }}
            >
              <Flex direction="column" align="center" justify="center">
                {/* SHOW CREATOR AND ADMINS */}
                <Title
                  className={`${montserrat_heading.variable} font-montserratHeading`}
                  variant="gradient"
                  gradient={{ from: 'gold', to: 'white', deg: 50 }}
                  order={2}
                  p="lg"
                  // size={20}
                >
                  {t('email_creator_admins')}
                </Title>
                {courseMetadata ? (
                  <>
                    <Text
                      className={`${montserrat_heading.variable} font-montserratHeading`}
                      variant="gradient"
                      gradient={{ from: 'gold', to: 'white', deg: 50 }}
                      // py={8}
                      pb={10}
                      pt={2}
                      size={23}
                    >
                      {t('creator_email')}:{' '}
                      <a
                        className="goldUnderline"
                        href={`mailto:${courseMetadata['course_owner']}`}
                      >
                        {courseMetadata['course_owner']}
                      </a>
                      {courseMetadata['course_admins'].length > 0 && (
                        <>
                          <br></br>
                          {t('admins_email')}:{' '}
                          <a
                            className="goldUnderline"
                            href={`mailto:${courseMetadata[
                              'course_admins'
                            ].join(', ')}`}
                          >
                            {courseMetadata['course_admins'].join(', ')}
                          </a>
                        </>
                      )}
                    </Text>
                  </>
                ) : (
                  <>
                    <LoadingSpinner />
                  </>
                )}
              </Flex>
            </div>
            <Title
              className={`${montserrat_heading.variable} font-montserratHeading`}
              variant="gradient"
              gradient={{ from: 'gold', to: 'white', deg: 50 }}
              order={3}
              p="xl"
              py={35}
            >
              {' '}
              {t('if_you_are_creator_or_admin')}
              <br></br>
              {t('or_go_to_new_page')}
              <Link href={'/new'} className="goldUnderline">
                {t('uiuc_chat_new')}
              </Link>
            </Title>
          </Flex>
        </div>
        <GlobalFooter />
      </main>
    </>
  )
}
