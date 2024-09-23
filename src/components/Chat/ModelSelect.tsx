import {
  IconChevronDown,
  IconCircleCheck,
  IconDownload,
  IconExternalLink,
  IconSparkles,
  IconAlertTriangleFilled,
} from '@tabler/icons-react'
import { forwardRef, useContext, useEffect, useState } from 'react'
import { useMediaQuery } from '@mantine/hooks'
import HomeContext from '~/pages/api/home/home.context'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import { Group, Select, Title, Text } from '@mantine/core'
import Link from 'next/link'
import React from 'react'
import { OpenAIModel } from '~/utils/modelProviders/types/openai'
import ChatUI from '~/utils/modelProviders/WebLLM'
import { modelCached } from './UserSettings'
import Image from 'next/image'
import {
  AllLLMProviders,
  AnySupportedModel,
  LLMProvider,
  ProviderNames,
  selectBestModel,
} from '~/utils/modelProviders/LLMProvider'
import {
  recommendedModelIds,
  warningLargeModelIds,
} from '~/utils/modelProviders/ConfigWebLLM'
import { LoadingSpinner } from '../UIUC-Components/LoadingSpinner'

interface ModelDropdownProps {
  title: string
  value: string | undefined
  onChange: (value: string) => void
  llmProviders: AllLLMProviders
  isSmallScreen: boolean
  isWebLLM?: boolean
  loadingModelId: string | null
  chat_ui: ChatUI
}

interface ModelItemProps extends React.ComponentPropsWithoutRef<'div'> {
  label: string
  downloadSize?: string
  isDownloaded?: boolean
  modelId: string
  selectedModelId: string | undefined
  modelType: string
  vram_required_MB: number
  chat_ui: ChatUI
}

export const getModelLogo = (modelType: string) => {
  switch (modelType) {
    case ProviderNames.OpenAI:
      return 'https://images.squarespace-cdn.com/content/v1/5a4908d949fc2b8e312bdf53/1676298536608-GQSN44SGOEHWCFSIZIGK/openai_icon.png?format=750w'
    case ProviderNames.Ollama:
      return 'https://raw.githubusercontent.com/deepset-ai/haystack-integrations/main/logos/ollama.png'
    case ProviderNames.WebLLM:
      return 'https://avatars.githubusercontent.com/u/106173866?s=48&v=4'
    case ProviderNames.Anthropic:
      return 'https://www.anthropic.com/images/icons/safari-pinned-tab.svg'
    case ProviderNames.NCSAHosted:
      return 'https://assets.kastan.ai/UofI-logo-white.jpg'
    case ProviderNames.Azure:
      return 'https://assets.kastan.ai/uiuc-chat-emails/msft-logo.png'
    default:
      throw new Error(`Unknown model type: ${modelType}`)
  }
}
export const ModelItem = forwardRef<
  HTMLDivElement,
  ModelItemProps & {
    loadingModelId: string | null
    setLoadingModelId: (id: string | null) => void
  }
