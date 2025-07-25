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
      prompts,
    },
    handleUpdateConversation,
  } = useContext(HomeContext)

  const { t } = useTranslation('common')
  const isSmallScreen = useMediaQuery('(max-width: 960px)')

  // Update localStorage whenever useMQRetrieval changes
  useEffect(() => {
    localStorage.setItem('UseMQRetrieval', useMQRetrieval ? 'true' : 'false')
  }, [useMQRetrieval])

  return (
    <>
      <div
        className="flex h-full w-[100%] flex-col space-y-4 rounded-lg p-3"
        style={{ position: 'relative' }}
      >
        <Tooltip
          multiline
          // color="#15162b"
          color=""
          arrowPosition="side"
          position="top-start"
          arrowSize={8}
          withArrow
          label={t('chat.retrieval.multi_query.disabled')}
          classNames={{
            tooltip: `${isSmallScreen ? 'text-xs' : 'text-sm'} text-[--tooltip] bg-[--tooltip-background] ${montserrat_paragraph.variable} font-montserratParagraph`,
          }}
        >
          <div>
            <Title
              className={`${montserrat_heading.variable} rounded-lg bg-[--modal-dark] p-4 font-montserratHeading text-[--modal-text]`}
              color="white"
              order={isSmallScreen ? 5 : 4}
            >
              {t('chat.retrieval.fancy')}
            </Title>
            <Switch
              disabled={true}
              checked={false}
              color="orange"
              className="mx-4 pl-2 pt-2"
              classNames={{
                label: `${montserrat_paragraph.variable} font-montserratParagraph ${isSmallScreen ? 'text-xs' : ''}`,
                description: `${montserrat_paragraph.variable} font-montserratParagraph ${isSmallScreen ? 'text-xs' : ''}`,
              }}
              label={t('chat.retrieval.multi_query.label')}
              onChange={(event) =>
                setUseMQRetrieval(event.currentTarget.checked)
              }
              description={t(
                'A LLM generates multiple queries based on your original for improved semantic search. Then every retrieved context is filtered by a smaller LLM (Mistral 7b) so that only high quality and relevant documents are included in the final GPT-4 call.',
              )}
            />
          </div>
        </Tooltip>
        <div className="flex h-full flex-col space-y-4 rounded-lg p-2">
          <Input.Description
            className={`text-right ${isSmallScreen ? 'text-xs' : 'text-sm'} ${montserrat_paragraph.variable} font-montserratParagraph`}
          >
            <Link
              href="https://platform.openai.com/account/usage"
              target="_blank"
              className="hover:underline"
            >
              {t('models.openai.usage_link')}
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
