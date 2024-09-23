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
import { montserrat_heading } from 'fonts'
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
// these mantine class names may change in future versions

  .mantine-Table-root thead tr {
    background-color: #15162a; 
  }
.mantine-Pagination-control[data-active="true"] {
  background-color: blueviolet;
  color: white;
}

// trying to change the top position of the data display of multiselect, but it is unstable
.mantine-1ibeiuk {
  top: 60px !important;
  // box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.7) !important; // Add shadow
  // margin-top: 0 !important; // Remove space between bar section and data dropdown
}

`

const PAGE_SIZE = 100

export function ProjectFilesTable({
  course_name,
  setFailedCount = (count: number) => {},
  tabValue,
}: {
  course_name: string
  setFailedCount?: (count: number) => void
  tabValue: string
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
    <>
      <GlobalStyle />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {selectedRecords.length > 0 && (
          <Paper
          // className={classes.dropdown}
          // withBorder
          // style={styles}
          >
            <div
              style={{
                display: 'flex',
                position: 'relative',
                alignItems: 'flex-start',
                background: 'black',
              }}
            >
              {/* {items.map((item, index) => ( */}
              <Tooltip
                label="All selected documents will be added to the group"
                position="top"
                withArrow
              >
                <Button
                  // key={index}
                  onClick={() => {
                    setShowMultiSelect(true)
                  }}
                  className="bg-purple-600 bg-opacity-50 hover:bg-purple-600"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: 'hsla(280, 100%, 70%, 0.5)',
                    border: 'none',
                    paddingRight: '10px',
                    paddingLeft: '10px',
                    transition: '0.3s',
                    marginRight: '5px',
                    marginBottom: '7px',
                  }}
                >
                  Add Document to Groups
                </Button>
              </Tooltip>

              {/* ))} */}
              {/* <div style={{ position: 'relative' }}> */}

              {showMultiSelect && (
                <div
                  ref={multiSelectRef}
                  style={{ position: 'absolute', zIndex: 10 }}
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
                      isLoadingDocumentGroups ? 'Loading...' : 'Select Group'
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
                    // onChange={async (newSelectedGroups) => {
                    //   await addDocumentsToDocGroups(selectedRecords, newSelectedGroups);
                    //   for (const record of selectedRecords) {
                    //     // await handleDocumentGroupsChange(record, selectedDocGroups);
                    //     for (const removedGroup of selectedDocGroups) {
                    //       await removeFromDocGroup.mutate({
                    //         record,
                    //         removedGroup,
                    //       })
                    //     }

                    //     setShowMultiSelect(false);
                    //     setSelectedRecords([]);
                    //   }
                    // }}
                    onChange={async (newSelectedGroups) => {
                      await addDocumentsToDocGroups(
                        selectedRecords,
                        newSelectedGroups,
                      )
                      // Through all the common docgorups newselectedgroups doesn't have the doc group that is in all the common docgroups
                      const unselectedGroups: string[] =
                        selectedDocGroups.filter(
                          (group) => !newSelectedGroups.includes(group),
                        )
                      // Remove the unselected groups from the selected records
                      for (const record of selectedRecords) {
                        for (const unselectedGroup of unselectedGroups) {
                          await removeFromDocGroup.mutate({
                            record,
                            removedGroup: unselectedGroup,
                          })
                        }
                      }

                      // Update the selected document groups
                      setSelectedDocGroups(newSelectedGroups)

                      // Hide the multi-select and clear the selected records
                      setShowMultiSelect(false)
                      setSelectedRecords([])
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
                        width: '250px',
                      },
                      value: {
                        marginTop: '2px',
                      },
                      dropdown: {
                        boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.7)', // Add shadow
                        marginTop: '0', // Remove space between bar section and data dropdown
                      },
                      wrapper: {
                        width: '100%',
                      },
                    }}
                  />
                </div>
              )}
              <Button
                uppercase
                leftIcon={<IconTrash size={16} />}
                disabled={!selectedRecords.length}
                onClick={() => {
                  if (selectedRecords.length > 100) {
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
                style={{
                  backgroundColor: selectedRecords.length
                    ? '#8B0000'
                    : 'transparent',
                  // flex: 1
                }}
              >
                {selectedRecords.length
                  ? `Delete ${
                      selectedRecords.length === 1
                        ? '1 selected record'
                        : `${selectedRecords.length} selected records`
                    }`
                  : 'Select records to delete'}
              </Button>
              {/* <Center> */}

              {/* </Center> */}
            </div>
            {/* </div> */}
          </Paper>
        )}
        <div style={{ marginLeft: 'auto' }}>
          {' '}
          {/* Add this div */}
          <Tooltip
            multiline
            width={280}
            withArrow
            transitionProps={{ duration: 200 }}
            label="Download the post-processed text and vector embeddings (OpenAI Ada-002) used by the LLM. The export format is JSON Lines (.JSONL). To minimize data transfer costs, exporting original files (PDFs, etc.) is only available for individual documents."
            position="top"
          >
            <Button // button to export materials
              uppercase
              leftIcon={<IconFileExport size={16} />}
              // disabled={!selectedRecords.length}
              onClick={() => {
                // setRecordsToExport(selectedRecords)
                setExportModalOpened(true)
              }}
              style={{
                // backgroundColor: selectedRecords.length
                //   ? 'purple'
                //   : 'transparent',
                backgroundColor: 'hsla(280, 100%, 70%, 0.5)',
                marginLeft: '5px',
                marginBottom: '7px',
              }}
            >
              {/* {selectedRecords.length
                ? `Export ${selectedRecords.length === 1
                  ? '1 selected record'
                  : `${selectedRecords.length} selected records`
                }`
                : 'Select records to export'} */}
              Export All Documents & Embeddings
            </Button>
          </Tooltip>
        </div>
      </div>
      <DataTable
        records={
          tabValue === 'failed'
            ? failedDocuments?.final_docs
            : documents?.final_docs
        }
        // records={[]}
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
        // fetching={appendToDocGroup.isLoading || removeFromDocGroup.isLoading/* other loading states */}
        recordsPerPage={PAGE_SIZE}
        customLoader={<LoadingSpinner />}
        borderRadius="lg"
        withColumnBorders
        withBorder={true}
        striped
        highlightOnHover
        height="85vh"
        rowStyle={(row) => {
          if (selectedRecords.includes(row)) {
            return { backgroundColor: 'hsla(280, 100%, 70%, 0.5)' }
          }
          return {}
        }}
        style={{
          width: '100%',
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
                          handleDocumentGroupsChange(record, newSelectedGroups)
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
                    <ActionIcon color={copied ? 'teal' : 'gray'} onClick={copy}>
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
        opened={exportModalOpened} // Use a separate state variable for the export modal
        onClose={() => setExportModalOpened(false)} // Update the state variable when the modal is closed
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
    </>
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
