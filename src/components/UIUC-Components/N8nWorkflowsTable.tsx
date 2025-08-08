/* eslint-disable @typescript-eslint/ban-ts-comment */
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'

import { Switch, Text } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import {
  // IconArrowsSort,
  // IconCaretDown,
  // IconCaretUp,
  // IconSquareArrowUp,
  IconAlertCircle,
} from '@tabler/icons-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { DataTable } from 'mantine-datatable'
import { Montserrat } from 'next/font/google'
import { type UIUCTool } from '~/types/chat'
import { useFetchAllWorkflows } from '~/utils/functionCalling/handleFunctionCalling'
import { LoadingSpinner } from './LoadingSpinner'

const PAGE_SIZE = 25

interface N8nWorkflowsTableProps {
  n8nApiKey: string
  course_name: string
  isEmptyWorkflowTable: boolean
  sidebarCollapsed?: boolean
  // fetchWorkflows: (
  //   limit?: number,
  //   pagination?: boolean,
  // ) => Promise<WorkflowRecord[]>
}

const montserrat_med = Montserrat({
  weight: '500',
  subsets: ['latin'],
})

const dataTableTitleStyles = {
  color: 'var(--table-header)',
}

const dataTableCellsStyles = {
  color: 'var(--foreground)',
}

const notificationStyles = (isError = false) => {
  return {
    root: {
      backgroundColor: 'var(--notification)', // Dark background to match the page
      borderColor: isError ? '#E53935' : 'var(--notification-border)', // Red for errors,  for success
      borderWidth: '1px',
      borderStyle: 'solid',
      borderRadius: '8px', // Added rounded corners
    },
    title: {
      color: 'var(--notification-title)', // White text for the title
      fontWeight: 600,
    },
    description: {
      color: 'var(--notification-message)', // Light gray text for the message
    },
    closeButton: {
      color: 'var(--notification-title)', // White color for the close button
      borderRadius: '4px', // Added rounded corners to close button
      '&:hover': {
        backgroundColor: 'rgba(255, 255, 255, 0.1)', // Subtle hover effect
      },
    },
    icon: {
      backgroundColor: 'transparent', // Transparent background for the icon
      color: isError ? '#E53935' : 'var(--notification-title)', // Icon color matches the border
    },
  }
}

