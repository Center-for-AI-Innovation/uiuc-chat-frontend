import { Switch, Table, TextInput, Title, Text } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { IconSearch } from '@tabler/icons-react'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import { useContext, useMemo, useState } from 'react'
import HomeContext from '~/pages/api/home/home.context'

export const ToolsItem = ({}) => {
  const {
    state: { tools },
    dispatch: homeDispatch,
  } = useContext(HomeContext)

  const isSmallScreen = useMediaQuery('(max-width: 960px)')
  const [toolSearch, setToolSearch] = useState('')

  // Logic to filter tools based on the search query
  const filteredTools = useMemo(() => {
    if (!tools) {
      return []
    }

    return [...tools].filter((tool_obj) =>
      tool_obj.readableName?.toLowerCase().includes(toolSearch?.toLowerCase()),
    )
  }, [tools, toolSearch])

  // Handle tool search change
  const handleToolSearchChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setToolSearch(event.target.value)
  }

  const handleToggleChecked = (id: string) => {
    // handleUpdateActions(id)
    homeDispatch({
      field: 'tools',
      value: tools.map((tool) =>
        tool.id === id ? { ...tool, checked: !tool.enabled } : tool,
      ),
    })
  }
  return (
    <>
      <div
        className="flex h-full w-[100%] flex-col space-y-4 rounded-lg p-3"
        style={{ position: 'relative', zIndex: 100 }}
      >
        <div>
          <div className="flex flex-col"></div>
          <Title
            className={`px-4 pt-4 ${montserrat_heading.variable} rounded-lg bg-[--modal-dark] p-4 font-montserratHeading text-[--modal-text]`}
            order={isSmallScreen ? 5 : 3}
          >
            Tools
          </Title>
          <div className="flex flex-col items-center justify-center rounded-lg">
            <TextInput
              type="search"
              placeholder="Search Tools"
              my="sm"
              radius="md"
              icon={<IconSearch size={isSmallScreen ? 15 : 20} />}
              value={toolSearch}
              onChange={handleToolSearchChange}
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
                    Tool
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
                {filteredTools.map((tool_obj, index) => (
                  <tr key={index}>
                    <td style={{ wordWrap: 'break-word' }}>
                      <Text
                        className={`${montserrat_paragraph.variable} font-montserratParagraph ${isSmallScreen ? 'text-xs' : 'text-sm'}`}
                      >
                        {tool_obj.readableName}
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
                        checked={tool_obj.enabled}
                        onChange={() => handleToggleChecked(tool_obj.id)}
                        color="orange"
                        size={isSmallScreen ? 'sm' : 'lg'}
                      />
                    </td>
                  </tr>
                ))}
                {filteredTools.length === 0 && (
                  <tr>
                    <td colSpan={4}>
                      <Text align="center">No tools found</Text>
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