>(
  (
    {
      label,
      downloadSize,
      isDownloaded,
      modelId,
      selectedModelId,
      modelType,
      vram_required_MB,
      loadingModelId,
      setLoadingModelId,
      chat_ui,
      ...others
    }: ModelItemProps & {
      loadingModelId: string | null
      setLoadingModelId: (id: string | null) => void
    },
    ref,
  ) => {
    const [isModelCached, setIsModelCached] = useState(false)
    const showSparkles = recommendedModelIds.includes(label)
    const showWarningLargeModel = warningLargeModelIds.includes(label)
    const { state, dispatch: homeDispatch } = useContext(HomeContext)
    // const {
    //   state: {
    //     isLoadingWebLLMModelId,

    //   },
    //   handleUpdateConversation,
    //   dispatch: homeDispatch,
    // } = useContext(HomeContext)
    useEffect(() => {
      const checkModelCache = async () => {
        // if (!chat_ui?.isModelLoading()) {
        //   setLoadingModelId(null)
        // }

        const cached = modelCached.some((model) => model.id === modelId)
        setIsModelCached(cached)
        // if (cached && isLoading) {
        //   const webLLMLoadingState = { id: modelId, isLoading: false }
        //   // homeDispatch({
        //   //   field: 'webLLMModelIdLoading',
        //   //   value: WebLLMLoadingState,
        //   // })
        //   setLoadingModelId(null)
        // }
        //   console.log('model is loading', state.webLLMModelIdLoading)
        //   if (state.webLLMModelIdLoading.isLoading) {
        //     setLoadingModelId(modelId)
        //     console.log('model id', modelId)
        //     console.log('loading model id', loadingModelId)
        //     console.log('model is loading', state.webLLMModelIdLoading.id)
        //   } else if (!state.webLLMModelIdLoading.isLoading) {
        //     setLoadingModelId(null)
        //   }
        // }
      }
      checkModelCache()
    }, [modelId])

    return (
      <div ref={ref} {...others}>
        <Group noWrap>
          <div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Image
                src={getModelLogo(modelType)}
                alt={`${modelType} logo`}
                width={20}
                height={20}
                style={{ marginRight: '8px', borderRadius: '4px' }}
              />
              {/* {selectedModelId === modelId ? (
                <IconCircleCheck stroke={2} />
              ) : (
                <IconCircleDashed stroke={2} />
              )} */}
              <Text size="sm" style={{ marginLeft: '8px' }}>
                {label}
              </Text>
            </div>
            {downloadSize && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginTop: '4px',
                }}
              >
                <Text size="xs" opacity={0.65}>
                  {downloadSize}
                </Text>
                {state.webLLMModelIdLoading.id == modelId &&
                state.webLLMModelIdLoading.isLoading ? (
                  <div
                    style={{
                      marginLeft: '8px',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <LoadingSpinner size="0.5rem" />
                    <Text
                      size="s"
                      style={{ marginLeft: '7px' }}
                      className="text-purple-600"
                    >
                      loading
                    </Text>
                  </div>
                ) : (
                  <>
                    {isModelCached ||
                    (state.webLLMModelIdLoading.id == modelId &&
                      !state.webLLMModelIdLoading.isLoading) ? (
                      <>
                        <IconCircleCheck
                          size="1rem"
                          style={{ marginLeft: '8px' }}
                          className="text-purple-400"
                        />
                        {/* {isLoading && setLoadingModelId(null)} */}
                      </>
                    ) : (
                      <IconDownload size="1rem" style={{ marginLeft: '8px' }} />
                    )}
                    <Text
                      size="xs"
                      opacity={isModelCached ? 1 : 0.65}
                      style={{ marginLeft: '4px' }}
                      className={
                        isModelCached ||
                        (state.webLLMModelIdLoading.id == modelId &&
                          !state.webLLMModelIdLoading.isLoading)
                          ? 'text-purple-400'
                          : ''
                      }
                    >
                      {isModelCached ||
                      (state.webLLMModelIdLoading.id == modelId &&
                        !state.webLLMModelIdLoading.isLoading)
                        ? 'downloaded'
                        : 'download'}
                    </Text>
                  </>
                )}
                {showSparkles && (
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <IconSparkles size="1rem" style={{ marginLeft: '8px' }} />
                    <Text
                      size="xs"
                      opacity={0.65}
                      style={{ marginLeft: '4px' }}
                    >
                      recommended
                    </Text>
                  </div>
                )}
                {showWarningLargeModel && (
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <IconAlertTriangleFilled
                      size="1rem"
                      style={{ marginLeft: '8px' }}
                    />
                    <Text
                      size="xs"
                      opacity={0.65}
                      style={{ marginLeft: '4px' }}
                    >
                      warning, requires large vRAM GPU
                    </Text>
                  </div>
                )}
              </div>
            )}
          </div>
        </Group>
      </div>
    )
  },
)

