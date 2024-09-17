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

      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#0E1116]">
        <div className="container flex w-full max-w-[95vw] flex-col items-center justify-center gap-4 px-4 py-8">
          <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
            UIUC.<span className="text-[hsl(280,100%,70%)]">chat</span>
          </h1>
          <div className="w-full max-w-4xl">
            {/* size="lg"
            py="l"
            style={{ position: 'relative', minHeight: '100%' }} */}
            <Title
              color="#57534e"
              order={2}
              variant="gradient"
              weight={800}
              // gradient={{ from: 'indigo', to: 'cyan', deg: 45 }}
              gradient={{ from: 'pink', to: 'blue', deg: 45 }}
              ta="center"
              mt="md"
            >
              Upload anything. Search everything.
              <br></br>
              <span className="home-header_text-underline">Discover More.</span>
            </Title>

            {/* <Text color="#57534e" c="dimmed" ta="center" mt="md">
              *Factuality not guaranteed.
              <br></br>
              Test it in your area of expertise to best assess its capabilities.
            </Text> */}

            <Text color="white" ta="center" weight={500} size="lg">
              <span className="font-bold">Upload</span> your videos, any number
              of PDFs, PowerPoint, Word, Excel and almost anything other
              document to chat with your knowledge base.
            </Text>
          </div>

          <ListProjectTable />

          <Title color="white" order={3}>
            Explore the Courses
          </Title>

          {/* Main courses */}
          <CourseCard />

          <h4 className="font-extrabold tracking-tight text-white sm:text-[3rem]">
            <div>
              Some background{' '}
              <span className="text-[hsl(280,100%,70%)]">about us</span>
            </div>
          </h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
            <Link
              className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 text-white hover:bg-white/20"
              href="https://github.com/kastanday/ai-ta-frontend"
              target="_blank"
            >
              <h3 className="text-2xl font-bold">Read the code →</h3>
              <div className="text-lg">
                100% free<br></br>100% open source &#40;MIT License&#41;
                <br></br>100% awesome
              </div>
            </Link>
            <Link
              className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 text-white hover:bg-white/20"
              href="https://ai.ncsa.illinois.edu/"
              target="_blank"
            >
              <h3 className="text-2xl font-bold">
                Sponsored by the Center of AI Innovation
              </h3>
              <div className="text-lg">
                Part of the National Center for Supercomputing Applications.
              </div>
            </Link>
            <Link
              className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 text-white hover:bg-white/20"
              href="https://kastanday.com/"
              target="_blank"
            >
              <h3 className="text-2xl font-bold">Bio 👋</h3>
              <div className="text-lg">
                Made by Kastan Day at the University of Illinois.
              </div>
              {/* <div className="text-lg">Sponsored by the </div> */}
            </Link>

            <Link
              className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 text-white hover:bg-white/20"
              href="https://status.uiuc.chat/"
              target="_blank"
            >
              <h3 className="text-2xl font-bold">Status page 📊</h3>
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
      backgroundColor: 'white', //theme.fn.primaryColor(),
      width: rem(45),
      height: rem(2),
      marginTop: theme.spacing.sm,
      marginLeft: 'auto',
      marginRight: 'auto',
    },
  },

  card: {
    border: `${rem(1)} solid ${
      theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[1]
    }`,
  },

  cardTitle: {
    '&::after': {
      content: '""',
      display: 'block',
      backgroundColor: 'white', //theme.fn.primaryColor(),
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
      bg="#0E1116"
      key={feature.title}
      shadow="md"
      radius="md"
      className={classes.card}
      padding="xl"
      style={{ position: 'relative', minHeight: '100%' }}
    >
      <feature.icon size={rem(50)} stroke={2} color="#C06BF9" />
      <Text
        color="white"
        fz="lg"
        fw={500}
        className={classes.cardTitle}
        mt="md"
      >
        {feature.title}
      </Text>
      <Text style={{ color: 'white' }} fz="sm" c="dimmed" mt="sm">
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
    // Add more cards here
  ]

  return (
    <>
      {cards.map((card) => (
        <div
          key={card.course_slug}
          className="box-sizing: border-box; border: 100px solid #ccc;"
        >
          <Card
            bg="#0E1116"
            style={{
              width: '80vw',
              height: 'auto',
            }}
            shadow="sm"
            padding="lg"
            radius="md"
            withBorder
          >
            {card.imageSrc && (
              // <Card.Section style={{ height: 'auto' }}>
              <Card.Section style={{ height: '15vw' }}>
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
                      height: '100%',
                      objectFit: 'cover',
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
                <Badge size="xl" color="pink" variant="light">
                  {card.badge}
                </Badge>
              </Group>

              <Text size="sm" color="dimmed">
                <div
                  dangerouslySetInnerHTML={{
                    __html: card.description.replace(
                      /<a/g,
                      '<a style="color: lightblue; text-decoration: underline;"',
                    ),
                  }}
                />
              </Text>

              <Link href={`/${card.course_slug}/chat`}>
                <Button
                  variant="light"
                  color="blue"
                  fullWidth
                  mt="md"
                  radius="md"
                >
                  View
                </Button>
              </Link>
            </Card.Section>
          </Card>
        </div>
      ))}
    </>
  )
}
