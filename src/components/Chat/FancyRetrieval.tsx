import { Input, Switch, Title, Tooltip } from '@mantine/core'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import { ModelParams } from './ModelParams'
import { IconExternalLink } from '@tabler/icons-react'
import { useContext, useEffect, useState } from 'react'
import HomeContext from '~/pages/api/home/home.context'
import { useTranslation } from 'react-i18next'
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
          label="Multi-Query Retrieval is disabled for performance reasons, I'm working to bring it back ASAP."
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
              Fancy Retrieval
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
              label={t('Multi Query Retrieval (slow 30 second response time)')}
              onChange={(event) =>
                setUseMQRetrieval(event.currentTarget.checked)
              }
              description={t(
                'A LLM generates multiple queries based on your original for improved semantic search. Then every retrieved context is filtered by a smaller LLM (Mistral 7b) so that only high quality and relevant documents are included in the final GPT-4 call.',
              )}
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
              View account usage on OpenAI{' '}
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
