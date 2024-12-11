import React, { useEffect, useRef, useState } from 'react'
import {
  Text,
  Card,
  Skeleton,
  Tooltip,
  useMantineTheme,
  Checkbox,
  Button,
  Input,
  ScrollArea,
  TextInput,
  List,
  SegmentedControl,
  Center,
  rem,
} from '@mantine/core'
import { Label } from '@radix-ui/react-label'
import NextLink from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../Dialog'
import {
  IconAlertCircle,
  IconHome,
  IconSitemap,
  IconSubtask,
  IconWorld,
  IconWorldDownload,
  IconArrowRight,
} from '@tabler/icons-react'
// import { APIKeyInput } from '../LLMsApiKeyInputForm'
// import { ModelToggles } from '../ModelToggles'
import { motion } from 'framer-motion'
// import { Checkbox } from '@radix-ui/react-checkbox'
import { montserrat_heading } from 'fonts'
import { notifications } from '@mantine/notifications'
import axios from 'axios'
import { Montserrat } from 'next/font/google'
import { FileUpload } from './UploadNotification'
import { QueryClient } from '@tanstack/react-query'
const montserrat_med = Montserrat({
  weight: '500',
  subsets: ['latin'],
})
export default function WebsiteIngestForm({
  project_name,
  setUploadFiles,
  queryClient,
}: {
  project_name: string
  setUploadFiles: React.Dispatch<React.SetStateAction<FileUpload[]>>
  queryClient: QueryClient
}): JSX.Element {
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

      if (value && /^\d+$/.test(value)) {
        const numValue = parseInt(value)
        if (numValue >= 1 && numValue <= 500) {
          setInputErrors((prev) => ({
            ...prev,
            maxUrls: { error: false, message: '' },
          }))
          return
        }
      }

      let errorMessage = ''
      if (!value) {
        errorMessage = 'Please provide an input for Max URLs'
      } else if (!/^\d+$/.test(value)) {
        errorMessage = 'Max URLs should be a valid number'
      } else {
        const numValue = parseInt(value)
        if (numValue < 1 || numValue > 500) {
          errorMessage = 'Max URLs should be between 1 and 500'
        }
      }

      setInputErrors((prev) => ({
        ...prev,
        maxUrls: {
          error: !!errorMessage,
          message: errorMessage,
        },
      }))
    }
  }
  const [icon, setIcon] = useState(<IconWorldDownload size={'50%'} />)
  const [scrapeStrategy, setScrapeStrategy] =
    useState<string>('equal-and-below')
  const [open, setOpen] = useState(false)
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    setUrl(input)
    setIsUrlValid(validateUrl(input))
  }
  const validateUrl = (input: string) => {
    const regex = /^(https?:\/\/)?.+/
    return regex.test(input)
  }

  const [inputErrors, setInputErrors] = useState({
    maxUrls: { error: false, message: '' },
    maxDepth: { error: false, message: '' },
  })

  const formatUrl = (url: string) => {
    if (!/^https?:\/\//i.test(url)) {
      url = 'http://' + url
    }
    return url
  }

  const handleIngest = async () => {
    setOpen(false)

    if (inputErrors.maxUrls.error) {
      alert('Invalid max URLs input (1 to 500)')
      return
    }

    if (isUrlValid) {
      const newFile: FileUpload = {
        name: url,
        status: 'uploading',
        type: 'webscrape',
      }
      setUploadFiles((prevFiles) => [...prevFiles, newFile])
      setUploadFiles((prevFiles) =>
        prevFiles.map((file) =>
          file.name === url ? { ...file, status: 'ingesting' } : file,
        ),
      )
      try {
        const response = await scrapeWeb(
          url,
          project_name,
          maxUrls.trim() !== '' ? parseInt(maxUrls) : 50,
          scrapeStrategy,
        )

        if (
          response &&
          typeof response === 'string' &&
          response.includes('Crawl completed successfully')
        ) {
          setUploadFiles((prevFiles) =>
            prevFiles.map((file) =>
              file.name === url ? { ...file, status: 'complete' } : file,
            ),
          )
          await queryClient.invalidateQueries({
            queryKey: ['documents', project_name],
          })
        } else {
          // Handle unsuccessful crawl
          setUploadFiles((prevFiles) =>
            prevFiles.map((file) =>
              file.name === url ? { ...file, status: 'error' } : file,
            ),
          )
          throw new Error('Crawl was not successful')
        }
      } catch (error: any) {
        console.error('Error while scraping web:', error)
        setUploadFiles((prevFiles) =>
          prevFiles.map((file) =>
            file.name === url ? { ...file, status: 'error' } : file,
          ),
        )
        // Remove the timeout since we're handling errors properly now
      }
    } else {
      alert('Invalid URL (please include https://)')
    }

    await new Promise((resolve) => setTimeout(resolve, 8000))
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
      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen)
          if (!isOpen) {
            setUrl('')
            setIsUrlValid(false)
            setIsUrlUpdated(false)
            setMaxUrls('50')
            setInputErrors((prev) => ({
              ...prev,
              maxUrls: { error: false, message: '' },
            }))
          }
        }}
      >
        <DialogTrigger asChild>
          <Card
            className="group relative cursor-pointer overflow-hidden rounded-2xl bg-gradient-to-br from-[#1c1c2e] to-[#2a2a40] p-6 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
            style={{ height: '100%' }}
          >
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-900/30">
                  <IconWorldDownload className="h-8 w-8" />
                </div>
                <Text className="text-xl font-semibold text-gray-100">
                  Website
                </Text>
              </div>
            </div>

            <Text className="mb-4 text-sm leading-relaxed text-gray-400">
              Import content from any website by providing the URL. Supports
              recursive crawling with customizable depth.
            </Text>

            <div className="mt-auto flex items-center text-sm text-purple-400">
              <span>Configure import</span>
              <IconArrowRight
                size={16}
                className="ml-2 transition-transform group-hover:translate-x-1"
              />
            </div>
          </Card>
        </DialogTrigger>

        <DialogContent className="mx-auto w-[95%] max-w-2xl rounded-2xl border-0 bg-[#1c1c2e] px-4 py-6 text-white sm:px-6">
          <DialogHeader>
            <DialogTitle className="mb-4 text-xl font-bold">
              Ingest Website
            </DialogTitle>
          </DialogHeader>
          <div className="border-t border-gray-800 pt-4">
            <div className="max-h-[70vh] overflow-y-auto sm:h-auto sm:max-h-none sm:overflow-visible">
              <div className="space-y-4">
                <form
                  className="w-full"
                  onSubmit={(event) => {
                    event.preventDefault()
                  }}
                >
                  <Input
                    icon={icon}
                    className="w-full"
                    styles={{
                      input: {
                        backgroundColor: '#1A1B1E',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        borderRadius: '1rem',
                        '&:focus': {
                          borderColor: '#9370DB',
                        },
                      },
                      wrapper: {
                        width: '100%',
                      },
                    }}
                    placeholder="Enter URL..."
                    radius="xl"
                    type="url"
                    value={url}
                    size="lg"
                    onChange={(e) => {
                      handleUrlChange(e)
                    }}
                  />
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
                          styles={{
                            input: {
                              backgroundColor: '#1A1B1E',
                            },
                          }}
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
                    <p style={{ color: 'red' }}>
                      {inputErrors.maxUrls.message}
                    </p>
                  )}
                  {inputErrors.maxDepth.error && (
                    <p style={{ color: 'red' }}>
                      {inputErrors.maxDepth.message}
                    </p>
                  )}

                  <Text
                    style={{ color: '#C1C2C5', fontSize: '16px' }}
                    className={`${montserrat_heading.variable} font-montserratHeading`}
                  >
                    Limit web crawl
                  </Text>
                  <div className="pl-3">
                    <List>
                      <List.Item>
                        <strong>Equal and Below:</strong> Only scrape content
                        that starts will the given URL. E.g. nasa.gov/blogs will
                        scrape all blogs like nasa.gov/blogs/new-rocket but
                        never go to nasa.gov/events.
                      </List.Item>
                      <List.Item>
                        <strong>Same subdomain:</strong> Crawl the entire
                        subdomain. E.g. docs.nasa.gov will grab that entire
                        subdomain, but not nasa.gov or api.nasa.gov.
                      </List.Item>
                      <List.Item>
                        <strong>Entire domain:</strong> Crawl as much of this
                        entire website as possible. E.g. nasa.gov also includes
                        docs.nasa.gov
                      </List.Item>
                      <List.Item>
                        <span>
                          <strong>All:</strong> Start on the given URL and
                          wander the web...{' '}
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
                    <strong>I suggest starting with Equal and Below</strong>,
                    then just re-run this if you need more later.
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
                            <IconHome
                              style={{ width: rem(16), height: rem(16) }}
                            />
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
              </div>
            </div>
          </div>
          <div className="mt-4 border-t border-gray-800 pt-2">
            <Button
              onClick={handleIngest}
              disabled={!isUrlValid}
              className="h-11 w-full rounded-xl bg-purple-600 text-white transition-colors hover:bg-purple-700"
            >
              Ingest the Website
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
