import { Switch, Table, TextInput, Title, Text, Tooltip } from '@mantine/core'
import { IconSearch } from '@tabler/icons-react'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import { useContext, useMemo, useState } from 'react'
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
    const target = documentGroups.find((docGroup) => docGroup.id === id)
    if (target?.adminDisabled) {
      return
    }
    homeDispatch({
      field: 'documentGroups',
      value: documentGroups.map((docGroup) =>
        docGroup.id === id
          ? { ...docGroup, checked: !docGroup.checked }
          : docGroup,
      ),
    })
  }

  const hasAdminDisabledGroups = useMemo(
    () => documentGroups.some((g) => g.adminDisabled),
    [documentGroups],
  )

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
              aria-label="Search by Document Group"
              my="sm"
              radius="md"
              icon={
                <IconSearch size={isSmallScreen ? 15 : 20} aria-hidden="true" />
              }
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
              aria-label="Document groups configuration"
              variant="striped"
              className="text-[--modal-text]"
              style={{
                width: '90%',
              }}
            >
              <thead>
                <tr
                  className={`${
                    montserrat_paragraph.variable
                  } font-montserratParagraph ${
                    isSmallScreen ? 'text-xs' : 'text-sm'
                  }`}
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
                  <tr
                    key={doc_group_obj.id ?? index}
                    className={
                      doc_group_obj.adminDisabled ? 'opacity-[0.72]' : undefined
                    }
                  >
                    <td style={{ wordWrap: 'break-word' }}>
                      <Text
                        className={`${
                          montserrat_paragraph.variable
                        } font-montserratParagraph ${
                          isSmallScreen ? 'text-xs' : 'text-sm'
                        }`}
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
                      <Tooltip
                        label="Admin has disabled that doc group"
                        disabled={!doc_group_obj.adminDisabled}
                        withinPortal
                      >
                        <span
                          style={{ display: 'inline-flex' }}
                          className={
                            doc_group_obj.adminDisabled
                              ? undefined
                              : 'cursor-pointer'
                          }
                        >
                          <Switch
                            checked={doc_group_obj.checked}
                            disabled={doc_group_obj.adminDisabled}
                            aria-label={
                              doc_group_obj.adminDisabled
                                ? `${doc_group_obj.name}: Admin has disabled that doc group`
                                : `${doc_group_obj.name}: toggle document group`
                            }
                            onChange={() =>
                              handleToggleChecked(doc_group_obj.id)
                            }
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
                        </span>
                      </Tooltip>
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
