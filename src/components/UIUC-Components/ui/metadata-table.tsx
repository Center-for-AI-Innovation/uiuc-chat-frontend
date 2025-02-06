'use client'

import * as React from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { IconCopy } from '@tabler/icons-react'
import { cn } from '~/lib/utils'
import { Input } from './input'
import { DataTable } from './data-table'
import { TableCell } from './table'
import { type MetadataRow } from '~/types/metadata'
import { montserrat_heading, montserrat_paragraph } from 'fonts'

interface DataTableProps {
  data: MetadataRow[]
  onViewJson?: (data: any) => void
}

function DocumentTable({
  document,
  onViewJson,
}: {
  document: MetadataRow
  onViewJson?: (data: any) => void
}) {
  const [searchTerm, setSearchTerm] = React.useState('')

  // Get all fields except metadata fields
  const fields = Object.entries(document)
    .filter(
      ([key]) =>
        !['document_id', 'document_name', 'run_status', 'last_error'].includes(
          key,
        ),
    )
    .filter(([key]) => key.toLowerCase().includes(searchTerm.toLowerCase()))

  // Get all unique subfields from nested JSON values
  const subfields = React.useMemo(() => {
    const allSubfields = new Set<string>()
    fields.forEach(([_, value]) => {
      if (typeof value === 'object' && value !== null) {
        Object.keys(value).forEach((key) => allSubfields.add(key))
      }
    })
    return Array.from(allSubfields)
  }, [fields])

  // Function to truncate and format JSON preview
  const formatJsonPreview = (value: any): string => {
    if (typeof value !== 'object' || value === null) return String(value || '-')
    const preview = JSON.stringify(value)
    return preview.length > 50 ? preview.slice(0, 47) + '...' : preview
  }

  // Create columns based on fields
  const columns = React.useMemo<ColumnDef<any>[]>(() => {
    const baseColumns: ColumnDef<any>[] = [
      {
        accessorKey: 'field',
        header: 'Field',
        cell: ({ row }) => (
          <div
            className={`${montserrat_heading.variable} font-montserratHeading text-sm font-medium text-white/90`}
          >
            {row.original.field}
          </div>
        ),
      },
    ]

    if (subfields.length > 0) {
      return [
        ...baseColumns,
        ...subfields.map(
          (subfield): ColumnDef<any> => ({
            accessorKey: subfield,
            header: subfield,
            cell: ({ row }) => {
              const value = row.original.value[subfield]
              return (
                <TableCell
                  className={cn(
                    'cursor-pointer p-0 transition-colors hover:bg-white/5',
                    typeof value === 'object' &&
                      value !== null &&
                      'cursor-pointer',
                  )}
                  onClick={() => value && onViewJson?.(value)}
                >
                  <div
                    className={cn(
                      `${montserrat_paragraph.variable} truncate p-4 font-montserratParagraph text-sm text-white/80`,
                      typeof value === 'object' &&
                        value !== null &&
                        'text-indigo-400 hover:text-indigo-300',
                    )}
                    title={formatJsonPreview(value)}
                  >
                    {formatJsonPreview(value)}
                  </div>
                </TableCell>
              )
            },
          }),
        ),
      ]
    }

    return [
      ...baseColumns,
      {
        accessorKey: 'value',
        header: 'Value',
        cell: ({ row }) => {
          const value = row.original.value
          // Show loading state only if the value is undefined/null and document is in progress
          if (
            document.run_status === 'in_progress' &&
            (value === undefined || value === null)
          ) {
            return (
              <div className="h-6 w-24 animate-pulse rounded-md bg-gray-700/50" />
            )
          }
          return (
            <TableCell
              className={cn(
                'cursor-pointer p-0 transition-colors hover:bg-white/5',
                typeof value === 'object' && value !== null && 'cursor-pointer',
              )}
              onClick={() =>
                typeof value === 'object' &&
                value !== null &&
                onViewJson?.(value)
              }
            >
              <div
                className={cn(
                  `${montserrat_paragraph.variable} truncate p-4 font-montserratParagraph text-sm text-white/80`,
                  typeof value === 'object' &&
                    value !== null &&
                    'text-indigo-400 hover:text-indigo-300',
                )}
                title={formatJsonPreview(value)}
              >
                {formatJsonPreview(value)}
              </div>
            </TableCell>
          )
        },
      },
    ]
  }, [document.run_status, subfields, onViewJson])

  // Transform data for the table
  const tableData = React.useMemo(
    () =>
      fields.map(([fieldName, value]) => ({
        field: fieldName,
        value,
      })),
    [fields],
  )

  return (
    <div className="mb-8 overflow-hidden rounded-lg bg-black/20">
      {/* Document header */}
      <div className="sticky top-0 z-20 border-b border-white/10 bg-black/40 p-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3
              className={`${montserrat_heading.variable} font-montserratHeading text-lg font-semibold text-white/90`}
            >
              {document.document_name}
            </h3>
            <div
              className={cn(
                'flex items-center gap-2',
                document.run_status === 'in_progress' && 'animate-pulse',
              )}
            >
              <div
                className={cn(
                  'h-2 w-2 rounded-full',
                  document.run_status === 'completed' && 'bg-green-500',
                  document.run_status === 'failed' && 'bg-red-500',
                  document.run_status === 'in_progress' && 'bg-yellow-500',
                )}
              />
              <span
                className={cn(
                  `${montserrat_paragraph.variable} whitespace-nowrap font-montserratParagraph capitalize`,
                  document.run_status === 'completed' && 'text-green-500',
                  document.run_status === 'failed' && 'text-red-500',
                  document.run_status === 'in_progress' && 'text-yellow-500',
                )}
              >
                {document.run_status.replace('_', ' ')}
              </span>
              {document.last_error && document.run_status === 'failed' && (
                <span
                  className={`${montserrat_paragraph.variable} max-w-[200px] truncate font-montserratParagraph text-xs text-red-400`}
                  title={document.last_error}
                >
                  ({document.last_error})
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search fields..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`${montserrat_paragraph.variable} h-8 w-64 bg-black/20 font-montserratParagraph text-sm text-white/90 placeholder:text-white/60 focus-visible:ring-indigo-500`}
            />
          </div>
        </div>
      </div>

      <div className="max-h-[400px] overflow-auto">
        <DataTable columns={columns} data={tableData} onViewJson={onViewJson} />
      </div>
    </div>
  )
}

export function MetadataTable({ data, onViewJson }: DataTableProps) {
  return (
    <div className="space-y-4">
      {data.map((document) => (
        <DocumentTable
          key={document.document_id}
          document={document}
          onViewJson={onViewJson}
        />
      ))}
    </div>
  )
}