export const N8nWorkflowsTable = ({
  n8nApiKey,
  course_name,
  isEmptyWorkflowTable,
  sidebarCollapsed = false,
}: N8nWorkflowsTableProps) => {
  const [page, setPage] = useState(1)
  const queryClient = useQueryClient()

  // Get responsive width classes based on sidebar state
  const widthClasses = sidebarCollapsed
    ? 'w-[96%] md:w-[98%] lg:w-[96%] xl:w-[94%] 2xl:w-[92%]' // More space when sidebar collapsed
    : 'w-[96%] md:w-[94%] lg:w-[92%] xl:w-[90%] 2xl:w-[88%]' // Less space when sidebar expanded

  const {
    data: records,
    isLoading: isLoadingRecords,
    isSuccess: isSuccess,
    isError: isErrorTools,
    refetch: refetchWorkflows,
  } = useFetchAllWorkflows(course_name, n8nApiKey, 20, 'true', true)

  const mutate_active_flows = useMutation({
    mutationFn: async ({ id, checked }: { id: string; checked: boolean }) => {
      const response = await fetch(
        `/api/UIUC-api/tools/activateWorkflow?api_key=${n8nApiKey}&id=${id}&activate=${checked}`,
      )
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error)
      }

      return data
    },

    onMutate: (variables) => {
      // A mutation is about to happen!

      // Optionally return a context containing data to use when for example rolling back
      return { id: 1 }
    },
    onError: (error, variables, context) => {
      // An error happened!
      console.log(`Error happened ${error}`)
      notifications.show({
        id: 'error-notification',
        withCloseButton: true,
        closeButtonProps: { color: 'red' },
        onClose: () => console.log('error unmounted'),
        onOpen: () => console.log('error mounted'),
        autoClose: 12000,
        title: (
          <Text size={'lg'} className={`${montserrat_med.className}`}>
            Error with activation
          </Text>
        ),
        message: (
          <Text className={`${montserrat_med.className} text-[neutral-200]`}>
            {(error as Error).message}
          </Text>
        ),
        color: 'red',
        radius: 'lg',
        icon: <IconAlertCircle />,
        className: 'my-notification-class',
        styles: notificationStyles(true),
        withBorder: true,
        loading: false,
      })
    },
    onSuccess: (data, variables, context) => {
      // Boom baby!
      console.log(`success`, data)
    },
    onSettled: (data, error, variables, context) => {
      // Error or success... doesn't matter!
      queryClient.invalidateQueries({
        queryKey: ['tools', n8nApiKey],
      })
    },
  })

  useEffect(() => {
    // Refetch if API key changes
    refetchWorkflows()
  }, [n8nApiKey])

  const startIndex = (page - 1) * PAGE_SIZE
  const endIndex = startIndex + PAGE_SIZE

  const [isWideScreen, setIsWideScreen] = useState(window.innerWidth >= 1000)

  useEffect(() => {
    const handleResize = () => {
      setIsWideScreen(window.innerWidth >= 1000)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const dataTableStyle = {
    //    width: isWideScreen ? '85%' : '92%',
  }

  let currentRecords
  let sortedRecords

  if (records && records.length !== 0) {
    sortedRecords = [...records].sort((a, b) => {
      const dateA = new Date(a.createdAt as string)
      const dateB = new Date(b.createdAt as string)
      return dateB.getTime() - dateA.getTime()
    })
    currentRecords = (sortedRecords as UIUCTool[]).slice(startIndex, endIndex)
  }

  return (
    <>
      {/* <Title
        order={3}
        // w={}
        // size={'xl'}
        className={`pb-3 pt-3 ${montserrat_paragraph.variable} font-montserratParagraph`}
      >
        Your n8n tools
      </Title> */}
      <Text
        // w={isWideScreen ? '85%' : '92%'}
        className={`pb-2 text-[--dashboard-foreground] ${widthClasses}`}
      >
        These tools can be automatically invoked by the LLM to fetch additional
        data to answer user questions on the{' '}
        <a
          href={`/${course_name}/chat`}
          // target="_blank"
          rel="noopener noreferrer"
          className="text-[--dashboard-button] hover:text-[--dashboard-button-hover]"
          style={{
            textDecoration: 'underline',
          }}
        >
          chat page
        </a>
        .
      </Text>

      {/* dataTable styling options https://icflorescu.github.io/mantine-datatable/examples/overriding-the-default-styles/  */}
      <div className={`n8n_workflows_table ${widthClasses}`}>
        <DataTable
          height={500}
          styles={{
            pagination: {
              backgroundColor: 'var(--background)',
            },
          }}
          rowStyle={(row, index) => {
            return index % 2 === 0
              ? { backgroundColor: 'var(--background)' }
              : { backgroundColor: 'var(--background-faded)' }
          }}
          sx={{
            color: 'var(--foreground)',
            backgroundColor: 'var(--background)',
          }}
          withColumnBorders
          borderColor="var(--table-border)"
          rowBorderColor="var(--table-border)"
          withBorder={false}
          fetching={isLoadingRecords}
          customLoader={<LoadingSpinner />}
          // keyField="id"
          records={isEmptyWorkflowTable ? [] : (currentRecords as UIUCTool[])}
          /* //just testing the output, safe to remove in the future
        records={[{
          "id": "1323addd-a4ac-4dd2-8de2-6f934969a0f1",
          "name": "Feest, Bogan and Herzog",
          "streetAddress": "21716 Ratke Drive",
          "city": "Stromanport",
          "state": "WY",
          "missionStatement": "Innovate bricks-and-clicks metrics."
        }]}
*/
          columns={[
            // { titleStyle: dataTableTitleStyles, accessor: 'id', width: 175 },
            {
              titleStyle: dataTableTitleStyles,
              cellsStyle: dataTableCellsStyles,
              accessor: 'name',
            },
            {
              titleStyle: dataTableTitleStyles,
              cellsStyle: dataTableCellsStyles,
              accessor: 'enabled',
              width: 100,
              render: (record, index) => (
                <Switch
                  // @ts-ignore -- for some reason N8N returns "active" and we use "enabled" but I can't get them to agree
                  checked={!!record.active}
                  onChange={(event) => {
                    mutate_active_flows.mutate({
                      id: record.id,
                      checked: event.target.checked,
                    })
                  }}
                  size="sm"
                  className="cursor-pointer"
                  styles={(theme) => ({
                    track: {
                      backgroundColor: record.enabled
                        ? 'var(--dashboard-button) !important'
                        : 'transparent',
                      borderColor: record.enabled
                        ? 'var(--dashboard-button) !important'
                        : 'var(--foreground-faded)',
                    },
                    label: {
                      color: 'var(--dashboard-foreground)',
                      fontFamily: `var(--font-montserratParagraph), ${theme.fontFamily}`,
                    },
                  })}
                />
              ),
            },
            {
              titleStyle: dataTableTitleStyles,
              cellsStyle: dataTableCellsStyles,
              accessor: 'tags',
              render: (record, index) => {
                return record.tags
                  ? record.tags.map((tag) => tag.name).join(', ')
                  : ''
              },
            },
            {
              titleStyle: dataTableTitleStyles,
              cellsStyle: dataTableCellsStyles,
              accessor: 'createdAt',
              // textAlign: 'left',
              render: (record, index) => {
                const { createdAt } = record as { createdAt: string }
                return dayjs(createdAt).format('MMM D YYYY, h:mm A')
              },
            },
            {
              titleStyle: dataTableTitleStyles,
              cellsStyle: dataTableCellsStyles,
              accessor: 'updatedAt',
              // textAlign: 'left',
              render: (record, index) => {
                const { updatedAt } = record as { updatedAt: string }
                return dayjs(updatedAt).format('MMM D YYYY, h:mm A')
              },
            },
          ]}
          // totalRecords={records.length}
          totalRecords={records?.length || 0}
          recordsPerPage={PAGE_SIZE}
          page={page}
          onPageChange={(p) => setPage(p)}
          // 👇 uncomment the next line to use a custom pagination size
          // paginationSize="md"
          // 👇 uncomment the next line to use a custom loading text
          loadingText="Loading..."
          // 👇 uncomment the next line to display a custom text when no records were found
          noRecordsText="No records found"
          // 👇 uncomment the next line to use a custom pagination text
          // paginationText={({ from, to, totalRecords }) => `Records ${from} - ${to} of ${totalRecords}`}
          // 👇 uncomment the next lines to use custom pagination colors
          // paginationActiveBackgroundColor="green"
          // paginationActiveTextColor="#e6e348"
        />
      </div>
    </>
  )
}