const ModelDropdown: React.FC<
  ModelDropdownProps & {
    setLoadingModelId: (id: string | null) => void
    onChange: (modelId: string) => Promise<void>
  }
> = ({
  title,
  value,
  onChange,
  llmProviders,
  isSmallScreen,
  isWebLLM,
  loadingModelId,
  setLoadingModelId,
  chat_ui,
}) => {
  const { state, dispatch: homeDispatch } = useContext(HomeContext)

  // Filter out providers that are not enabled and their models which are disabled
  const { enabledProvidersAndModels, allModels } = Object.keys(
    llmProviders,
  ).reduce(
    (
      acc: {
        enabledProvidersAndModels: Record<string, LLMProvider>
        allModels: AnySupportedModel[]
      },
      key,
    ) => {
      const provider = llmProviders[key as keyof typeof llmProviders]
      if (provider && provider.enabled) {
        const enabledModels =
          provider.models?.filter((model) => model.enabled) || []
        if (enabledModels.length > 0) {
          // @ts-ignore -- Can't figure out why the types aren't perfect.
          acc.enabledProvidersAndModels[key as keyof typeof llmProviders] = {
            ...provider,
            models: enabledModels,
          }
          acc.allModels.push(
            ...enabledModels.map((model) => ({
              ...model,
              provider: provider.provider,
            })),
          )
        }
      }
      return acc
    },
    {
      enabledProvidersAndModels: {} as Record<string, LLMProvider>,
      allModels: [] as AnySupportedModel[],
    },
  )

  const selectedModel = allModels.find((model) => model.id === value)

  return (
    <>
      <Title
        className={`px-4 pt-4 ${montserrat_heading.variable} rounded-lg bg-[#15162c] p-4 font-montserratHeading md:rounded-lg`}
        color="white"
        order={isSmallScreen ? 5 : 4}
      >
        Model
      </Title>

      <div
        tabIndex={0}
        className="relative mt-4 flex w-full flex-col items-start px-4"
      >
        <Select
          className="menu z-[50] w-full"
          size="md"
          placeholder="Select a model"
          searchable
          value={value}
          onChange={async (modelId) => {
            if (state.webLLMModelIdLoading.isLoading) {
              setLoadingModelId(modelId)
              console.log('model id', modelId)
              console.log('loading model id', loadingModelId)
              console.log('model is loading', state.webLLMModelIdLoading.id)
            } else if (!state.webLLMModelIdLoading.isLoading) {
              setLoadingModelId(null)
            }
            await onChange(modelId!)
          }}
          data={Object.values(enabledProvidersAndModels).flatMap(
            (provider: LLMProvider) =>
              provider.models?.map((model) => ({
                value: model.id,
                label: model.name,
                // @ts-ignore -- this being missing is fine
                downloadSize: model?.downloadSize,
                modelId: model.id,
                selectedModelId: value,
                modelType: provider.provider,
                group: provider.provider,
                // @ts-ignore -- this being missing is fine
                vram_required_MB: model.vram_required_MB,
              })) || [],
          )}
          itemComponent={(props) => (
            <ModelItem
              {...props}
              loadingModelId={loadingModelId}
              setLoadingModelId={setLoadingModelId}
            />
          )}
          maxDropdownHeight={480}
          rightSectionWidth="auto"
          icon={
            selectedModel ? (
              <Image
                // @ts-ignore -- this being missing is fine
                src={getModelLogo(selectedModel.provider)}
                // @ts-ignore -- this being missing is fine
                alt={`${selectedModel.provider} logo`}
                width={20}
                height={20}
                style={{ marginLeft: '4px', borderRadius: '4px' }}
              />
            ) : null
          }
          rightSection={<IconChevronDown size="1rem" className="mr-2" />}
          classNames={{
            root: 'w-full',
            wrapper: 'w-full',
            input: `${montserrat_paragraph.variable} font-montserratParagraph ${isSmallScreen ? 'text-xs' : 'text-sm'} w-full`,
            rightSection: 'pointer-events-none',
            item: `${montserrat_paragraph.variable} font-montserratParagraph ${isSmallScreen ? 'text-xs' : 'text-sm'}`,
          }}
          styles={(theme) => ({
            input: {
              backgroundColor: 'rgb(107, 33, 168)',
              border: 'none',
              // color: theme.white,
              // borderRadius: theme.radius.md,
              // width: '24rem',
              // [`@media (max-width: 960px)`]: {
              //   width: '17rem', // Smaller width for small screens
              // },
            },
            dropdown: {
              backgroundColor: '#1d1f33',
              border: '1px solid rgba(42,42,120,1)',
              borderRadius: theme.radius.md,
              marginTop: '2px',
              boxShadow: theme.shadows.xs,
              width: '100%',
              maxWidth: '100%',
              position: 'absolute',
            },
            item: {
              backgroundColor: '#1d1f33',
              borderRadius: theme.radius.md,
              margin: '2px',
              '&[data-selected]': {
                '&': {
                  backgroundColor: 'transparent',
                },
                '&:hover': {
                  backgroundColor: 'rgb(107, 33, 168)',
                  color: theme.white,
                },
              },
              '&[data-hovered]': {
                backgroundColor: 'rgb(107, 33, 168)',
                color: theme.white,
              },
            },
          })}
          dropdownPosition="bottom"
          withinPortal
        />
      </div>
    </>
  )
}

