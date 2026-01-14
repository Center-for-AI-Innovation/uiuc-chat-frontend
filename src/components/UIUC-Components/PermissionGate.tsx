import React from 'react'
import Link from 'next/link'
import { Button, Title, Flex, Text } from '@mantine/core'
import { useAuth } from 'react-oidc-context'
import { montserrat_heading } from 'fonts'
import { initiateSignIn } from '~/utils/authHelpers'

export const PermissionGate = ({
  course_name,
  errorType,
}: {
  course_name: string
  errorType?: 401 | 403 | 404 | null
}) => {
  const auth = useAuth()

  const handleSignIn = () => {
    void initiateSignIn(
      auth,
      course_name === 'new' ? '/new' : `/${course_name}/dashboard`,
    )
  }

  const getErrorMessage = () => {
    switch (errorType) {
      case 401:
        return 'You must sign in to access this chatbot.'
      case 403:
        return "You don't have sufficient permissions to access this chatbot."
      case 404:
        return 'This chatbot does not exist.'
      default:
        return 'You must sign in to access this chatbot.'
    }
  }

  const getTitle = () => {
    switch (errorType) {
      case 401:
        return 'Sign in required'
      case 403:
        return "You don't have sufficient permissions"
      case 404:
        return 'Chatbot not found'
      default:
        return 'Sign in required'
    }
  }

  return (
    <>
      <main className="course-page-main flex min-h-screen flex-col items-center justify-center">
        <div className="container flex flex-col items-center justify-center gap-8 px-4 py-8 ">
          <Link href="/">
            <h2
              className={`text-5xl font-extrabold tracking-tight text-white sm:text-[5rem] ${montserrat_heading.variable} font-montserratHeading`}
            >
              {' '}
              <span className="${inter.style.fontFamily} mr-2 text-[--illinois-orange]">
                Illinois
              </span>
              <span className="${inter.style.fontFamily} text-[--foreground]">
                Chat
              </span>{' '}
            </h2>
          </Link>
        </div>
        <div className="items-left container flex flex-col justify-center gap-2 py-0">
          <Flex direction="column" align="center" justify="center">
            <Title
              className={`${montserrat_heading.variable} font-montserratHeading text-[--foreground]`}
              order={2}
              p="xl"
            >
              {' '}
              {getTitle()}
            </Title>
            <Text
              className={`${montserrat_heading.variable} font-montserratHeading text-[--foreground]`}
              size="lg"
              p="md"
              ta="center"
            >
              {getErrorMessage()}
            </Text>
            {errorType === 403 && (
              <Link href="/chatbots">
                <Button
                  className=" login-btn btn bg-[--button] text-white hover:bg-[--button-hover]"
                  style={{ fontSize: '24px' }}
                >
                  My Chatbots →
                </Button>
              </Link>
            )}
            {errorType === 404 && (
              <Link
                href={
                  course_name !== 'new'
                    ? `/new?course_name=${encodeURIComponent(course_name)}`
                    : '/new'
                }
              >
                <Button
                  className=" login-btn btn bg-[--button] text-white hover:bg-[--button-hover]"
                  style={{ fontSize: '24px' }}
                >
                  Create New →
                </Button>
              </Link>
            )}
            {errorType !== 404 && errorType !== 403 && (
              <Link href="/sign-in">
                <Button
                  className=" login-btn btn bg-[--button] text-white hover:bg-[--button-hover]"
                  style={{ fontSize: '24px' }}
                  onClick={handleSignIn}
                >
                  Sign in →
                </Button>
              </Link>
            )}
          </Flex>
        </div>
      </main>
    </>
  )
}
