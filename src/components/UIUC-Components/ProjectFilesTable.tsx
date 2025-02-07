'use client'

import {
  ActionIcon,
  Box,
  Button,
  Modal,
  Group,
  MultiSelect,
  Text,
  Paper,
  Center,
  Stack,
  Image,
  createStyles,
  MantineTheme,
  TextInput,
  Code,
  CopyButton,
  Tooltip,
  Indicator,
} from '@mantine/core'
import {
  IconAlertTriangle,
  IconCheck,
  IconCopy,
  IconEye,
  IconFileExport,
  IconTrash,
  IconX,
} from '@tabler/icons-react'
import Link from 'next/link'
import { DataTable, DataTableSortStatus } from 'mantine-datatable'
import { createRef, useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { notifications, showNotification } from '@mantine/notifications'
import styled, { createGlobalStyle } from 'styled-components'

import { CourseDocument, DocumentGroup } from 'src/types/courseMaterials'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchPresignedUrl } from '~/utils/apiUtils'
import {
  useAppendToDocGroup,
  useGetDocumentGroups,
  useRemoveFromDocGroup,
} from '~/hooks/docGroupsQueries'
import { LoadingSpinner } from './LoadingSpinner'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import { useMediaQuery } from '@mantine/hooks'
import { IconInfoCircleFilled } from '@tabler/icons-react'
import { handleExport } from '~/pages/api/UIUC-api/exportAllDocuments'
import { showToastOnUpdate } from './MakeQueryAnalysisPage'
import { useRouter } from 'next/router'
import { tabWidth } from 'prettier.config.cjs'

// export const getCurrentPageName = () => {
//   const router = useRouter()
//   return router.asPath.slice(1).split('/')[0] as string
// }

const useStyles = createStyles((theme) => ({}))

const GlobalStyle = createGlobalStyle`
  .mantine-Pagination-control[data-active="true"] {
    background-color: blueviolet;
    color: white;
  }
`

const PAGE_SIZE = 100

