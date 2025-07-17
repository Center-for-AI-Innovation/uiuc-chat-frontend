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
import { useTranslation } from 'next-i18next'
// const rubikpuddles = Rubik_Puddles({ weight: '400', subsets: ['latin'] })

export const CannotEditCourse = ({ course_name }: { course_name: string }) => {
  const { t } = useTranslation('common')
  return (
    <>
      <Flex direction="column" align="center" justify="center">
        <Title
          className={`${montserrat_heading.variable} font-montserratHeading`}
          variant="gradient"
          gradient={{ from: 'gold', to: 'white', deg: 50 }}
          order={2}
          p="xl"
        >
          {t('cannot_edit_course')}
        </Title>
        <Title
          className={`${montserrat_heading.variable} font-montserratHeading`}
          variant="gradient"
          gradient={{ from: 'gold', to: 'white', deg: 50 }}
          order={3}
          p="xl"
        >
          {t('sign_in_or_new_page', { new_page_link: <Link href={'/new'} className="goldUnderline">uiuc.chat/new</Link> })}
        </Title>
      </Flex>
    </>
  )
}
