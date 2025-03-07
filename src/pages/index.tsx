import Image from 'next/image'
import { type NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import React, { useState, useEffect } from 'react'
import { ArrowNarrowRight, ExternalLink } from 'tabler-icons-react'
import ProjectTable from '~/components/UIUC-Components/ProjectTable'
import { Card, Button } from '@mantine/core'

import { LandingPageHeader } from '~/components/UIUC-Components/navbars/GlobalHeader'
import GlobalFooter from '~/components/UIUC-Components/GlobalFooter'
import { montserrat_heading, montserrat_paragraph, doto_font } from 'fonts'

// Typing animation component
const TypingAnimation: React.FC = () => {
  const words = [
    'personal portfolio',
    'favorite websites',
    'research',
    'academic journals',
    'GitHub',
    'business',
    'favorite blogs',
    'clubs',
  ]

  const [displayText, setDisplayText] = useState('')
  const [wordIndex, setWordIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const currentWord = words[wordIndex] || ''

    // Set typing/deleting speed (in ms)
    const typingSpeed = 75 // Slightly slower typing for readability
    const deletingSpeed = 40 // Slightly slower deletion for readability
    const pauseBeforeDelete = 1500 // Longer pause to allow reading
    const pauseBeforeNewWord = 300 // Brief pause between words

    let timer: NodeJS.Timeout

    if (isDeleting) {
      // Deleting mode
      if (displayText) {
        timer = setTimeout(() => {
          setDisplayText(displayText.slice(0, -1))
        }, deletingSpeed)
      } else {
        // When fully deleted, pause briefly before moving to next word
        timer = setTimeout(() => {
          setIsDeleting(false)
          setWordIndex((prevIndex) => (prevIndex + 1) % words.length)
        }, pauseBeforeNewWord)
      }
    } else {
      // Typing mode
      if (displayText === currentWord) {
        // When fully typed, pause then start deleting
        timer = setTimeout(() => {
          setIsDeleting(true)
        }, pauseBeforeDelete)
      } else {
        // Continue typing the current word
        timer = setTimeout(() => {
          setDisplayText(currentWord.slice(0, displayText.length + 1))
        }, typingSpeed)
      }
    }

    return () => clearTimeout(timer)
  }, [displayText, isDeleting, wordIndex, words])

  return (
    <div className={`typing-animation ${doto_font.variable}`}>
      <span
        style={{
          position: 'relative',
          fontWeight: 'bold',
          fontSize: 'inherit',
          color: 'var(--illinois-white)',
          fontFamily: 'var(--font-doto)',
        }}
      >
        {displayText}
        <span
          className="cursor"
          style={{
            display: 'inline-block',
            width: '3px',
            height: '1.2em',
            backgroundColor: 'var(--illinois-white)',
            marginLeft: '2px',
            verticalAlign: 'middle',
            animation: 'blink 1s step-start infinite',
          }}
        />
      </span>
      <style jsx>{`
        @keyframes blink {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0;
          }
        }
        .typing-animation {
          display: inline-block;
          width: 100%;
          min-width: 400px; /* Increased for longer words */
          max-width: 400px; /* Limit maximum width */
          text-align: left; /* Left-align text for natural typing look */
        }

        /* Responsive adjustments */
        @media (max-width: 640px) {
          .typing-animation {
            min-width: 100%; /* Use percentage instead of fixed width */
            max-width: 100%; /* Use percentage instead of fixed width */
            margin-top: 8px; /* Add space in mobile view */
          }
        }
      `}</style>
    </div>
  )
}

