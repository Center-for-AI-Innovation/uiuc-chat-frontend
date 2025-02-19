import {
  Card,
  Title,
  Tabs,
  Indicator,
  Tooltip,
  Button,
  Modal,
  Text,
  createStyles,
} from '@mantine/core'
import { ProjectFilesTable } from './ProjectFilesTable'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import { type CourseMetadata } from '~/types/courseMetadata'
import { useState, useEffect } from 'react'
import { useMediaQuery } from '@mantine/hooks'
import { IconFileExport, IconRefresh } from '@tabler/icons-react'
import { useRouter } from 'next/router'
import { handleExport } from '~/pages/api/UIUC-api/exportAllDocuments'
import { showToastOnUpdate } from './MakeQueryAnalysisPage'
import { useQueryClient } from '@tanstack/react-query'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import UploadNotification, { type FileUpload } from './UploadNotification'

const useStyles = createStyles(() => ({
  tabsList: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    padding: '0.5rem 2rem',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    gap: '1rem',
  },
  tab: {
    color: 'rgba(255, 255, 255, 0.9)',
    '&[data-active]': {
      backgroundColor: 'rgba(139, 92, 246, 0.3)',
    },
    '&:hover': {
      backgroundColor: 'rgba(139, 92, 246, 0.2)',
    },
    borderRadius: '0.5rem',
    padding: '0.5rem 1rem',
  },
  tableContainer: {
    // backgroundColor: '#1e1f3a',
    borderRadius: '0 0 0.75rem 0.75rem',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
    '&::-webkit-scrollbar': {
      width: '8px',
    },
    '&::-webkit-scrollbar-track': {
      background: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '4px',
    },
    '&::-webkit-scrollbar-thumb': {
      background: 'rgba(139, 92, 246, 0.5)',
      borderRadius: '4px',
    },
  },
}))

