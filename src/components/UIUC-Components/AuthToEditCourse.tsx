import React from 'react'
import Link from 'next/link'
import { Button, Title, Flex } from '@mantine/core'
import { useAuth } from 'react-oidc-context'
import { montserrat_heading } from 'fonts'
import { initiateSignIn } from '~/utils/authHelpers'
import { useTranslation } from 'next-i18next';

export const AuthComponent = ({ course_name }: { course_name: string }) => {
  const auth = useAuth()
  const { t } = useTranslation('common');

  const handleSignIn = () => {
    void initiateSignIn(
      auth,
      course_name === 'new' ? '/new' : `/${course_name}/dashboard`,
    )
  }
  return (
    <>
      <main className="justify-center; course-page-main flex min-h-screen flex-col items-center">
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
              {t('must_sign_in_to_edit')}
            </Title>
            <Link href="/sign-in">
              <Button
                className=" btn bg-[--button] text-white hover:bg-[--button-hover]"
                style={{ fontSize: '24px' }}
                onClick={handleSignIn}
              >
                {t('sign_in_arrow')}
              </Button>
            </Link>
          </Flex>
        </div>
      </main>
    </>
  )
}
