import Image from 'next/image'
import { type NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import React from 'react'

import {
  // MantineProvider,
  rem,
  Card,
  Text,
  Title,
  Badge,
  Button,
  Group,
  Flex,
} from '@mantine/core'

import { LandingPageHeader } from '~/components/UIUC-Components/navbars/GlobalHeader'
import GlobalFooter from '~/components/UIUC-Components/GlobalFooter'
import { montserrat_heading, montserrat_paragraph } from 'fonts'

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>UIUC.chat</title>
        <meta
          name="description"
          content="Chat with your documents, with full support for any format and web scraping."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <LandingPageHeader />
      <main
        className={`illinois-blue-gradient-bg flex min-h-screen flex-col items-center justify-center
          ${montserrat_paragraph.variable} font-montserratParagraph`}
      >
        <div className="container flex w-full max-w-5xl flex-col items-center justify-center gap-4 px-8 py-8 sm:py-20">
          <div
            className="
            flex w-full
            max-w-3xl flex-col items-start justify-center
            gap-8 sm:flex-row
          "
          >
            <div className="sm:w-1/2 ">
              <div
                style={{ color: 'var(--illinois-blue)', lineHeight: '110%' }}
                className={`
                  text-3xl font-bold sm:mt-4
                  sm:text-3xl
                  ${montserrat_heading.variable} font-montserratHeading
                `}
              >
                <h2>
                  Create a chatbot with{' '}
                  <span class="whitespace-nowrap">your content.</span>
                </h2>
                <h2 className="mt-4">
                  Share it with <span class="whitespace-nowrap">a click.</span>
                </h2>
              </div>

              <div className="mb-8 mt-4 text-sm text-neutral-400">
                Build an AI-teaching assistant, literature review, document
                search, <span class="whitespace-nowrap">and more.</span>
              </div>

              <Button
                variant="light"
                style={{
                  backgroundColor: 'var(--illinois-orange)',
                  color: 'var(--illinois-white)',
                }}
                radius="sm"
              >
                Try it out{' '}
                <ArrowNarrowRight size={32} strokeWidth={1} color={'white'} />
              </Button>
            </div>

            <div className="order-first text-center sm:order-last sm:w-1/2">
              <div
                className="min-h-8 rounded-xl p-10"
                style={{ background: 'var(--illinois-orange-gradient)' }}
              >
                <img
                  src="/media/banner_upload_materials.png"
                  className="rounded-xl"
                ></img>
              </div>

              <div className="mt-2 text-xs text-neutral-400">
                Bring your knowledge, go to{' '}
                <a href="http://chat.Illinois.edu/new" target="_blank">
                  chat.Illinois.edu/new
                </a>
              </div>
            </div>
          </div>

          {/*
          <h1 className="mt-8 text-5xl font-extrabold tracking-tight sm:text-[5rem]">
            UIUC.<span className="text-[var(--illinois-orange)]">chat</span>
          </h1>

          <div>
            <Title
              color="var(--illinois-storm-dark)"
              order={2}
              variant="gradient"
              weight={800}
              gradient={{
                from: 'var(--illinois-orange)',
                to: 'var(--illinois-industrial)',
                deg: 45
              }}
              ta="center"
              mt="md"
            >
              Upload anything. Search everything.
              <br></br>
              <span className="home-header_text-underline">Discover More.</span>
            </Title>

            <Text color="var(--illinois-orange)" ta="center" weight={500} size="lg">
              <span className="font-bold">Upload</span> your videos, any number
              of PDFs, PowerPoint, Word, Excel and almost anything other
              document to chat with your knowledge base.
            </Text>
          </div>
*/}

          <Title order={3} className="mt-16">
            Flagship Chatbots
          </Title>

          <div className="text-sm text-neutral-400">
            Dive right into our bots trained on everything Illinois
          </div>

          {/*
          <ListProjectTable />
*/}
          <div
            className="
            mt-4
            flex w-full max-w-5xl
            flex-col items-center
            gap-8 sm:flex-row
          "
          >
            <CourseCard />
          </div>
        </div>

        {/* orange banner */}
        <div
          style={{ background: 'var(--illinois-orange-gradient)' }}
          className="
          my-14
          flex w-full items-center
          justify-center px-4
          py-36 sm:my-0
        "
        >
          <div
            className={`
            whitespace-wrap flex flex-col items-center
            justify-center gap-3

            text-center text-2xl font-bold
            text-white sm:flex-row

            sm:whitespace-nowrap md:text-3xl

            ${montserrat_heading.variable} font-montserratHeading
          `}
          >
            <div className="">
              An AI that knows <span class="whitespace-nowrap">about your</span>
            </div>

            <div className="">_________</div>
          </div>
        </div>

        {/* second section below the orange banner */}
        <div className="container flex w-full max-w-5xl flex-col items-center justify-center gap-4 px-8 py-8 sm:py-20">
          <h2
            className={`
            text-4xl font-bold
            ${montserrat_heading.variable} font-montserratHeading
          `}
          >
            How Illinois Chat works
          </h2>

          {/* step 1 */}
          <div className="w-full max-w-3xl">
            <div
              className="
              mt-4 flex
              flex-col items-start justify-center gap-2 sm:mt-20
              sm:flex-row sm:gap-16
            "
            >
              <div
                className="min-h-8 rounded-xl p-10 sm:order-last sm:w-1/2"
                style={{ background: 'var(--illinois-orange-gradient)' }}
              >
                <img
                  src="/media/banner_upload_materials.png"
                  className="rounded-xl"
                ></img>
              </div>

              <div className="sm:order-first sm:w-1/2">
                <div className="flex items-center gap-4 sm:mt-8">
                  <div
                    className={`
                      text-4xl font-black
                      ${montserrat_heading.variable} font-montserratHeading
                    `}
                    style={{ color: 'var(--illinois-orange)' }}
                  >
                    1
                  </div>
                  <div
                    className={`
                    text-xl font-bold
                    ${montserrat_heading.variable} font-montserratHeading
                  `}
                  >
                    Connect your documents{' '}
                    <span className="whitespace-nowrap">and tools</span>
                  </div>
                </div>

                <div className="mt-4">
                  Subtitle ipsum dolor sit amet consectetur adipiscing elit Ut
                  et massa mi. Aliquam in hendrerit urna. Pellentesque sit amet
                  sapien fringilla, mattis.
                </div>
                {/*
                <Button
                  className="mt-4 bg-neutral-400"
                  variant="light"
                  style={{
                    color: 'var(--illinois-white)',
                    backgroundColor: 'var(--illinois-blue)',
                  }}
                  radius="sm"
                >
                  Learn More{' '}
                  <ExternalLink
                    size={20}
                    strokeWidth={1.75}
                    color={'var(--illinois-white)'}
                    className="ml-1"
                  />
                </Button>
*/}
              </div>
            </div>

            {/* step 2 */}
            <div
              className="
              mt-12 flex
              flex-col items-start justify-center gap-2 sm:mt-20
              sm:flex-row sm:gap-16
            "
            >
              <div
                className="min-h-8 rounded-xl p-10 sm:w-1/2"
                style={{ background: 'var(--illinois-orange-gradient)' }}
              >
                <img
                  src="/media/banner_upload_materials.png"
                  className="rounded-xl"
                ></img>
              </div>

              <div className="sm:w-1/2">
                <div className="flex items-center gap-4 sm:mt-8">
                  <div
                    className={`
                      text-4xl font-black
                      ${montserrat_heading.variable} font-montserratHeading
                    `}
                    style={{ color: 'var(--illinois-orange)' }}
                  >
                    2
                  </div>
                  <div
                    className={`
                    text-xl font-bold
                    ${montserrat_heading.variable} font-montserratHeading
                  `}
                  >
                    Customize prompts, tools{' '}
                    <span className="whitespace-nowrap">
                      and LLMs <span className="font-normal">(optional)</span>
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  Subtitle ipsum dolor sit amet consectetur adipiscing elit Ut
                  et massa mi. Aliquam in hendrerit urna. Pellentesque sit amet
                  sapien fringilla, mattis.
                </div>
                {/*
                <Button
                  className="mt-4 bg-neutral-400"
                  variant="light"
                  style={{
                    color: 'var(--illinois-white)',
                    backgroundColor: 'var(--illinois-blue)',
                  }}
                  radius="sm"
                >
                  Learn More{' '}
                  <ExternalLink
                    size={20}
                    strokeWidth={1.75}
                    color={'var(--illinois-white)'}
                    className="ml-1"
                  />
                </Button>
*/}
              </div>
            </div>

            {/* step 3 */}
            <div
              className="
              mt-12 flex
              flex-col items-start justify-center gap-2 sm:mt-20
              sm:flex-row sm:gap-16
            "
            >
              <div
                className="min-h-8 rounded-xl p-10 sm:order-last sm:w-1/2"
                style={{ background: 'var(--illinois-orange-gradient)' }}
              >
                <img
                  src="/media/banner_upload_materials.png"
                  className="rounded-xl"
                ></img>
              </div>

              <div className="sm:order-first sm:w-1/2">
                <div className="flex items-center gap-4 sm:mt-8">
                  <div
                    className={`
                      text-4xl font-black
                      ${montserrat_heading.variable} font-montserratHeading
                    `}
                    style={{ color: 'var(--illinois-orange)' }}
                  >
                    3
                  </div>
                  <div
                    className={`
                    text-xl font-bold
                    ${montserrat_heading.variable} font-montserratHeading
                  `}
                  >
                    Customize prompts, tools{' '}
                    <span className="whitespace-nowrap">
                      and LLMs <span className="font-normal">(optional)</span>
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  Subtitle ipsum dolor sit amet consectetur adipiscing elit Ut
                  et massa mi. Aliquam in hendrerit urna. Pellentesque sit amet
                  sapien fringilla, mattis.
                </div>
                {/*
                <Button
                  className="mt-4 bg-neutral-400"
                  variant="light"
                  style={{
                    color: 'var(--illinois-white)',
                    backgroundColor: 'var(--illinois-blue)',
                  }}
                  radius="sm"
                >
                  Learn More{' '}
                  <ExternalLink
                    size={20}
                    strokeWidth={1.75}
                    color={'var(--illinois-white)'}
                    className="ml-1"
                  />
                </Button>
*/}
              </div>
            </div>
          </div>
        </div>

        {/* blue banner */}
        <div
          style={{ background: 'var(--illinois-blue-gradient)' }}
          className="
          my-12
          flex w-full items-center
          justify-center px-8
          py-12 text-white sm:my-0
          sm:py-36
        "
        >
          <div
            className="
            flex w-full
            max-w-3xl flex-col items-start justify-center gap-16
            text-white sm:flex-row

            sm:gap-16
          "
          >
            <div className="sm:w-1/2">
              <h2
                className={`
                text-xl font-bold
                ${montserrat_heading.variable} font-montserratHeading
              `}
              >
                Ready to build?
              </h2>

              <div className="mt-4">
                If features like custom LLMs, 52+ models to choose from, and
                APIs are important to you (and you understand what those mean),
                then you’ll be excited to know we support all of that and more.
              </div>

              <Button
                className="mt-8 bg-neutral-400"
                variant="light"
                style={{
                  color: 'var(--illinois-white)',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--illinois-white)',
                }}
                radius="sm"
              >
                Learn More{' '}
                <ExternalLink
                  size={20}
                  strokeWidth={1.75}
                  color={'var(--illinois-white)'}
                  className="ml-1"
                />
              </Button>
            </div>

            <div className="sm:w-1/2">
              <h2
                className={`
                text-xl font-bold
                ${montserrat_heading.variable} font-montserratHeading
              `}
              >
                Want something custom?
              </h2>

              <div className="mt-4">
                We build features for industry partners to bring GenAI to their
                org. Reach out at <a href="mailto:hi@uiuc.chat">hi@uiuc.chat</a>
              </div>
            </div>
          </div>
        </div>

        {/* second section below the blue banner */}
        <div className="container flex w-full max-w-5xl flex-col items-center justify-center gap-4 px-8 py-8 sm:py-20">
          <h4
            className={`
            text-4xl font-extrabold tracking-tight
            ${montserrat_heading.variable} font-montserratHeading
          `}
          >
            About Us
          </h4>
          <div className="mt-4 grid grid-cols-1 gap-14 sm:grid-cols-2 md:gap-8">
            <Link
              className="bg-[var(--illinois-white)]/10 flex max-w-xs flex-col gap-4 rounded-xl sm:p-4 "
              href="https://github.com/kastanday/ai-ta-frontend"
              target="_blank"
            >
              <h3
                className={`
                text-2xl font-bold
                ${montserrat_heading.variable} font-montserratHeading
              `}
              >
                Read the code
              </h3>
              <div className="text-lg">
                100% free<br></br>100% open source &#40;MIT License&#41;
                <br></br>100% awesome
              </div>
            </Link>
            <Link
              className="bg-[var(--illinois-white)]/10 flex max-w-xs flex-col gap-4 rounded-xl sm:p-4 "
              href="https://ai.ncsa.illinois.edu/"
              target="_blank"
            >
              <h3
                className={`
                text-2xl font-bold
                ${montserrat_heading.variable} font-montserratHeading
              `}
              >
                Sponsored by the Center of{' '}
                <span class="whitespace-nowrap">AI Innovation</span>
              </h3>
              <div className="text-lg">
                Part of the National Center for Supercomputing Applications.
              </div>
            </Link>
            <Link
              className="bg-[var(--illinois-white)]/10 flex max-w-xs flex-col gap-4 rounded-xl sm:p-4 "
              href="https://kastanday.com/"
              target="_blank"
            >
              <h3
                className={`
                text-2xl font-bold
                ${montserrat_heading.variable} font-montserratHeading
              `}
              >
                Bio
              </h3>
              <div className="text-lg">
                Made by Kastan Day at the University of Illinois.
              </div>
              {/* <div className="text-lg">Sponsored by the </div> */}
            </Link>

            <Link
              className="bg-[var(--illinois-white)]/10 flex max-w-xs flex-col gap-4 rounded-xl sm:p-4"
              href="https://status.uiuc.chat/"
              target="_blank"
            >
              {/* text-[var(--illinois-white)] hover:bg-[var(--illinois-white)]/20 */}
              <h3
                className={`
                text-2xl font-bold
                ${montserrat_heading.variable} font-montserratHeading
              `}
              >
                Status page
              </h3>
              {/* <div className="text-lg">Check service uptime.</div> */}
              <Image
                src="https://status.uiuc.chat/api/badge/1/uptime/24?label=Uptime%2024%20hours"
                alt="Service Uptime Badge"
                width={150}
                height={50}
              />
              <Image
                src="https://status.uiuc.chat/api/badge/1/uptime/720?label=Uptime%2030%20days"
                alt="Service Uptime Badge"
                width={150}
                height={50}
              />
            </Link>
          </div>
        </div>

        {/* search */}
        {/* <script async src="https://cse.google.com/cse.js?cx=2616b82a523e047b2">
        </script>
        <div className="gcse-search"></div> */}
        <GlobalFooter />
      </main>
    </>
  )
}

