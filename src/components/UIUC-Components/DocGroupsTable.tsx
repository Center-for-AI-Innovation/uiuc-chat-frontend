'use client'

import {
  TextInput,
  Text,
  ScrollArea,
  Table,
  Switch,
  Tooltip,
} from '@mantine/core'
import { IconHelp, IconSearch } from '@tabler/icons-react'
import { useMemo, useState } from 'react'
import { createGlobalStyle } from 'styled-components'

import {
  useGetDocumentGroups,
  useUpdateDocGroup,
} from '~/hooks/docGroupsQueries'
import { useQueryClient } from '@tanstack/react-query'

const GlobalStyle = createGlobalStyle`
  .mantine-Checkbox-input:checked {
    background-color: purple;
    border-color: hsl(280,100%,80%);
  } 

  .mantine-Table-root thead tr {
    background-color: #1e1f3a;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .mantine-Table-root thead th {
    color: rgba(255, 255, 255, 0.9);
    font-weight: 600;
  }

  .mantine-Table-root tbody tr {
    background-color: #15162c;
  }

  .mantine-Table-root tbody tr:nth-of-type(odd) {
    background-color: #1e1f3a;
  }

  .mantine-TextInput-input {
    background-color: #1e1f3a;
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: white;
  }

  .mantine-TextInput-input:focus {
    border-color: rgb(147, 51, 234);
  }

  .mantine-ScrollArea-root {
    background-color: #15162c;
    overflow: hidden;
    border-radius: 0.75rem;
  }

  .mantine-Table-root {
    margin: 0;
  }

  .mantine-Table-root thead tr th {
    background-color: #1e1f3a;
    position: sticky;
    top: 0;
    z-index: 10;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .mantine-ScrollArea-scrollbar {
    background-color: #1e1f3a;
  }

  .mantine-ScrollArea-thumb {
    background-color: rgba(147, 51, 234, 0.4);
  }
`

export function DocGroupsTable({ course_name }: { course_name: string }) {
  const queryClient = useQueryClient()
  const [documentGroupSearch, setDocumentGroupSearch] = useState('')

  const updateDocGroup = useUpdateDocGroup(course_name, queryClient)

  const {
    data: documentGroups,
    isLoading: isLoadingDocumentGroups,
    isError: isErrorDocumentGroups,
    refetch: refetchDocumentGroups,
  } = useGetDocumentGroups(course_name)

  // Logic to filter doc_groups based on the search query
  const filteredDocumentGroups = useMemo(() => {
    if (!documentGroups) {
      return []
    }

    return [...documentGroups].filter((doc_group_obj) =>
      doc_group_obj.name
        ?.toLowerCase()
        .includes(documentGroupSearch?.toLowerCase()),
    )
  }, [documentGroups, documentGroupSearch])

  // Handle doc_group search change
  const handleDocumentGroupSearchChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setDocumentGroupSearch(event.target.value)
  }

  return (
    <>
      <GlobalStyle />
      <div className="w-full px-0 py-4 md:px-2">
        <TextInput
          placeholder="Search by Document Group"
          mb="sm"
          radius="md"
          icon={<IconSearch />}
          value={documentGroupSearch}
          onChange={handleDocumentGroupSearchChange}
          className="sticky top-0 z-10"
        />
        <ScrollArea.Autosize
          mah="calc(80vh - 16rem)"
          type="always"
          offsetScrollbars
          className="overflow-hidden rounded-xl"
        >
          <Table
            style={{
              tableLayout: 'fixed',
              position: 'relative',
              borderCollapse: 'separate',
              borderSpacing: 0,
              overflow: 'hidden',
            }}
            // withBorder
            withColumnBorders
            highlightOnHover
          >
            <thead>
              <tr>
                <th className="w-[50%] sm:w-[60%] md:w-[70%]">
                  Document Group
                </th>
                <th className="w-[30%] sm:w-[25%] md:w-[15%]">
                  Number of Docs
                </th>
                <th className="w-[20%] text-center sm:w-[15%]">
                  <Tooltip
                    multiline
                    color="#CC65FF"
                    arrowPosition="center"
                    arrowSize={8}
                    width={220}
                    withArrow
                    label="If a document is included in ANY enabled group, it will be included in chatbot results. Enabled groups take precedence over disabled groups."
                  >
                    <span className="flex items-center justify-center whitespace-nowrap">
                      <span className="hidden sm:inline">Enabled</span>
                      <IconHelp size={16} className="ml-1" />
                    </span>
                  </Tooltip>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredDocumentGroups.map((doc_group_obj, index) => (
                <tr key={index}>
                  <td style={{ wordWrap: 'break-word' }}>
                    <Text>{doc_group_obj.name}</Text>
                  </td>
                  {/* <td style={{ wordWrap: 'break-word' }}>
                      <Text>{doc_group_obj.description}</Text>
                    </td> */}
                  <td style={{ wordWrap: 'break-word' }}>
                    <Text>{doc_group_obj.doc_count}</Text>
                  </td>
                  <td
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      wordWrap: 'break-word',
                    }}
                  >
                    <Switch
                      checked={doc_group_obj.enabled}
                      onChange={(event) =>
                        updateDocGroup.mutate({
                          doc_group_obj,
                          enabled: event.currentTarget.checked,
                        })
                      }
                      color="grape"
                      size="lg"
                    />
                  </td>
                </tr>
              ))}
              {filteredDocumentGroups.length === 0 && (
                <tr>
                  <td colSpan={4}>
                    <Text align="center">No document groups found</Text>
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </ScrollArea.Autosize>
      </div>
    </>
  )
}
