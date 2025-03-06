import React from 'react'
import Link from 'next/link'
import {
  Button,
  Title,
  Flex,
} from '@mantine/core'
import { useAuth } from 'react-oidc-context'
import { montserrat_heading } from 'fonts'
import { initiateSignIn } from '~/utils/authHelpers'

export const AuthComponent = ({ course_name }: { course_name: string }) => {
  const auth = useAuth()

  const handleSignIn = () => {
    void initiateSignIn(auth, course_name === 'new' ? '/new' : `/${course_name}/dashboard`)
  }
  return (
    <>
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
            >
              {' '}
              You must sign in to create or edit content.
            </Title>
            <Link href="/sign-in">
            <Button
              className="kas-gradient-text btn"
              style={{ fontSize: '24px' }}
              onClick={handleSignIn}
            >
              Sign in →
            </Button>
          </Link>
          </Flex>
        </div>
      </main>
    </>
  )
}