export const ModelSelect = React.forwardRef<HTMLDivElement, any>(
  ({ chat_ui, props }, ref) => {
    const {
      state: { selectedConversation, llmProviders, defaultModelId },
      handleUpdateConversation,
      dispatch: homeDispatch,
    } = useContext(HomeContext)
    const isSmallScreen = useMediaQuery('(max-width: 960px)')
    const defaultModel = selectBestModel(llmProviders).id
    const [loadingModelId, setLoadingModelId] = useState<string | null>(null)

    const handleModelClick = (modelId: string) => {
      // Get list of models from all providers
      const allModels = Object.values(llmProviders)
        .flatMap((provider) => provider?.models || [])
        .filter((model) => model.enabled)

      const model =
        Object.keys(allModels).reduce((foundModel: any, key: any) => {
          return foundModel || allModels!.find((model) => model.id === modelId)
        }, undefined) || defaultModel

      selectedConversation &&
        handleUpdateConversation(selectedConversation, {
          key: 'model',
          value: model as OpenAIModel,
        })
      localStorage.setItem('defaultModel', modelId)
    }

    return (
      <div
        className="flex h-full w-[100%] flex-col space-y-4 rounded-lg bg-[#1d1f33] p-3 dark:bg-[#1d1f33]"
        style={{ position: 'relative', zIndex: 100 }}
      >
        <div>
          <div className="flex flex-col">
            <ModelDropdown
              title="Select Model"
              value={selectedConversation?.model.id || defaultModelId}
              onChange={
                // async (modelId) => {
                // // if (state.webLLMModelIdLoading) {
                // //   setLoadingModelId(modelId)
                // //   console.log('model is loading', state.webLLMModelIdLoading.id)
                // // }
                // await handleModelClick(modelId)
                async (modelId) => {
                  handleModelClick(modelId)
                }
              }
              llmProviders={llmProviders}
              isSmallScreen={isSmallScreen}
              loadingModelId={loadingModelId}
              setLoadingModelId={setLoadingModelId}
              chat_ui={chat_ui}
            />
            <div className="px-5">
              <Title
                className={`pb-1 pl-4 pt-2 ${montserrat_heading.variable} font-montserratHeading`}
                // variant="gradient"
                // gradient={{ from: 'gold', to: 'white', deg: 170 }}
                variant="gradient"
                gradient={{
                  from: 'hsl(280,100%,70%)',
                  to: 'white',
                  deg: 185,
                }}
                order={5}
              >
                NCSA Hosted Models, 100% free
              </Title>
              <Text
                size={'sm'}
                className={`ms-4 text-gray-400 ${montserrat_paragraph.variable} font-montserratParagraph`}
              >
                The best free option is the Llama 3.1 70b model, hosted by NCSA.
              </Text>
              <Title
                className={`pb-1 pl-4 pt-2 ${montserrat_heading.variable} font-montserratHeading`}
                // variant="gradient"
                // gradient={{ from: 'gold', to: 'white', deg: 170 }}
                variant="gradient"
                gradient={{
                  from: 'hsl(280,100%,70%)',
                  to: 'white',
                  deg: 185,
                }}
                order={5}
              >
                OpenAI
              </Title>
              <Text
                size={'sm'}
                className={`ms-4 text-gray-400 ${montserrat_paragraph.variable} font-montserratParagraph`}
              >
                OpenAI{' '}
                <Link
                  href="https://platform.openai.com/docs/models"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 visited:text-purple-600 hover:text-blue-700 hover:underline"
                >
                  model details and pricing.{' '}
                  <IconExternalLink
                    size={15}
                    style={{ position: 'relative', top: '2px' }}
                    className={'mb-2 inline'}
                  />
                </Link>{' '}
                An OpenAI API key is required, and you may face rate-limit
                issues until you complete your first billing cycle.
              </Text>

              {/* <div
              className="w-[95%] items-start rounded-2xl shadow-md shadow-purple-600 md:w-[93%] xl:w-[85%]"
              style={{ zIndex: 1, background: '#15162c' }}
            >

              <Title
                className={`${montserrat_heading.variable} font-montserratHeading`}
                variant="gradient"
                gradient={{
                  from: 'hsl(280,100%,70%)',
                  to: 'white',
                  deg: 185,
                }}
                order={3}
                p="xl"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                On-device LLMs
              </Title>
            </div> */}
              <Title
                className={`pb-1 pl-4 pt-2 ${montserrat_heading.variable} font-montserratHeading`}
                // variant="gradient"
                // gradient={{ from: 'gold', to: 'white', deg: 170 }}
                variant="gradient"
                gradient={{
                  from: 'hsl(280,100%,70%)',
                  to: 'white',
                  deg: 185,
                }}
                order={5}
              >
                On-device LLMs
              </Title>
              <Text
                size={'sm'}
                className={`ms-4 text-gray-400 ${montserrat_paragraph.variable} font-montserratParagraph`}
              >
                We support running some models in your web browser on your
                device. That&apos;s 100% local, on-device AI. It even uses your
                GPU. For this, your browser{' '}
                <Link
                  href={'https://webgpureport.org/'}
                  className="text-blue-500 visited:text-purple-600 hover:text-blue-700 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  must pass this compatability check for WebGPU.{' '}
                  <IconExternalLink
                    size={15}
                    style={{ position: 'relative', top: '2px' }}
                    className={'mb-2 inline'}
                  />
                </Link>
                <br />
                If you see lots of text, it&apos;s working. If you see
                &quot;webgpu not available on this browser&quot;, it&apos;s not
                working.
              </Text>
              <Title
                className={`pb-1 pl-4 pt-2 ${montserrat_heading.variable} font-montserratHeading`}
                // variant="gradient"
                // gradient={{ from: 'gold', to: 'white', deg: 170 }}
                variant="gradient"
                gradient={{
                  from: 'hsl(280,100%,70%)',
                  to: 'white',
                  deg: 185,
                }}
                order={5}
              >
                Coming soon
              </Title>
              <Text
                size={'sm'}
                className={`ms-4 text-gray-400 ${montserrat_paragraph.variable} font-montserratParagraph`}
              >
                Anthropic, Google Gemini, Azure OpenAI, customizable OpenAI
                compatible servers.
              </Text>
            </div>
          </div>
        </div>
      </div>
    )
  },
)

ModelItem.displayName = 'ModelItem'
ModelSelect.displayName = 'ModelSelect'
