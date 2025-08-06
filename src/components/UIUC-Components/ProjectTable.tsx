import { useAuth } from 'react-oidc-context'
import { Table, Title, Text } from '@mantine/core'
import { useEffect, useState } from 'react'
import { type CourseMetadata } from '~/types/courseMetadata'
import { useRouter } from 'next/router'
import { DataTable } from 'mantine-datatable'
import styled from 'styled-components'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import Link from 'next/link'
import React from 'react'
import { useMediaQuery } from '@mantine/hooks'
import {
  IconChevronUp,
  IconChevronDown,
  IconSelector,
} from '@tabler/icons-react'

const StyledRow = styled.tr`
  &:hover {
    color: var(--foreground);
    background-color: var(--background-faded);
  }
`

const StyledTable = styled(Table)`
  table-layout: fixed;
  width: 100%;

  th,
  td {
    word-wrap: break-word;
    overflow-wrap: break-word;
    hyphens: auto;
    padding: 8px;

    color: var(--foreground) !important;
  }

  thead th {
    border-bottom-color: var(--table-border) !important;
  }

  tbody td {
    border-top-color: var(--table-border) !important;
  }
`

const ResponsiveTableWrapper = styled.div`
  overflow-x: auto;
  width: 100%;
  color: var(--foreground);
  background-color: var(--background);
  border-radius: 15px;
  padding: 0;

  @media (min-width: 640px) {
    padding: 0 8px;
  }

  @media (min-width: 768px) {
    padding: 0 16px;
  }

  @media (min-width: 1024px) {
    padding: 0 24px;
  }

  @media (min-width: 1280px) {
    padding: 0 32px;
  }
`

type SortDirection = 'asc' | 'desc' | null
type SortableColumn = 'name' | 'privacy' | 'owner' | 'admins'

