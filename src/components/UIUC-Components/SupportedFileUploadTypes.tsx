import Image from 'next/image'
import {
  Text,
  Title,
  Flex,
  createStyles,
  Accordion,
  // rem,
  // Group,
  // Card,
  // Badge,
  // MantineProvider,
  // Button,
  // Group,
  // Stack,
  // createStyles,
  // FileInput,
  // Group,
  // Divider,
  // TextInput,
  // Tooltip,
} from '@mantine/core'
// const rubik_puddles = Rubik_Puddles({ weight: '400', subsets: ['latin'] })

// import Link from 'next/link'
import React from 'react'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import Link from 'next/link'
import { IconPhoto } from '@tabler/icons-react'

const useStyles = createStyles((theme) => ({
  // For Logos
  logos: {
    // width: '30%',
    aspectRatio: '3/2',
    objectFit: 'contain',
    width: '80px',
  },

  smallLogos: {
    // width: '30%',
    aspectRatio: '1/1',
    objectFit: 'contain',
    width: '45px',
  },

  codeStyledText: {
    backgroundColor: '#020307',
    borderRadius: '5px',
    padding: '1px 5px',
    fontFamily: 'monospace',
    alignItems: 'center',
    justifyItems: 'center',
  },

  // For Accordion
  root: {
    borderRadius: theme.radius.lg,
    paddingLeft: 25,
    width: '400px',
    // outline: 'none',
    paddingTop: 20,
    paddingBottom: 20,

    '&[data-active]': {
      paddingTop: 20,
    },
  },
  control: {
    borderRadius: theme.radius.lg,
    // outline: '0.5px solid ',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.2)', // 20% white on hover
    },
  },
  content: {
    borderRadius: theme.radius.lg,
  },
  panel: {
    borderRadius: theme.radius.lg,
  },
  item: {
    backgroundColor: 'bg-transparent',
    // border: `${rem(1)} solid transparent`,
    border: `solid transparent`,
    borderRadius: theme.radius.lg,
    position: 'relative',
    // zIndex: 0,
    transition: 'transform 150ms ease',
    outline: 'none',

    '&[data-active]': {
      transform: 'scale(1.03)',
      backgroundColor: '#15162b',
      borderRadius: theme.radius.lg,
      boxShadow: theme.shadows.xl,
    },
    '&:hover': {
      backgroundColor: 'bg-transparent',
    },
  },

  chevron: {
    '&[data-rotate]': {
      transform: 'rotate(180deg)',
    },
  },
}))

