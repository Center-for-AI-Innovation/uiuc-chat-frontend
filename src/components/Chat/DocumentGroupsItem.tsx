import { Switch, Table, TextInput, Title, Text } from '@mantine/core'
import { IconSearch } from '@tabler/icons-react'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import { useContext, useEffect, useMemo, useState } from 'react'
import HomeContext from '~/pages/api/home/home.context'
import { useMediaQuery } from '@mantine/hooks'

export const DocumentGroupsItem = ({}) => {
  const {
    state: { documentGroups },
    dispatch: homeDispatch,
  } = useContext(HomeContext)

  const isSmallScreen = useMediaQuery('(max-width: 960px)')
  const [documentGroupSearch, setDocumentGroupSearch] = useState('')

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

  const handleToggleChecked = (id: string) => {
    // handleUpdateActions(id)
    homeDispatch({
      field: 'documentGroups',
      value: documentGroups.map((docGroup) =>
        docGroup.id === id
          ? { ...docGroup, checked: !docGroup.checked }
          : docGroup,
      ),
    })
  }

  // For testing purposes
  // useEffect(() => {
  //   console.log('Document groups updated: ', documentGroups)
  // }, [documentGroups])

  return (
    <>
      <div
        className="flex h-full w-[100%] flex-col space-y-4 rounded-lg p-3"
        style={{ position: 'relative', zIndex: 100 }}
      >
        <div>
          <div className="flex flex-col"></div>
          <Title
            className={`px-4 pt-4 ${montserrat_heading.variable} rounded-lg bg-[--modal-dark] p-4 font-montserratHeading md:rounded-lg`}
            order={isSmallScreen ? 5 : 3}
          >
            Document Groups
          </Title>
          <div className="flex flex-col items-center justify-center rounded-lg">
            <TextInput
              type="search"
              placeholder="Search by Document Group"
              my="sm"
              radius="md"
              icon={<IconSearch size={isSmallScreen ? 15 : 20} />}
              value={documentGroupSearch}
              onChange={handleDocumentGroupSearchChange}
              w={'90%'}
              size={isSmallScreen ? 'xs' : 'sm'}
              styles={{
                input: {
                  color: 'var(--foreground)',
                  backgroundColor: 'var(--background-faded)',
                  borderColor: 'var(--background-dark)',
                  '&:focus': {
                    borderColor: 'var(--background-darker)',
                  },
                },
              }}
            />

            {/* unable to use this until v7 of mantine since we can't control the hover color              highlightOnHover */}
            <Table
              variant="striped"
              className="text-[--modal-text]"
              style={{
                width: '90%',
              }}
            >
              <thead>
                <tr
                  className={`${montserrat_paragraph.variable} font-montserratParagraph ${isSmallScreen ? 'text-xs' : 'text-sm'}`}
                >
                  <th
                    style={{
                      width: '60%',
                      wordWrap: 'break-word',
                      color: 'var(--foreground)',
                    }}
                  >
                    Document Group
                  </th>
                  <th
                    style={{
                      width: '40%',
                      wordWrap: 'break-word',
                      textAlign: 'center',
                      color: 'var(--foreground)',
                    }}
                  >
                    <span className="flex flex-col items-center justify-center">
                      <span className="self-center">Enabled</span>
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredDocumentGroups.map((doc_group_obj, index) => (
                  <tr key={index}>
                    <td style={{ wordWrap: 'break-word' }}>
                      <Text
                        className={`${montserrat_paragraph.variable} font-montserratParagraph ${isSmallScreen ? 'text-xs' : 'text-sm'}`}
                      >
                        {doc_group_obj.name}
                      </Text>
                    </td>
                    <td
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        wordWrap: 'break-word',
                      }}
                    >
                      <Switch
                        checked={doc_group_obj.checked}
                        onChange={() => handleToggleChecked(doc_group_obj.id)}
                        className="cursor-pointer"
                        styles={{
                          track: {
                            backgroundColor: doc_group_obj.checked
                              ? 'var(--dashboard-button) !important'
                              : 'var(--dashboard-background-dark)',
                            borderColor: doc_group_obj.checked
                              ? 'var(--dashboard-button) !important'
                              : 'var(--dashboard-background-dark)',
                          },
                        }}
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
          </div>
        </div>
      </div>
    </>
  )
}
