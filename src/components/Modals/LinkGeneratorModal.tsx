import React, { useEffect, useState } from 'react'
import {
  Modal,
  Text,
  Flex,
  Divider,
  TextInput,
  Group,
  Button,
  CopyButton,
  Paper,
} from '@mantine/core'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import { IconCheck, IconCopy } from '@tabler/icons-react'
import CustomSwitch from '~/components/Switches/CustomSwitch'
import { useTranslation } from 'next-i18next'

interface LinkGeneratorModalProps {
  opened: boolean
  onClose: () => void
  course_name: string
  currentSettings: {
    guidedLearning: boolean
    documentsOnly: boolean
    systemPromptOnly: boolean
  }
}

export const LinkGeneratorModal = ({
  opened,
  onClose,
  course_name,
  currentSettings,
}: LinkGeneratorModalProps) => {
  const { t } = useTranslation('common')
  const [linkSettings, setLinkSettings] = useState({
    guidedLearning: false,
    documentsOnly: false,
    systemPromptOnly: false,
  })
  const [generatedLink, setGeneratedLink] = useState('')

  // Reset link settings when modal is opened
  useEffect(() => {
    if (opened) {
      setLinkSettings({
        guidedLearning: false,
        documentsOnly: false,
        systemPromptOnly: false,
      })
    }
  }, [opened])

  const handleSettingChange =
    (setting: keyof typeof linkSettings) => (value: boolean) => {
      setLinkSettings((prev) => ({
        ...prev,
        [setting]: value,
      }))
    }

  useEffect(() => {
    const baseUrl = window.location.origin
    const queryParams = new URLSearchParams()

    Object.entries(linkSettings).forEach(([key, value]) => {
      if (value) {
        const paramName = key as keyof typeof linkSettings
        queryParams.append(paramName, 'true')
      }
    })

    const queryString = queryParams.toString()
    const chatUrl = `${baseUrl}/${course_name}/chat${queryString ? `?${queryString}` : ''}`
    setGeneratedLink(chatUrl)
  }, [linkSettings, course_name])

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Text
          className={`${montserrat_heading.variable} font-montserratHeading`}
          size="lg"
          weight={700}
        >
          {t('prompt.generate_shareable_link')}
        </Text>
      }
      centered
      radius="md"
      size="lg"
      styles={{
        header: {
          color: 'var(--modal-text)',
          backgroundColor: 'var(--modal)',
          borderBottom: '1px solid #2D2F48',
          padding: '20px 24px',
          marginBottom: '16px',
        },
        content: {
          color: 'var(--modal-text)',
          backgroundColor: 'var(--modal)',
          border: '1px solid var(--modal-border)',
        },
        body: {
          padding: '0 24px 24px 24px',
        },
        title: {
          marginBottom: '0',
        },
        close: {
          color: 'var(--foreground-faded)',
          marginTop: '4px',
        },
      }}
    >
      <Flex direction="column" gap="xl">
        <Text
          className={`${montserrat_paragraph.variable} font-montserratParagraph`}
          size="sm"
          style={{ lineHeight: 1.5 }}
        >
          {t('prompt.link_settings_intro')}
        </Text>

        <Flex direction="column" gap="md">
          <CustomSwitch
            label={t('prompt.guided_learning') as unknown as string}
            tooltip={
              currentSettings.guidedLearning
                ? (t('prompt.guided_learning_locked_tooltip') as unknown as string)
                : (t('prompt.guided_learning_link_tooltip') as unknown as string)
            }
            checked={linkSettings.guidedLearning}
            onChange={(checked) =>
              handleSettingChange('guidedLearning')(checked)
            }
          />

          <CustomSwitch
            label={t('prompt.document_only') as unknown as string}
            tooltip={
              currentSettings.documentsOnly
                ? (t('prompt.document_only_locked_tooltip') as unknown as string)
                : (t('prompt.document_only_link_tooltip') as unknown as string)
            }
            checked={linkSettings.documentsOnly}
            onChange={(checked) =>
              handleSettingChange('documentsOnly')(checked)
            }
          />

          <CustomSwitch
            label={t('prompt.bypass_internal_prompting') as unknown as string}
            tooltip={
              currentSettings.systemPromptOnly
                ? (t('prompt.bypass_internal_prompting_locked_tooltip') as unknown as string)
                : (t('prompt.bypass_internal_prompting_link_tooltip') as unknown as string)
            }
            checked={linkSettings.systemPromptOnly}
            onChange={(checked) =>
              handleSettingChange('systemPromptOnly')(checked)
            }
          />
        </Flex>

        <Flex direction="column" gap="md">
          <Text
            size="sm"
            weight={600}
            className={`${montserrat_paragraph.variable} font-montserratParagraph`}
          >
            {t('prompt.generated_link')}
          </Text>

          <Paper
            p="md"
            radius="md"
            style={{
              backgroundColor: 'var(--background-faded)',
              border: '1px solid var(--background-dark)',
              wordBreak: 'break-all',
            }}
          >
            <Text
              size="sm"
              className={`${montserrat_paragraph.variable} font-montserratParagraph text-[--modal-text]`}
              style={{
                lineHeight: 1.5,
              }}
            >
              {generatedLink}
            </Text>
          </Paper>

          <Group position="right">
            <CopyButton value={generatedLink}>
              {({ copied, copy }) => (
                <Button
                  variant="filled"
                  radius="md"
                  onClick={copy}
                  className={`${montserrat_paragraph.variable} font-montserratParagraph`}
                  leftIcon={
                    copied ? <IconCheck size={16} /> : <IconCopy size={16} />
                  }
                  sx={(theme) => ({
                    background: copied
                      ? 'var(--dashboard-button-hover) !important'
                      : 'var(--dashboard-button) !important',
                    border: 'none',
                    color: '#fff',
                    padding: '10px 20px',
                    fontWeight: 600,
                    minWidth: '140px',
                    transition: 'all 0.2s ease',
                    '& .mantine-Button-leftIcon': {
                      marginRight: '8px',
                      width: '16px',
                    },
                    '& .mantine-Button-inner': {
                      justifyContent: 'flex-start',
                    },
                    '&:hover': {
                      background: copied
                        ? 'var(--dashboard-button-hover) !important'
                        : 'var(--dashboard-button-hover) !important',
                    },
                  })}
                >
                  {copied
                    ? (t('common.copied') as unknown as string)
                    : (t('common.copy_link') as unknown as string)}
                </Button>
              )}
            </CopyButton>
          </Group>
        </Flex>
      </Flex>
    </Modal>
  )
}
