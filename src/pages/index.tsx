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
        <title>Illinois Chat</title>
        <meta
          name="description"
          content="Chat with your documents, with full support for any format and web scraping."
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

      <main
        className={`illinois-blue-gradient-bg flex min-h-screen flex-col items-center justify-center overflow-hidden
          ${montserrat_paragraph.variable} font-montserratParagraph`}
      >
        <div className="container flex w-full max-w-5xl flex-col items-center justify-center gap-4 px-4 py-8 sm:px-8 sm:py-20">
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
                  <span className="whitespace-nowrap">your content.</span>
                </h2>
                <h2 className="mt-4">
                  Share it with{' '}
                  <span className="whitespace-nowrap">a click.</span>
                </h2>
              </div>

              <div className="mb-8 mt-4 text-sm text-neutral-400">
                Deep search your documents, build an AI-teaching assistant,
                accelerate your literature review,{' '}
                <span className="whitespace-nowrap">and get creative.</span>
              </div>

              <Button
                variant="light"
                style={{
                  backgroundColor: 'var(--illinois-orange)',
                  color: 'var(--illinois-white)',
                }}
                radius="sm"
                component="a"
                href="/chat"
              >
                Try it out{' '}
                <ArrowNarrowRight size={32} strokeWidth={1} color={'white'} />
              </Button>
            </div>

            <div className="order-first text-center sm:order-last sm:w-1/2">
              <div className="min-h-8 rounded-xl sm:p-4">
                {/* p-10                style={{ background: 'var(--illinois-orange-gradient)' }} */}
                <div className="">
                  <img
                    src="/media/banner_upload_materials.png"
                    className="w-full max-w-full rounded-xl"
                  ></img>
                </div>

                <div className="icons_scrolling_container overflow-hidden">
                  <div className="icons_scrolling">
                    <img
                      src="/media/banner_icons.png"
                      className="max-w-full rounded-xl"
                    ></img>
                    <img
                      src="/media/banner_icons.png"
                      className="max-w-full rounded-xl"
                    ></img>
                  </div>
                </div>
              </div>

              <div
                className="mr-8 mt-[2px] text-right text-xs sm:mr-4 sm:mt-[-8px]"
                style={{ color: 'var(--illinois-orange)' }}
              >
                Upload almost anything
              </div>
            </div>
          </div>

          <div className="mb-6 w-full pt-8 text-center">
            <h2
              className={`
                pt-12
                text-2xl font-bold sm:pt-2 
                ${montserrat_heading.variable} font-montserratHeading
              `}
              style={{ color: 'var(--illinois-blue)' }}
            >
              Flagship Chatbots
            </h2>
            <p
              className={`
                text-md mt-2
                ${montserrat_paragraph.variable} font-montserratParagraph
              `}
            >
              Dive right into our bots trained on everything Illinois
            </p>
          </div>

          <div className="w-full max-w-5xl">
            <FlagshipChatbots />
          </div>
        </div>

        <div className="mb-6 w-full px-2 pt-4 text-center sm:mt-[-24px] sm:px-4">
          <ProjectTable />
        </div>

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

          {/* step 1 */}
          <div className="w-full max-w-3xl">
            <div
              className="
              mt-4 flex
              flex-col items-center justify-center gap-2
              sm:flex-row sm:gap-16
            "
            >
              <div
                className="min-h-8 rounded-xl p-10 sm:order-last sm:w-1/2"
                style={{ background: 'var(--illinois-orange-gradient)' }}
              >
                <img
                  src="/media/banner_step_001.png"
                  className="w-full max-w-full rounded-xl"
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
                    Bring your documents{' '}
                    <span className="whitespace-nowrap">and tools</span>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-2 text-sm">
                  <div className="">
                    Simply{' '}
                    <span
                      className={`font-bold ${montserrat_heading.variable} font-montserratHeading`}
                    >
                      Drag-n-Drop
                    </span>{' '}
                    your files for analysis.
                  </div>
                  <div className="">
                    <span
                      className={`font-bold ${montserrat_heading.variable} font-montserratHeading`}
                    >
                      Connect
                    </span>{' '}
                    to Canvas, GitHub, Notion and more.
                  </div>
                  <div className="">
                    <span
                      className={`font-bold ${montserrat_heading.variable} font-montserratHeading`}
                    >
                      Web crawl
                    </span>{' '}
                    your favorite articles and blogs.
                  </div>
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
              flex-col items-center justify-center gap-2
              sm:flex-row sm:gap-16
            "
            >
              <div
                className="min-h-8 rounded-xl p-10 sm:w-1/2"
                style={{ background: 'var(--illinois-orange-gradient)' }}
              >
                <img
                  src="/media/banner_step_002.png"
                  className="w-full max-w-full rounded-xl"
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
                    Customize LLMs, prompts, and{' '}
                    <span className="whitespace-nowrap">
                      tools <span className="font-normal">(optional)</span>
                    </span>
                  </div>
                </div>

                <div className="mt-4 text-sm">
                  Updated with the{' '}
                  <span
                    className={`font-bold ${montserrat_heading.variable} font-montserratHeading`}
                  >
                    world&apos;s
                  </span>{' '}
                  best AI models at your fingertips, enhanced with{' '}
                  <span
                    className={`font-bold ${montserrat_heading.variable} font-montserratHeading`}
                  >
                    tools
                  </span>{' '}
                  and advanced{' '}
                  <span
                    className={`font-bold ${montserrat_heading.variable} font-montserratHeading`}
                  >
                    prompt engineering
                  </span>
                  .
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
              flex-col items-center justify-center gap-2
              sm:flex-row sm:gap-16
            "
            >
              <div
                className="min-h-8 rounded-xl p-10 sm:order-last sm:w-1/2"
                style={{ background: 'var(--illinois-orange-gradient)' }}
              >
                <img
                  src="/media/banner_step_003.png"
                  className="w-full max-w-full rounded-xl"
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
                    Share with anyone
                  </div>
                </div>

                <div className="mt-4 text-sm">
                  Collaborate and{' '}
                  <span
                    className={`font-bold ${montserrat_heading.variable} font-montserratHeading`}
                  >
                    publish your chatbot
                  </span>{' '}
                  for whoever you want to use it or{' '}
                  <span
                    className={`font-bold ${montserrat_heading.variable} font-montserratHeading`}
                  >
                    discover other chatbots
                  </span>{' '}
                  from the Illinois Chat community.
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
            w-full overflow-hidden px-4
            py-8 text-white sm:my-0
            sm:px-8 sm:py-24
          "
        >
          <div
            className="
              mx-auto flex
              w-full
              max-w-3xl flex-col items-start
              justify-center gap-4
              sm:flex-row sm:gap-8
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
              <h2
                className={`
                text-xl font-bold
                ${montserrat_heading.variable} font-montserratHeading
              `}
              >
                Use our API.
              </h2>

              <div className="mt-4">
                If you&apos;re tired of the OpenAI API and want an AI
                that&apos;s trained to understand your data, come build on our
                API with 52+ models to choose from. We&apos;re always updated
                with the latest State of the Art (SOTA) open source LLMs for
                free, hosted here at Illinois.
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
                component="a"
                href="https://docs.uiuc.chat/api"
                target="_blank"
                rel="noopener noreferrer"
              >
                Read the docs{' '}
                <ExternalLink
                  size={20}
                  strokeWidth={1.75}
                  color={'var(--illinois-white)'}
                  className="ml-1"
                />
              </Button>
            </div>

            <div
              className="
              mt-0 
              sm:mt-0 sm:w-2/3
            "
            >
              <div className="relative overflow-hidden rounded-xl bg-[#1e1e1e] p-4 text-white">
                <pre className="overflow-x-auto font-mono text-sm">
                  <code>
                    <span className="text-[#569cd6]">import</span>{' '}
                    <span className="text-[#9cdcfe]">requests</span>
                    {'\n\n'}
                    <span className="text-[#9cdcfe]">data</span> = {'{'}
                    {'\n'}
                    {'  '}
                    <span className="text-[#ce9178]">
                      &quot;model&quot;
                    </span>:{' '}
                    <span className="text-[#ce9178]">
                      &quot;llama3.1:70b&quot;
                    </span>
                    ,{'\n'}
                    {'  '}
                    <span className="text-[#ce9178]">
                      &quot;apiKey&quot;
                    </span>:{' '}
                    <span className="text-[#ce9178]">
                      &quot;&lt;********&gt;&quot;
                    </span>
                    ,{'\n'}
                    {'  '}
                    <span className="text-[#ce9178]">&quot;messages&quot;</span>
                    : [{'\n'}
                    {'    '}
                    {'{'}
                    {'\n'}
                    {'      '}
                    <span className="text-[#ce9178]">
                      &quot;role&quot;
                    </span>:{' '}
                    <span className="text-[#ce9178]">&quot;user&quot;</span>,
                    {'\n'}
                    {'      '}
                    <span className="text-[#ce9178]">
                      &quot;content&quot;
                    </span>:{' '}
                    <span className="text-[#ce9178]">
                      &quot;How do I use the Illinois Chat API?&quot;
                    </span>
                    {'\n'}
                    {'    '}
                    {'}'}
                    {'\n'}
                    {'  '}],
                    {'\n'}
                    {'}'}
                    {'\n\n'}
                    <span className="text-[#9cdcfe]">response</span> ={' '}
                    <span className="text-[#9cdcfe]">requests</span>.
                    <span className="text-[#dcdcaa]">post</span>({'\n'}
                    {'  '}
                    <span className="text-[#ce9178]">
                      &quot;https://uiuc.chat/api/chat-api/chat&quot;
                    </span>
                    ,{'\n'}
                    {'  '}
                    <span className="text-[#9cdcfe]">json</span>=
                    <span className="text-[#9cdcfe]">data</span>
                    {'\n'}){'\n'}
                    <span className="text-[#dcdcaa]">print</span>(
                    <span className="text-[#9cdcfe]">response</span>.
                    <span className="text-[#9cdcfe]">text</span>)
                  </code>
                </pre>
              </div>
            </div>
          </div>

          <div
            className="
              mx-auto flex
              w-full

              max-w-3xl flex-col items-start justify-center
              gap-16 sm:flex-row
            "
          >
            <div className="mt-16 sm:w-1/2">
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
        <div className="container flex w-full max-w-5xl flex-col items-center justify-center gap-4 overflow-hidden px-4 py-8 sm:px-8 sm:py-20">
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
              className="bg-[var(--illinois-white)]/10 duration-600 flex max-w-xs flex-col gap-4 rounded-xl transition-transform hover:scale-[1.01] sm:p-4"
              href="https://github.com/Center-for-AI-Innovation/uiuc-chat-frontend"
              target="_blank"
              style={{ boxShadow: '4px 4px 10px rgba(0,0,0, .2)' }}
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
              className="bg-[var(--illinois-white)]/10 duration-600 flex max-w-xs flex-col gap-4 rounded-xl transition-transform hover:scale-[1.01] sm:p-4"
              href="https://ai.ncsa.illinois.edu/"
              target="_blank"
              style={{ boxShadow: '4px 4px 10px rgba(0,0,0, .2)' }}
            >
              <h3
                className={`
                text-2xl font-bold
                ${montserrat_heading.variable} font-montserratHeading
              `}
              >
                Sponsored by the Center of{' '}
                <span className="whitespace-nowrap">AI Innovation</span>
              </h3>
              <div className="text-lg">
                Part of the National Center for Supercomputing Applications.
              </div>
            </Link>
            <Link
              className="bg-[var(--illinois-white)]/10 duration-600 flex max-w-xs flex-col gap-4 rounded-xl transition-transform hover:scale-[1.01] sm:p-4"
              href="https://rohanmarwaha.com/"
              target="_blank"
              style={{ boxShadow: '4px 4px 10px rgba(0,0,0, .2)' }}
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
                Started by Rohan Marwaha at the University of Illinois. But it{' '}
                <a
                  href="https://github.com/Center-for-AI-Innovation/uiuc-chat-frontend/graphs/contributors"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    textDecoration: 'underline',
                    textDecorationColor: 'var(--illinois-blue)',
                  }}
                >
                  takes a village
                </a>
                .
              </div>
              {/* <div className="text-lg">Sponsored by the </div> */}
            </Link>

            <Link
              className="bg-[var(--illinois-white)]/10 duration-600 flex max-w-xs flex-col gap-4 rounded-xl transition-transform hover:scale-[1.01] sm:p-4"
              href="https://status.uiuc.chat/"
              target="_blank"
              style={{ boxShadow: '4px 4px 10px rgba(0,0,0, .2)' }}
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
