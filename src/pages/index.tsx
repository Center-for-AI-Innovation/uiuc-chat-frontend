import { Button, Card } from '@mantine/core'
import { type NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import React, { useState, useEffect, useMemo } from 'react'
import { ArrowNarrowRight, ExternalLink, Link } from 'tabler-icons-react'

import { doto_font, montserrat_heading, montserrat_paragraph } from 'fonts'
import GlobalFooter from '~/components/UIUC-Components/GlobalFooter'
import { LandingPageHeader } from '~/components/UIUC-Components/navbars/GlobalHeader'
import router from 'next/router'

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
          lineHeight: 1,
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
  const useIllinoisChatConfig = useMemo(() => {
    return process.env.NEXT_PUBLIC_USE_ILLINOIS_CHAT_CONFIG === 'True'
  }, [])
  const IllinoisChatBannerContent = useMemo(() => {
    return process.env.NEXT_PUBLIC_ILLINOIS_CHAT_BANNER_CONTENT || null
  }, [])

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
              {/*1. If useIllinoisChatConfig && IllinoisChatBannerContent → render HTML from IllinoisChatBannerContent*/}
              {/*2. If !useIllinoisChatConfig → render default "Heads up" banner*/}
              {/*3. Otherwise → render nothing*/}
              {useIllinoisChatConfig && IllinoisChatBannerContent ? (
                <div
                  dangerouslySetInnerHTML={{
                    __html: IllinoisChatBannerContent,
                  }}
                />
              ) : !useIllinoisChatConfig ? (
                <>
                  Heads up: we’ve rebranded to Illinois Chat — please visit{' '}
                  <a href="https://chat.illinois.edu" className="underline">
                    chat.illinois.edu
                  </a>
                </>
              ) : null}
            </span>
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
                style={{ color: 'var(--foreground)', lineHeight: '110%' }}
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

              <div className="mb-8 mt-4 text-sm text-[--foreground-faded]">
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
                onClick={() => {
                  // Use Next.js router to navigate
                  router.push('/chat')
                }}
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
                      className="max-w-full"
                    ></img>
                    <img
                      src="/media/banner_icons.png"
                      className="max-w-full"
                    ></img>
                  </div>
                </div>
              </div>

              <div
                className="mr-8 mt-[2px] hidden text-right text-xs sm:mr-4 sm:mt-[-8px]"
                style={{ color: 'var(--illinois-orange)' }}
              >
                Upload almost anything
              </div>
            </div>
          </div>

          {!useIllinoisChatConfig && (
            <div className="mt-12 w-[100vw] rounded-lg bg-[--dashboard-background-faded] p-8 pb-14">
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
          )}
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
            <div className="mt-16">
              <h2
                className={`
                text-xl font-bold
                ${montserrat_heading.variable} font-montserratHeading
              `}
              >
                Want something custom?
              </h2>

              <div className="mt-4">
                We collaborate with researchers and industry partners to develop
                custom features on this platform. For inquiries, please contact
                us at{' '}
                <a
                  style={{ color: 'var(--illinois-orange)' }}
                  href="mailto:caii_ai@lists.illinois.edu"
                >
                  contact us
                </a>
                .
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
          <div className="mt-4 grid grid-cols-1 gap-14 sm:grid-cols-3 md:gap-8">
            <div className="flex max-w-xs flex-col gap-4 rounded-xl bg-[--dashboard-background-faded] p-6">
              <h3
                className={`
                text-xl font-bold
                ${montserrat_heading.variable} font-montserratHeading
              `}
              >
                Support
              </h3>
              <div className="text-md">
                If you have any questions or would like to submit a bug please{' '}
                <a
                  style={{ color: 'var(--illinois-orange)' }}
                  href="mailto:genaisupport@mx.uillinois.edu"
                >
                  email us
                </a>
                .
              </div>
              {/* <div className="text-lg">Sponsored by the </div> */}
            </div>
            <div className="flex max-w-xs flex-col gap-4 rounded-xl bg-[--dashboard-background-faded] p-6">
              <h3
                className={`
                text-xl font-bold
                ${montserrat_heading.variable} font-montserratHeading
              `}
              >
                Open source
              </h3>
              <div className="text-md">
                All code is open source. Join us on{' '}
                <a
                  style={{ color: 'var(--illinois-orange)' }}
                  href="https://github.com/Center-for-AI-Innovation"
                >
                  GitHub
                </a>
                .
              </div>
            </div>
            <div className="flex max-w-xs flex-col gap-4 rounded-xl bg-[--dashboard-background-faded] p-6">
              <h3
                className={`
                text-xl font-bold
                ${montserrat_heading.variable} font-montserratHeading
              `}
              >
                Developed at Illinois
              </h3>
              <div className="text-md">
                Developed by the{' '}
                <a
                  style={{ color: 'var(--illinois-orange)' }}
                  href="https://ai.ncsa.illinois.edu/"
                >
                  Center of AI Innovation
                </a>{' '}
                at{' '}
                <a
                  style={{ color: 'var(--illinois-orange)' }}
                  href="https://ncsa.illinois.edu/"
                >
                  National Center for Supercomputing Applications
                </a>
                .
              </div>
            </div>
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
    <div className="ml-auto mr-auto grid grid-cols-1 gap-6 sm:grid-cols-3">
      {cards.map((card) => (
        <Card
          key={card.course_slug}
          component="a"
          href={`/${card.course_slug}/chat`}
          // target="_blank"
          radius="md"
          className="flex h-56 flex-col"
          style={{
            color: 'var(--illinois-blue)',
            background: 'var(--illinois-white)',
          }}
        >
          <Card.Section className="h-12">
            <div
              className={`
                flex items-center px-3 text-sm font-semibold
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
                    backgroundColor: 'var(--illinois-white)',
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
                text-xs sm:line-clamp-5
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