export function ProjectFilesTable({
  course_name,
  setFailedCount = (count: number) => {},
  tabValue,
  onTabChange,
  failedCount = 0,
}: {
  course_name: string
  setFailedCount?: (count: number) => void
  tabValue: string
  onTabChange: (value: string) => void
  failedCount?: number
}) {
  const queryClient = useQueryClient()
  const [selectedRecords, setSelectedRecords] = useState<CourseDocument[]>([])
  const [filterKey, setFilterKey] = useState<string>('')
  const [filterValue, setFilterValue] = useState<string>('')
  const [modalOpened, setModalOpened] = useState(false)
  const [recordsToDelete, setRecordsToDelete] = useState<CourseDocument[]>([])
  const [page, setPage] = useState(1)
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
    columnAccessor: 'created_at',
    direction: 'desc',
  })
  const [errorModalOpened, setErrorModalOpened] = useState(false)
  const [currentError, setCurrentError] = useState('')
  const isSmallScreen = useMediaQuery('(max-width: 768px)')
  const isBetweenSmallAndMediumScreen = useMediaQuery('(max-width: 878px)')
  const [showMultiSelect, setShowMultiSelect] = useState(false)
  const [isDeletingDocuments, setIsDeletingDocuments] = useState(false)
  const [exportModalOpened, setExportModalOpened] = useState(false)
  const [showDeleteButton, setShowDeleteButton] = useState(false)
  const [selectedCount, setSelectedCount] = useState(0)
  const router = useRouter()

  const getCurrentPageName = () => {
    return router.asPath.slice(1).split('/')[0] as string
  }
  const openModel = (open: boolean, error = '') => {
    setErrorModalOpened(open)
    setCurrentError(error)
  }

  const appendToDocGroup = useAppendToDocGroup(course_name, queryClient, page)
  const removeFromDocGroup = useRemoveFromDocGroup(
    course_name,
    queryClient,
    page,
  )
  const { theme } = useStyles()

  // State to track overflow status of error column in each row of failed documents
  const [overflowStates, setOverflowStates] = useState<{
    [key: number]: boolean
  }>({})

  // Refs for each row of failed documents
  const textRefs = useRef<{ [key: number]: React.RefObject<HTMLDivElement> }>(
    {},
  )
  const multiSelectRef = useRef<HTMLDivElement>(null)
  const [selectedDocGroups, setSelectedDocGroups] = useState<string[]>([])

  //   const MultiSelect = styled(MultiSelect)`
  //   .mantine-MultiSelect-dropdown {
  //     top: 4px !important;
  //     // box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.7) !important; // Add shadow
  //     // margin-top: 0 !important; // Remove space between bar section and data dropdown
  //   }
  // `;

  // ------------- Queries -------------
  const {
    data: documents,
    isLoading: isLoadingDocuments,
    isError: isErrorDocuments,
    error: documentsError,
    refetch: refetchDocuments,
  } = useQuery({
    refetchInterval: 10_000,
    queryKey: [
      'documents',
      course_name,
      page,
      filterKey,
      filterValue,
      sortStatus.columnAccessor,
      sortStatus.direction,
    ],
    // keepPreviousData: true,
    queryFn: async () => {
      const from = (page - 1) * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      const response = await fetch(
        `/api/materialsTable/fetchProjectMaterials?from=${from}&to=${to}&course_name=${course_name}&filter_key=${filterKey}&filter_value=${filterValue}&sort_column=${sortStatus.columnAccessor}&sort_direction=${sortStatus.direction}`,
      )
      if (!response.ok) {
        throw new Error('Failed to fetch document groups')
      }

      const data = await response.json()
      return data
    },
  })

  const {
    data: failedDocuments,
    isLoading: isLoadingFailedDocuments,
    isError: isErrorFailedDocuments,
    error: failedDocumentsError,
  } = useQuery({
    refetchInterval: 10_000,
    queryKey: [
      'failedDocuments',
      course_name,
      page,
      filterKey,
      filterValue,
      sortStatus.columnAccessor,
      sortStatus.direction,
    ],
    queryFn: async () => {
      const from = (page - 1) * PAGE_SIZE
      const to = from + PAGE_SIZE - 1
      const response = await fetch(
        `/api/materialsTable/fetchFailedDocuments?from=${from}&to=${to}&course_name=${course_name}&filter_key=${filterKey}&filter_value=${filterValue}&sort_column=${sortStatus.columnAccessor}&sort_direction=${sortStatus.direction}`,
      )
      if (!response.ok) {
        throw new Error('Failed to fetch failed documents')
      }
      const failedDocumentsResponse = await response.json()
      setFailedCount(failedDocumentsResponse.recent_fail_count)
      return failedDocumentsResponse
    },
  })

  const {
    data: documentGroups,
    isLoading: isLoadingDocumentGroups,
    isError: isErrorDocumentGroups,
    refetch: refetchDocumentGroups,
  } = useGetDocumentGroups(course_name)

  useEffect(() => {
    if (tabValue === 'failed') {
      const newOverflowStates: { [key: number]: boolean } = {}
      Object.keys(textRefs.current).forEach((key) => {
        const index = Number(key)
        const currentRef = textRefs.current[index]
        if (currentRef && currentRef.current) {
          const isOverflowing =
            currentRef.current.scrollHeight > currentRef.current.clientHeight
          newOverflowStates[index] = isOverflowing
        }
      })
      setOverflowStates(newOverflowStates)
    }
  }, [failedDocuments, tabValue])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        multiSelectRef.current &&
        event.target instanceof Node &&
        !multiSelectRef.current.contains(event.target)
      ) {
        setShowMultiSelect(false)
      }
    }

    // Bind the event listener
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  async function addDocumentsToDocGroups(
    records: CourseDocument[],
    newSelectedGroups: string[],
  ) {
    const addDocGroupPromises = records.map((record) =>
      handleDocumentGroupsChange(record, [
        ...newSelectedGroups,
        ...(record.doc_groups || []),
      ]),
    )
    await Promise.all(addDocGroupPromises)
  }

  async function handleDocumentGroupsChange(
    record: CourseDocument,
    newSelectedGroups: string[],
  ) {
    const doc_groups = record.doc_groups ? record.doc_groups : []

    const removedGroups = doc_groups.filter(
      (group: any) => !newSelectedGroups.includes(group),
    )
    const appendedGroups = newSelectedGroups.filter(
      (group) => !doc_groups.includes(group),
    )

    if (removedGroups.length > 0) {
      for (const removedGroup of removedGroups) {
        await removeFromDocGroup.mutate({
          record,
          removedGroup,
        })
      }
    }
    if (appendedGroups.length > 0) {
      for (const appendedGroup of appendedGroups) {
        await appendToDocGroup.mutate({
          record,
          appendedGroup,
        })
      }
    }
  }

  const deleteDocumentMutation = useMutation({
    mutationFn: async (recordsToDelete: CourseDocument[]) => {
      console.debug('Deleting records:', recordsToDelete)
      const API_URL = 'https://flask-production-751b.up.railway.app'
      const deletePromises = recordsToDelete.map((record) =>
        axios.delete(`${API_URL}/delete`, {
          params: {
            course_name: record.course_name,
            s3_path: record.s3_path,
            url: record.url,
          },
        }),
      )
      await Promise.all(deletePromises)
      console.debug('Deleted records')
    },
    onMutate: async (recordsToDelete) => {
      console.debug('in onMutate')
      await queryClient.cancelQueries({ queryKey: ['documents', course_name] })

      const previousDocuments = queryClient.getQueryData<CourseDocument[]>([
        'documents',
        course_name,
      ])

      const previousDocumentGroups = queryClient.getQueryData([
        'documentGroups',
        course_name,
      ])

      queryClient.setQueryData<CourseDocument[]>(
        ['documents', course_name],
        (old = []) => {
          return old.filter(
            (doc) =>
              !recordsToDelete.find(
                (record) =>
                  (record.s3_path && record.s3_path === doc.s3_path) ||
                  (record.url && record.url === doc.url),
              ),
          )
        },
      )

      queryClient.setQueryData<DocumentGroup[]>(
        ['documentGroups', course_name],
        (old = []) => {
          return old.map((doc_group) => {
            recordsToDelete.forEach((record) => {
              if (doc_group.name in record.doc_groups) {
                doc_group.doc_count -= 1
              }
            })
            return doc_group
          })
        },
      )

      return { previousDocuments, previousDocumentGroups }
    },
    onError: (err, variables, context) => {
      console.debug('Error deleting documents:', err)
      if (context?.previousDocuments) {
        queryClient.setQueryData(
          ['documents', course_name],
          context.previousDocuments,
        )
      }

      if (context?.previousDocumentGroups) {
        queryClient.setQueryData(
          ['documentGroups', course_name],
          context.previousDocumentGroups,
        )
      }

      showToastOnFileDeleted(theme, true)
    },
    onSettled: async () => {
      showToastOnFileDeleted(theme)
      setShowDeleteButton(false)
      setSelectedCount(0)
      const sleep = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms))
      console.debug('sleeping for 500ms')
      await sleep(500)
      console.debug('Invalidating queries')
      queryClient.invalidateQueries({ queryKey: ['documents', course_name] })
      queryClient.invalidateQueries({
        queryKey: ['documentGroups', course_name],
      })
    },
  })

  if (isErrorDocuments) {
    showNotification({
      title: 'Error',
      message: 'Failed to fetch documents',
      color: 'red',
      icon: <IconTrash size={24} />,
    })

    return errorStateForProjectFilesTable()
  }

  const showToastOnFileDeleted = (theme: MantineTheme, was_error = false) => {
    return (
      // docs: https://mantine.dev/others/notifications/
      notifications.show({
        id: 'file-deleted-from-materials',
        withCloseButton: true,
        // onClose: () => console.debug('unmounted'),
        // onOpen: () => console.debug('mounted'),
        autoClose: 5000,
        // position="top-center",
        title: was_error ? 'Error deleting file' : 'Deleting file...',
        message: was_error
          ? "An error occurred while deleting the file. Please try again and I'd be so grateful if you email kvday2@illinois.edu to report this bug."
          : 'The file is being deleted in the background.',
        icon: was_error ? <IconAlertTriangle /> : <IconCheck />,
        styles: {
          root: {
            backgroundColor: theme.colors.nearlyWhite,
            borderColor: was_error
              ? theme.colors.errorBorder
              : theme.colors.aiPurple,
          },
          title: {
            color: theme.colors.nearlyBlack,
          },
          description: {
            color: theme.colors.nearlyBlack,
          },
          closeButton: {
            color: theme.colors.nearlyBlack,
            '&:hover': {
              backgroundColor: theme.colors.dark[1],
            },
          },
          icon: {
            backgroundColor: was_error
              ? theme.colors.errorBackground
              : theme.colors.successBackground,
            padding: '4px',
          },
        },
        loading: false,
      })
    )
  }

  const showToast = (
    theme: MantineTheme,
    title: string,
    message: string,
    was_error = false,
  ) => {
    return notifications.show({
      id: 'file-deleted-from-materials',
      withCloseButton: true,
      autoClose: 12000,
      title: title,
      message: message,
      icon: was_error ? <IconAlertTriangle /> : <IconCheck />,
      styles: {
        root: {
          backgroundColor: theme.colors.nearlyWhite,
          borderColor: was_error
            ? theme.colors.errorBorder
            : theme.colors.aiPurple,
        },
        title: {
          color: theme.colors.nearlyBlack,
        },
        description: {
          color: theme.colors.nearlyBlack,
        },
        closeButton: {
          color: theme.colors.nearlyBlack,
          '&:hover': {
            backgroundColor: theme.colors.dark[1],
          },
        },
        icon: {
          backgroundColor: was_error
            ? theme.colors.errorBackground
            : theme.colors.successBackground,
          padding: '4px',
        },
      },
      loading: false,
    })
  }

  // const items = [
  //   {
  //     name: (
  //       <span
  //         className={`${montserrat_heading.variable} font-montserratHeading`}
  //       >
  //         Document Groups
  //       </span>
  //     )
  //   },
  //   // link: ``,  // multiselect dropdown
  //   {
  //     name: (
  //       <span
  //         className={`${montserrat_heading.variable} font-montserratHeading`}
  //       >
  //         Delete Selected Document
  //       </span>
  //     ),
  //   },
  // ];
  return (
    <div className="flex h-[80vh] flex-col">
      <GlobalStyle />
      {/* Fixed Header Section */}
      <div className="flex-none">
        <div className="mb-2 flex items-center justify-between border-b border-gray-700 px-4 pt-4 sm:px-6 md:px-8 ">
          <div className="flex items-center md:space-x-4">
            <button
              onClick={() => onTabChange('success')}
              className={`rounded-t-lg px-4 py-3 font-medium transition-colors duration-200 ${
                tabValue === 'success'
                  ? 'border-b-2 border-purple-500 bg-purple-600/20 text-white'
                  : 'text-gray-400 hover:bg-purple-600/10 hover:text-white'
              } ${montserrat_heading.variable} font-montserratHeading`}
            >
              Success
            </button>
            <Indicator
              inline
              disabled={!failedCount}
              label={failedCount}
              color="grape"
              offset={6}
              size={16}
            >
              <button
                onClick={() => onTabChange('failed')}
                className={`rounded-t-lg px-4 py-3 font-medium transition-colors duration-200 ${
                  tabValue === 'failed'
                    ? 'border-b-2 border-purple-500 bg-purple-600/20 text-white'
                    : 'text-gray-400 hover:bg-purple-600/10 hover:text-white'
                } ${montserrat_heading.variable} font-montserratHeading`}
              >
                Failed
              </button>
            </Indicator>
          </div>

          <div className="flex flex-wrap items-center gap-2 px-2 md:gap-4">
            {selectedRecords.length > 0 && (
              <Paper className="w-full bg-transparent sm:w-auto">
                <div className="relative flex w-full flex-col items-start sm:flex-row sm:items-center">
                  <Tooltip
                    label="All selected documents will be added to the group"
                    position="top"
                    withArrow
                  >
                    <Button
                      onClick={() => {
                        setShowMultiSelect(true)
                      }}
                      className={`mb-2 w-full bg-purple-600/50 px-4 py-2 text-sm transition-colors duration-300 hover:bg-purple-600 sm:mb-0 sm:mr-4 sm:w-auto sm:px-6 sm:py-3 sm:text-base ${montserrat_paragraph.variable} border-0 font-montserratParagraph focus:outline-none focus:ring-0`}
                    >
                      <span className="block sm:hidden">Add to Groups</span>
                      <span className="hidden sm:block">
                        Add Document to Groups
                      </span>
                    </Button>
                  </Tooltip>

                  {showMultiSelect && (
                    <div
                      ref={multiSelectRef}
                      className="absolute right-0 top-full z-10 mt-1"
                    >
                      <MultiSelect
                        data={
                          documentGroups
                            ? documentGroups.map((doc_group) => ({
                                value: doc_group.name || '',
                                label: doc_group.name || '',
                              }))
                            : []
                        }
                        value={selectedDocGroups}
                        placeholder={
                          isLoadingDocumentGroups
                            ? 'Loading...'
                            : 'Select Group'
                        }
                        searchable={!isLoadingDocumentGroups}
                        nothingFound={
                          isLoadingDocumentGroups
                            ? 'Loading...'
                            : 'No groups... Start typing to create a new one ✨'
                        }
                        creatable
                        getCreateLabel={(query) => `+ Create "${query}"`}
                        onCreate={(doc_group_name) => ({
                          value: doc_group_name,
                          label: doc_group_name,
                        })}
                        onChange={async (newSelectedGroups) => {
                          await addDocumentsToDocGroups(
                            selectedRecords,
                            newSelectedGroups,
                          )
                          const unselectedGroups: string[] =
                            selectedDocGroups.filter(
                              (group) => !newSelectedGroups.includes(group),
                            )
                          for (const record of selectedRecords) {
                            for (const unselectedGroup of unselectedGroups) {
                              await removeFromDocGroup.mutate({
                                record,
                                removedGroup: unselectedGroup,
                              })
                            }
                          }
                          setSelectedDocGroups(newSelectedGroups)
                          setShowMultiSelect(false)
                          setSelectedRecords([])
                        }}
                        disabled={isLoadingDocumentGroups}
                        classNames={{
                          value: 'tag-item self-center',
                        }}
                        styles={{
                          input: {
                            paddingTop: '12px',
                            paddingBottom: '12px',
                            width: '250px',
                          },
                          value: {
                            marginTop: '2px',
                          },
                          dropdown: {
                            boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.7)',
                            marginTop: '0',
                          },
                          wrapper: {
                            width: '100%',
                          },
                        }}
                      />
                    </div>
                  )}
                  {showDeleteButton && (
                    <Button
                      uppercase
                      leftIcon={<IconTrash size={16} />}
                      disabled={!selectedCount}
                      onClick={() => {
                        if (selectedCount > 100) {
                          showToast(
                            theme,
                            'Selection Limit Exceeded',
                            'You have selected more than 100 documents. Please select less than or equal to 100 documents.',
                            true,
                          )
                        } else {
                          setRecordsToDelete(selectedRecords)
                          setModalOpened(true)
                        }
                      }}
                      className={`mb-2 w-full border-0 px-4 py-2 text-sm focus:outline-none focus:ring-0 sm:mb-0 sm:w-auto sm:px-6 sm:py-3 sm:text-base ${
                        selectedCount
                          ? 'bg-red-900 hover:bg-red-800'
                          : 'bg-transparent'
                      } transition-colors duration-300 ${montserrat_paragraph.variable} font-montserratParagraph`}
                    >
                      <span className="block sm:hidden">
                        Delete {selectedCount}
                      </span>
                      <span className="hidden sm:block">
                        {selectedCount
                          ? `Delete ${
                              selectedCount === 1
                                ? '1 selected record'
                                : `${selectedCount} selected records`
                            }`
                          : 'Select records to delete'}
                      </span>
                    </Button>
                  )}
                </div>
              </Paper>
            )}
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      {/* <div className="flex-1 flex flex-col overflow-hidden h-[90%]"> */}
      <div className="flex h-[90%] flex-1 flex-col overflow-hidden px-4 py-4 sm:px-6 sm:py-6 md:px-8">
        <DataTable
          records={
            tabValue === 'failed'
              ? failedDocuments?.final_docs
              : documents?.final_docs
          }
          totalRecords={
            tabValue === 'failed'
              ? failedDocuments?.total_count
              : documents?.total_count
          }
          page={page}
          onPageChange={setPage}
          sortStatus={sortStatus}
          onSortStatusChange={setSortStatus}
          fetching={
            isLoadingDocuments ||
            isLoadingDocumentGroups ||
            isDeletingDocuments ||
            appendToDocGroup.isPending ||
            removeFromDocGroup.isPending
          }
          recordsPerPage={PAGE_SIZE}
          customLoader={<LoadingSpinner />}
          borderRadius="lg"
          withColumnBorders
          withBorder={false}
          paginationColor="blueviolet"
          // c={{pagintation: {backgroundColor: '#1e1f3a'}}}
          striped
          highlightOnHover
          rowStyle={(row, index) => {
            if (selectedRecords.includes(row)) {
              return { backgroundColor: 'hsla(280, 100%, 70%, 0.5)' }
            }
            return index % 2 === 0
              ? { backgroundColor: '#1e1f3a' }
              : { backgroundColor: '#15162c' }
          }}
          styles={{
            pagination: {
              backgroundColor: '#15162c',
            },
          }}
          columns={[
            {
              accessor: 'readable_filename',
              title: 'File Name',
              // render: ({ readable_filename }) =>
              //   readable_filename ? `${readable_filename}` : '',
              render: ({ readable_filename }) =>
                readable_filename ? (
                  <div style={{ wordWrap: 'break-word' }} className="">
                    {readable_filename}
                  </div>
                ) : (
                  ''
                ),
              // width: '14vw',
              width: isSmallScreen ? '35vw' : '14vw',
              sortable: true,
              filter: (
                <TextInput
                  label="File Name"
                  description="Show uploaded files that include the specified text"
                  placeholder="Search files..."
                  rightSection={
                    <ActionIcon
                      size="sm"
                      variant="transparent"
                      c="dimmed"
                      onClick={() => {
                        setFilterKey('readable_filename')
                        setFilterValue('')
                      }}
                    >
                      <IconX size={14} />
                    </ActionIcon>
                  }
                  value={filterValue}
                  onChange={(e) => {
                    setFilterKey('readable_filename')
                    setFilterValue(e.currentTarget.value)
                  }}
                />
              ),
              filtering: filterKey !== null,
            },
            {
              accessor: 'url',
              title: 'URL',
              render: ({ url }) =>
                url ? (
                  <div style={{ wordWrap: 'break-word', maxWidth: '14vw' }}>
                    {url}
                  </div>
                ) : (
                  ''
                ),
              sortable: true,
              width: isBetweenSmallAndMediumScreen ? '12vw' : '14vw',
              filter: (
                <TextInput
                  label="URL"
                  description="Show all urls that include the specified text"
                  placeholder="Search urls..."
                  rightSection={
                    <ActionIcon
                      size="sm"
                      variant="transparent"
                      c="dimmed"
                      onClick={() => {
                        setFilterKey('url')
                        setFilterValue('')
                      }}
                    >
                      <IconX size={14} />
                    </ActionIcon>
                  }
                  value={filterValue}
                  onChange={(e) => {
                    setFilterKey('url')
                    setFilterValue(e.currentTarget.value)
                  }}
                />
              ),
              filtering: filterKey !== null,
            },
            {
              accessor: 'base_url',
              title: 'The Starting URL of Web Scraping',
              render: ({ base_url }) =>
                base_url ? (
                  <div style={{ wordWrap: 'break-word' }}>{base_url}</div>
                ) : (
                  ''
                ),
              sortable: true,
              // width: '10vw',
              width: isBetweenSmallAndMediumScreen ? '11vw' : '14vw',
              filter: (
                <TextInput
                  label="The Starting URL of Web Scraping"
                  description="Show all urls that include the specified text"
                  placeholder="Search urls..."
                  rightSection={
                    <ActionIcon
                      size="sm"
                      variant="transparent"
                      c="dimmed"
                      onClick={() => {
                        setFilterKey('base_url')
                        setFilterValue('')
                      }}
                    >
                      <IconX size={14} />
                    </ActionIcon>
                  }
                  value={filterValue}
                  onChange={(e) => {
                    setFilterKey('base_url')
                    setFilterValue(e.currentTarget.value)
                  }}
                />
              ),
              filtering: filterKey !== null,
            },
            {
              accessor: 'created_at',
              title: 'Date created',
              render: ({ created_at }) =>
                created_at ? (
                  <div style={{ wordWrap: 'break-word' }}>
                    {new Date(created_at).toLocaleString()}
                  </div>
                ) : (
                  ''
                ),
              // width: 130,
              width: isBetweenSmallAndMediumScreen
                ? 80
                : isSmallScreen
                  ? 60
                  : 130,
              sortable: true,
              // TODO: Think about how to allow filtering on date... need different UI to select date range
              // filter: (
              //   <TextInput
              //     label="Date created"
              //     description="Show uploaded files that include the specified text"
              //     placeholder="Search files..."
              //     rightSection={
              //       <ActionIcon
              //         size="sm"
              //         variant="transparent"
              //         c="dimmed"
              //         onClick={() => {
              //           setFilterKey('readable_filename')
              //           setFilterValue('')
              //         }}
              //       >
              //         <IconX size={14} />
              //       </ActionIcon>
              //     }
              //     value={filterValue}
              //     onChange={(e) => {
              //       setFilterKey('readable_filename')
              //       setFilterValue(e.currentTarget.value)
              //     }}
              //   />
              // ),
              // filtering: filterKey !== null,
            },
            ...(tabValue === 'failed'
              ? [
                  {
                    accessor: 'error',
                    title: 'Error',
                    width: 200,
                    render: ({ error }: { error: string }, index: number) => {
                      // Ensure a ref exists for this row
                      if (!textRefs.current[index]) {
                        textRefs.current[index] = createRef()
                      }

                      return (
                        <div>
                          <Text
                            ref={textRefs.current[index]}
                            size="sm"
                            style={{
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              maxWidth: '100%',
                            }}
                          >
                            {error}
                          </Text>
                          {overflowStates[index] && (
                            <Text
                              size="sm"
                              color="grape"
                              onClick={() => openModel(true, error)}
                              className="rounded-md hover:underline"
                              style={{
                                cursor: 'pointer',
                                bottom: 0,
                                textAlign: 'right',
                              }}
                            >
                              Read more
                            </Text>
                          )}
                        </div>
                      )
                    },
                  },
                ]
              : [
                  {
                    accessor: 'doc_group',
                    title: 'Document Groups',
                    width: 200, // Increase this value to make the column wider
                    render: (record: CourseDocument) => (
                      <Group position="apart" spacing="xs">
                        <MultiSelect
                          data={
                            documentGroups
                              ? [...documentGroups].map((doc_group) => ({
                                  value: doc_group.name || '',
                                  label: doc_group.name || '',
                                }))
                              : []
                          }
                          value={record.doc_groups ? record.doc_groups : []}
                          placeholder={
                            isLoadingDocumentGroups
                              ? 'Loading...'
                              : 'Select Group'
                          }
                          searchable={!isLoadingDocumentGroups}
                          nothingFound={
                            isLoadingDocumentGroups
                              ? 'Loading...'
                              : 'No groups... Start typing to create a new one ✨'
                          }
                          creatable
                          getCreateLabel={(query) => `+ Create "${query}"`}
                          onCreate={(doc_group_name) => {
                            // createDocumentGroup.mutate({ record, doc_group_name })
                            return {
                              value: doc_group_name,
                              label: doc_group_name,
                            }
                          }}
                          onChange={(newSelectedGroups) => {
                            handleDocumentGroupsChange(
                              record,
                              newSelectedGroups,
                            )
                          }}
                          disabled={isLoadingDocumentGroups}
                          sx={{ flex: 1, width: '100%' }}
                          classNames={{
                            value: 'tag-item self-center',
                          }}
                          styles={{
                            input: {
                              paddingTop: '12px',
                              paddingBottom: '12px',
                            },
                            value: {
                              marginTop: '2px',
                            },
                          }}
                        />
                      </Group>
                    ),
                  },
                ]),
            ...(tabValue === 'failed'
              ? []
              : [
                  {
                    accessor: 'actions',
                    title: <Box mr={6}>Actions</Box>,
                    width: 75,
                    render: (materials: any, index: number) => {
                      const openModal = async (action: string) => {
                        let urlToOpen = materials.url
                        if (!materials.url && materials.s3_path) {
                          const presignedUrl = await fetchPresignedUrl(
                            materials.s3_path,
                          )
                          urlToOpen = presignedUrl
                        }
                        if (action === 'view' && urlToOpen) {
                          window.open(urlToOpen, '_blank')
                        } else if (action === 'delete') {
                          setRecordsToDelete([materials])
                          setModalOpened(true)
                        }
                      }

                      return (
                        <Group spacing="xs">
                          <ActionIcon
                            size="sm"
                            variant="subtle"
                            color="green"
                            onClick={() => openModal('view')}
                          >
                            <IconEye size={16} />
                          </ActionIcon>
                          <ActionIcon
                            size="sm"
                            variant="subtle"
                            color="red"
                            onClick={() => openModal('delete')}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Group>
                      )
                    },
                  },
                ]),
          ]}
          selectedRecords={selectedRecords}
          onSelectedRecordsChange={(newSelectedRecords) => {
            if (newSelectedRecords.length > 0) {
              setSelectedRecords(newSelectedRecords)
              setShowDeleteButton(true)
              setSelectedCount(newSelectedRecords.length)
              console.debug('New selection:', newSelectedRecords)

              // Use reduce to find the common document groups among all selected records
              const commonDocGroups = newSelectedRecords.reduce(
                (commonGroups, record) => {
                  return commonGroups.filter((group) =>
                    record.doc_groups.includes(group),
                  )
                },
                (newSelectedRecords[0] as CourseDocument).doc_groups,
              )

              setSelectedDocGroups(commonDocGroups)
              console.log(commonDocGroups)
            } else {
              setSelectedRecords([])
              setSelectedDocGroups([])
              setShowDeleteButton(false)
              setSelectedCount(0)
            }
          }}
          // Accessor not necessary when documents have an `id` property
          // idAccessor={(row: any) => (row.url ? row.url : row.s3_path)}
        />{' '}
        {/* End DataTable */}
        <Modal
          opened={modalOpened}
          onClose={() => setModalOpened(false)}
          title="Please confirm your action"
        >
          <Text size="sm" style={{ color: 'white' }}>
            {`Are you sure you want to delete the selected records?`}
          </Text>
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: '20px',
            }}
          >
            <Button
              className="min-w-[3rem] -translate-x-1 transform rounded-s-md bg-purple-800 text-white hover:border-indigo-600 hover:bg-indigo-600 hover:text-white focus:shadow-none focus:outline-none"
              onClick={() => {
                setModalOpened(false)
              }}
              style={{
                backgroundColor: 'transparent',
                marginRight: '7px',
              }}
            >
              Cancel
            </Button>
            <Button
              className="min-w-[3rem] -translate-x-1 transform rounded-s-md bg-purple-800 text-white hover:border-indigo-600 hover:bg-indigo-600 hover:text-white focus:shadow-none focus:outline-none"
              onClick={async () => {
                setModalOpened(false)
                setIsDeletingDocuments(true)
                console.debug('Deleting records:', recordsToDelete)
                deleteDocumentMutation.mutate(recordsToDelete)
                // await handleDelete(recordsToDelete)
                setRecordsToDelete([])
                setSelectedRecords([])
                setSelectedCount(0)
                setShowDeleteButton(false)
                const sleep = (ms: number) =>
                  new Promise((resolve) => setTimeout(resolve, ms))
                console.debug('sleeping for 1s before refetching')
                await sleep(1000)
                refetchDocuments()
                setIsDeletingDocuments(false)
              }}
            >
              Delete
            </Button>
          </div>
        </Modal>
        <Modal
          opened={errorModalOpened}
          onClose={() => setErrorModalOpened(false)}
          title="Error Details"
          size={'xl'}
          closeOnEscape={true}
          transitionProps={{ transition: 'fade', duration: 200 }}
          centered
          radius={'lg'}
          overlayProps={{ blur: 3, opacity: 0.55 }}
          styles={{
            header: {
              backgroundColor: '#15162c',
              borderBottom: '2px solid',
              borderColor: theme.colors.dark[3],
            },
            body: {
              backgroundColor: '#15162c',
            },
            title: {
              color: 'white',
              fontFamily: montserrat_heading.variable,
              fontWeight: 'bold',
            },
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
              paddingTop: '20px',
            }}
          >
            <Code style={{ whiteSpace: 'pre-wrap' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <CopyButton value={currentError} timeout={2000}>
                  {({ copied, copy }) => (
                    <Tooltip
                      label={copied ? 'Copied' : 'Copy'}
                      withArrow
                      position="right"
                    >
                      <ActionIcon
                        color={copied ? 'teal' : 'gray'}
                        onClick={copy}
                      >
                        {copied ? (
                          <IconCheck size="1rem" />
                        ) : (
                          <IconCopy size="1rem" />
                        )}
                      </ActionIcon>
                    </Tooltip>
                  )}
                </CopyButton>
              </div>
              {currentError}
            </Code>
          </div>
        </Modal>
        <Modal
          opened={exportModalOpened}
          onClose={() => setExportModalOpened(false)}
          title="Please confirm your action"
        >
          <Text size="sm" style={{ color: 'white' }}>
            {`Are you sure you want to export all the documents and embeddings?`}
          </Text>
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: '20px',
            }}
          >
            <Button
              className="min-w-[3rem] -translate-x-1 transform rounded-s-md bg-purple-800 text-white hover:border-indigo-600 hover:bg-indigo-600 hover:text-white focus:shadow-none focus:outline-none"
              onClick={() => {
                setExportModalOpened(false)
              }}
              style={{
                backgroundColor: 'transparent',
                marginRight: '7px',
              }}
            >
              Cancel
            </Button>
            <Button
              className="min-w-[3rem] -translate-x-1 transform rounded-s-md bg-purple-800 text-white hover:border-indigo-600 hover:bg-indigo-600 hover:text-white focus:shadow-none focus:outline-none"
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
      </div>
    </div>
  )
}

function errorStateForProjectFilesTable() {
  return (
    <DataTable
      records={[]}
      borderRadius="lg"
      withColumnBorders
      withBorder={true}
      striped
      highlightOnHover
      height="80vh"
      // Error state:
      noRecordsIcon={
        <Stack align="center" p={30}>
          <Text c="dimmed" size="md">
            Ah! We hit a wall when fetching your documents. The database must be
            on fire 🔥
          </Text>
          <Image
            // width={"20vw"}
            style={{ minWidth: 300, maxWidth: '30vw' }}
            radius="lg"
            src="https://assets.kastan.ai/this-is-fine.jpg"
            alt="No data found"
            // style={{ filter: 'grayscale(1)' }}
          />
          <Text c="dimmed" size="md">
            So.. please try again later.
          </Text>
        </Stack>
      }
      style={{
        width: '100%',
      }}
      columns={[
        {
          accessor: 'Name',
        },
        {
          accessor: 'URL',
        },
        {
          accessor: 'The Starting URL of Web Scraping',
        },
        {
          accessor: 'doc_group',
        },
        {
          accessor: 'actions',
        },
      ]}
    />
  )
}
