import { Input, Switch, Title, Tooltip } from '@mantine/core'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import { ModelParams } from './ModelParams'
import { IconExternalLink } from '@tabler/icons-react'
import { useContext, useEffect, useState } from 'react'
import HomeContext from '~/pages/api/home/home.context'
import { useTranslation } from 'next-i18next'
import Link from 'next/link'
import { useMediaQuery } from '@mantine/hooks'

export const FancyRetrieval = () => {
  // Toggle to enable Fancy retrieval method: Multi-Query Retrieval
  const [useMQRetrieval, setUseMQRetrieval] = useState(
    localStorage.getItem('UseMQRetrieval') === 'true',
  )
  const {
    state: {
      selectedConversation,
      defaultModelId,
      // showModelSettings,
      prompts,
    },
    handleUpdateConversation,
    // dispatch: homeDispatch,
  } = useContext(HomeContext)

  const { t } = useTranslation('chat')
  const isSmallScreen = useMediaQuery('(max-width: 960px)')

  // Update localStorage whenever useMQRetrieval changes
  useEffect(() => {
    localStorage.setItem('UseMQRetrieval', useMQRetrieval ? 'true' : 'false')
  }, [useMQRetrieval])

  return (
    <>
      <div
        className="flex h-full w-[100%] flex-col space-y-4 rounded-lg bg-[#1d1f33] p-4 dark:bg-[#1d1f33]"
        style={{ position: 'relative' }}
      >
        <Tooltip
          multiline
          // color="#15162b"
          color="grape"
          arrowPosition="side"
          position="top-start"
          arrowSize={8}
          withArrow
          label={t('multi_query_retrieval_disabled') || ''}
          classNames={{
            tooltip: `${isSmallScreen ? 'text-xs' : 'text-sm'} ${montserrat_paragraph.variable} font-montserratParagraph`,
          }}
        >
          <div>
            <Title
              className={`px-4 pt-4 ${montserrat_heading.variable} rounded-lg bg-[#15162c] p-4 font-montserratHeading md:rounded-lg`}
              color="white"
              order={isSmallScreen ? 5 : 4}
            >
              {t('fancy_retrieval')}
            </Title>
            <Switch
              disabled={true}
              // checked={useMQRetrieval}
              checked={false}
              className="mx-4 pl-2 pt-2"
              classNames={{
                label: `${montserrat_paragraph.variable} font-montserratParagraph ${isSmallScreen ? 'text-xs' : ''}`,
                description: `${montserrat_paragraph.variable} font-montserratParagraph ${isSmallScreen ? 'text-xs' : ''}`,
              }}
              label={t('multi_query_retrieval_label') || ''}
              onChange={(event) =>
                setUseMQRetrieval(event.currentTarget.checked)
              }
              description={t('multi_query_retrieval_description')}
              color="violet.7"
            />
          </div>
        </Tooltip>
        {/* <ModelParams
          selectedConversation={selectedConversation}
          prompts={prompts}
          handleUpdateConversation={handleUpdateConversation}
          t={t}
        /> */}
        <div className="flex h-full flex-col space-y-4 rounded-lg p-2">
          <Input.Description
            className={`text-right ${isSmallScreen ? 'text-xs' : 'text-sm'} ${montserrat_paragraph.variable} font-montserratParagraph`}
          >
            <Link
              href="https://platform.openai.com/account/usage"
              target="_blank"
              className="hover:underline"
            >
              {t('openai_usage_link')}
              <IconExternalLink
                size={15}
                style={{ position: 'relative', top: '2px' }}
                className={'mb-2 inline'}
              />
            </Link>
          </Input.Description>
        </div>
      </div>
    </>
  )
}
