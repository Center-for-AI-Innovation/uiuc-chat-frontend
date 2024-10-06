import React, { useEffect, useRef, useState } from 'react'
import { Text, Switch, Card, Skeleton, Tooltip, useMantineTheme, Checkbox, Button, Input, ScrollArea, TextInput, List, SegmentedControl, Center, rem } from '@mantine/core'
import { IconAlertCircle, IconCheck, IconExternalLink, IconHome, IconSitemap, IconSubtask, IconWorld, IconWorldDownload, IconX } from '@tabler/icons-react'
// import { APIKeyInput } from '../LLMsApiKeyInputForm'
// import { ModelToggles } from '../ModelToggles'
import {
  AnthropicProvider,
  ProviderNames,
} from '~/utils/modelProviders/LLMProvider'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../Dialog"
// import { Checkbox } from '@radix-ui/react-checkbox'
import { Label } from '@radix-ui/react-label'
import { ExternalLink } from 'tabler-icons-react'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import { notifications } from '@mantine/notifications'
import axios from 'axios'
import { Montserrat } from 'next/font/google'
const montserrat_med = Montserrat({
  weight: '500',
  subsets: ['latin'],
})
export default function WebsiteIngestForm() {
  const [isUrlUpdated, setIsUrlUpdated] = useState(false)
  const [isUrlValid, setIsUrlValid] = useState(false)
  const [url, setUrl] = useState('')
  const [maxUrls, setMaxUrls] = useState('50')
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    variable: string,
  ) => {
    const value = e.target.value
    if (variable === 'maxUrls') {
      setMaxUrls(value)
    } else if (variable === 'maxDepth') {
      // TODO: implement depth again.
      // setMaxDepth(value)
    }
  }
  const [icon, setIcon] = useState(<IconWorldDownload size={'50%'} />)
  const [scrapeStrategy, setScrapeStrategy] =
    useState<string>('equal-and-below')
  const logoRef = useRef(null) // Create a ref for the logo
  const [isEnabled, setIsEnabled] = useState(false);
  const [open, setOpen] = useState(false);
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    setUrl(input)
    setIsUrlValid(validateUrl(input))
  }
  const validateUrl = (input: string) => {
    const regex = /^https?:\/\/canvas\.illinois\.edu\/courses\/\d+/
    return regex.test(input)
  }

  const [inputErrors, setInputErrors] = useState({
    maxUrls: { error: false, message: '' },
    maxDepth: { error: false, message: '' },
  })

  const validateInputs = () => {
    const errors = {
      maxUrls: { error: false, message: '' },
      maxDepth: { error: false, message: '' },
    }
    // Check for maxUrls
    if (!maxUrls) {
      errors.maxUrls = {
        error: true,
        message: 'Please provide an input for Max URLs',
      }
    } else if (!/^\d+$/.test(maxUrls)) {
      // Using regex to ensure the entire string is a number
      errors.maxUrls = {
        error: true,
        message: 'Max URLs should be a valid number',
      }
    } else if (parseInt(maxUrls) < 1 || parseInt(maxUrls) > 500) {
      errors.maxUrls = {
        error: true,
        message: 'Max URLs should be between 1 and 500',
      }
    }

    setInputErrors(errors)
    return !Object.values(errors).some((error) => error.error)
  }
  const formatUrl = (url: string) => {
    if (!/^https?:\/\//i.test(url)) {
      url = 'http://' + url
    }
    return url
  }
  const formatUrlAndMatchRegex = (url: string) => {
    // fullUrl always starts with http://. Is the starting place of the scrape.
    // baseUrl is used to construct the match statement.

    // Ensure the url starts with 'http://'
    if (!/^https?:\/\//i.test(url)) {
      url = 'http://' + url
    }

    // Extract the base url including the path
    const baseUrl = (
      url.replace(/^https?:\/\//i, '').split('?')[0] as string
    ).replace(/\/$/, '') // Remove protocol (http/s), split at '?', and remove trailing slash

    const matchRegex = `http?(s)://**${baseUrl}/**`

    return {
      fullUrl: baseUrl,
      matchRegex: matchRegex,
    }
  }
  // const validateUrl = (url: string) => {
  //   const courseraRegex = /^https?:\/\/(www\.)?coursera\.org\/learn\/.+/
  //   const mitRegex = /^https?:\/\/ocw\.mit\.edu\/.+/
  //   const githubRegex = /^https?:\/\/(www\.)?github\.com\/.+/
  //   const canvasRegex = /^https?:\/\/canvas\.illinois\.edu\/courses\/\d+/
  //   const webScrapingRegex = /^(https?:\/\/)?.+/

  //   return (
  //     courseraRegex.test(url) ||
  //     mitRegex.test(url) ||
  //     githubRegex.test(url) ||
  //     canvasRegex.test(url) ||
  //     webScrapingRegex.test(url)
  //   )
  // }
  useEffect(() => {
    if (url && url.length > 0 && validateUrl(url)) {
      setIsUrlUpdated(true)
    } else {
      setIsUrlUpdated(false)
    }
  }, [url])

  // if (isLoading) {
  //   return <Skeleton height={200} width={330} radius={'lg'} />
  // }
  const scrapeWeb = async (
    url: string | null,
    courseName: string | null,
    maxUrls: number,
    scrapeStrategy: string,
  ) => {
    try {
      if (!url || !courseName) return null
      console.log('SCRAPING', url)

      const fullUrl = formatUrl(url)

      const postParams = {
        url: fullUrl,
        courseName: courseName,
        maxPagesToCrawl: maxUrls,
        scrapeStrategy: scrapeStrategy,
        match: formatUrlAndMatchRegex(fullUrl).matchRegex,
        maxTokens: 2000000, // basically inf.
      }
      console.log(
        'About to post to the web scraping endpoint, with params:',
        postParams,
      )

      const response = await axios.post(
        `https://crawlee-production.up.railway.app/crawl`,
        {
          params: postParams,
        },
      )
      console.log('Response from web scraping endpoint:', response.data)
      return response.data
    } catch (error: any) {
      console.error('Error during web scraping:', error)

      notifications.show({
        id: 'error-notification',
        withCloseButton: true,
        closeButtonProps: { color: 'red' },
        onClose: () => console.log('error unmounted'),
        onOpen: () => console.log('error mounted'),
        autoClose: 12000,
        title: (
          <Text size={'lg'} className={`${montserrat_med.className}`}>
            {'Error during web scraping. Please try again.'}
          </Text>
        ),
        message: (
          <Text className={`${montserrat_med.className} text-neutral-200`}>
            {error.message}
          </Text>
        ),
        color: 'red',
        radius: 'lg',
        icon: <IconAlertCircle />,
        className: 'my-notification-class',
        style: {
          backgroundColor: 'rgba(42,42,64,0.3)',
          backdropFilter: 'blur(10px)',
          borderLeft: '5px solid red',
        },
        withBorder: true,
        loading: false,
      })
      // return error
      // throw error
    }
  }

  return (
    <motion.div layout>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Card className="max-w-[330px] bg-[#15162c] md:w-[330px] p-6 rounded-lg shadow-sm hover:bg-[#1c1c2e] cursor-pointer transition-colors duration-300">
            <div className="flex items-center justify-between mb-4">
              {/* <div>
            <a
              className="mb-3 flex items-center"
              href="https://canvas.illinois.edu"
              target="_blank"
              rel="noopener noreferrer"
            > */}

              <span className="text-lg font-medium mr-2 text-yellow flex items-center">
                <IconWorldDownload style={{ marginRight: '0.5rem' }} />
                Website
              </span>
              {/* <ExternalLink size={16} className="text-white" /> */}
              {/* </a> */}
              {/* </div> */}
              {/* <div className="relative inline-block w-10 mr-2 align-middle select-none">
            <input
              type="checkbox"
              name="toggle"
              id="toggle"
              className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
              checked={isEnabled}
              onChange={() => setIsEnabled(!isEnabled)}
            />
            <label
              htmlFor="toggle"
              className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"
            ></label>
          </div> */}
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Ingest content from the website e.g. GitHub, Notion, MIT Course, Coursera.
            </p>
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >

                <DialogContent className="sm:max-w-[25rem] bg-[#15162c] text-white border-0 max-w-fit"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Ingest Website</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="mt-4 h-[60vh] pr-4">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="canvas-url" className="text-white">URL</Label>
                        <Input
                          icon={icon}
                          // I can't figure out how to change the background colors.
                          className={`mt-4 w-[100%] min-w-[25rem] disabled:bg-purple-200 lg:w-[75%]`}
                          // wrapperProps={{ borderRadius: 'xl' }}
                          // styles={{ input: { backgroundColor: '#1A1B1E' } }}
                          styles={{
                            input: {
                              backgroundColor: '#1A1B1E',
                              // paddingRight: '6rem', // Adjust right padding to prevent text from hiding behind the button
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                            },
                          }}
                          placeholder="Enter URL..."
                          radius={'xl'}
                          type="url" // Set the type to 'url' to avoid thinking it's a username or pw.
                          value={url}
                          size={'lg'}
                          // disabled={isDisabled}
                          onChange={(e) => {
                            setUrl(e.target.value)
                            // setShowContentOptions(
                            //   e.target.value.includes('canvas.illinois.edu'),
                            // )
                            if (e.target.value.includes('coursera.org')) {
                              setIcon(
                                <img
                                  src={'/media/coursera_logo_cutout.png'}
                                  alt="Coursera Logo"
                                  style={{ height: '50%', width: '50%' }}
                                />,
                              )
                            } else if (e.target.value.includes('ocw.mit.edu')) {
                              setIcon(
                                <img
                                  src={'/media/mitocw_logo.jpg'}
                                  alt="MIT OCW Logo"
                                  style={{ height: '50%', width: '50%' }}
                                />,
                              )
                            } else if (e.target.value.includes('github.com')) {
                              setIcon(
                                <img
                                  src="/media/github-mark-white.png"
                                  alt="GitHub Logo"
                                  style={{ height: '50%', width: '50%' }}
                                />,
                              )
                            } else if (e.target.value.includes('canvas.illinois.edu')) {
                              setIcon(
                                <img
                                  src="/media/canvas_logo.png"
                                  alt="Canvas Logo"
                                  style={{ height: '50%', width: '50%' }}
                                />,
                              )
                            } else {
                              setIcon(<IconWorldDownload />)
                            }
                          }}
                        // onKeyPress={(event) => {
                        //   if (event.key === 'Enter') {
                        //     handleSubmit()
                        //   }
                        // }}
                        // rightSection={
                        // <Button
                        //   onClick={(e) => {
                        //     e.preventDefault()
                        //     if (validateInputs() && validateUrl(url)) {
                        //       handleSubmit()
                        //     }
                        //   }}
                        //   size="md"
                        //   radius={'xl'}
                        //   className={`rounded-s-md ${
                        //     isUrlUpdated ? 'bg-purple-800' : 'border-purple-800'
                        //   } overflow-ellipsis text-ellipsis p-2 ${
                        //     isUrlUpdated ? 'text-white' : 'text-gray-500'
                        //   } min-w-[5rem] -translate-x-1 transform hover:border-indigo-600 hover:bg-indigo-600 hover:text-white focus:shadow-none focus:outline-none`}
                        //   w={`${isSmallScreen ? 'auto' : 'auto'}`}
                        //   disabled={isDisabled}
                        // >
                        //   Ingest
                        // </Button>
                        // }
                        // rightSectionWidth={isSmallScreen ? 'auto' : 'auto'}
                        />
                      </div>
                      <form
                        className="w-[80%] min-w-[20rem] lg:w-[75%]"
                        onSubmit={(event) => {
                          event.preventDefault()
                        }}
                      >
                        <div className="pb-2 pt-2">
                          <Tooltip
                            multiline
                            w={400}
                            color="#15162b"
                            arrowPosition="side"
                            arrowSize={8}
                            withArrow
                            position="bottom-start"
                            label="We will attempt to visit this number of pages, but not all will be scraped if they're duplicates, broken or otherwise inaccessible."
                          >
                            <div>
                              <Text
                                style={{ color: '#C1C2C5', fontSize: '16px' }}
                                className={`${montserrat_heading.variable} font-montserratHeading`}
                              >
                                Max URLs (1 to 500)
                              </Text>
                              <TextInput
                                styles={{ input: { backgroundColor: '#1A1B1E' } }}
                                name="maximumUrls"
                                radius="md"
                                placeholder="Default 50"
                                value={maxUrls}
                                onChange={(e) => {
                                  handleInputChange(e, 'maxUrls')
                                }}
                                error={inputErrors.maxUrls.error}
                              />
                            </div>
                          </Tooltip>
                        </div>
                        {inputErrors.maxUrls.error && (
                          <p style={{ color: 'red' }}>{inputErrors.maxUrls.message}</p>
                        )}
                        {inputErrors.maxDepth.error && (
                          <p style={{ color: 'red' }}>{inputErrors.maxDepth.message}</p>
                        )}

                        <Text
                          style={{ color: '#C1C2C5', fontSize: '16px' }}
                          className={`${montserrat_heading.variable} font-montserratHeading`}
                        >
                          Limit web crawl
                        </Text>
                        {/* <Text style={{ color: '#C1C2C5', fontSize: '16px' }} className={`${montserrat_paragraph.variable} font-montserratParagraph`}>Limit web crawl (from least to most inclusive)</Text> */}
                        <div className="pl-3">
                          <List>
                            <List.Item>
                              <strong>Equal and Below:</strong> Only scrape content that
                              starts will the given URL. E.g. nasa.gov/blogs will scrape
                              all blogs like nasa.gov/blogs/new-rocket but never go to
                              nasa.gov/events.
                            </List.Item>
                            <List.Item>
                              <strong>Same subdomain:</strong> Crawl the entire subdomain.
                              E.g. docs.nasa.gov will grab that entire subdomain, but not
                              nasa.gov or api.nasa.gov.
                            </List.Item>
                            <List.Item>
                              <strong>Entire domain:</strong> Crawl as much of this entire
                              website as possible. E.g. nasa.gov also includes
                              docs.nasa.gov
                            </List.Item>
                            <List.Item>
                              <span>
                                <strong>All:</strong> Start on the given URL and wander
                                the web...{' '}
                                <Text style={{ color: '#C1C2C5' }}>
                                  For more detail{' '}
                                  <a
                                    className={'text-purple-600'}
                                    href="https://docs.uiuc.chat/features/web-crawling-details"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    read the docs
                                  </a>
                                  .
                                </Text>
                              </span>
                            </List.Item>
                          </List>
                        </div>

                        <Text style={{ color: '#C1C2C5' }}>
                          <strong>I suggest starting with Equal and Below</strong>, then
                          just re-run this if you need more later.
                        </Text>
                        <div className="pt-2"></div>
                        <SegmentedControl
                          fullWidth
                          orientation="vertical"
                          size="sm"
                          radius="md"
                          value={scrapeStrategy}
                          onChange={(strat) => setScrapeStrategy(strat)}
                          data={[
                            {
                              // Maybe use IconArrowBarDown ??
                              value: 'equal-and-below',
                              label: (
                                <Center style={{ gap: 10 }}>
                                  <IconSitemap
                                    style={{ width: rem(16), height: rem(16) }}
                                  />
                                  <span>Equal and Below</span>
                                </Center>
                              ),
                            },
                            {
                              value: 'same-hostname',
                              label: (
                                <Center style={{ gap: 10 }}>
                                  <IconSubtask
                                    style={{ width: rem(16), height: rem(16) }}
                                  />
                                  <span>Subdomain</span>
                                </Center>
                              ),
                            },
                            {
                              value: 'same-domain',
                              label: (
                                <Center style={{ gap: 10 }}>
                                  <IconHome style={{ width: rem(16), height: rem(16) }} />
                                  <span>Entire domain</span>
                                </Center>
                              ),
                            },
                            {
                              value: 'all',
                              label: (
                                <Center style={{ gap: 10 }}>
                                  <IconWorld
                                    style={{ width: rem(16), height: rem(16) }}
                                  />
                                  <span>All</span>
                                </Center>
                              ),
                            },
                          ]}
                        />
                      </form>
                      <Button
                        // onClick={handleIngest}
                        disabled={!isUrlValid}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        Ingest the Website
                      </Button>
                    </div>
                  </ScrollArea>
                </DialogContent>

              </motion.div>
            </AnimatePresence>
          </Card>
        </DialogTrigger>
      </Dialog>


    </motion.div >
  )
}
