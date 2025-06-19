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
  MultiSelect,
  type MantineTheme,
} from '@mantine/core';
import { type NextFont } from 'next/dist/compiled/@next/font';
import { useFetchEnabledDocGroups } from '~/hooks/docGroupsQueries';
import { useRouter } from 'next/router';
import { IconChevronDown } from '@tabler/icons-react';
import { useFetchAllWorkflows } from '~/utils/functionCalling/handleFunctionCalling';
import { type UIUCTool } from '~/types/chat';

// Define the shape of the custom GPT form data
interface CustomGPTFormState {
  name: string;
  urlSuffix: string;
  promptText: string;
  documentGroups: string[];
  tools: string[];
  id: string;
  description: string;
}

interface CustomGPTModalProps {
  opened: boolean;
  onClose: () => void;
  editingCustomPromptId: string | null;
  customPromptForm: CustomGPTFormState;
  handleCustomPromptFormChange: (
    field: keyof CustomGPTFormState,
    value: string | string[],
  ) => void;
  handleSaveCustomPrompt: () => Promise<void>;
  theme: MantineTheme;
  montserrat_heading: NextFont;
  montserrat_paragraph: NextFont;
}

const CustomGPTModal: React.FC<CustomGPTModalProps> = ({
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
  const router = useRouter();
  const course_name = router.query.course_name as string;
  
  const { data: documentGroups } = useFetchEnabledDocGroups(course_name);
  const { data: tools } = useFetchAllWorkflows(course_name);

  const documentGroupOptions = documentGroups?.map(group => ({
    value: group.name,
    label: group.name,
  })) || [];

  const toolOptions = tools?.map((tool: UIUCTool) => ({
    value: tool.id,
    label: tool.readableName,
  })) || [];

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
            ? 'Edit Custom GPTs'
            : 'Add New Custom GPTs'}
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
        <TextInput
          label="Name"
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
          label="Description"
          placeholder="Enter a description for your custom GPT..."
          value={customPromptForm.description}
          onChange={(event) =>
            handleCustomPromptFormChange('description', event.currentTarget.value)
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
        <MultiSelect
          label="Document Groups"
          placeholder="Select document groups..."
          data={documentGroups?.map(group => group.name) || []}
          value={customPromptForm.documentGroups}
          onChange={(value) => handleCustomPromptFormChange('documentGroups', value)}
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
        <MultiSelect
          label="Tools"
          placeholder="Select tools (optional)"
          value={customPromptForm.tools || []}
          onChange={(value) => handleCustomPromptFormChange('tools', value)}
          data={toolOptions}
          className={`${montserrat_paragraph.className} font-montserratParagraph`}
          withinPortal
          searchable
          clearable
          styles={{ 
            label: { color: 'white', marginBottom: '4px' },
            input: {
              '&:focus': {
                borderColor: theme.colors.violet[6],
                boxShadow: `0 0 3px 1px ${theme.colors.violet[4]}`,
              },
            },
            rightSection: {
              pointerEvents: 'none',
              color: theme.colors.gray[5],
              width: '30px',
              '@media (maxWidth: 480px)': {
                width: '24px',
              },
            },
            dropdown: {
              backgroundColor: '#1d1f33',
              border: '1px solid rgba(42,42,120,1)',
              borderRadius: theme.radius.md,
              marginTop: '2px',
              boxShadow: theme.shadows.xs,
            },
            item: {
              backgroundColor: '#1d1f33',
              borderRadius: theme.radius.md,
              margin: '2px',
              '&[data-selected]': {
                backgroundColor: 'transparent',
                '&:hover': {
                  backgroundColor: 'rgb(107, 33, 168)',
                  color: theme.white,
                },
              },
              '&[data-hovered]': {
                backgroundColor: 'rgb(107, 33, 168)',
                color: theme.white,
              },
              fontFamily: `var(--font-montserratParagraph), ${theme.fontFamily}`,
              cursor: 'pointer',
              whiteSpace: 'normal',
              lineHeight: 1.2,
              fontSize: '0.9rem',
              padding: '8px 12px',
            },
          }}
          rightSection={
            <IconChevronDown
              size={14}
              style={{ marginRight: '8px' }}
            />
          }
        />
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
            onClick={onClose}
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
            {editingCustomPromptId ? 'Save Changes' : 'Add GPT'}
          </Button>
        </Group>
      </Flex>
    </Modal>
  );
};

export default CustomGPTModal; 