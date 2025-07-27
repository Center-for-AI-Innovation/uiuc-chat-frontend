import React, { useEffect, useState } from 'react';
import {
  Modal,
  Text,
  Flex,
  Divider,
  Group,
  Button,
  CopyButton,
  Paper,
  Select,
} from '@mantine/core';
import { montserrat_heading, montserrat_paragraph } from 'fonts';
import { IconCheck, IconCopy, IconChevronDown } from '@tabler/icons-react';
import CustomSwitch from '~/components/Switches/CustomSwitch';
import { type CustomSystemPrompt } from '~/types/courseMetadata';

interface LinkGeneratorModalProps {
  opened: boolean;
  onClose: () => void;
  course_name: string;
  currentSettings: {
    guidedLearning: boolean;
    documentsOnly: boolean;
    systemPromptOnly: boolean;
  };
  customSystemPrompts?: CustomSystemPrompt[];
  initialActivePrompt?: string;
}

export const LinkGeneratorModal = ({
  opened,
  onClose,
  course_name,
  currentSettings,
  customSystemPrompts = [],
  initialActivePrompt,
}: LinkGeneratorModalProps) => {
  const [linkSettings, setLinkSettings] = useState({
    guidedLearning: false,
    documentsOnly: false,
    systemPromptOnly: false,
  });
  const [selectedActivePrompt, setSelectedActivePrompt] = useState<string>('');
  const [generatedLink, setGeneratedLink] = useState('');

  // Reset link settings when modal is opened
  useEffect(() => {
    if (opened) {
      setLinkSettings({
        guidedLearning: false,
        documentsOnly: false,
        systemPromptOnly: false,
      });
      setSelectedActivePrompt(initialActivePrompt || '');
    }
  }, [opened, initialActivePrompt]);

  const handleSettingChange = (setting: keyof typeof linkSettings) => (value: boolean) => {
    setLinkSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  useEffect(() => {
    const baseUrl = window.location.origin;
    const queryParams = new URLSearchParams();

    if (selectedActivePrompt) {
      queryParams.append('activePrompt', selectedActivePrompt);
    }

    Object.entries(linkSettings).forEach(([key, value]) => {
      if (value) {
        const paramName = key as keyof typeof linkSettings;
        queryParams.append(paramName, 'true');
      }
    });

    const queryString = queryParams.toString();
    const chatUrl = `${baseUrl}/${course_name}/chat${queryString ? `?${queryString}` : ''}`;
    setGeneratedLink(chatUrl);
  }, [linkSettings, course_name, selectedActivePrompt]);

  const customPromptOptions = [
    { value: '', label: 'Use Course Default System Prompt' },
    ...(customSystemPrompts || []).map(prompt => ({
      value: prompt.urlSuffix,
      label: prompt.name || prompt.urlSuffix,
    })),
  ];

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Text
          className={`${montserrat_heading.variable} font-montserratHeading`}
          size="lg"
          weight={700}
          gradient={{ from: 'gold', to: 'white', deg: 45 }}
          variant="gradient"
        >
          Generate Shareable Link
        </Text>
      }
      centered
      radius="md"
      size="lg"
      styles={{
        header: {
          backgroundColor: '#15162c',
          borderBottom: '1px solid #2D2F48',
          padding: '20px 24px',
          marginBottom: '16px'
        },
        content: {
          backgroundColor: '#15162c',
          border: '1px solid #2D2F48',
        },
        body: {
          padding: '0 24px 24px 24px',
        },
        title: {
          marginBottom: '0',
        },
        close: {
          marginTop: '4px'
        }
      }}
    >
      <Flex direction="column" gap="xl">
        <Text
          className={`${montserrat_paragraph.variable} font-montserratParagraph`}
          size="sm"
          style={{ color: '#D1D1D1', lineHeight: 1.5 }}
        >
          Configure AI behavior settings for your shareable link. These settings will enable specific behaviors when users access the chat through this link. Note: If a setting is enabled course-wide, enabling it here will ensure it stays active even if course-wide settings change in the future.
        </Text>

        <Divider style={{ borderColor: 'rgba(255,255,255,0.1)' }} />
        
        <Select
          labelProps={{ style: { color: 'white', marginBottom: '4px' } }}
          label="System Prompt for Link"
          placeholder="Choose a system prompt"
          data={customPromptOptions}
          value={selectedActivePrompt}
          onChange={(value) => setSelectedActivePrompt(value ?? '')}
          className={`${montserrat_paragraph.variable} font-montserratParagraph`}
          rightSection={<IconChevronDown size="1rem" />}
          withinPortal
          styles={(theme) => ({
            input: {
              backgroundColor: theme.colors.dark[6],
              borderColor: theme.colors.dark[4],
              color: theme.white,
              transition: 'border-color 0.2s ease',
              '&::placeholder': {
                color: theme.colors.dark[2],
              },
              '&:focus, &:focus-within': {
                borderColor: theme.colors.violet[4],
              },
            },
            dropdown: {
              backgroundColor: theme.colors.dark[6],
              borderColor: theme.colors.dark[4],
              maxHeight: '250px',
              overflowY: 'auto',
            },
            item: {
              backgroundColor: theme.colors.dark[6],
              color: theme.white,
              borderRadius: theme.radius.sm,
              padding: '8px 12px',
              margin: '2px 4px',
              transition: 'background-color 50ms ease-out',

              '&:not([data-selected])[data-hovered]': {
                backgroundColor: theme.colors.violet[5],
              },

              '&[data-selected]': {
                backgroundColor: theme.colors.violet[6],
                color: theme.white,
              },

              '&[data-selected][data-hovered]': {
                backgroundColor: theme.colors.violet[6],
              }
            },
            rightSection: {
              color: theme.colors.gray[5],
            },
          })}
        />

        <Flex direction="column" gap="md">
          <CustomSwitch
            label="Guided Learning"
            tooltip={
              currentSettings.guidedLearning 
                ? "This setting is currently enabled course-wide. Enabling it here will ensure it stays active even if course settings change."
                : "Enable guided learning mode for this link. The AI will encourage independent problem-solving by providing hints and questions instead of direct answers."
            }
            checked={linkSettings.guidedLearning}
            onChange={(checked) => handleSettingChange('guidedLearning')(checked)}
          />

          <CustomSwitch
            label="Document-Based References Only"
            tooltip={
              currentSettings.documentsOnly 
                ? "This setting is currently enabled course-wide. Enabling it here will ensure it stays active even if course settings change."
                : "Restrict AI to only use information from provided documents. The AI will not use external knowledge or make assumptions beyond the documents' content."
            }
            checked={linkSettings.documentsOnly}
            onChange={(checked) => handleSettingChange('documentsOnly')(checked)}
          />

          <CustomSwitch
            label="Bypass UIUC.chat's internal prompting"
            tooltip={
              currentSettings.systemPromptOnly 
                ? "This setting is currently enabled course-wide. Enabling it here will ensure it stays active even if course settings change."
                : "Use raw system prompt without additional internal prompting. This bypasses UIUC.chat's built-in prompts for citations and helpfulness."
            }
            checked={linkSettings.systemPromptOnly}
            onChange={(checked) => handleSettingChange('systemPromptOnly')(checked)}
          />
        </Flex>

        <Divider style={{ borderColor: 'rgba(255,255,255,0.1)' }} />

        <Flex direction="column" gap="md">
          <Text
            size="sm"
            weight={600}
            className={`${montserrat_paragraph.variable} font-montserratParagraph`}
            style={{ color: '#D1D1D1' }}
          >
            Generated Link
          </Text>
          
          <Paper
            p="md"
            radius="md"
            style={{
              backgroundColor: '#1A1B1E',
              border: '1px solid #2D2F48',
              wordBreak: 'break-all',
            }}
          >
            <Text
              size="sm"
              className={`${montserrat_paragraph.variable} font-montserratParagraph`}
              style={{
                color: '#D1D1D1',
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
                  leftIcon={copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                  sx={(theme) => ({
                    background: copied 
                      ? 'linear-gradient(90deg, #15803d 0%, #059669 50%, #0d9488 100%) !important'
                      : 'linear-gradient(90deg, #6d28d9 0%, #4f46e5 50%, #2563eb 100%) !important',
                    border: 'none',
                    color: '#fff',
                    padding: '10px 20px',
                    fontWeight: 600,
                    minWidth: '140px',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
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
                        ? 'linear-gradient(90deg, #059669 0%, #0d9488 50%, #15803d 100%) !important'
                        : 'linear-gradient(90deg, #4f46e5 0%, #2563eb 50%, #6d28d9 100%) !important',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
                    },
                    '&:active': {
                      transform: 'translateY(0)',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                    },
                  })}
                >
                  {copied ? 'Copied!' : 'Copy Link'}
                </Button>
              )}
            </CopyButton>
          </Group>
        </Flex>
      </Flex>
    </Modal>
  );
}; 