export default Home

import { createStyles, SimpleGrid, Container } from '@mantine/core'
import { IconGauge, IconUser, IconCookie } from '@tabler/icons-react'
import { ArrowNarrowRight, ExternalLink } from 'tabler-icons-react'
import ListProjectTable from '~/components/UIUC-Components/ProjectTable'

const mockdata = [
  {
    title: 'Faster than ChatGPT, with better prompts',
    description:
      'It is said to have an IQ of 5,000 and is a math genius, and can answer any question you throw at it.',
    icon: IconGauge,
  },
  {
    title: 'Course Specific',
    description:
      'Made by your professor, with all your course materials for hyper-detailed answers.',
    icon: IconUser,
  },
  {
    title: 'Upload anything, get answers',
    description:
      'Add your own study materials and get answers from the AI. Optionally, share these with your classmates.',
    icon: IconCookie,
  },
]

const useStyles = createStyles((theme) => ({
  title: {
    fontSize: rem(34),
    fontWeight: 900,

    [theme.fn.smallerThan('sm')]: {
      fontSize: rem(24),
    },
  },

  description: {
    maxWidth: 600,
    margin: 'auto',

    '&::after': {
      content: '""',
      display: 'block',
      backgroundColor: 'var(--illinois-white)',
      width: rem(45),
      height: rem(2),
      marginTop: theme.spacing.sm,
      marginLeft: 'auto',
      marginRight: 'auto',
    },
  },

  card: {
    border: `${rem(1)} solid var(--illinois-storm-light)`,
  },

  cardTitle: {
    '&::after': {
      content: '""',
      display: 'block',
      backgroundColor: 'var(--illinois-white)',
      width: rem(45),
      height: rem(2),
      marginTop: theme.spacing.sm,
    },
  },
}))

