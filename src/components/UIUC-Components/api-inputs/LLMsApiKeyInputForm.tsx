import {
  ActionIcon,
  Button,
  Card,
  Flex,
  Group,
  Input,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconAlertCircle, IconCheck, IconX } from '@tabler/icons-react'
import { useForm, type FieldApi } from '@tanstack/react-form'
import { useQueryClient } from '@tanstack/react-query'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import Head from 'next/head'
import Image from 'next/image'
import React, { forwardRef, useEffect, useState } from 'react'
import { getModelLogo } from '~/components/Chat/ModelSelect'
import SettingsLayout, {
  getInitialCollapsedState,
} from '~/components/Layout/SettingsLayout'
import {
  useGetProjectLLMProviders,
  useSetProjectLLMProviders,
} from '~/hooks/useProjectAPIKeys'
import {
  LLM_PROVIDER_ORDER,
  type AllLLMProviders,
  type AnthropicProvider,
  type AnySupportedModel,
  type AzureProvider,
  type BedrockProvider,
  type GeminiProvider,
  type LLMProvider,
  type NCSAHostedProvider,
  type NCSAHostedVLMProvider,
  type OllamaProvider,
  type OpenAIProvider,
  type ProviderNames,
  type SambaNovaProvider,
  type WebLLMProvider,
} from '~/utils/modelProviders/LLMProvider'
import { useResponsiveCardWidth } from '~/utils/responsiveGrid'
import { GetCurrentPageName } from '../CanViewOnlyCourse'
import GlobalFooter from '../GlobalFooter'
import AnthropicProviderInput from './providers/AnthropicProviderInput'
import AzureProviderInput from './providers/AzureProviderInput'
import BedrockProviderInput from './providers/BedrockProviderInput'
import GeminiProviderInput from './providers/GeminiProviderInput'
import NCSAHostedLLmsProviderInput from './providers/NCSAHostedProviderInput'
import NCSAHostedVLMProviderInput from './providers/NCSAHostedVLMProviderInput'
import OllamaProviderInput from './providers/OllamaProviderInput'
import OpenAIProviderInput from './providers/OpenAIProviderInput'
import SambaNovaProviderInput from './providers/SambaNovaProviderInput'
import WebLLMProviderInput from './providers/WebLLMProviderInput'

const isSmallScreen = false

function FieldInfo({ field }: { field: FieldApi<any, any, any, any> }) {
  return (
    <>
      {field.state.meta.isTouched && field.state.meta.errors.length ? (
        <Text size="xs" color="red">
          {field.state.meta.errors.join(', ')}
        </Text>
      ) : null}
      {field.state.meta.isValidating ? (
        <Text size="xs">Validating...</Text>
      ) : null}
    </>
  )
}

export const APIKeyInput = ({
  field,
  placeholder,
}: {
  field: FieldApi<any, any, any, any>
  placeholder: string
}) => {
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setError(null)
  }, [field.state.value])

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <Input.Wrapper
        id="API-key-input"
        label={placeholder}
        styles={{
          label: { color: 'var(--dashboard-foreground-faded)' },
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <TextInput
            type="password"
            placeholder={placeholder}
            aria-label={placeholder}
            value={field.state.value}
            onChange={(e) => {
              field.handleChange(e.target.value)
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                field.form.handleSubmit()
              }
            }}
            style={{ flex: 1 }}
            styles={{
              input: {
                color: 'var(--foreground)',
                backgroundColor: 'var(--background)',
                padding: '8px',
                borderRadius: '4px',
              },
            }}
          />
          <ActionIcon
            size="xs"
            color="red"
            onClick={(e) => {
              e.preventDefault()
              field.handleChange('')
              field.form.handleSubmit()
            }}
            type="submit"
            className="hover:bg-[red] hover:text-[white]"
            style={{ marginLeft: '8px' }}
          >
            <IconX size={12} />
          </ActionIcon>
        </div>
      </Input.Wrapper>
      <FieldInfo field={field} />
      <div className="pt-1" />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {error && (
          <Text color="red" size="sm">
            {error}
          </Text>
        )}
        <div>
          <Button
            compact
            className="bg-[--dashboard-button] text-[--dashboard-button-foreground] hover:bg-[--dashboard-button-hover]"
            onClick={() => {
              field.form.handleSubmit()
            }}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}

