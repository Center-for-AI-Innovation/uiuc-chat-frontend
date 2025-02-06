import {
  Card,
  Title,
  Flex,
  Text,
  ScrollArea,
  Group,
  Modal,
  CopyButton,
  Button,
  Tooltip,
} from '@mantine/core'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import { useMediaQuery } from '@mantine/hooks'
import { type CourseMetadata } from '~/types/courseMetadata'
import { useState, useEffect } from 'react'
import {
  IconDownload,
  IconRefresh,
  IconCopy,
  IconCheck,
  IconChevronDown,
  IconBook,
} from '@tabler/icons-react'
import {
  useQuery,
  useMutation,
  useQueryClient,
  type Query,
} from '@tanstack/react-query'
import {
  generateMetadata,
  getDocumentStatuses,
  downloadMetadataCSV,
  getMetadataDocuments,
  getMetadataFields,
} from '~/utils/apiUtils'
import { MetadataTable } from './ui/metadata-table'
import { Textarea } from './ui/textarea'
import { MultiSelect } from './ui/multi-select'
import { cn } from '~/lib/utils'
import { type MetadataRun, type DocumentStatus } from '~/types/metadata'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '../shadcn/accordion'

// Function to get metadata history
async function getMetadataHistory(courseName: string): Promise<MetadataRun[]> {
  const response = await fetch(
    `/api/UIUC-api/getMetadataHistory?course_name=${encodeURIComponent(courseName)}`,
  )

  if (!response.ok) {
    throw new Error(`Failed to get metadata history: ${response.statusText}`)
  }

  const data = await response.json()
  return data.history || []
}

// Add new types and components
interface JsonDialogProps {
  opened: boolean
  onClose: () => void
  jsonData: any
}

function JsonDialog({ opened, onClose, jsonData }: JsonDialogProps) {
  const formattedJson = JSON.stringify(jsonData, null, 2)

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="JSON Data"
      size="lg"
      styles={{
        title: {
          color: 'white',
          fontFamily: montserrat_heading.variable,
        },
        body: {
          backgroundColor: '#1e1f3a',
        },
        header: {
          backgroundColor: '#1e1f3a',
        },
        close: {
          color: 'white',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          },
        },
      }}
    >
      <div className="relative">
        <pre className="max-h-[70vh] overflow-auto rounded-lg bg-[#15162b] p-4 text-sm text-white/90">
          {formattedJson}
        </pre>
        <div className="absolute right-2 top-2">
          <CopyButton value={formattedJson} timeout={2000}>
            {({ copied, copy }) => (
              <Button
                color={copied ? 'teal' : 'grape'}
                onClick={copy}
                size="xs"
                variant="light"
                leftIcon={
                  copied ? <IconCheck size={16} /> : <IconCopy size={16} />
                }
              >
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            )}
          </CopyButton>
        </div>
      </div>
    </Modal>
  )
}

