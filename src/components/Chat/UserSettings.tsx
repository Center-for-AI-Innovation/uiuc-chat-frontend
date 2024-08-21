import { useContext, useEffect } from 'react'
import { Divider, Flex, Modal, Title, createStyles, Tabs } from '@mantine/core'
import HomeContext from '~/pages/api/home/home.context'
import { useDisclosure, useMediaQuery } from '@mantine/hooks'
import React from 'react'
import { ModelSelect } from './ModelSelect'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import { FancyRetrieval } from './FancyRetrieval'
import { DocumentGroupsItem } from './DocumentGroupsItem'
import { ToolsItem } from './ToolsItem'
import { ModelParams } from './ModelParams'
import { useTranslation } from 'react-i18next'
import { prebuiltAppConfig } from '~/utils/modelProviders/ConfigWebLLM'
import * as webllm from '@mlc-ai/web-llm'
import { WebllmModel, webLLMModels } from '~/utils/modelProviders/WebLLM'

const useStyles = createStyles((theme) => ({
  modalContent: {
    height: '95%',
    width: '90%',
    borderRadius: '10px',
    backgroundColor: '#1d1f33',
  },
  modalHeader: {
    width: '100%',
    borderRadius: '10px',
    backgroundColor: '#15162c',
  },
  title: {
    fontFamily: montserrat_heading.variable,
    fontWeight: 'bold',
  },
  tab: {
    fontFamily: montserrat_paragraph.variable,
    '&:hover': {
      background: '#15162c',
    },
    '&[data-active="true"]': {
      background: 'linear-gradient(to right, #6d28d9, #4f46e5, #2563eb)',
    },
    whiteSpace: 'normal',
  },
  divider: {
    alignSelf: 'center',
    margin: '8px 0',
  },
}))
export const modelCached: WebllmModel[] = []

const appConfig = prebuiltAppConfig
// CHANGE THIS TO SEE EFFECTS OF BOTH, CODE BELOW DO NOT NEED TO CHANGE
appConfig.useIndexedDBCache = false
// if (appConfig.useIndexedDBCache) {
//   console.debug('WebLLM: Using IndexedDB Cache')
// } else {
//   console.debug('WebLLM: Using Cache API')
// }

export const UserSettings = () => {
  const {
    state: { selectedConversation, prompts, showModelSettings },
    handleUpdateConversation,
    dispatch: homeDispatch,
  } = useContext(HomeContext)

  const { t } = useTranslation('chat')
  const { classes } = useStyles()
  const [opened, { open, close }] = useDisclosure(false)
  const isSmallScreen = useMediaQuery('(max-width: 960px)')
  const loadModelCache = async () => {
    for (const model of webLLMModels) {
      const theCachedModel = await webllm.hasModelInCache(model.name, appConfig)
      if (theCachedModel) {
        if (
          !modelCached.some((cachedModel) => cachedModel.name === model.name)
        ) {
          modelCached.push(model)
        }
      }
      // console.log('hasModelInCache: ', modelCached)
    }
  }

  useEffect(() => {
    if (showModelSettings) {
      open()
      console.log('model cached', modelCached)
      loadModelCache()
    } else {
      close()
    }
  }, [showModelSettings, open, close, loadModelCache])

  const handleClose = () => {
    homeDispatch({ field: 'showModelSettings', value: false })
  }

  return (
    <Modal.Root opened={opened} onClose={handleClose} centered size={'800px'}>
      <Modal.Overlay style={{ width: '100%', color: '#1d1f33' }} />
      <Modal.Content
        className={`${classes.modalContent} ${isSmallScreen ? 'p-2' : 'p-4'} overflow-x-hidden md:rounded-lg`}
      >
        <Modal.Header className={classes.modalHeader}>
          <Modal.Title>
            <Title
              className={`${classes.title} ${montserrat_heading.variable} font-montserratHeading`}
              order={isSmallScreen ? 5 : 4}
            >
              Settings
            </Title>
          </Modal.Title>
          <Modal.CloseButton />
        </Modal.Header>
        <Modal.Body className="mt-4" p={isSmallScreen ? 'xs' : 'md'}>
          <Tabs
            orientation="vertical"
            defaultValue="model"
            variant="pills"
            styles={{
              tabsList: {
                width: isSmallScreen ? '25%' : 'auto',
              },
            }}
          >
            <Tabs.List mt={'xl'} ml="xs">
              <Tabs.Tab
                className={`${classes.tab} ${isSmallScreen ? 'px-2 text-xs' : 'text-md'} ${montserrat_paragraph.variable} font-montserratParagraph`}
                value="model"
              >
                Model
              </Tabs.Tab>
              <Tabs.Tab
                className={`${classes.tab} ${isSmallScreen ? 'px-2 text-xs' : 'text-md'} ${montserrat_paragraph.variable} font-montserratParagraph`}
                value="documentGroups"
              >
                Document Groups
              </Tabs.Tab>
              <Tabs.Tab
                className={`${classes.tab} ${isSmallScreen ? 'px-2 text-xs' : 'text-md'} ${montserrat_paragraph.variable} font-montserratParagraph`}
                value="tools"
              >
                Tools
              </Tabs.Tab>
            </Tabs.List>

            <Divider ml={'sm'} orientation="vertical" />

            <Tabs.Panel value="model" pt="xs">
              <Flex direction="column">
                <ModelSelect />
                <Divider
                  className={classes.divider}
                  w={isSmallScreen ? '70%' : '90%'}
                />
                <ModelParams
                  selectedConversation={selectedConversation}
                  prompts={prompts}
                  handleUpdateConversation={handleUpdateConversation}
                  t={t}
                />
                <Divider
                  className={classes.divider}
                  w={isSmallScreen ? '70%' : '90%'}
                />
                <FancyRetrieval />
                <Divider
                  className={classes.divider}
                  w={isSmallScreen ? '70%' : '90%'}
                />
              </Flex>
            </Tabs.Panel>

            <Tabs.Panel value="documentGroups" pt="xs">
              <DocumentGroupsItem />
              <Divider
                className={classes.divider}
                w={isSmallScreen ? '70%' : '90%'}
              />
            </Tabs.Panel>

            <Tabs.Panel value="tools" pt="xs">
              <ToolsItem />
              <Divider
                className={classes.divider}
                w={isSmallScreen ? '70%' : '90%'}
              />
            </Tabs.Panel>
          </Tabs>
        </Modal.Body>
      </Modal.Content>
    </Modal.Root>
  )
}
