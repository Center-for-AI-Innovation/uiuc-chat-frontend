import React from 'react'
import Link from 'next/link'
import {
  // Card,
  // Image,
  // Text,
  // Badge,
  // MantineProvider,
  // Button,
  // Group,
  // Stack,
  // createStyles,
  // FileInput,
  // rem,
  Title,
  Flex,
} from '@mantine/core'
import { montserrat_heading } from 'fonts'
// const rubikpuddles = Rubik_Puddles({ weight: '400', subsets: ['latin'] })

export const CannotEditGPT4Page = ({
  course_name,
}: {
  course_name: string
}) => {
  return (
    <>
      <main
        id="main-content"
        className="justify-center; course-page-main flex min-h-screen flex-col items-center"
      >
        <div className="container flex flex-col items-center justify-center gap-8 px-4 py-8 ">
          <Link href="/">
            <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
              {' '}
              UIUC.{' '}
              <span className="${inter.style.fontFamily} text-[hsl(280,100%,70%)]">
                chat
              </span>{' '}
            </h1>
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
              You cannot edit the gpt4 page.
              <br></br>
              It&apos;s for using GPT-4 by itself with no extra knowledge base.
            </Title>

            <Title
              className={`${montserrat_heading.variable} font-montserratHeading`}
              variant="gradient"
              gradient={{ from: 'gold', to: 'white', deg: 50 }}
              order={3}
              p="xl"
            >
              {' '}
              Go to{' '}
              <Link href={'/new'} className="goldUnderline">
                uiuc.chat/new
              </Link>{' '}
              to make a new page.
            </Title>
          </Flex>
        </div>
      </main>
    </>
  )
}