export function FeaturesCards() {
  const { classes, theme } = useStyles()
  const features = mockdata.map((feature) => (
    <Card
      bg="var(--illinois-background-darker)"
      key={feature.title}
      shadow="md"
      radius="md"
      className={classes.card}
      padding="xl"
      style={{ position: 'relative', minHeight: '100%' }}
    >
      <feature.icon size={rem(50)} stroke={2} color="var(--illinois-orange)" />
      <Text
        color="var(--illinois-white)"
        fz="lg"
        fw={500}
        className={classes.cardTitle}
        mt="md"
      >
        {feature.title}
      </Text>
      <Text
        style={{ color: 'var(--illinois-white)' }}
        fz="sm"
        c="dimmed"
        mt="sm"
      >
        {feature.description}
      </Text>
    </Card>
  ))

  return (
    // <Container size="lg" py="xl" style={{ position: 'relative' }}>

    <SimpleGrid
      cols={3}
      spacing="xl"
      mt={50}
      breakpoints={[{ maxWidth: 'md', cols: 1 }]}
    >
      {features}
    </SimpleGrid>
  )
}

// TODO: USE BETTER CARDS! https://ui.mantine.dev/category/article-cards
function CourseCard() {
  const cards = [
    {
      course_slug: 'ece120',
      imageSrc: '/media/hero_courses_banners/ECE_logo.jpg',
      title: 'Electrical & Computer Engineering, ECE 120',
      badge: 'ECE @ UIUC',
      description:
        'Prof. Volodymyr (Vlad) Kindratenko, Director of the Center for Artificial Intelligence Innovation at NCSA, in Fall 2023. We also have <a href="/ECE220FA23/chat">ECE 220</a> & <a href="/ECE408FA23/chat">ECE 408</a>.',
    },
    {
      course_slug: 'NCSA',
      imageSrc: '/media/hero_courses_banners/NCSA_more_than_imagine.jpg',
      title: 'NCSA',
      badge: 'NCSA Docs',
      description:
        "Using all of NCSA's public information, get answers for detailed questions about the organization.",
    },
    {
      course_slug: 'NCSADelta',
      imageSrc: '/media/hero_courses_banners/delta_hero.jpg',
      title: 'NCSA Delta Documentation',
      badge: 'NCSA Docs',
      description:
        "Using all of Delta's documentation, get detailed examples, advice and information about how to use the Delta supercomputer.",
    },
    /*
    {
      course_slug: 'clowder-docs',
      imageSrc: '/media/hero_courses_banners/clowder_logo.png',
      title: 'Clowder docs',
      badge: 'NCSA Docs',
      description:
        "Using all of Clowder's documentation, this bot will answer questions and point you to the right docs and YouTube videos about Clowder.",
    },
    {
      course_slug: 'cropwizard-1.5',
      imageSrc: '/media/hero_courses_banners/aifarms_wide_logo.png',
      title: 'Crop Wizard',
      badge: 'AIFARMS',
      description:
        'Using documents collected from the <a href="https://www.nifa.usda.gov/about-nifa/how-we-work/extension" target="_blank" rel="noopener noreferrer">Farm Extension division</a> at all the US\'s public land-grant universities, this bot acts as a crop advisor. Useful to both farmers and professional farm advisors. Make sure to use image uploads with GPT4-Vision whenever possible!',
    },
    {
      course_slug: 'langchain-docs',
      // imageSrc: "",
      title: 'Langchain',
      badge: 'Coding',
      description:
        "Using all of Langchain's documentation, this bot will write excellent LangChain code. Just ask it to program whatever you'd like.",
    },
    {
      course_slug: 'ansible',
      // imageSrc: "",
      title: 'Ansible',
      badge: 'Coding',
      description:
        "Using all of Ansible's documentation, this bot will write excellent Ansible scripts. Just ask it to program whatever you'd like.",
    },
    {
      course_slug: 'lilian-weng-blog',
      // imageSrc: '/media/hero_courses_banners/lilian_weng_blog.png',
      title: 'Lilian Wang Blog (OpenAI popular topics)',
      badge: 'LLMs',
      description:
        'A collection of Lilian Wang\'s blog posts, some of the best in the AI world, from here: <a href="https://lilianweng.github.io/" target="_blank" rel="noopener noreferrer">https://lilianweng.github.io</a>.',
    },
*/
    // Add more cards here
  ]

  return (
    <>
      {cards.map((card) => (
        <Card
          key={card.course_slug}
          component="a"
          href={`/${card.course_slug}/chat`}
          target="_blank"
          radius="md"
          className=""
          style={{
            height: '12rem',
            background: 'var(--background)',
            'box-shadow': '4px 4px 10px rgba(0,0,0, .2)',
          }}
        >
          {/*

          bg="var(--background)"
          className=""
          style={{
            width: 'calc(100% / 3)',
          }}
          shadow="xl"
          padding="lg"
          radius="sm"
*/}

          <Card.Section>
            <div
              className={`
                flex items-center px-3 text-sm font-semibold text-neutral-600
                ${montserrat_heading.variable} font-montserratHeading
              `}
              style={{ height: '2rem' }}
            >
              {card.badge}
            </div>
          </Card.Section>

          {card.imageSrc && (
            <Card.Section>
              <div
                className="flex items-center overflow-hidden px-3"
                style={{ height: '8rem' }}
              >
                <Image
                  src={card.imageSrc}
                  width={720}
                  height={100}
                  quality={80}
                  alt={`A photo representing ${card.title}`}
                  style={{
                    display: 'block',
                    width: '100%',
                    height: 'auto', // '100%',
                    objectFit: 'fill', //'cover',
                  }}
                />
              </div>
            </Card.Section>
          )}

          <Card.Section>
            <div
              className="flex items-center gap-2 px-3"
              style={{ height: '2rem' }}
            >
              <div
                className="
                rounded-md bg-neutral-100
                px-2
                py-1 text-xs
                text-neutral-600
              "
              >
                {card.badge}
              </div>

              <div className="flex grow justify-end">
                <ArrowNarrowRight size={32} strokeWidth={1.25} color={'#888'} />
              </div>
            </div>
          </Card.Section>

          {/*

old code and can be removed

          {card.imageSrc && (
            // <Card.Section style={{ height: 'auto' }}>
            <Card.Section style={{ height: '8rem' }}>
              <Link href={`/${card.course_slug}/chat`}>
                <Image
                  src={card.imageSrc}
                  width={720}
                  height={100}
                  quality={80}
                  alt={`A photo representing ${card.title}`}
                  style={{
                    display: 'block',
                    width: '100%',
                    height: 'auto', // '100%',
                    objectFit: 'fill', //'cover',
                  }}
                />
              </Link>
            </Card.Section>
          )}

          <Card.Section className="pb-2 pl-4 pr-4 pt-2">
            <Group position="apart" mt="md" mb="xs">
              <Text
                className={`${montserrat_heading.variable} font-montserratHeading`}
              >
                {card.title}
              </Text>
              <Badge size="xl" color="var(--illinois-orange)" variant="light">
                {card.badge}
              </Badge>
            </Group>

            <Text size="sm" color="dimmed">
              <div
                dangerouslySetInnerHTML={{
                  __html: card.description.replace(
                    /<a/g,
                    '<a style="color: var(--illinois-arches); text-decoration: underline;"',
                  ),
                }}
              />
            </Text>

            <Link href={`/${card.course_slug}/chat`}>
              <Button
                variant="light"
                style={{
                  backgroundColor: 'var(--illinois-industrial)',
                  color: 'var(--illinois-white)',
                }}
                fullWidth
                mt="md"
                radius="md"
              >
                View
              </Button>
            </Link>
          </Card.Section>
*/}
        </Card>
      ))}
    </>
  )
}