export default function MetadataGenerationPage({
  course_name,
  metadata,
}: {
  course_name: string
  metadata: CourseMetadata | null
}) {
  const isSmallScreen = useMediaQuery('(max-width: 960px)')
  const [prompt, setPrompt] = useState('')
  const queryClient = useQueryClient()
  const [currentRunId, setCurrentRunId] = useState<number | null>(null)
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([])
  const [selectedHistoryRun, setSelectedHistoryRun] =
    useState<MetadataRun | null>(null)
  const [jsonDialogData, setJsonDialogData] = useState<any>(null)

  // Query for available documents
  const { data: documents = [], isLoading: isLoadingDocuments } = useQuery({
    queryKey: ['metadataDocuments', course_name],
    queryFn: () => getMetadataDocuments(course_name),
  })

  // Create document options for MultiSelect
  const documentOptions = documents.map((doc) => ({
    value: doc.id.toString(),
    label: doc.readable_filename,
  }))

  // Create document names map for the table
  const documentNames = documents.reduce(
    (acc, doc) => ({ ...acc, [doc.id]: doc.readable_filename }),
    {} as Record<number, string>,
  )

  // Mutation for generating metadata
  const { mutate: generateMetadataMutation, isPending: isGenerating } =
    useMutation({
      mutationFn: () =>
        generateMetadata(prompt, selectedDocumentIds.map(Number)),
      onSuccess: (data) => {
        setCurrentRunId(data.run_id)
        queryClient.invalidateQueries({ queryKey: ['documentStatuses'] })
        queryClient.invalidateQueries({ queryKey: ['metadataHistory'] })
      },
    })

  // Query for document statuses
  const { data: documentStatuses = [], isLoading: isLoadingStatuses } =
    useQuery({
      queryKey: ['documentStatuses', selectedDocumentIds, currentRunId],
      queryFn: () =>
        getDocumentStatuses(selectedDocumentIds.map(Number), currentRunId!),
      enabled: currentRunId !== null,
      refetchInterval: (query: Query<DocumentStatus[], Error>) => {
        // If any document is still in progress or we have no statuses yet, poll every 5 seconds
        if (
          !query.state.data?.length ||
          query.state.data.some((doc) => doc.run_status === 'in_progress')
        ) {
          return 5000
        }
        // If all documents are completed or failed, stop polling
        if (
          query.state.data?.every((doc) =>
            ['completed', 'failed'].includes(doc.run_status),
          )
        ) {
          return false
        }
        return 5000 // Continue polling by default
      },
    })

  // Watch for completion and update state
  useEffect(() => {
    if (documentStatuses.length > 0) {
      const allCompleted = documentStatuses.every((doc) =>
        ['completed', 'failed'].includes(doc.run_status),
      )
      if (allCompleted) {
        // Wait for a short delay to ensure all updates are processed
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['metadataHistory'] })
          setCurrentRunId(null) // Re-enable the form only when all docs are completed
        }, 1000)
      }
    }
  }, [documentStatuses, queryClient])

  // Mutation for downloading CSV
  const { mutate: downloadCSV, isPending: isDownloading } = useMutation({
    mutationFn: (runIds: number[]) => downloadMetadataCSV(runIds),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `metadata_${course_name}_${new Date().toISOString()}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    },
  })

  // Check if all documents are processed
  const isAllCompleted = documentStatuses?.every((doc) =>
    ['completed', 'failed'].includes(doc.run_status),
  )
  const hasError = documentStatuses?.some((doc) => doc.run_status === 'failed')

  // Query for metadata history
  const { data: historyData = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ['metadataHistory', course_name],
    queryFn: () => getMetadataHistory(course_name),
    // Refresh history data every 5 seconds while there's an active run or viewing a running item
    refetchInterval:
      currentRunId || selectedHistoryRun?.status === 'in_progress'
        ? 5000
        : false,
  })

  // Automatically select in-progress run from history
  useEffect(() => {
    if (!currentRunId && !selectedHistoryRun && historyData?.length > 0) {
      const inProgressRun = historyData.find(
        (run) => run.status === 'in_progress',
      )
      if (inProgressRun) {
        // setSelectedHistoryRun(inProgressRun)
        setCurrentRunId(inProgressRun.run_id)
        setSelectedDocumentIds(inProgressRun.document_ids.map(String))
        setPrompt(inProgressRun.prompt)
      }
    }
  }, [historyData, currentRunId, selectedHistoryRun])

  // Query for document statuses for history item
  const {
    data: historyDocumentStatuses = [],
    isLoading: isLoadingHistoryStatuses,
  } = useQuery({
    queryKey: ['historyDocumentStatuses', selectedHistoryRun?.run_id],
    queryFn: async () => {
      if (!selectedHistoryRun) return []
      // Get all document statuses for the selected run
      const response = await fetch(
        `/api/UIUC-api/getDocumentStatuses?run_id=${selectedHistoryRun.run_id}`,
      )
      if (!response.ok) {
        throw new Error('Failed to fetch document statuses')
      }
      const data = await response.json()
      return data.statuses || []
    },
    enabled: selectedHistoryRun !== null && !currentRunId,
  })

  // Query for metadata fields for current run
  const { data: currentMetadata = [], isLoading: isLoadingCurrentMetadata } =
    useQuery({
      queryKey: ['metadataFields', currentRunId],
      queryFn: async () => {
        console.log('Fetching current metadata for run ID:', currentRunId)
        const data = await getMetadataFields(currentRunId!)
        console.log('Current metadata response:', data)

        // Transform data to have one row per document
        const documentRows = new Map<number, any>()

        data.forEach((field) => {
          if (!documentRows.has(field.document_id)) {
            documentRows.set(field.document_id, {
              document_id: field.document_id,
              document_name: documentNames[field.document_id],
              run_status:
                documentStatuses?.find(
                  (doc) => doc.document_id === field.document_id,
                )?.run_status || 'in_progress',
              last_error: documentStatuses?.find(
                (doc) => doc.document_id === field.document_id,
              )?.last_error,
            })
          }

          const row = documentRows.get(field.document_id)
          row[field.field_name] = field.field_value
        })

        return Array.from(documentRows.values())
      },
      enabled: currentRunId !== null,
      refetchInterval: (query: Query<any[], Error>) => {
        // If any document is still in progress, poll every 5 seconds
        if (documentStatuses?.some((doc) => doc.run_status === 'in_progress')) {
          return 5000
        }
        return false
      },
    })

  // Query for metadata fields for history item
  const { data: historyMetadata = [], isLoading: isLoadingHistoryMetadata } =
    useQuery({
      queryKey: ['metadataFields', selectedHistoryRun?.run_id],
      queryFn: async () => {
        console.log(
          'Fetching history metadata for run ID:',
          selectedHistoryRun?.run_id,
        )
        const data = await getMetadataFields(selectedHistoryRun!.run_id)
        console.log('History metadata response:', data)

        // Transform data to have one row per document
        const documentRows = new Map<number, any>()

        data.forEach((field) => {
          if (!documentRows.has(field.document_id)) {
            documentRows.set(field.document_id, {
              document_id: field.document_id,
              document_name: documentNames[field.document_id],
              // Map the MetadataRun status to DocumentStatus status
              run_status:
                selectedHistoryRun?.status === 'in_progress'
                  ? 'in_progress'
                  : selectedHistoryRun?.status,
            })
          }

          const row = documentRows.get(field.document_id)
          row[field.field_name] = field.field_value
        })

        return Array.from(documentRows.values())
      },
      enabled: selectedHistoryRun !== null && !currentRunId,
      refetchInterval:
        selectedHistoryRun?.status === 'in_progress' ? 5000 : false,
    })

  // If we have a current run but no metadata yet, show loading state for selected documents
  const loadingMetadata =
    currentRunId && !currentMetadata.length
      ? selectedDocumentIds.map((id) => ({
          document_id: Number(id),
          document_name: documentNames[Number(id)],
          run_status:
            documentStatuses?.find((doc) => doc.document_id === Number(id))
              ?.run_status || 'in_progress',
          last_error: documentStatuses?.find(
            (doc) => doc.document_id === Number(id),
          )?.last_error,
        }))
      : []

  // Function to handle history item click
  const handleHistoryClick = (run: MetadataRun) => {
    if (!currentRunId) {
      setSelectedHistoryRun(run === selectedHistoryRun ? null : run)
      // Invalidate the history document statuses query to force a refetch
      queryClient.invalidateQueries({
        queryKey: ['historyDocumentStatuses', run.run_id],
      })
    }
  }

  // Function to render metadata value
  const renderMetadataValue = (value: any) => {
    if (value === null || value === undefined) return '-'
    if (typeof value === 'object') {
      return (
        <div
          className="cursor-pointer text-white/90 hover:text-white"
          onClick={() => setJsonDialogData(value)}
        >
          <div className="flex items-center gap-1">
            <span>View JSON</span>
            <IconCopy size={14} className="text-white/60" />
          </div>
        </div>
      )
    }
    return String(value)
  }

  return (
    // <div className="flex w-full flex-col items-center gap-6">
    <>
      <Card
        shadow="xs"
        padding="none"
        radius="xl"
        className="mt-[2%] w-[96%] md:w-[90%] 2xl:w-[90%]"
      >
        <Flex direction={isSmallScreen ? 'column' : 'row'}>
          {/* Left Panel - Main Content */}
          <div
            style={{
              flex: isSmallScreen ? '1 1 100%' : '1 1 95%',
              border: 'None',
              color: 'white',
            }}
            className="min-h-full bg-gradient-to-br from-purple-900 via-indigo-800 to-blue-800"
          >
            <div className="w-full border-b border-white/10 bg-black/20 px-4 py-3 sm:px-6 sm:py-4 md:px-8">
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <Title
                    order={2}
                    className={`${montserrat_heading.variable} font-montserratHeading text-lg text-white/90 sm:text-2xl`}
                  >
                    Deep Research
                  </Title>
                  <Text className="text-white/60">/</Text>
                  <Title
                    order={3}
                    variant="gradient"
                    gradient={{ from: 'gold', to: 'white', deg: 50 }}
                    className={`${montserrat_heading.variable} min-w-0 font-montserratHeading text-base sm:text-xl ${
                      course_name.length > 40
                        ? 'max-w-[120px] truncate sm:max-w-[300px] lg:max-w-[400px]'
                        : ''
                    }`}
                  >
                    {course_name}
                  </Title>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 md:p-8">
              {/* Document Selection and Prompt Area */}
              <Card className="mb-6 rounded-xl bg-black/20 p-6">
                {/* Guide Section */}
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem
                    value="guide"
                    className="overflow-hidden rounded-lg bg-[#15162c]"
                  >
                    <AccordionTrigger className="w-full px-4 py-3 hover:no-underline [&>svg]:hidden [&[data-state=open]>div>div:last-child>svg]:rotate-180">
                      <div className="flex w-full items-center justify-between">
                        <div className="flex items-center gap-2">
                          <IconBook className="h-5 w-5 text-white/80" />
                          <Text
                            className={`${montserrat_heading.variable} font-montserratHeading text-base text-white/90`}
                          >
                            Deep Research Guide
                          </Text>
                        </div>
                        <div className="flex items-center">
                          <IconChevronDown className="h-4 w-4 shrink-0 text-white/60 transition-transform duration-200" />
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="border-t border-white/10">
                        <div className="space-y-4 p-4">
                          {/* About Section */}
                          <div>
                            <Text
                              className={`${montserrat_heading.variable} mb-2 font-montserratHeading text-sm text-white/90`}
                            >
                              About
                            </Text>
                            <Text
                              className={`${montserrat_paragraph.variable} font-montserratParagraph text-sm leading-relaxed text-white/70`}
                            >
                              This advanced AI-powered tool performs deep
                              analysis of your documents, uncovering valuable
                              insights and relationships. It intelligently
                              processes both textual content and tabular data,
                              organizing the findings into a clear hierarchical
                              structure. The extracted information is
                              thoughtfully categorized into main topics, logical
                              groups, and detailed attributes, making it easy to
                              explore and understand your documents&apos;
                              content in depth.
                            </Text>
                          </div>

                          {/* Usage Instructions Section */}
                          <div>
                            <Text
                              className={`${montserrat_heading.variable} mb-2 font-montserratHeading text-sm text-white/90`}
                            >
                              Usage Instructions
                            </Text>
                            <ul
                              className={`${montserrat_paragraph.variable} list-inside list-disc space-y-1 font-montserratParagraph text-sm text-white/70`}
                            >
                              <li>
                                Enter a clear, specific prompt to analyze your
                                selected documents
                              </li>
                              <li>
                                For structured insights, use JSON format:{' '}
                                {`{"field_name": "description of what to analyze"}`}
                              </li>
                              <li>
                                Each insight will be displayed in an organized
                                table format
                              </li>
                              <li>
                                Complex findings will be shown as expandable
                                JSON objects
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {/* Document Selection */}
                <div className="my-6">
                  <div className="mb-2 flex items-center justify-between">
                    <Text
                      className={`${montserrat_paragraph.variable} font-montserratParagraph text-white/90`}
                    >
                      Select Documents
                    </Text>
                    <Text
                      className={`${montserrat_paragraph.variable} font-montserratParagraph text-xs text-white/60`}
                    >
                      You can select multiple documents
                    </Text>
                  </div>
                  <MultiSelect
                    options={documentOptions}
                    selected={selectedDocumentIds}
                    onChange={setSelectedDocumentIds}
                    placeholder="Search and select documents..."
                    disabled={currentRunId !== null || isGenerating}
                    className={`${montserrat_paragraph.variable} border-none bg-[#15162c] font-montserratParagraph focus-visible:ring-indigo-500`}
                  />
                </div>

                {/* Prompt Input */}
                <div className="mb-6">
                  <Text
                    className={`${montserrat_paragraph.variable} mb-2 font-montserratParagraph text-white/90`}
                  >
                    Enter Prompt
                  </Text>
                  <div className="relative">
                    <Textarea
                      placeholder='e.g., {"title": "Extract the main title", "authors": "List all authors", "abstract": "Get the paper abstract"}'
                      value={prompt}
                      onChange={(e) => {
                        const newValue = e.target.value
                        // Try to format JSON if the input is valid JSON
                        try {
                          const parsed = JSON.parse(newValue)
                          setPrompt(JSON.stringify(parsed, null, 2))
                        } catch {
                          setPrompt(newValue)
                        }
                      }}
                      className="min-h-[120px] border-white/10 bg-[#15162c] font-mono text-white placeholder:text-white/50 focus-visible:ring-indigo-500"
                    />
                    {prompt && (
                      <CopyButton value={prompt} timeout={2000}>
                        {({ copied, copy }) => (
                          <Button
                            variant="subtle"
                            size="xs"
                            className="absolute right-2 top-2 text-white/60 hover:bg-white/10 hover:text-white"
                            onClick={copy}
                          >
                            {copied ? (
                              <IconCheck size={14} />
                            ) : (
                              <IconCopy size={14} />
                            )}
                          </Button>
                        )}
                      </CopyButton>
                    )}
                  </div>
                </div>

                {/* Generate Button */}
                <div className="w-fit">
                  <div className="inline-block">
                    {' '}
                    {/* Wrapper div for the tooltip */}
                    <Tooltip
                      label={
                        currentRunId
                          ? 'An analysis is already in progress'
                          : !prompt.trim()
                            ? 'Please enter a prompt'
                            : selectedDocumentIds.length === 0
                              ? 'Please select at least one document'
                              : ''
                      }
                      position="top"
                      disabled={
                        !(
                          currentRunId ||
                          !prompt.trim() ||
                          selectedDocumentIds.length === 0
                        )
                      }
                    >
                      <div>
                        {' '}
                        {/* Additional wrapper for the disabled button */}
                        <Button
                          className="relative transform bg-indigo-600 text-white transition-all hover:bg-indigo-700 disabled:opacity-50"
                          onClick={() => generateMetadataMutation()}
                          disabled={
                            isGenerating ||
                            currentRunId !== null ||
                            !prompt.trim() ||
                            selectedDocumentIds.length === 0
                          }
                        >
                          {isGenerating ? (
                            <div className="flex items-center gap-2">
                              <IconRefresh className="h-4 w-4 animate-spin" />
                              Generating...
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <IconRefresh className="h-4 w-4" />
                              Generate
                            </div>
                          )}
                        </Button>
                      </div>
                    </Tooltip>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Right Panel - History */}
          <div
            style={{
              flex: isSmallScreen ? '1 1 100%' : '1 1 40%',
              backgroundColor: '#15162c',
              color: 'white',
            }}
            className="rounded-r-xl p-4 sm:p-6"
          >
            <Title
              order={3}
              className={`${montserrat_heading.variable} mb-4 font-montserratHeading text-white/90`}
            >
              Generation History
            </Title>
            <ScrollArea
              h={isSmallScreen ? 300 : 'calc(100vh - 200px)'}
              className="pr-4"
            >
              {isLoadingHistory ? (
                <Text color="dimmed">Loading history...</Text>
              ) : historyData.length === 0 ? (
                <Text color="dimmed">No previous runs</Text>
              ) : (
                <div className="space-y-4">
                  {historyData.map((run) => (
                    <Card
                      key={run.run_id}
                      className={cn(
                        'cursor-pointer rounded-lg bg-black/20 p-4 transition-colors hover:bg-black/30',
                        selectedHistoryRun?.run_id === run.run_id &&
                          !currentRunId &&
                          'bg-purple-800',
                        'hover:bg-indigo-600',
                      )}
                      padding="sm"
                      onClick={() =>
                        currentRunId ? null : handleHistoryClick(run)
                      }
                    >
                      <Group position="apart" mb="xs">
                        <Text
                          className={`${montserrat_paragraph.variable} font-montserratParagraph text-sm text-white/90`}
                        >
                          Run #{run.run_id}
                        </Text>
                        <div className="flex items-center gap-2">
                          <Text
                            className={`${montserrat_paragraph.variable} font-montserratParagraph text-xs text-white/60`}
                          >
                            {new Date(run.timestamp).toLocaleString()}
                          </Text>
                          {run.prompt && (
                            <CopyButton value={run.prompt} timeout={2000}>
                              {({ copied, copy }) => (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 p-0 text-white/60 hover:bg-white/10 hover:text-white"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    copy()
                                  }}
                                >
                                  {copied ? (
                                    <IconCheck className="h-4 w-4" />
                                  ) : (
                                    <IconCopy className="h-4 w-4" />
                                  )}
                                </Button>
                              )}
                            </CopyButton>
                          )}
                          {run.status === 'completed' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 p-0 text-white/60 hover:bg-white/10 hover:text-white"
                              onClick={(e) => {
                                e.stopPropagation()
                                downloadCSV([run.run_id])
                              }}
                            >
                              <IconDownload className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </Group>
                      {run.prompt && (
                        <Text
                          className={`${montserrat_paragraph.variable} mb-2 line-clamp-2 font-montserratParagraph text-sm text-white/80`}
                        >
                          {run.prompt}
                        </Text>
                      )}
                      <Group position="apart">
                        <Text
                          className={`${montserrat_paragraph.variable} font-montserratParagraph text-xs`}
                          color={
                            run.status === 'completed'
                              ? 'teal'
                              : run.status === 'failed'
                                ? 'red'
                                : 'yellow'
                          }
                        >
                          {run.status.toUpperCase()}
                        </Text>
                        {run.document_count && (
                          <Text
                            className={`${montserrat_paragraph.variable} font-montserratParagraph text-xs text-white/60`}
                          >
                            {run.document_count} document
                            {run.document_count !== 1 ? 's' : ''}
                          </Text>
                        )}
                      </Group>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </Flex>
      </Card>

      {/* Results Table */}
      {(currentRunId || selectedHistoryRun) && (
        <Card
          shadow="xs"
          padding="none"
          radius="xl"
          className="mt-[2%] w-[96%] md:w-[90%] 2xl:w-[90%]"
        >
          <div
            style={{
              color: 'white',
            }}
            className="min-h-full bg-gradient-to-r from-purple-900 via-indigo-800 to-blue-800"
          >
            <div className="w-full border-b border-white/10 bg-black/20 px-4 py-3 sm:px-6 sm:py-4 md:px-8">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <Title
                    order={3}
                    className={`${montserrat_heading.variable} font-montserratHeading text-lg text-white/90 sm:text-2xl`}
                  >
                    Research Results
                    <Text
                      component="span"
                      className="ml-2 text-sm text-white/60"
                    >
                      Run #{currentRunId || selectedHistoryRun?.run_id}
                    </Text>
                  </Title>

                  {((currentRunId && isAllCompleted && !hasError) ||
                    selectedHistoryRun?.status === 'completed') && (
                    <Button
                      variant="subtle"
                      size="sm"
                      onClick={() =>
                        downloadCSV([
                          currentRunId || selectedHistoryRun!.run_id,
                        ])
                      }
                      className="shrink-0 rounded-md bg-purple-800 text-white hover:bg-indigo-600"
                      disabled={isDownloading}
                      leftIcon={<IconDownload className="h-4 w-4" />}
                    >
                      Export CSV
                    </Button>
                  )}
                </div>

                {(currentRunId ? prompt : selectedHistoryRun?.prompt) && (
                  <div className="flex flex-col gap-1">
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem
                        value="prompt-details"
                        className="overflow-hidden rounded-lg bg-[#15162c]"
                      >
                        <AccordionTrigger className="w-full px-4 py-3 hover:no-underline [&>svg]:hidden [&[data-state=open]>div>div:last-child>svg]:rotate-180">
                          <div className="flex w-full items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Text
                                className={`${montserrat_heading.variable} font-montserratHeading text-base text-white/90`}
                              >
                                Prompt
                              </Text>
                              <CopyButton
                                value={
                                  currentRunId
                                    ? prompt
                                    : selectedHistoryRun?.prompt || ''
                                }
                                timeout={2000}
                              >
                                {({ copied, copy }) => (
                                  <Button
                                    variant="subtle"
                                    size="xs"
                                    className="h-6 p-0 text-white/60 hover:bg-white/10 hover:text-white"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      copy()
                                    }}
                                  >
                                    {copied ? (
                                      <IconCheck className="h-4 w-4" />
                                    ) : (
                                      <IconCopy className="h-4 w-4" />
                                    )}
                                  </Button>
                                )}
                              </CopyButton>
                            </div>
                            <div className="flex items-center">
                              <IconChevronDown className="h-4 w-4 shrink-0 text-white/60 transition-transform duration-200" />
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="border-t border-white/10">
                            <div className="p-4">
                              <div className="max-h-[200px] overflow-auto rounded-lg bg-[#1e1f3a] p-4">
                                <Text
                                  className={`${montserrat_paragraph.variable} whitespace-pre font-mono font-montserratParagraph text-sm leading-relaxed text-white/90`}
                                >
                                  {(() => {
                                    const promptText = currentRunId
                                      ? prompt
                                      : selectedHistoryRun?.prompt
                                    try {
                                      const parsed = JSON.parse(
                                        promptText || '',
                                      )
                                      return JSON.stringify(parsed, null, 2)
                                    } catch {
                                      return promptText
                                    }
                                  })()}
                                </Text>
                              </div>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[#1e1f3a]/80 px-4 py-4 sm:px-6 sm:py-6 md:px-8">
              {isLoadingCurrentMetadata || isLoadingHistoryMetadata ? (
                <div className="flex h-32 items-center justify-center rounded-xl bg-[#15162c] text-white/60">
                  <Text>Loading metadata...</Text>
                </div>
              ) : currentRunId ? (
                <div className="max-h-[calc(80vh-16rem)] min-h-[400px] overflow-y-auto rounded-xl">
                  <MetadataTable
                    data={
                      currentMetadata.length ? currentMetadata : loadingMetadata
                    }
                    onViewJson={setJsonDialogData}
                  />
                </div>
              ) : historyMetadata.length === 0 ? (
                <div className="flex h-32 items-center justify-center rounded-xl bg-[#15162c] text-white/60">
                  <Text>No metadata available</Text>
                </div>
              ) : (
                <div className="max-h-[calc(80vh-16rem)] min-h-[400px] overflow-y-auto rounded-xl">
                  <MetadataTable
                    data={historyMetadata}
                    onViewJson={setJsonDialogData}
                  />
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* JSON Dialog */}
      <JsonDialog
        opened={jsonDialogData !== null}
        onClose={() => setJsonDialogData(null)}
        jsonData={jsonDialogData}
      />
    </>
  )
}