const ListProjectTable: React.FC = () => {
  const auth = useAuth()
  const [courses, setProjects] = useState<
    { [key: string]: CourseMetadata }[] | null
  >(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const [rows, setRows] = useState<JSX.Element[]>([])
  const [isFullyLoaded, setIsFullyLoaded] = useState<boolean>(false)
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [sortColumn, setSortColumn] = useState<SortableColumn>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [rawData, setRawData] = useState<{ [key: string]: CourseMetadata }[]>(
    [],
  )

  const handleSort = (column: SortableColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (column: SortableColumn) => {
    if (sortColumn !== column)
      return <IconSelector size={14} color="var(--illinois-blue)" />
    return sortDirection === 'asc' ? (
      <IconChevronUp size={14} color="var(--illinois-blue)" />
    ) : (
      <IconChevronDown size={14} color="var(--illinois-blue)" />
    )
  }

  const sortData = () => {
    if (!rawData) return

    const sortedData = [...rawData].sort((a, b) => {
      const courseNameA = Object.keys(a)[0] ?? ''
      const courseNameB = Object.keys(b)[0] ?? ''
      const metadataA = a[courseNameA as keyof typeof a]
      const metadataB = b[courseNameB as keyof typeof b]

      if (!metadataA || !metadataB) return 0

      let comparison = 0
      switch (sortColumn) {
        case 'name':
          comparison = courseNameA
            .toLowerCase()
            .localeCompare(courseNameB.toLowerCase())
          break
        case 'privacy':
          comparison =
            metadataA.is_private === metadataB.is_private
              ? 0
              : metadataA.is_private
                ? 1
                : -1
          break
        case 'owner':
          comparison = metadataA.course_owner
            .toLowerCase()
            .localeCompare(metadataB.course_owner.toLowerCase())
          break
        case 'admins':
          const adminsA = metadataA.course_admins
            .filter((admin: string) => admin !== 'rohan13@illinois.edu')
            .join(', ')
          const adminsB = metadataB.course_admins
            .filter((admin: string) => admin !== 'rohan13@illinois.edu')
            .join(', ')
          comparison = adminsA
            .toLowerCase()
            .localeCompare(adminsB.toLowerCase())
          break
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })

    const newRows = sortedData
      .map((course) => {
        const courseName = Object.keys(course)[0]
        if (!courseName) return null

        const courseMetadata = course[courseName as keyof typeof course]
        if (!courseMetadata) return null

        const filteredAdmins = courseMetadata.course_admins.filter(
          (admin: string) => admin !== 'rohan13@illinois.edu',
        )

        return (
          <StyledRow
            key={courseName}
            onClick={(e) => {
              // Check if cmd (Mac) or ctrl (Windows/Linux) key is pressed
              if (e.metaKey || e.ctrlKey) {
                // Open in new tab
                window.open(`/${courseName}/chat`, '_blank')
              } else {
                // Normal navigation in current tab
                router.push(`/${courseName}/chat`)
              }
            }}
            style={{ cursor: 'pointer', color: 'var(--illinois-blue)' }}
          >
            <td>{courseName}</td>
            <td>{courseMetadata.is_private ? 'Private' : 'Public'}</td>
            <td>{courseMetadata.course_owner}</td>
            <td>{filteredAdmins.join(', ')}</td>
          </StyledRow>
        )
      })
      .filter((row): row is JSX.Element => row !== null)

    setRows(newRows)
  }

  useEffect(() => {
    sortData()
  }, [sortColumn, sortDirection, rawData])

  useEffect(() => {
    const fetchCourses = async () => {
      console.log('Fetching projects')

      if (auth.isLoading) {
        return
      }

      if (auth.isAuthenticated && auth.user?.profile.email) {
        console.log('Signed')

        const currUserEmail = auth.user.profile.email
        console.log(currUserEmail)
        if (!currUserEmail) {
          throw new Error('No email found for the user')
        }

        const response = await fetch(
          `/api/UIUC-api/getAllCourseMetadata?currUserEmail=${currUserEmail}`,
        )
        const data = await response.json()
        if (data) {
          setRawData(data)
          setIsFullyLoaded(true)
        } else {
          console.log('No project found with the given name')
          setIsFullyLoaded(true)
        }
      } else {
        console.log('User not signed in')
        setIsFullyLoaded(true)
      }
    }
    fetchCourses()
  }, [auth.isLoading, auth.isAuthenticated])

  if (auth.isLoading || !isFullyLoaded) {
    // Loading screen is actually NOT worth it :/ just return null
    // return <Skeleton animate={true} height={40} width="70%" radius="xl" />
    return null
  } else {
    if (!auth.isAuthenticated) {
      return (
        <>
          {/* Todo: add enticing copy for new recruits */}
          {/* <Title order={3}>
            <Link className="text-[--dashboard-button] underline" href="/new">Make your own project here</Link>
          </Title> */}
        </>
      )
    }

    return (
      <>
        <div className="mx-auto px-8 py-6">
          {rows.length > 0 ? (
            <>
              <div
                style={{
                  overflowX: 'auto',
                  width: '100%',
                }}
              >
                <StyledTable>
                  <thead>
                    <tr>
                      {[
                        { label: 'Chatbot Name', key: 'name' },
                        { label: 'Privacy', key: 'privacy' },
                        { label: 'Owner', key: 'owner' },
                        { label: 'Admins', key: 'admins' },
                      ].map(({ label, key }) => (
                        <th
                          key={key}
                          onClick={() => handleSort(key as SortableColumn)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'flex-start',
                              gap: '4px',
                            }}
                          >
                            <span
                              className={`text-md ${montserrat_heading.variable} font-montserratHeading`}
                            >
                              {label}
                            </span>
                            {getSortIcon(key as SortableColumn)}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>{rows}</tbody>
                </StyledTable>
              </div>
            </>
          ) : (
            <Text
              size="md"
              className={`pt-2 ${montserrat_heading.variable} font-montserratHeading`}
              bg={'bg-transparent'}
              style={{
                backgroundColor: 'transparent',
                textAlign: 'center',
                color: 'var(--illinois-blue)',
              }}
            >
              You haven&apos;t created any projects yet. Let&apos;s{' '}
              <Link
                className="underline"
                href="/new"
                style={{ color: 'var(--illinois-orange)' }}
              >
                go make one here
              </Link>
              , don&apos;t worry it&apos;s easy.
            </Text>
          )}
        </div>
      </>
    )
  }
}

export default ListProjectTable