function DocumentsCard({
  course_name,
  metadata,
}: {
  course_name: string
  metadata: CourseMetadata
}) {
  const [tabValue, setTabValue] = useState<string | null>('success')
  const [failedCount, setFailedCount] = useState<number>(0)
  const isSmallScreen = useMediaQuery('(max-width: 960px)')
  const [exportModalOpened, setExportModalOpened] = useState(false)
  const [rescrapeModalOpened, setRescrapeModalOpened] = useState(false)
  const [hasBaseUrls, setHasBaseUrls] = useState(false)
  const router = useRouter()
  const { classes, theme } = useStyles()
  const queryClient = useQueryClient()
  const [uploadFiles, setUploadFiles] = useState<FileUpload[]>([])

  useEffect(() => {
    const checkIngestStatus = async () => {
      const response = await fetch(
        `/api/materialsTable/docsInProgress?course_name=${course_name}`,
      )
      const data = await response.json()
      const docsResponse = await fetch(
        `/api/materialsTable/docs?course_name=${course_name}`,
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
        queryKey: ['documents', course_name],
      })
    }

    const interval = setInterval(checkIngestStatus, 3000)
    return () => {
      clearInterval(interval)
    }
  }, [course_name, queryClient])

  // Add query to check for documents with base URLs
  const { data: documentsWithBaseUrls } = useQuery({
    queryKey: ['documentsWithBaseUrls', course_name],
    queryFn: async () => {
      const response = await fetch(
        `/api/materialsTable/docs?course_name=${course_name}`,
      )
      if (!response.ok) {
        throw new Error('Failed to fetch documents')
      }
      const data = await response.json()
      const hasBaseUrl = data.documents?.some((doc: any) => doc.base_url)
      setHasBaseUrls(hasBaseUrl)
      return data
    },
  })

  const handleRescrape = async () => {
    setRescrapeModalOpened(false)

    try {
      const response = await fetch(
        `/api/materialsTable/getBaseUrlsWithGroups?course_name=${course_name}`,
      )
      if (!response.ok) {
        throw new Error('Failed to fetch base URLs')
      }

      const baseUrlsData = await response.json()
      const baseUrls = baseUrlsData.data

      if (!baseUrls || Object.keys(baseUrls).length === 0) {
        showToastOnUpdate(theme, true, false, 'No documents found to rescrape')
        return
      }

      // Create a Map to store normalized URLs and their original forms
      const normalizedToOriginal = new Map<
        string,
        { url: string; groups: any }
      >()

      // Helper function to normalize URLs
      const normalizeUrl = (url: string): string => {
        try {
          const urlObj = new URL(url)
          // Remove protocol, www, trailing slashes, and normalize domain case
          return (
            urlObj.hostname.toLowerCase().replace(/^www\./, '') +
            urlObj.pathname.toLowerCase().replace(/\/+$/, '') +
            urlObj.search.toLowerCase()
          )
        } catch (error) {
          return url
        }
      }

      // First pass: Collect all normalized forms and detect duplicates
      Object.entries(baseUrls).forEach(([baseUrl, groups]) => {
        try {
          const normalizedUrl = normalizeUrl(baseUrl)
          if (!normalizedToOriginal.has(normalizedUrl)) {
            normalizedToOriginal.set(normalizedUrl, { url: baseUrl, groups })
          }
        } catch (error) {
          // Skip invalid URLs silently
        }
      })

      // Convert back to object with only unique URLs
      const uniqueBaseUrls: Record<string, any> = {}
      normalizedToOriginal.forEach(({ url, groups }, normalizedUrl) => {
        uniqueBaseUrls[url] = groups
      })

      for (const baseUrl of Object.keys(uniqueBaseUrls)) {
        const newFile: FileUpload = {
          name: baseUrl,
          status: 'uploading',
          type: 'webscrape',
          url: baseUrl,
          isBaseUrl: true,
        }

        setUploadFiles((prevFiles) => {
          // Check if we already have this base URL in progress
          const normalizedNewUrl = normalizeUrl(baseUrl)

          const exists = prevFiles.some((file) => {
            if (!file.isBaseUrl || !file.url) return false
            try {
              const normalizedExistingUrl = normalizeUrl(file.url)
              return normalizedNewUrl === normalizedExistingUrl
            } catch (error) {
              return false
            }
          })

          if (exists) {
            return prevFiles
          }
          return [...prevFiles, newFile]
        })

        const postParams = {
          url: baseUrl,
          courseName: course_name,
          maxPagesToCrawl: 50,
          scrapeStrategy: 'equal-and-below',
          match: `http?(s)://${new URL(baseUrl).hostname}/**`,
          maxTokens: 2000000,
          documentGroups: uniqueBaseUrls[baseUrl],
        }

        try {
          const response = await axios.post(
            'https://crawlee-production.up.railway.app/crawl',
            {
              params: postParams,
            },
          )
        } catch (error: any) {
          setUploadFiles((prevFiles) =>
            prevFiles.map((file) =>
              file.name === baseUrl
                ? {
                    ...file,
                    status: 'error',
                    error:
                      error.response?.data?.message ||
                      error.message ||
                      'Failed to scrape website',
                  }
                : file,
            ),
          )
          showToastOnUpdate(
            theme,
            true,
            false,
            `Failed to scrape ${baseUrl}: ${error.response?.data?.message || error.message || 'Unknown error'}`,
          )
        }
      }
    } catch (error: any) {
      showToastOnUpdate(
        theme,
        true,
        false,
        `Failed to rescrape documents: ${error.message || 'Unknown error'}`,
      )
    }
  }

  const getCurrentPageName = () => {
    return router.asPath.slice(1).split('/')[0] as string
  }

  return (
    <Card
      shadow="xs"
      padding="none"
      radius="xl"
      className="mt-[2%] w-[96%] md:w-[90%] 2xl:w-[90%]"
    >
      <div className="min-h-full bg-gradient-to-r from-purple-900 via-indigo-800 to-blue-800">
        <Modal
          opened={exportModalOpened}
          onClose={() => setExportModalOpened(false)}
          title="Please confirm your action"
        >
          <Text size="sm" style={{ color: 'white' }}>
            {`Are you sure you want to export all the documents and embeddings?`}
          </Text>
          <div className="mt-5 flex justify-end gap-2">
            <Button
              className="rounded-md bg-transparent text-white hover:bg-indigo-600"
              onClick={() => setExportModalOpened(false)}
            >
              Cancel
            </Button>
            <Button
              className="rounded-md bg-purple-800 text-white hover:bg-indigo-600"
              onClick={async () => {
                setExportModalOpened(false)
                const result = await handleExport(getCurrentPageName())
                if (result && result.message) {
                  showToastOnUpdate(theme, false, false, result.message)
                }
              }}
            >
              Export
            </Button>
          </div>
        </Modal>

        <Modal
          opened={rescrapeModalOpened}
          onClose={() => setRescrapeModalOpened(false)}
          title="Please confirm your action"
        >
          <Text size="sm" style={{ color: 'white' }}>
            {`Are you sure you want to rescrape all documents? This will update all previously scraped web content.`}
          </Text>
          <div className="mt-5 flex justify-end gap-2">
            <Button
              className="rounded-md bg-transparent text-white hover:bg-indigo-600"
              onClick={() => setRescrapeModalOpened(false)}
            >
              Cancel
            </Button>
            <Button
              className="rounded-md bg-purple-800 text-white hover:bg-indigo-600"
              onClick={handleRescrape}
            >
              Rescrape
            </Button>
          </div>
        </Modal>

        <div className="w-full border-b border-white/10 bg-black/20 px-4 py-3 sm:px-6 sm:py-4 md:px-8">
          <div className="flex items-center justify-between gap-2">
            <Title
              order={3}
              className={`${montserrat_heading.variable} font-montserratHeading text-lg text-white/90 sm:text-2xl`}
            >
              Project Files
            </Title>

            <div className="flex gap-2">
              <Button
                variant="subtle"
                leftIcon={<IconRefresh size={20} />}
                onClick={() => setRescrapeModalOpened(true)}
                disabled={!hasBaseUrls}
                className={`
                  ${montserrat_paragraph.variable} 
                  rounded-3xl bg-purple-800 px-4 font-montserratParagraph
                  text-sm text-white transition-colors hover:bg-indigo-600 
                  disabled:cursor-not-allowed disabled:opacity-50
                  sm:text-base
                `}
              >
                <span className="hidden sm:inline">Rescrape Documents</span>
                <span className="inline sm:hidden">Rescrape</span>
              </Button>

              <Button
                variant="subtle"
                leftIcon={<IconFileExport size={20} />}
                onClick={() => setExportModalOpened(true)}
                className={`
                  ${montserrat_paragraph.variable} 
                  rounded-3xl bg-purple-800 px-4 font-montserratParagraph
                  text-sm text-white transition-colors hover:bg-indigo-600 
                  sm:text-base
                `}
              >
                <span className="hidden sm:inline">
                  Export All Documents & Embeddings
                </span>
                <span className="inline sm:hidden">Export All</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-[#1e1f3a]/80">
          {metadata && (
            <div className={classes.tableContainer}>
              <ProjectFilesTable
                course_name={course_name}
                setFailedCount={setFailedCount}
                tabValue={tabValue as string}
                onTabChange={(value) => setTabValue(value)}
                failedCount={failedCount}
              />
            </div>
          )}
        </div>
      </div>
      {uploadFiles.length > 0 && (
        <UploadNotification
          files={uploadFiles}
          onClose={() => setUploadFiles([])}
          projectName={course_name}
        />
      )}
    </Card>
  )
}

export default DocumentsCard
