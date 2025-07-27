// src/components/Modals/CustomPromptModal.tsx
import React from 'react';
import {
  Modal,
  Text,
  Textarea,
  TextInput,
  Flex,
  Group,
  Button,
  type MantineTheme,
} from '@mantine/core';
import { type NextFont } from 'next/dist/compiled/@next/font';

// Define the shape of the custom prompt form data
interface CustomPromptFormState {
  name: string;
  urlSuffix: string;
  promptText: string;
}

interface CustomPromptModalProps {
  opened: boolean;
  onClose: () => void;
  editingCustomPromptId: string | null;
  customPromptForm: CustomPromptFormState;
  handleCustomPromptFormChange: (
    field: keyof CustomPromptFormState,
    value: string,
  ) => void;
  handleSaveCustomPrompt: () => Promise<void>;
  theme: MantineTheme;
  montserrat_heading: NextFont;
  montserrat_paragraph: NextFont;
}

const CustomPromptModal: React.FC<CustomPromptModalProps> = ({
  opened,
  onClose,
  editingCustomPromptId,
  customPromptForm,
  handleCustomPromptFormChange,
  handleSaveCustomPrompt,
  theme,
  montserrat_heading,
  montserrat_paragraph,
}) => {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Text
          className={`${montserrat_heading.className} font-montserratHeading`}
          size="lg"
          weight={700}
          variant="gradient"
          gradient={{ from: 'gold', to: 'white', deg: 45 }}
        >
          {editingCustomPromptId
            ? 'Edit Custom System Prompt'
            : 'Add New Custom System Prompt'}
        </Text>
      }
      centered
      size="lg"
      radius="lg"
      styles={{
        title: { marginBottom: '0' },
        header: {
          backgroundColor: '#15162c',
          borderBottom: '1px solid #2D2F48',
          padding: '20px 24px',
        },
        content: {
          backgroundColor: '#15162c',
          border: '1px solid #2D2F48',
        },
        body: {
          padding: '24px',
          marginTop: '2%',
          paddingTop: '4%',
        },
        close: {
          color: '#D1D1D1',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          },
        },
      }}
    >
      <Flex direction="column" gap="md">
        <Textarea
          label="Prompt Name"
          placeholder="E.g., Friendly Tutor, Code Explainer"
          value={customPromptForm.name}
          onChange={(event) =>
            handleCustomPromptFormChange('name', event.currentTarget.value)
          }
          required
          className={`${montserrat_paragraph.className} font-montserratParagraph`}
          styles={{ 
            label: { color: 'white', marginBottom: '4px' },
            input: {
              '&:focus': {
                borderColor: theme.colors.violet[6],
                boxShadow: `0 0 3px 1px ${theme.colors.violet[4]}`,
              },
            },
          }}
        />
        <TextInput
          label="Link Identifier"
          placeholder="E.g., friendly-tutor (letters, numbers, -, _ only)"
          value={customPromptForm.urlSuffix}
          onChange={(event) =>
            handleCustomPromptFormChange(
              'urlSuffix',
              event.currentTarget.value,
            )
          }
          required
          maxLength={50}
          className={`${montserrat_paragraph.className} font-montserratParagraph`}
          styles={{ 
            label: { color: 'white', marginBottom: '4px' },
            input: {
              '&:focus': {
                borderColor: theme.colors.violet[6],
                boxShadow: `0 0 3px 1px ${theme.colors.violet[4]}`,
              },
            },
          }}
        />
        <Text
          size="xs"
          align="right"
          color={customPromptForm.urlSuffix.length > 45 ? 'red' : 'dimmed'}
          className={`${montserrat_paragraph.className} font-montserratParagraph`}
          mt={-10}
          mb={10}
        >
          {customPromptForm.urlSuffix.length} / 50
        </Text>
        <Textarea
          label="System Prompt Text"
          placeholder="Enter the custom system prompt here..."
          value={customPromptForm.promptText}
          onChange={(event) =>
            handleCustomPromptFormChange(
              'promptText',
              event.currentTarget.value,
            )
          }
          autosize
          minRows={5}
          maxRows={15}
          required
          className={`${montserrat_paragraph.className} font-montserratParagraph`}
          styles={{ 
            label: { color: 'white', marginBottom: '4px' },
            input: {
              '&:focus': {
                borderColor: theme.colors.violet[6],
                boxShadow: `0 0 3px 1px ${theme.colors.violet[4]}`,
              },
            },
          }}
        />
        <Group position="right" mt="md">
          <Button
            variant="outline"
            onClick={onClose} // Use onClose directly from props
            className={`${montserrat_paragraph.className} font-montserratParagraph`}
            styles={(themeParam) => ({
              root: {
                borderColor: themeParam.colors.gray[6],
                color: '#fff',
                '&:hover': {
                  backgroundColor: themeParam.colors.gray[8],
                },
              },
            })}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveCustomPrompt}
            variant="filled"
            radius="md"
            className={`${montserrat_paragraph.className} font-montserratParagraph`}
            sx={(themeParam) => ({
              background: `linear-gradient(to right, ${themeParam.colors.purple?.[7] || '#862e9c'}, ${themeParam.colors.pink?.[6] || '#e64980'}) !important`,
              border: 'none',
              color: themeParam.white,
              padding: '10px 20px',
              fontWeight: 600,
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
              transition: 'all 0.2s ease',
              '&:hover': {
                background: `linear-gradient(to right, ${themeParam.colors.pink?.[6] || '#e64980'}, ${themeParam.colors.purple?.[7] || '#862e9c'}) !important`,
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
              },
              '&:active': {
                transform: 'translateY(0)',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
              },
            })}
          >
            {editingCustomPromptId ? 'Save Changes' : 'Add Prompt'}
          </Button>
        </Group>
      </Flex>
    </Modal>
  );
};

export default CustomPromptModal; 