const NewModelDropdown: React.FC<{
  value: AnySupportedModel
  onChange: (model: AnySupportedModel) => Promise<void>
  llmProviders: AllLLMProviders
  isSmallScreen: boolean
}> = ({ value, onChange, llmProviders, isSmallScreen }) => {
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
          provider.models?.filter((model: { enabled: any }) => model.enabled) ||
          []
        if (enabledModels.length > 0) {
          // @ts-ignore -- Can't figure out why the types aren't perfect.
          acc.enabledProvidersAndModels[key as keyof typeof llmProviders] = {
            ...provider,
            models: enabledModels,
          }
          acc.allModels.push(
            ...enabledModels.map((model: any) => ({
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
  const selectedModel =
    allModels.find((model) => model.id === value?.id) || undefined

  return (
    <>
      <Select
        className="menu z-[50] w-full"
        size="md"
        placeholder="Select a model"
        // searchable
        value={value?.id || ''}
        onChange={async (modelId) => {
          const selectedModel = allModels.find((model) => model.id === modelId)
          if (selectedModel) {
            await onChange(selectedModel)
          }
        }}
        data={Object.entries(enabledProvidersAndModels)
          // Sort by LLM_PROVIDER_ORDER
          .sort(([providerA], [providerB]) => {
            const indexA = LLM_PROVIDER_ORDER.indexOf(
              providerA as ProviderNames,
            )
            const indexB = LLM_PROVIDER_ORDER.indexOf(
              providerB as ProviderNames,
            )
            // Providers not in the order list will be placed at the end
            if (indexA === -1) return 1
            if (indexB === -1) return -1
            return indexA - indexB
          })
          .flatMap(
            ([_, provider]) =>
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
          <ModelItem {...props} setLoadingModelId={() => {}} />
        )}
        maxDropdownHeight={520}
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
        // rightSection={<IconChevronDown size="1rem" className="mr-2" />}
        classNames={{
          root: 'w-full',
          wrapper: 'w-full',
          input: `${montserrat_paragraph.variable} font-montserratParagraph ${isSmallScreen ? 'text-xs' : 'text-sm'} w-full`,
          rightSection: 'pointer-events-none',
          item: `${montserrat_paragraph.variable} font-montserratParagraph ${isSmallScreen ? 'text-xs' : 'text-sm'}`,
        }}
        styles={(theme) => ({
          input: {
            color: 'var(--foreground)',
            backgroundColor: 'var(--background)',
            borderColor: 'var(--button)',
            // color: theme.white,
            // borderRadius: theme.radius.md,
            // width: '24rem',
            // [`@media (max-width: 960px)`]: {
            //   width: '17rem', // Smaller width for small screens
            // },
          },
          dropdown: {
            backgroundColor: 'var(--background)',
            border: '1px solid var(--background-dark)',
            borderRadius: theme.radius.md,
            marginTop: '2px',
            boxShadow: theme.shadows.xs,
            width: '100%',
            maxWidth: '100%',
            position: 'absolute',
          },
          item: {
            color: 'var(--foreground)',
            backgroundColor: 'var(--background)',
            borderRadius: theme.radius.md,
            margin: '2px',
            '&[data-selected]': {
              '&': {
                color: 'var(--foreground)',
                backgroundColor: 'transparent',
              },
              '&:hover': {
                color: 'var(--foreground)',
                backgroundColor: 'var(--foreground-faded)',
              },
            },
            '&[data-hovered]': {
              color: 'var(--foreground)',
              backgroundColor: 'var(--foreground-faded)',
            },
          },
        })}
        dropdownPosition="bottom"
        withinPortal
      />
    </>
  )
}

interface ModelItemProps extends React.ComponentPropsWithoutRef<'div'> {
  label: string
  downloadSize?: string
  isDownloaded?: boolean
  modelId: string
  selectedModelId: string | undefined
  modelType: string
  vram_required_MB: number
}

export const ModelItem = forwardRef<
  HTMLDivElement,
  ModelItemProps & {
    loadingModelId: string | null
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
      ...others
    }: ModelItemProps & {
      loadingModelId: string | null
    },
    ref,
  ) => {
    return (
      <>
        <div ref={ref} {...others}>
          <Group noWrap>
            <div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Image
                  src={getModelLogo(modelType) || ''}
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
            </div>
          </Group>
        </div>
      </>
    )
  },
)

export function findDefaultModel(
  providers: AllLLMProviders,
): (AnySupportedModel & { provider: ProviderNames }) | undefined {
  for (const providerKey in providers) {
    const provider = providers[providerKey as keyof typeof providers]
    if (provider && provider.models) {
      const currentDefaultModel = provider.models.find(
        (model) => model.default === true,
      )
      if (currentDefaultModel) {
        return {
          ...currentDefaultModel,
          provider: providerKey as ProviderNames,
        }
      }
    }
  }
  return undefined
}

export default function APIKeyInputForm() {
  const projectName = GetCurrentPageName()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    getInitialCollapsedState(),
  )

  // Get responsive card width classes based on sidebar state
  const cardWidthClasses = useResponsiveCardWidth(sidebarCollapsed)

  // ------------ <TANSTACK QUERIES> ------------
  const queryClient = useQueryClient()
  const {
    data: llmProviders,
    isLoading: isLoadingLLMProviders,
    isError: isErrorLLMProviders,
    error: errorLLMProviders,
    // enabled: !!projectName // Only run the query when projectName is available
  } = useGetProjectLLMProviders({ projectName: projectName })

  useEffect(() => {
    if (llmProviders) {
      form.reset()
    }
  }, [llmProviders])

  useEffect(() => {
    // handle errors
    if (isErrorLLMProviders) {
      showConfirmationToast({
        title: 'Error',
        message:
          'Failed your api keys. Our database must be having a bad day. Please refresh or try again later.',
        isError: true,
      })
    }
  }, [isErrorLLMProviders])

  const mutation = useSetProjectLLMProviders(queryClient)

  const setDefaultModelAndUpdateProviders = (
    newDefaultModel: AnySupportedModel & { provider: ProviderNames },
  ) => {
    // Update the llmProviders state
    form.setFieldValue(
      'providers',
      (prevProviders: AllLLMProviders | undefined) => {
        if (!prevProviders) return prevProviders
        const updatedProviders = { ...prevProviders }

        // Reset default for all models
        Object.keys(updatedProviders).forEach((providerKey) => {
          const provider =
            updatedProviders[providerKey as keyof AllLLMProviders]
          if (provider && provider.models) {
            provider.models = provider.models.map((model) => ({
              ...model,
              default: false,
            }))
          }
        })

        // Set the new default model
        const provider =
          updatedProviders[newDefaultModel.provider as keyof AllLLMProviders]
        if (provider && provider.models) {
          const modelIndex = provider.models.findIndex(
            (model: AnySupportedModel) => model.id === newDefaultModel.id,
          )
          if (modelIndex !== -1) {
            ;(provider.models as any[])[modelIndex] = {
              ...(provider.models as any[])[modelIndex],
              default: true,
            }
          }
        }

        newDefaultModel.default = true
        return updatedProviders
      },
    )
  }

  const updateDefaultModelTemperature = (newTemperature: number) => {
    // Update the llmProviders state
    form.setFieldValue(
      'providers',
      (prevProviders: AllLLMProviders | undefined) => {
        let currdefaultModel
        if (prevProviders) {
          currdefaultModel = findDefaultModel(prevProviders)
        }

        if (!prevProviders || !currdefaultModel) {
          return prevProviders
        }

        const updatedProviders = { ...prevProviders }

        // Update the temperature for the default model
        const provider =
          updatedProviders[currdefaultModel.provider as keyof AllLLMProviders]
        if (provider?.models) {
          const modelIndex = provider.models.findIndex(
            (model: AnySupportedModel) => model.default === true,
          )
          if (modelIndex !== -1) {
            const currentModel = provider.models[modelIndex]
            if (currentModel) {
              provider.models[modelIndex] = {
                ...currentModel,
                temperature: newTemperature,
              }
            }
          }
        }

        // Update the defaultModel state
        return updatedProviders
      },
    )
  }

  // ------------ </TANSTACK QUERIES> ------------

  const form = useForm({
    defaultValues: {
      providers: llmProviders,
    },
    onSubmit: async ({ value }) => {
      const llmProviders = value.providers as AllLLMProviders
      mutation.mutate(
        {
          projectName,
          // queryClient,
          llmProviders,
        },
        {
          onSuccess: (data, variables, context) => {
            queryClient.invalidateQueries({
              queryKey: ['projectLLMProviders', projectName],
            })
            showConfirmationToast({
              title: 'Updated LLM providers',
              message: `Now your project's users can use the supplied LLMs!`,
            })
          },
          onError: (error, variables, context) =>
            showConfirmationToast({
              title: 'Error updating LLM providers',
              message: `Update failed with error: ${error.name} -- ${error.message}`,
              isError: true,
            }),
        },
      )
    },
  })

  // if (isLoadingLLMProviders) {
  //   return (
  //     <div className="flex h-screen items-center justify-center">
  //       <Text>Loading...</Text>
  //     </div>
  //   )
  // }

  // if (isErrorLLMProviders) {
  //   return (
  //     <div className="flex h-screen items-center justify-center">
  //       <Text>
  //         Failed to load API keys. Please try again later.{' '}
  //         {errorLLMProviders?.message}
  //       </Text>
  //     </div>
  //   )
  // }

  return (
    <SettingsLayout
      course_name={projectName}
      sidebarCollapsed={sidebarCollapsed}
      setSidebarCollapsed={setSidebarCollapsed}
    >
      <Head>
        <title>{projectName}/LLMs</title>
        <meta
          name="UIUC.chat"
          content="The AI teaching assistant built for students at UIUC."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="course-page-main min-w-screen flex min-h-screen flex-col items-center">
        <div className="items-left flex w-full flex-col justify-center py-0">
          <Flex direction="column" align="center" w="100%">
            <Card
              withBorder
              padding="none"
              radius="xl"
              className={`mt-[2%] ${cardWidthClasses}`}
              style={{
                // maxWidth: '90%',
                // width: '100%',
                marginTop: '2%',
                backgroundColor: 'var(--background)',
                borderColor: 'var(--dashboard-border)',
              }}
            >
              <Flex className="flex-col md:flex-row">
                <div
                  style={{
                    border: 'None',
                    color: 'text-[--foreground]',
                  }}
                  className="min-h-full flex-[1_1_100%] bg-[--background] md:flex-[1_1_70%]"
                >
                  <Flex
                    gap="md"
                    direction="column"
                    justify="flex-start"
                    align="flex-start"
                    className="lg:ml-4"
                  >
                    <Title
                      order={2}
                      align="left"
                      className={`pl-4 pr-2 pt-4 ${montserrat_heading.variable} font-montserratHeading text-[--foreground]`}
                    >
                      {/* API Keys: Add LLMs to your Chatbot */}
                      Configure LLM Providers for your Chatbot
                    </Title>
                    <Title
                      className={`${montserrat_heading.variable} flex-[1_1_50%] font-montserratHeading text-[--foreground]`}
                      order={5}
                      px={18}
                      ml={'md'}
                      style={{ textAlign: 'left' }}
                    >
                      Configure which LLMs are available to your users. Enable
                      or disable models to balance price and performance.
                    </Title>
                    <Stack align="center" justify="start">
                      <form
                        onSubmit={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          form.handleSubmit()
                        }}
                      >
                        {/* Providers */}
                        <div
                          className="px-8 pb-8"
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 16,
                          }}
                        >
                          <>
                            <Title
                              className={`${montserrat_heading.variable} mt-4 font-montserratHeading text-[--foreground]`}
                              order={3}
                            >
                              Closed source LLMs
                            </Title>
                            <Text
                              className={`pl-1 ${montserrat_paragraph.variable} font-montserratParagraph`}
                              size="md"
                            >
                              The best performers, but you gotta pay their
                              prices and follow their rules.
                            </Text>
                            <Flex
                              direction={{ base: 'column', '75rem': 'row' }}
                              wrap="wrap"
                              justify="flex-start"
                              align="flex-start"
                              className="gap-4"
                              w={'100%'}
                            >
                              {' '}
                              <AnthropicProviderInput
                                provider={
                                  llmProviders?.Anthropic as AnthropicProvider
                                }
                                form={form}
                                isLoading={isLoadingLLMProviders}
                              />
                              <OpenAIProviderInput
                                provider={
                                  llmProviders?.OpenAI as OpenAIProvider
                                }
                                form={form}
                                isLoading={isLoadingLLMProviders}
                              />
                              <AzureProviderInput
                                provider={llmProviders?.Azure as AzureProvider}
                                form={form}
                                isLoading={isLoadingLLMProviders}
                              />
                              <BedrockProviderInput
                                provider={
                                  llmProviders?.Bedrock as BedrockProvider
                                }
                                form={form}
                                isLoading={isLoadingLLMProviders}
                              />
                              <GeminiProviderInput
                                provider={
                                  llmProviders?.Gemini as GeminiProvider
                                }
                                form={form}
                                isLoading={isLoadingLLMProviders}
                              />
                              <SambaNovaProviderInput
                                provider={
                                  llmProviders?.SambaNova as SambaNovaProvider
                                }
                                form={form}
                                isLoading={isLoadingLLMProviders}
                              />
                            </Flex>
                            <Title
                              className={`-mb-3 ${montserrat_heading.variable} mt-4 font-montserratHeading text-[--foreground]`}
                              order={3}
                            >
                              Open source LLMs
                            </Title>
                            <Text
                              className={`pl-1 ${montserrat_paragraph.variable} font-montserratParagraph`}
                              size="md"
                            >
                              Your weights, your rules.
                            </Text>
                            <Flex
                              direction={{ base: 'column', '75rem': 'row' }}
                              wrap="wrap"
                              justify="flex-start"
                              align="flex-start"
                              className="gap-4"
                              w={'100%'}
                            >
                              {' '}
                              <NCSAHostedLLmsProviderInput
                                provider={
                                  llmProviders?.NCSAHosted as NCSAHostedProvider
                                }
                                form={form}
                                isLoading={isLoadingLLMProviders}
                              />
                              <NCSAHostedVLMProviderInput
                                provider={
                                  llmProviders?.NCSAHostedVLM as NCSAHostedVLMProvider
                                }
                                form={form}
                                isLoading={isLoadingLLMProviders}
                              />
                              <OllamaProviderInput
                                provider={
                                  llmProviders?.Ollama as OllamaProvider
                                }
                                form={form}
                                isLoading={isLoadingLLMProviders}
                              />
                              <WebLLMProviderInput
                                provider={
                                  llmProviders?.WebLLM as WebLLMProvider
                                }
                                form={form}
                                isLoading={isLoadingLLMProviders}
                              />
                            </Flex>
                          </>
                        </div>
                      </form>
                    </Stack>
                  </Flex>
                </div>
                <div
                  className="flex flex-[1_1_100%] md:flex-[1_1_30%]"
                  style={{
                    //flex: isSmallScreen ? '1 1 100%' : '1 1 40%',
                    padding: '1rem',
                    backgroundColor: 'var(--dashboard-sidebar-background)',
                    color: 'var(--dashboard-foreground)',
                    borderLeft: isSmallScreen
                      ? ''
                      : '1px solid var(--dashboard-border)',
                  }}
                >
                  <div className="card flex h-full flex-col justify-center">
                    <div className="card-body" style={{ padding: '.5rem' }}>
                      <div className="pb-4">
                        <Title
                          className={`label ${montserrat_heading.variable} font-montserratHeading`}
                          order={3}
                        >
                          Default Model
                        </Title>
                        <br />
                        <Text
                          className={`pl-1 ${montserrat_paragraph.variable} font-montserratParagraph`}
                          size="md"
                        >
                          Choose the default model for your chatbot. Users can
                          still override this default to use any of the models
                          enabled on the left.
                        </Text>
                        <br />
                        <div className="flex justify-center">
                          {llmProviders && (
                            // @ts-ignore - we don't really need this named functionality... gonna skip fixing this.
                            <form.Field name="defaultModel">
                              {(field) => (
                                <NewModelDropdown
                                  value={
                                    findDefaultModel(
                                      llmProviders,
                                    ) as AnySupportedModel
                                  }
                                  onChange={(newDefaultModel) => {
                                    const modelWithProvider = {
                                      ...newDefaultModel,
                                      provider:
                                        (newDefaultModel as any).provider ||
                                        findDefaultModel(llmProviders)
                                          ?.provider,
                                    }
                                    field.setValue(modelWithProvider)
                                    setDefaultModelAndUpdateProviders(
                                      modelWithProvider as AnySupportedModel & {
                                        provider: ProviderNames
                                      },
                                    )
                                    field.setValue(modelWithProvider)
                                    return form.handleSubmit()
                                  }}
                                  llmProviders={llmProviders}
                                  isSmallScreen={isSmallScreen}
                                />
                              )}
                            </form.Field>
                          )}
                        </div>
                        <div className="pt-6"></div>
                        {/* <div>
                          {llmProviders && (
                            // @ts-ignore - we don't really need this named functionality... gonna skip fixing this.
                            <form.Field name="defaultTemperature">
                              {(field) => (
                                <>
                                  <Text
                                    size="sm"
                                    weight={500}
                                    mb={4}
                                    className={`pl-1 ${montserrat_paragraph.variable} font-montserratParagraph`}
                                  >
                                    Default Temperature:{' '}
                                    {
                                      findDefaultModel(llmProviders)
                                        ?.temperature
                                    }
                                  </Text>
                                  <Text
                                    size="xs"
                                    color="dimmed"
                                    mt={4}
                                    className={`pl-1 ${montserrat_paragraph.variable} font-montserratParagraph`}
                                  >
                                    We recommended using 0.1. Higher values
                                    increase randomness or
                                    &apos;creativity&apos;, lower force the
                                    model to stick to its normal behavior.
                                  </Text>
                                  <Slider
                                    value={
                                      findDefaultModel(llmProviders)
                                        ?.temperature
                                    }
                                    onChange={(newTemperature) => {
                                      updateDefaultModelTemperature(
                                        newTemperature,
                                      )
                                      field.handleChange(newTemperature)
                                      form.handleSubmit()
                                    }}
                                    min={0}
                                    max={1}
                                    step={0.1}
                                    precision={1}
                                    marks={[
                                      { value: 0, label: t('Precise') },
                                      { value: 0.5, label: t('Neutral') },
                                      { value: 1, label: t('Creative') },
                                    ]}
                                    showLabelOnHover
                                    color="grape"
                                    className="m-2"
                                    size={isSmallScreen ? 'xs' : 'md'}
                                    classNames={{
                                      markLabel: `mx-2 text-neutral-300 ${montserrat_paragraph.variable} font-montserratParagraph mt-2 ${isSmallScreen ? 'text-xs' : ''}`,
                                    }}
                                  />
                                  <FieldInfo field={field} />
                                </>
                              )}
                            </form.Field>
                          )}
                        </div> */}
                        <div className="pt-2" />
                      </div>
                    </div>
                  </div>
                </div>
              </Flex>
            </Card>

            {/* SECTION: OTHER INFO, TBD */}
            {/* <div
              className="mx-auto mt-[2%] w-[90%] items-start rounded-2xl shadow-md"
              style={{ zIndex: 1, background: '#15162c' }}
            >
              <Flex direction="row" justify="space-between">
                <div className="flex flex-col items-start justify-start">
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
                    <Title
                      order={3}
                      pt={40}
                      // w={}
                      // size={'xl'}
                      className={`pb-3 pt-3 ${montserrat_paragraph.variable} font-montserratParagraph`}
                    >
                      OTHER INFO, TBD
                    </Title>
                  </Title>
                </div>
                <div className=" flex flex-col items-end justify-center">
                  
                </div>
              </Flex>
            </div> */}
          </Flex>
        </div>
        <GlobalFooter />
      </main>
    </SettingsLayout>
  )
}

