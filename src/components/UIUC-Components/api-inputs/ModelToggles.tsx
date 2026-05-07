import React, { useState } from 'react'
import { Button, Group, Modal, Text, Tooltip } from '@mantine/core'
import { IconAlertTriangleFilled } from '@tabler/icons-react'
import { Switch } from '@/components/shadcn/ui/switch'
import { type LLMProvider } from '~/utils/modelProviders/LLMProvider'
import {
  type CountryOfConcern,
  getCountryOfConcern,
  getCountryOfConcernLongMessage,
  getCountryOfConcernShortMessage,
  isChatbotCocAcknowledged,
  markChatbotCocAcknowledged,
} from '~/utils/modelProviders/countriesOfConcern'
import { GetCurrentPageName } from '../CanViewOnlyCourse'

interface PendingFlaggedModel {
  modelId: string
  modelName: string
  country: CountryOfConcern
  field: any
}

export function ModelToggles({
  form,
  provider,
}: {
  form: any
  provider: LLMProvider
}) {
  const providerModels = provider?.provider
    ? form.state.values.providers[provider.provider]?.models || {}
    : {}
  const chatbotId = GetCurrentPageName()

  const [pendingModel, setPendingModel] = useState<PendingFlaggedModel | null>(
    null,
  )

  const closeModal = () => setPendingModel(null)

  const confirmEnable = () => {
    if (!pendingModel) return
    markChatbotCocAcknowledged(chatbotId)
    pendingModel.field.handleChange(true)
    setTimeout(() => form.handleSubmit(), 0)
    setPendingModel(null)
  }

  return (
    <div className="mt-4 flex flex-col gap-2">
      {Object.entries(providerModels).map(
        ([modelId, modelData]: [string, any]) => {
          const realModelId = modelData?.id ?? modelId
          const country = getCountryOfConcern(realModelId)
          const isFlagged = country !== null
          return (
            <form.Field
              key={modelId}
              name={`providers.${provider.provider}.models.${modelId}.enabled`}
            >
              {(field: any) => {
                const handleChange = (checked: boolean) => {
                  if (
                    checked &&
                    isFlagged &&
                    country &&
                    !isChatbotCocAcknowledged(chatbotId)
                  ) {
                    setPendingModel({
                      modelId: realModelId,
                      modelName: modelData.name,
                      country,
                      field,
                    })
                    return
                  }
                  field.handleChange(checked)
                  setTimeout(() => form.handleSubmit(), 0)
                }

                return (
                  <div className="flex items-center gap-2">
                    <Switch
                      variant="labeled"
                      showLabels
                      showThumbIcon
                      size="sm"
                      label={modelData.name}
                      checked={field.state.value}
                      onCheckedChange={handleChange}
                    />
                    {isFlagged && country && (
                      <Tooltip
                        multiline
                        width={280}
                        withArrow
                        label={getCountryOfConcernShortMessage(country)}
                      >
                        <span
                          aria-label={`Country of concern warning: ${country}`}
                          className="inline-flex"
                        >
                          <IconAlertTriangleFilled
                            size="1rem"
                            className="text-yellow-500"
                            aria-hidden="true"
                          />
                        </span>
                      </Tooltip>
                    )}
                  </div>
                )
              }}
            </form.Field>
          )
        },
      )}

      <Modal
        opened={pendingModel !== null}
        onClose={closeModal}
        title="Country of Concern Warning"
        centered
        zIndex={1000}
      >
        {pendingModel && (
          <>
            <Group spacing="sm" align="flex-start" noWrap>
              <IconAlertTriangleFilled
                size="1.5rem"
                className="mt-1 shrink-0 text-yellow-500"
                aria-hidden="true"
              />
              <Text size="sm">
                {getCountryOfConcernLongMessage(
                  pendingModel.modelName,
                  pendingModel.country,
                )}
              </Text>
            </Group>
            <Group position="right" mt="lg" spacing="sm">
              <Button variant="default" onClick={closeModal}>
                Cancel
              </Button>
              <Button color="yellow" onClick={confirmEnable}>
                Enable anyway
              </Button>
            </Group>
          </>
        )}
      </Modal>
    </div>
  )
}