const SupportedFileUploadTypes = () => {
  const { classes, theme } = useStyles()
  // className={classes.wrapper}

  return (
    <>
      <Title
        className={`${montserrat_heading.variable} font-montserratHeading`}
        variant="gradient"
        gradient={{ from: 'gold', to: 'white', deg: 50 }}
        order={4}
        p="xl"
      >
        Supported File Types
      </Title>

      <Flex className="space-x-0">
        <Image
          src="/media/pdf_logo.png"
          width={720}
          height={400}
          quality={85}
          alt="PDF icon"
          className={classes.logos}
        />
        <Image
          src="/media/word_logo.png"
          width={2000}
          height={2000}
          quality={80}
          alt="Word logo"
          className={classes.logos}
        />
        <Image
          src="/media/ppt_logo.png"
          width={720}
          height={220}
          quality={80}
          alt="Powerpoint logo"
          className={classes.logos}
        />
        <Image
          src="/media/excel_logo.png"
          width={720}
          height={220}
          quality={80}
          alt="Powerpoint logo"
          className={classes.logos}
        />
      </Flex>
      <div className="p-2" />
      {/* 2nd ROW  */}
      <Flex>
        <Image
          src="/media/video_clapboard_icon.png"
          width={720}
          height={100}
          quality={60}
          color="white"
          alt="Generic video icon"
          className={classes.logos}
        />
        <IconPhoto
          size={'54px'}
          strokeWidth={2}
          color={'white'}
          className={classes.logos}
        />
        <Image
          src="/media/audio_logo.png"
          width={720}
          height={220}
          quality={60}
          alt="Generic audio icon"
          className={classes.logos}
        />
        <Image
          src="/media/cc_logo.jpg"
          width={720}
          height={220}
          quality={60}
          alt="Closed caption icon"
          className={classes.logos}
        />
      </Flex>
      <div className="p-2" />
      {/* THIRD ROW */}
      <Flex>
        <Image
          src="/media/canvas_logo.png"
          width={720}
          height={100}
          quality={60}
          alt="Canvas logo"
          className={classes.logos}
          // Had to force it down a few pixels, looked weird otherwise
          // style={{ position: 'relative', top: '7px' }}
        />
        <Image
          src="/media/mitocw_logo.jpg"
          width={720}
          height={100}
          quality={60}
          alt="MIT Open Courseware logo"
          className={classes.logos}
        />
        <Image
          src="/media/github-mark-white.png"
          width={720}
          height={100}
          quality={60}
          alt="Github logo"
          className={classes.logos}
          // className={classes.smallLogos}
          // style={{mixBlendMode: 'multiply' }}
        />
        <Image
          src="/media/notion_logo.png"
          width={720}
          height={100}
          quality={60}
          alt="Notion logo"
          className={classes.logos}
          // className={classes.smallLogos}
          // style={{mixBlendMode: 'multiply' }}
        />
      </Flex>

      <div className="p-1" />
      <Text style={{ paddingTop: '8px' }}>
        And literally any text file:{' '}
        {/* < code className={classes.codeStyledText} ></code >, {' '} */}
        <code className={classes.codeStyledText}>txt</code>,{' '}
        <code className={classes.codeStyledText}>code</code>,{' '}
        <code className={classes.codeStyledText}>utf-8</code> ...
      </Text>

      <Accordion
        pl={20}
        pr={4}
        style={{ borderRadius: 'theme.radius.lg' }}
        classNames={{
          item: classes.item,
          chevron: classes.chevron,
          panel: classes.panel,
        }}
        className={classes.root}
      >
        <Accordion.Item
          value="openai-key-details"
          className={classes.item}
          style={{ backgroundColor: '#292c5b' }}
        >
          <Accordion.Control className={classes.control}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                width: '100%',
                borderRadius: theme.radius.lg,
              }}
            >
              <Text
                className={`label ${montserrat_paragraph.variable} inline-block p-0 font-montserratParagraph text-neutral-200`}
                size={'md'}
              >
                <span className={'text-white'}>Integrations</span> 👇
              </Text>
            </div>
          </Accordion.Control>
          <Accordion.Panel bg={'#15162b'}>
            <Text
              className={`${montserrat_paragraph.variable} p-0 font-montserratParagraph text-neutral-200`}
              size={'sm'}
              style={{ textAlign: 'left' }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  paddingBottom: '3px',
                }}
              >
                <Image
                  src="/media/github-mark-white.png"
                  width={720}
                  height={100}
                  quality={60}
                  alt="Github logo"
                  className="w-[50px]"
                />
              </div>
              <strong>For GitHub</strong>, just enter a URL like{' '}
              <code className={classes.codeStyledText}>
                github.com/USER/REPO
              </code>
              , for example:{' '}
              <span className={'text-purple-600'}>
                <Link
                  target="_blank"
                  rel="noreferrer"
                  href={'https://github.com/langchain-ai/langchain'}
                >
                  https://github.com/langchain-ai/langchain
                </Link>
              </span>
              . We&apos;ll ingest all files in the main branch. Ensure the
              repository is public.
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  paddingBottom: '3px',
                }}
              >
                <Image
                  src="/media/canvas_logo.png"
                  width={720}
                  height={100}
                  quality={60}
                  alt="Github logo"
                  className="w-[50px]"
                />
              </div>
              <strong>For Canvas</strong>, just enter a URL like{' '}
              <code className={classes.codeStyledText}>
                canvas.illinois.edu/courses/COURSE_CODE
              </code>
              , for example:{' '}
              <span className={'text-purple-600'}>
                <Link
                  target="_blank"
                  rel="noreferrer"
                  href={'https://canvas.illinois.edu/courses/37348'}
                >
                  https://canvas.illinois.edu/courses/37348
                </Link>
              </span>
              .
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  paddingBottom: '3px',
                  paddingTop: '4px',
                }}
              >
                <Image
                  src="/media/mitocw_logo.jpg"
                  width={720}
                  height={100}
                  quality={60}
                  alt="MIT Open Course Ware logo"
                  className="w-[50px]"
                />
              </div>
              <strong>For MIT Open Course Ware</strong>, just enter a URL like{' '}
              <code className={classes.codeStyledText}>
                ocw.mit.edu/courses/ANY_COURSE
              </code>{' '}
              , for example:{' '}
              <span className={'text-purple-600'}>
                <Link
                  target="_blank"
                  rel="noreferrer"
                  href={
                    'https://ocw.mit.edu/courses/8-321-quantum-theory-i-fall-2017'
                  }
                >
                  https://ocw.mit.edu/courses/8-321-quantum-theory-i-fall-2017
                </Link>
              </span>
              .
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  paddingBottom: '3px',
                  paddingTop: '3px',
                }}
              >
                <Image
                  src="/media/coursera_logo_cutout.png"
                  width={720}
                  height={100}
                  quality={60}
                  alt="Coursera logo"
                  className="w-[50px]"
                  style={{ display: 'flex', justifyContent: 'center' }}
                />
              </div>
              <strong>For Coursera</strong>, it&apos;s probably easiest to
              manually export the content then upload it here. Or{' '}
              <span className={'text-purple-600'}>
                <Link
                  target="_blank"
                  rel="noreferrer"
                  href={'mailto:kvday2@illinois.edu'}
                >
                  email me
                </Link>
              </span>{' '}
              and we can do a direct ingest, we&apos;re limited by
              Coursera&apos;s controls on login/auth.
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  paddingBottom: '3px',
                  paddingTop: '3px',
                }}
              >
                <Image
                  src="/media/notion_logo.png"
                  width={720}
                  height={100}
                  quality={60}
                  alt="Notion logo"
                  className="w-[50px]"
                  style={{ display: 'flex', justifyContent: 'center' }}
                />
              </div>
              <strong>For Notion</strong>, manually Export your pages to local
              files, then ingest those. It works great.
            </Text>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </>
  )
}

export default SupportedFileUploadTypes
