import React, { useEffect, useRef, useState } from 'react'
import { Text, Switch, Card, Skeleton, Tooltip, useMantineTheme, Checkbox, Button, Input, ScrollArea, TextInput, List, SegmentedControl, Center, rem } from '@mantine/core'
import { IconAlertCircle, IconBrandGithub, IconCheck, IconExternalLink, IconHome, IconSitemap, IconSubtask, IconWorld, IconWorldDownload, IconX } from '@tabler/icons-react'
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
export default function CourseraIngestForm() {
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
                <img
                  src={'/media/coursera_logo_cutout.png'}
                  alt="Coursera Logo"
                  style={{ width: '2rem', marginRight: '0.5rem' }}
                />
                Coursera
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
              Ingest content from GitHub.
            </p>
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >

                <DialogContent className="sm:max-w-[30rem] bg-[#15162c] text-white border-0 max-w-fit"
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
                      {/* <form
                        className="s:w-[30%] min-w-[20rem] w-[90%]"
                        onSubmit={(event) => {
                          event.preventDefault()
                        }}
                      >
                         */}
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