const Home: NextPage = () => {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false)

  return (
    <>
      <Head>
        <title>mHealth Chatbot</title>
        <meta
          name="description"
          content="Chat with your personal trainer with knowledge of your health and fitness."
        />
        <link rel="icon" href="/favicon.ico" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
        <style>
          {`
            * {
              box-sizing: border-box;
              max-width: 100vw;
            }
            body, html {
              overflow-x: hidden;
              width: 100%;
              margin: 0;
              padding: 0;
            }
          `}
        </style>
      </Head>

      {/* Rebranding announcement header bar */}
      <div
        className="relative w-full py-2 text-center"
        style={{
          background: 'var(--illinois-orange)',
          color: 'var(--illinois-white)',
        }}
      >
        <div
          className={`inline-block ${montserrat_heading.variable} font-montserratHeading`}
        >
          <div className="relative inline-block cursor-help">
            <span
              className="text-lg font-bold"
              onMouseEnter={() => setIsTooltipVisible(true)}
              onMouseLeave={() => setIsTooltipVisible(false)}
            >
              Heads up: we&apos;ve rebranded to Illinois Chat
            </span>
            <div
              className={`absolute left-1/2 top-full z-50 mt-2 w-72 -translate-x-1/2 transform rounded p-2 text-sm transition duration-300 ${isTooltipVisible ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
              style={{
                background: '#333',
                border: '1px solid #444',
                boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
              }}
            >
              We&apos;re on our way to becoming a production service for all U
              of I campuses.
              <div
                className="absolute bottom-full left-1/2 h-0 w-0 -translate-x-1/2 transform"
                style={{
                  borderLeft: '8px solid transparent',
                  borderRight: '8px solid transparent',
                  borderBottom: '8px solid #333',
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <LandingPageHeader />

      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#0E1116]">
        <div className="container flex w-full max-w-[95vw] flex-col items-center justify-center gap-4 px-4 py-8">
          <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
            mHealth <span className="text-[hsl(280,100%,70%)]">Chatbot</span>
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
              Your Companion in Wellness
              <br></br>
              <span className="home-header_text-underline">
                Embrace Vitality with AI Support
              </span>
            </Title>

            {/* <Text color="#57534e" c="dimmed" ta="center" mt="md">
              *Factuality not guaranteed.
              <br></br>
              Test it in your area of expertise to best assess its capabilities.
            </Text> */}

        {/* orange banner */}
        <div
          style={{ background: 'var(--illinois-orange-gradient)' }}
          className="
          my-14
          flex w-full items-center justify-center
          overflow-hidden px-4
          py-36 sm:my-0
        "
        >
          <div
            className={`
            whitespace-wrap mx-auto
            flex max-w-3xl flex-col items-center
            justify-center gap-3

            text-center text-2xl font-bold
            text-white sm:flex-row sm:gap-2

            sm:whitespace-nowrap md:text-3xl

            ${montserrat_heading.variable} font-montserratHeading
          `}
          >
            {/* Adjusted container with better spacing */}
            <div className="flex w-full flex-col items-center justify-center sm:flex-row">
              <div className="pr-2 sm:flex-shrink-0 sm:text-right">
                Your AI trained on your
              </div>

              <div className="sm:max-w-[300px] sm:flex-grow">
                <TypingAnimation />
              </div>
            </div>
          </div>
        </div>

        {/* second section below the orange banner */}
        <div className="container flex w-full max-w-5xl flex-col items-center justify-center gap-4 overflow-hidden px-4 py-8 sm:px-8 sm:py-20">
          <h2
            className={`
              max-w-lg
              text-3xl font-bold sm:text-center
              sm:text-4xl
              ${montserrat_heading.variable} font-montserratHeading
          `}
          >
            It&apos;s the easiest way to make your{' '}
            <span className="whitespace-nowrap">own Chatbot</span>
          </h2>

          {/* <Title color="white" order={3}>
            Explore the Courses
          </Title> */}

          {/* Main courses */}
          {/* <CourseCard /> */}
        </div>

        <GlobalFooter />
      </main>
    </>
  )
}

export default Home

function FlagshipChatbots() {
  const cards = [
    // {
    //   course_slug: 'Illinois', // TODO: Replace the "research finder" to Illinois when ready
    //   imageSrc: '/media/hero_courses_banners/UofI.png',
    //   title: 'University of Illinois',
    //   badge: 'Illinois',
    //   tagline: 'Ask anything about U of I',
    //   description:
    //     "Using all of Illinois's documentation, get detailed examples, advice and information about the conference.",
    // },
    {
      course_slug: 'Research', // TODO: Replace the "research finder" to Illinois when ready
      imageSrc: '/media/hero_courses_banners/UofI.png',
      title: 'Illinois Research Finder',
      badge: 'Illinois',
      tagline: 'Find professors based on your research interests',
      description:
        "Using all of Illinois's documentation, get detailed examples, advice and information about the conference.",
    },
    {
      course_slug: 'NeurIPS-2024',
      imageSrc: '/media/hero_courses_banners/NEURIPS.png',
      title: 'NeurIPS 2024',
      badge: 'NeurIPS',
      tagline:
        'Trained on all 4,000+ papers from the largest AI conference in the world',
      description:
        "Using all of NeurIPS 2024's documentation, get detailed examples, advice and information about the conference.",
    },
    {
      course_slug: 'NCSADelta',
      imageSrc: '/media/hero_courses_banners/delta_hero.jpg',
      title: 'NCSA Delta Supercomputer',
      badge: 'NCSA Docs',
      tagline:
        "Quickstart on our Delta supercomputer, it'll write SLRUM scripts for you 😁",
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
    <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-3">
      {cards.map((card) => (
        <Card
          key={card.course_slug}
          component="a"
          href={`/${card.course_slug}/chat`}
          // target="_blank"
          radius="md"
          className="flex h-56 flex-col"
          style={{
            background: 'var(--background)',
            boxShadow: '4px 4px 10px rgba(0,0,0, .2)',
          }}
        >
          <Card.Section className="h-12">
            <div
              className={`
                flex items-center px-3 text-sm font-semibold text-neutral-600
                ${montserrat_heading.variable} font-montserratHeading
              `}
              style={{ height: '100%' }}
            >
              {card.title}
            </div>
          </Card.Section>

          {card.imageSrc && (
            <Card.Section className="flex-1 overflow-hidden">
              <div className="h-full w-full">
                <Image
                  src={card.imageSrc}
                  width={720}
                  height={160}
                  quality={80}
                  alt={`A photo representing ${card.title}`}
                  style={{
                    display: 'block',
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    backgroundColor: 'var(--background)',
                  }}
                />
              </div>
            </Card.Section>
          )}

          <Card.Section className="h-16 sm:h-20">
            <div className="flex h-full flex-col justify-center px-3 sm:flex-row sm:items-center">
              <div
                className="
                line-clamp-2 max-w-full
                text-xs text-neutral-600 sm:line-clamp-5
                "
              >
                {card.tagline}
              </div>

              <div className="mt-1 flex justify-end sm:ml-auto sm:mt-0">
                <ArrowNarrowRight size={28} strokeWidth={1.25} color={'#888'} />
              </div>
            </div>
          </Card.Section>
        </Card>
      ))}
    </div>
  )
}
