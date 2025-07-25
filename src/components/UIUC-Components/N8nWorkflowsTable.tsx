/* eslint-disable @typescript-eslint/ban-ts-comment */
import React, { useEffect, useState } from 'react'
import dayjs from 'dayjs'

import { notifications } from '@mantine/notifications'
import { Title, Text, Switch } from '@mantine/core'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import { Montserrat } from 'next/font/google'
import {
  IconAlertCircle,
} from '@tabler/icons-react'
import { DataTable, DataTableSortStatus } from 'mantine-datatable'
import { LoadingSpinner } from './LoadingSpinner'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { UIUCTool } from '~/types/chat'
import { useFetchAllWorkflows } from '~/utils/functionCalling/handleFunctionCalling'
import { useTranslation } from 'next-i18next'

const PAGE_SIZE = 25

interface N8nWorkflowsTableProps {
  n8nApiKey: string
  course_name: string
  isEmptyWorkflowTable: boolean
}

const montserrat_med = Montserrat({
  weight: '500',
  subsets: ['latin'],
})

interface WorkflowRecord extends UIUCTool {
  active: boolean;
}

interface Tag {
  name: string;
}

export const N8nWorkflowsTable = ({
  n8nApiKey,
  course_name,
  isEmptyWorkflowTable,
}: N8nWorkflowsTableProps) => {
  const [page, setPage] = useState(1)
  const queryClient = useQueryClient()
  const { t } = useTranslation('common')

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
      return { id: 1 }
    },
    onError: (error, variables, context) => {
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
            {t('tools_section.alerts.error.activation_failed')}
          </Text>
        ),
        message: (
          <Text className={`${montserrat_med.className} text-neutral-200`}>
            {(error as Error).message}
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
    },
    onSuccess: (data, variables, context) => {
      console.log(`success`, data)
    },
    onSettled: (data, error, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: ['tools', n8nApiKey],
      })
    },
  })

  useEffect(() => {
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
    width: isWideScreen ? '65%' : '92%',
  }

  let currentRecords
  let sortedRecords

  if (records && records.length !== 0) {
    sortedRecords = [...records].sort((a, b) => {
      const dateA = new Date(a.createdAt as string)
      const dateB = new Date(b.createdAt as string)
      return dateB.getTime() - dateA.getTime()
    })
    currentRecords = (sortedRecords as WorkflowRecord[]).slice(startIndex, endIndex)
  }

  const tableColumns = [
    { 
      accessor: 'name', 
      title: t('tools_section.table.name', { defaultValue: 'Name' }),
      render: (record: WorkflowRecord) => record.name || ''
    },
    {
      accessor: 'enabled',
      title: t('tools_section.table.enabled', { defaultValue: 'Enabled' }),
      width: 100,
      render: (record: WorkflowRecord) => (
        <Switch
          checked={!!record.active}
          onChange={(event) => {
            mutate_active_flows.mutate({
              id: record.id,
              checked: event.target.checked,
            })
          }}
        />
      ),
    },
    {
      accessor: 'tags',
      title: t('tools_section.table.tags', { defaultValue: 'Tags' }),
      width: 100,
      render: (record: WorkflowRecord) => {
        return record.tags
          ? record.tags.map((tag: Tag) => tag.name).join(', ')
          : ''
      },
    },
    {
      accessor: 'createdAt',
      title: t('tools_section.table.created_at', { defaultValue: 'Created at' }),
      width: 120,
      render: (record: WorkflowRecord) => {
        const { createdAt } = record
        return dayjs(createdAt).format('MMM D YYYY, h:mm A')
      },
    },
    {
      accessor: 'updatedAt',
      title: t('tools_section.table.updated_at', { defaultValue: 'Updated at' }),
      width: 120,
      render: (record: WorkflowRecord) => {
        const { updatedAt } = record
        return dayjs(updatedAt).format('MMM D YYYY, h:mm A')
      },
    },
  ]

  const loadingText = t('common.loading', { defaultValue: 'Loading...' }) as string
  const noRecordsText = t('tools_section.no_tools_found', { defaultValue: 'No tools found' }) as string

  return (
    <>
      <Text w={isWideScreen ? '65%' : '92%'} className="pb-2">
        {t('tools_section.description', { defaultValue: 'These tools can be automatically invoked by the LLM to fetch additional data to answer user questions on the chat page.' })}
        {' '}
        <a
          href={`/${course_name}/chat`}
          rel="noopener noreferrer"
          style={{
            color: '#8B5CF6',
            textDecoration: 'underline',
          }}
        >
          {t('tools_section.chatPage', { defaultValue: 'Chat Page' })}
        </a>
      </Text>
      <DataTable
        height={500}
        style={dataTableStyle}
        withBorder
        fetching={isLoadingRecords}
        customLoader={<LoadingSpinner />}
        records={isEmptyWorkflowTable ? [] : (currentRecords as WorkflowRecord[])}
        columns={tableColumns}
        totalRecords={records?.length || 0}
        recordsPerPage={PAGE_SIZE}
        page={page}
        onPageChange={(p) => setPage(p)}
        loadingText={loadingText}
        noRecordsText={noRecordsText}
      />
    </>
  )
}
