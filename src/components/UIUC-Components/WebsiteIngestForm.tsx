import React, { useEffect, useState } from 'react'
import {
  Text,
  Card,
  Tooltip,
  Button,
  Input,
  TextInput,
  List,
  SegmentedControl,
  Center,
  rem,
  Tabs,
} from '@mantine/core'
import {
  Dialog,
  DialogContent,
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
import { type FileUpload } from './UploadNotification'
import { type QueryClient } from '@tanstack/react-query'
import FirecrawlWebsiteIngestForm from './FirecrawlWebsiteIngestForm'
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
  const [activeTab, setActiveTab] = useState<string>('crawlee')
  const [depth, setDepth] = useState('2')
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    variable: string,
  ) => {
    const value = e.target.value
    if (variable === 'maxUrls') {
      setMaxUrls(value)

      // Different validation limits based on active tab
      const maxLimit = activeTab === 'firecrawl' ? 5000 : 500
      const minLimit = 1

      if (value && /^\d+$/.test(value)) {
        const numValue = parseInt(value)
        if (numValue >= minLimit && numValue <= maxLimit) {
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
        if (numValue < minLimit || numValue > maxLimit) {
          errorMessage = `Max URLs should be between ${minLimit} and ${maxLimit}`
        }
      }

      setInputErrors((prev) => ({
        ...prev,
        maxUrls: {
          error: !!errorMessage,
          message: errorMessage,
        },
      }))
    } else if (variable === 'depth') {
      setDepth(value)
    }
  }
  const icon = <IconWorldDownload size={'50%'} />
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
        url: url,
        isBaseUrl: true,
      }
      setUploadFiles((prevFiles) => [...prevFiles, newFile])

      try {
        const response = await scrapeWeb(
          url,
          project_name,
          maxUrls.trim() !== '' ? parseInt(maxUrls) : 50,
          scrapeStrategy,
        )
      } catch (error: unknown) {
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

  useEffect(() => {
    const checkIngestStatus = async () => {
      const response = await fetch(
        `/api/materialsTable/docsInProgress?course_name=${project_name}`,
      )
      const data = await response.json()
      const docsResponse = await fetch(
        `/api/materialsTable/successDocs?course_name=${project_name}`,
      )
      const docsData = await docsResponse.json()
      // Helper function to organize docs by base URL
      const organizeDocsByBaseUrl = (
        docs: Array<{ base_url: string; url: string }>,
      ) => {
        const baseUrlMap = new Map<string, Set<string>>()

        docs.forEach((doc) => {
          if (!baseUrlMap.has(doc.base_url)) {
            baseUrlMap.set(doc.base_url, new Set())
          }
          baseUrlMap.get(doc.base_url)?.add(doc.url)
        })

        return baseUrlMap
      }

      // Helper function to update status of existing files
      const updateExistingFiles = (
        currentFiles: FileUpload[],
        docsInProgress: Array<{ base_url: string }>,
      ) => {
        return currentFiles.map((file) => {
          if (file.type !== 'webscrape') return file

          const isStillIngesting = docsInProgress.some(
            (doc) => doc.base_url === file.name,
          )

          if (file.status === 'uploading' && isStillIngesting) {
            return { ...file, status: 'ingesting' as const }
          } else if (file.status === 'ingesting') {
            if (!isStillIngesting) {
              const isInCompletedDocs = docsData?.documents?.some(
                (doc: { url: string }) => doc.url === file.url,
              )

              if (isInCompletedDocs) {
                return { ...file, status: 'complete' as const }
              }

              // If not in completed docs, keep as 'ingesting'
              // The crawling might still be in progress even if not in docsInProgress
              return file
            }
          }
          return file
        })
      }

      // Helper function to create new file entries for additional URLs
      const createAdditionalFileEntries = (
        baseUrlMap: Map<string, Set<string>>,
        currentFiles: FileUpload[],
        docsInProgress: Array<{ base_url: string; readable_filename: string }>,
      ) => {
        const newFiles: FileUpload[] = []

        baseUrlMap.forEach((urls, baseUrl) => {
          // Only process if we have this base URL in our current files
          if (currentFiles.some((file) => file.name === baseUrl)) {
            const matchingDoc = docsInProgress.find(
              (doc) => doc.base_url === baseUrl,
            )

            const isStillIngesting = matchingDoc !== undefined

            urls.forEach((url) => {
              if (
                !currentFiles.some((file) => file.url === url) &&
                matchingDoc
              ) {
                newFiles.push({
                  name: url,
                  status: isStillIngesting ? 'ingesting' : 'complete',
                  type: 'webscrape',
                  url: url,
                })
              }
            })
          }
        })

        return newFiles
      }

      setUploadFiles((prev) => {
        const matchingDocsInProgress =
          data?.documents?.filter((doc: { base_url: string }) =>
            prev.some((file) => file.name === doc.base_url),
          ) || []

        const baseUrlMap = organizeDocsByBaseUrl(matchingDocsInProgress)

        const additionalFiles = createAdditionalFileEntries(
          baseUrlMap,
          prev,
          matchingDocsInProgress,
        )

        const updatedFiles = updateExistingFiles(prev, matchingDocsInProgress)

        return [...updatedFiles, ...additionalFiles]
      })

      await queryClient.invalidateQueries({
        queryKey: ['documents', project_name],
      })
    }

    const interval = setInterval(checkIngestStatus, 3000)
    return () => {
      clearInterval(interval)
    }
  }, [project_name])

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

        <DialogContent className="mx-auto w-[95%] max-w-2xl !rounded-2xl border-0 bg-[#1c1c2e] px-4 py-6 text-white sm:px-6">
          <DialogHeader>
            <DialogTitle className="mb-4 text-left text-xl font-bold">
              Ingest Website
            </DialogTitle>
          </DialogHeader>

          <Tabs
            value={activeTab}
            onTabChange={(value: string) => setActiveTab(value)}
            className="mb-4"
          >
            <Tabs.List grow>
              <Tabs.Tab value="crawlee" className="text-sm">
                Standard Crawler
              </Tabs.Tab>
              <Tabs.Tab value="firecrawl" className="text-sm">
                Firecrawl (Faster)
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="crawlee">
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
                        className="w-full rounded-full"
                        styles={{
                          input: {
                            backgroundColor: '#1A1B1E',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
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
                            <strong>Equal and Below:</strong> Only scrape
                            content that starts will the given URL. E.g.
                            nasa.gov/blogs will scrape all blogs like
                            nasa.gov/blogs/new-rocket but never go to
                            nasa.gov/events.
                          </List.Item>
                          <List.Item>
                            <strong>Same subdomain:</strong> Crawl the entire
                            subdomain. E.g. docs.nasa.gov will grab that entire
                            subdomain, but not nasa.gov or api.nasa.gov.
                          </List.Item>
                          <List.Item>
                            <strong>Entire domain:</strong> Crawl as much of
                            this entire website as possible. E.g. nasa.gov also
                            includes docs.nasa.gov
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
                        <strong>I suggest starting with Equal and Below</strong>
                        , then just re-run this if you need more later.
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
            </Tabs.Panel>

            <Tabs.Panel value="firecrawl">
              <FirecrawlWebsiteIngestForm
                url={url}
                setUrl={setUrl}
                isUrlValid={isUrlValid}
                handleUrlChange={handleUrlChange}
                maxUrls={maxUrls}
                handleInputChange={handleInputChange}
                inputErrors={inputErrors}
                setUploadFiles={setUploadFiles}
                setOpen={setOpen}
                depth={depth}
                project_name={project_name}
              />
            </Tabs.Panel>
          </Tabs>

          {activeTab === 'crawlee' && (
            <div className="mt-4 border-t border-gray-800 pt-2">
              <Button
                onClick={handleIngest}
                disabled={!isUrlValid}
                className="h-11 w-full rounded-xl bg-purple-600 text-white transition-colors hover:bg-purple-700"
              >
                Ingest the Website
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
