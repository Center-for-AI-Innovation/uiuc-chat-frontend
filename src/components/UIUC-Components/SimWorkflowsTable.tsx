import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { useEffect, useState } from 'react'

// Initialize dayjs plugins
dayjs.extend(relativeTime)

import { Text, Badge, Tooltip } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconAlertCircle, IconExternalLink } from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import { DataTable } from 'mantine-datatable'
import { Montserrat } from 'next/font/google'
import { type SimWorkflow } from '~/types/sim'
import { LoadingSpinner } from './LoadingSpinner'

const PAGE_SIZE = 25

interface SimWorkflowsTableProps {
  course_name: string
  isSimConfigured: boolean
  sidebarCollapsed?: boolean
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
      backgroundColor: 'var(--notification)',
      borderColor: isError ? '#E53935' : 'var(--notification-border)',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderRadius: '8px',
    },
    title: {
      color: 'var(--notification-title)',
      fontWeight: 600,
    },
    description: {
      color: 'var(--notification-message)',
    },
    closeButton: {
      color: 'var(--notification-title)',
      borderRadius: '4px',
      '&:hover': {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
      },
    },
    icon: {
      backgroundColor: 'transparent',
      color: isError ? '#E53935' : 'var(--notification-title)',
    },
  }
}

/**
 * Custom hook to fetch Sim workflows for a specific course
 * Reads API key and workflow IDs from localStorage
 */
const useFetchSimWorkflows = (course_name: string) => {
  return useQuery({
    queryKey: ['sim-workflows', course_name],
    queryFn: async (): Promise<SimWorkflow[]> => {
      // Get config from localStorage
      const simApiKey = localStorage.getItem(`sim_api_key_${course_name}`) || ''
      const simWorkflowIds = localStorage.getItem(`sim_workflow_ids_${course_name}`) || ''
      const metadataStr = localStorage.getItem(`sim_workflow_metadata_${course_name}`) || '{}'
      
      if (!simApiKey || !simWorkflowIds) {
        return []
      }

      const response = await fetch(
        `/api/UIUC-api/getSimWorkflows?` + 
        `course_name=${encodeURIComponent(course_name)}&` +
        `api_key=${encodeURIComponent(simApiKey)}&` +
        `workflow_ids=${encodeURIComponent(simWorkflowIds)}`
      )
      if (!response.ok) {
        throw new Error('Failed to fetch Sim workflows')
      }
      const data = await response.json()
      const workflows: SimWorkflow[] = data.workflows || []
      
      // Merge in metadata from localStorage
      try {
        const metadata = JSON.parse(metadataStr) as Record<string, { 
          name?: string
          description?: string
          inputFields?: any[]
        }>
        workflows.forEach(workflow => {
          const meta = metadata[workflow.id]
          if (meta) {
            if (meta.name) workflow.name = meta.name
            if (meta.description) workflow.description = meta.description
            if (meta.inputFields) (workflow as any).inputFields = meta.inputFields
          }
        })
      } catch (error) {
        console.warn('Failed to parse workflow metadata:', error)
      }
      
      return workflows
    },
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  })
}

