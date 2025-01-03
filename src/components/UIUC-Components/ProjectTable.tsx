import { Table, Title, Text } from '@mantine/core'
import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { extractEmailsFromClerk } from '~/components/UIUC-Components/clerkHelpers'
import { type CourseMetadata } from '~/types/courseMetadata'
import { useRouter } from 'next/router'
import { DataTable } from 'mantine-datatable'
import styled from 'styled-components'
import { montserrat_heading } from 'fonts'
import Link from 'next/link'
import React from 'react'
import { useMediaQuery } from '@mantine/hooks'
import { IconChevronUp, IconChevronDown, IconSelector } from '@tabler/icons-react'

const StyledRow = styled.tr`
  &:hover {
    background-color: hsla(280, 100%, 70%, 0.5);
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
  }
`

const ResponsiveTableWrapper = styled.div`
  overflow-x: auto;
  width: 100%;
  background-color: #15162b;
  box-shadow: 0px 0px 10px 2px rgba(0, 0, 0, 0.5);
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

type SortDirection = 'asc' | 'desc' | null;
type SortableColumn = 'name' | 'privacy' | 'owner' | 'admins';

const ListProjectTable: React.FC = () => {
  const clerk_user = useUser()
  const [courses, setProjects] = useState<{ [key: string]: CourseMetadata }[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const [rows, setRows] = useState<JSX.Element[]>([])
  const [isFullyLoaded, setIsFullyLoaded] = useState<boolean>(false)
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [sortColumn, setSortColumn] = useState<SortableColumn>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [rawData, setRawData] = useState<{ [key: string]: CourseMetadata }[]>([])

  const handleSort = (column: SortableColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (column: SortableColumn) => {
    if (sortColumn !== column) return <IconSelector size={14} />;
    return sortDirection === 'asc' ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />;
  }

  const sortData = () => {
    if (!rawData) return;

    const sortedData = [...rawData].sort((a, b) => {
      const courseNameA = Object.keys(a)[0] ?? '';
      const courseNameB = Object.keys(b)[0] ?? '';
      const metadataA = a[courseNameA as keyof typeof a];
      const metadataB = b[courseNameB as keyof typeof b];

      if (!metadataA || !metadataB) return 0;

      let comparison = 0;
      switch (sortColumn) {
        case 'name':
          comparison = courseNameA.toLowerCase().localeCompare(courseNameB.toLowerCase());
          break;
        case 'privacy':
          comparison = (metadataA.is_private === metadataB.is_private) ? 0 : metadataA.is_private ? 1 : -1;
          break;
        case 'owner':
          comparison = metadataA.course_owner.toLowerCase().localeCompare(metadataB.course_owner.toLowerCase());
          break;
        case 'admins':
          const adminsA = metadataA.course_admins.filter((admin: string) => admin !== 'kvday2@illinois.edu').join(', ');
          const adminsB = metadataB.course_admins.filter((admin: string) => admin !== 'kvday2@illinois.edu').join(', ');
          comparison = adminsA.toLowerCase().localeCompare(adminsB.toLowerCase());
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    const newRows = sortedData
      .map((course) => {
        const courseName = Object.keys(course)[0];
        if (!courseName) return null;
        
        const courseMetadata = course[courseName as keyof typeof course];
        if (!courseMetadata) return null;

        const filteredAdmins = courseMetadata.course_admins.filter(
          (admin: string) => admin !== 'kvday2@illinois.edu'
        );
        
        return (
          <StyledRow
            key={courseName}
            onClick={() => router.push(`/${courseName}/chat`)}
            style={{ cursor: 'pointer' }}
          >
            <td>{courseName}</td>
            <td>{courseMetadata.is_private ? 'Private' : 'Public'}</td>
            <td>{courseMetadata.course_owner}</td>
            <td>{filteredAdmins.join(', ')}</td>
          </StyledRow>
        );
      })
      .filter((row): row is JSX.Element => row !== null);

    setRows(newRows);
  }

  useEffect(() => {
    sortData();
  }, [sortColumn, sortDirection, rawData]);

  useEffect(() => {
    const fetchCourses = async () => {
      console.log('Fetching projects')
      if (!clerk_user.isLoaded) {
        return
      }

      if (clerk_user.isSignedIn) {
        console.log('Signed')
        const emails = extractEmailsFromClerk(clerk_user.user)
        const currUserEmail = emails[0]
        console.log(currUserEmail)
        if (!currUserEmail) {
          throw new Error('No email found for the user')
        }

        const response = await fetch(
          `/api/UIUC-api/getAllCourseMetadata?currUserEmail=${currUserEmail}`,
        )
        const data = await response.json()
        if (data) {
          setRawData(data);
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
  }, [clerk_user.isLoaded, clerk_user.isSignedIn])

  if (!clerk_user.isLoaded || !isFullyLoaded) {
    // Loading screen is actually NOT worth it :/ just return null
    // return <Skeleton animate={true} height={40} width="70%" radius="xl" />
    return null
  } else {
    if (!clerk_user.isSignedIn) {
      return (
        <>
          {/* Todo: add enticing copy for new recruits */}
          {/* <Title order={3}>
            <Link className="text-purple-500 underline" href="/new">Make your own project here</Link>
          </Title> */}
        </>
      )
    }

    return (
      <>
        <div className="mx-auto w-full md:w-4/5">
          <Title order={2} color="white" ta="center" pb={16} pt={8}>
            Your Projects
          </Title>
          {rows.length > 0 ? (
            <div
              style={{
                overflowX: 'auto',
                width: '100%',
                backgroundColor: '#15162b',
                boxShadow: '0px 0px 10px 2px rgba(0,0,0,0,5)',
                borderRadius: '15px',
              }}
            >
              <StyledTable>
                <thead>
                  <tr>
                    {[
                      { label: 'Project Name', key: 'name' },
                      { label: 'Privacy', key: 'privacy' },
                      { label: 'Project Owner', key: 'owner' },
                      { label: 'Project Admins', key: 'admins' }
                    ].map(({ label, key }) => (
                      <th 
                        key={key} 
                        onClick={() => handleSort(key as SortableColumn)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span className={`text-md text-slate-200 ${montserrat_heading.variable} font-montserratHeading`}>
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
          ) : (
            <Text
              size="md"
              className={`${montserrat_heading.variable} font-montserratHeading`}
              bg={'bg-transparent'}
              style={{ backgroundColor: 'clear', textAlign: 'center' }}
            >
              You haven&apos;t created any projects yet. Let&apos;s{' '}
              <Link className="text-purple-500 underline" href="/new">
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