// This is a BEAUTIFUL component. Should use this more places.
export const showConfirmationToast = ({
  title,
  message,
  isError = false,
  autoClose = 5000, // Optional parameter with default value
}: {
  title: string
  message: string
  isError?: boolean
  autoClose?: number
}) => {
  notifications.show({
    id: 'success-toast',
    withCloseButton: true,
    onClose: () => console.log('unmounted'),
    onOpen: () => console.log('mounted'),
    autoClose: autoClose,
    title: title,
    message: message,
    color: isError ? 'red' : 'green',
    radius: 'lg',
    icon: isError ? <IconAlertCircle /> : <IconCheck />,
    className: 'my-notification-class',
    styles: {
      root: {
        backgroundColor: 'var(--notification)', // Dark background to match the page
        borderColor: isError ? '#E53935' : 'var(--notification-border)', // Red for errors,  for success
        borderWidth: '1px',
        borderStyle: 'solid',
        borderRadius: '8px', // Added rounded corners
      },
      title: {
        color: 'var(--notification-title)', // White text for the title
        fontWeight: 600,
      },
      description: {
        color: 'var(--notification-message)', // Light gray text for the message
      },
      closeButton: {
        color: 'var(--notification-title)', // White color for the close button
        borderRadius: '4px', // Added rounded corners to close button
        '&:hover': {
          backgroundColor: 'rgba(255, 255, 255, 0.1)', // Subtle hover effect
        },
      },
      icon: {
        backgroundColor: 'transparent', // Transparent background for the icon
        color: isError ? '#E53935' : 'var(--notification-title)', // Icon color matches the border
      },
    },
    loading: false,
  })
}
ModelItem.displayName = 'ModelItem'