export const SimWorkflowsTable = ({
  course_name,
  isSimConfigured,
  sidebarCollapsed = false,
}: SimWorkflowsTableProps) => {
  const [page, setPage] = useState(1)

  // Get responsive width classes based on sidebar state
  const widthClasses = sidebarCollapsed
    ? 'w-[96%] md:w-[98%] lg:w-[96%] xl:w-[94%] 2xl:w-[92%]'
    : 'w-[96%] md:w-[94%] lg:w-[92%] xl:w-[90%] 2xl:w-[88%]'

  const {
    data: workflows,
    isLoading: isLoadingWorkflows,
    isSuccess,
    isError,
    refetch: refetchWorkflows,
    error,
  } = useFetchSimWorkflows(course_name)

  useEffect(() => {
    if (isSimConfigured) {
      refetchWorkflows()
    }
  }, [isSimConfigured])

  useEffect(() => {
    if (isError && error) {
      notifications.show({
        id: 'error-notification',
        withCloseButton: true,
        closeButtonProps: { color: 'red' },
        autoClose: 12000,
        title: (
          <Text size="lg" className={`${montserrat_med.className}`}>
            Error fetching workflows
          </Text>
        ),
        message: (
          <Text className={`${montserrat_med.className} text-neutral-200`}>
            {error instanceof Error ? error.message : 'Failed to fetch Sim workflows'}
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
    }
  }, [isError, error])

  const startIndex = (page - 1) * PAGE_SIZE
  const endIndex = startIndex + PAGE_SIZE

  const [isWideScreen, setIsWideScreen] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 1000 : true
  )

  useEffect(() => {
    const handleResize = () => {
      setIsWideScreen(window.innerWidth >= 1000)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  let currentWorkflows: SimWorkflow[] = []
  let sortedWorkflows: SimWorkflow[] = []

  if (workflows && workflows.length > 0) {
    sortedWorkflows = [...workflows].sort((a, b) => {
      const dateA = new Date(a.updatedAt)
      const dateB = new Date(b.updatedAt)
      return dateB.getTime() - dateA.getTime()
    })
    currentWorkflows = sortedWorkflows.slice(startIndex, endIndex)
  }

  const simBaseUrl = process.env.NEXT_PUBLIC_SIM_BASE_URL || 'http://localhost:3100'

  return (
    <>
      <Text
        className={`pb-2 text-[--dashboard-foreground] ${widthClasses}`}
      >
        These workflows can be invoked from the{' '}
        <a
          href={`/${course_name}/chat`}
          rel="noopener noreferrer"
          className="text-[--dashboard-button] hover:text-[--dashboard-button-hover]"
          style={{
            textDecoration: 'underline',
          }}
        >
          chat page
        </a>
        {' '}to process complex AI tasks.
      </Text>

      <div className={`sim_workflows_table ${widthClasses}`}>
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
          fetching={isLoadingWorkflows}
          customLoader={<LoadingSpinner />}
          records={!isSimConfigured ? [] : currentWorkflows}
          columns={[
            {
              accessor: 'name',
              title: 'Workflow Name',
              width: '30%',
              cellsStyle: dataTableCellsStyles,
              titleStyle: dataTableTitleStyles,
              render: (workflow: SimWorkflow) => (
                <Tooltip label={workflow.description || 'No description'} withArrow>
                  <Text
                    className={`${montserrat_med.className} cursor-pointer hover:underline`}
                    onClick={() => window.open(`${simBaseUrl}/w/${workflow.id}`, '_blank')}
                  >
                    {workflow.name}
                    <IconExternalLink
                      size={14}
                      className="ml-1 inline-block"
                      style={{ position: 'relative', top: '-2px' }}
                    />
                  </Text>
                </Tooltip>
              ),
            },
            {
              accessor: 'id',
              title: 'Workflow ID',
              width: '25%',
              cellsStyle: dataTableCellsStyles,
              titleStyle: dataTableTitleStyles,
              render: (workflow: SimWorkflow) => (
                <Text
                  className={`${montserrat_med.className} font-mono text-xs`}
                  style={{ color: 'var(--foreground-muted)' }}
                >
                  {workflow.id}
                </Text>
              ),
            },
            {
              accessor: 'color',
              title: 'Color',
              width: '10%',
              cellsStyle: dataTableCellsStyles,
              titleStyle: dataTableTitleStyles,
              render: (workflow: SimWorkflow) => (
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '4px',
                    backgroundColor: workflow.color || '#3972F6',
                    border: '1px solid var(--table-border)',
                  }}
                />
              ),
            },
            {
              accessor: 'createdAt',
              title: 'Created',
              width: '15%',
              cellsStyle: dataTableCellsStyles,
              titleStyle: dataTableTitleStyles,
              render: (workflow: SimWorkflow) => (
                <Tooltip
                  label={dayjs(workflow.createdAt).format('MMMM D, YYYY h:mm A')}
                  withArrow
                >
                  <Text className={`${montserrat_med.className}`}>
                    {dayjs(workflow.createdAt).format('MMM D, YYYY')}
                  </Text>
                </Tooltip>
              ),
            },
            {
              accessor: 'updatedAt',
              title: 'Last Updated',
              width: '20%',
              cellsStyle: dataTableCellsStyles,
              titleStyle: dataTableTitleStyles,
              render: (workflow: SimWorkflow) => (
                <Tooltip
                  label={dayjs(workflow.updatedAt).format('MMMM D, YYYY h:mm A')}
                  withArrow
                >
                  <Text className={`${montserrat_med.className}`}>
                    {dayjs(workflow.updatedAt).fromNow()}
                  </Text>
                </Tooltip>
              ),
            },
          ]}
          totalRecords={sortedWorkflows.length}
          recordsPerPage={PAGE_SIZE}
          page={page}
          onPageChange={setPage}
          emptyState={
            !isSimConfigured ? (
              <div className="flex flex-col items-center justify-center py-8">
                <IconAlertCircle size={48} className="mb-4 text-yellow-500" />
                <Text className={`${montserrat_med.className} text-center`}>
                  Sim is not configured
                </Text>
                <Text
                  className={`${montserrat_med.className} mt-2 text-center text-sm`}
                  style={{ color: 'var(--foreground-muted)' }}
                >
                  Please configure your Sim API key and base URL to view workflows.
                </Text>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <Text className={`${montserrat_med.className} text-center`}>
                  No workflows found
                </Text>
                <Text
                  className={`${montserrat_med.className} mt-2 text-center text-sm`}
                  style={{ color: 'var(--foreground-muted)' }}
                >
                  Create your first workflow in the{' '}
                  <a
                    href={simBaseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[--dashboard-button] hover:text-[--dashboard-button-hover] hover:underline"
                  >
                    Sim Dashboard
                  </a>
                </Text>
              </div>
            )
          }
        />
      </div>
    </>
  )
}

export default SimWorkflowsTable
