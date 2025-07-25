import { Switch, Table, TextInput, Title, Text } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { IconSearch } from '@tabler/icons-react'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import { useContext, useMemo, useState } from 'react'
import HomeContext from '~/pages/api/home/home.context'
import { useTranslation } from 'next-i18next'
import i18n from 'i18next'

export const ToolsItem = ({}) => {
  const {
    state: { tools },
    dispatch: homeDispatch,
  } = useContext(HomeContext)

  const isSmallScreen = useMediaQuery('(max-width: 960px)')
  const [toolSearch, setToolSearch] = useState('')
  const { t } = useTranslation('common')

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

  const searchPlaceholder = t('common.search', { defaultValue: 'Search...' }) as string

  return (
    <>
      <div className="flex flex-col items-center justify-center">
        <div className="flex w-full flex-col items-center justify-center">
          <div className="flex w-full flex-col">
            <Title
              className={`px-4 pt-4 ${montserrat_heading.variable} rounded-lg bg-[#15162c] p-4 font-montserratHeading`}
              color="white"
              order={isSmallScreen ? 5 : 3}
            >
              {t('settings.sections.tools.title')}
            </Title>

            <TextInput
              type="search"
              placeholder={String(t('settings.sections.tools.search'))}
              mb="sm"
              radius="md"
              icon={<IconSearch />}
              value={toolSearch}
              onChange={handleToolSearchChange}
              className="sticky top-0 z-10"
              w={'90%'}
              size={isSmallScreen ? 'xs' : 'sm'}
            />

            <Table
              variant="striped"
              style={{
                width: '90%',
              }}
              highlightOnHover
            >
              <thead>
                <tr
                  className={`${montserrat_paragraph.variable} font-montserratParagraph ${isSmallScreen ? 'text-xs' : 'text-sm'}`}
                >
                  <th style={{ width: '60%', wordWrap: 'break-word' }}>
                    {t('settings.sections.tools.table.name')}
                  </th>
                  <th
                    style={{
                      width: '40%',
                      wordWrap: 'break-word',
                      textAlign: 'center',
                    }}
                  >
                    <span className="flex flex-col items-center justify-center">
                      <span className="self-center">
                        {t('settings.sections.tools.table.enabled')}
                      </span>
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
                        color="grape"
                        size={isSmallScreen ? 'sm' : 'lg'}
                      />
                    </td>
                  </tr>
                ))}
                {filteredTools.length === 0 && (
                  <tr>
                    <td colSpan={4}>
                      <Text align="center">
                        {t('settings.sections.tools.table.no_tools')}
                      </Text>
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
