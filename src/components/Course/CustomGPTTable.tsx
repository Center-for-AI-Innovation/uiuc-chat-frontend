import React, { useState, useMemo } from 'react';
import {
  Card,
  Flex,
  Title,
  Button,
  Text,
  Paper,
  Tooltip,
  Group,
  UnstyledButton,
  Center,
  ActionIcon,
  Switch,
  type MantineTheme,
} from '@mantine/core';
import {
  IconPlus,
  IconPencil,
  IconCopy,
  IconTrash,
  IconInfoCircle,
  IconChevronUp,
  IconChevronDown,
  IconSelector,
  IconPin,
  IconPinFilled,
  IconLink,
} from '@tabler/icons-react';
import { type CustomSystemPrompt } from '~/types/courseMetadata';
import { showNotification } from '@mantine/notifications';

interface CustomPromptsTableProps {
  customSystemPrompts: CustomSystemPrompt[];
  theme: MantineTheme;
  montserrat_heading: { className: string; variable?: string };
  montserrat_paragraph: { className: string; variable?: string };
  onOpenAddEditModal: (prompt?: CustomSystemPrompt) => void;
  onDeletePrompt: (prompt: CustomSystemPrompt) => void;
  onTogglePinned: (promptId: string, isPinned: boolean) => void;
  onToggleEnabled?: (promptId: string, isEnabled: boolean) => void;
  onOpenLinkGeneratorModal: (urlSuffix: string) => void;
  onCopyToClipboard: (text: string, type: 'url' | 'prompt') => void;
}

type SortableColumn = 'name' | 'urlSuffix' | 'promptText' | 'documentGroups' | 'tools' | 'description';
type SortDirection = 'asc' | 'desc';

interface ThProps {
  children: React.ReactNode;
  reversed: boolean;
  sorted: boolean;
  onSort(): void;
  className?: string;
  scope?: string;
  width?: string;
}

function Th({ children, reversed, sorted, onSort, className, scope, width }: ThProps) {
  const Icon = sorted ? (reversed ? IconChevronUp : IconChevronDown) : IconSelector;
  return (
    <th scope={scope} className={className} style={{ width }}>
      <UnstyledButton onClick={onSort} className="w-full">
        <Group position="apart" noWrap spacing="xs">
          <Text fw={500} fz="xs" tt="uppercase" c="dimmed">
            {children}
          </Text>
          <Center>
            <Icon size="0.9rem" stroke={1.5} />
          </Center>
        </Group>
      </UnstyledButton>
    </th>
  );
}

const CustomPromptsTable: React.FC<CustomPromptsTableProps> = ({
  customSystemPrompts,
  theme,
  montserrat_heading,
  montserrat_paragraph,
  onOpenAddEditModal,
  onDeletePrompt,
  onTogglePinned,
  onToggleEnabled,
  onOpenLinkGeneratorModal,
  onCopyToClipboard,
}) => {
  const [sortColumn, setSortColumn] = useState<SortableColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (column: SortableColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleToggleEnabled = onToggleEnabled || (() => {});

  const sortedPrompts = useMemo(() => {
    if (!sortColumn) {
      return [...customSystemPrompts].sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return 0;
      });
    }

    return [...customSystemPrompts].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      
      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      }
      // Add more type handling if necessary

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [customSystemPrompts, sortColumn, sortDirection]);

  return (
    <Card
      shadow="xs"
      padding="none"
      radius="xl"
      className="mt-6 w-[96%] md:w-[90%] 2xl:w-[90%]"
    >
      <div className="min-h-full rounded-xl overflow-hidden bg-gradient-to-r from-purple-900 via-indigo-800 to-blue-800">
        <div className="w-full border-b border-white/10 bg-black/20 px-4 py-3 sm:px-6 sm:py-4 md:px-8">
          <Flex justify="space-between" align="center">
            <Group spacing="xs" align="center">
              <Title
                order={3}
                className={`${montserrat_heading.className} text-white/90 text-lg sm:text-2xl`}
              >
                Custom GPTs
              </Title>
              <Tooltip
                label="Custom GPTs allow you to create alternative behaviors for your course's AI assistant. These can be shared via links generated with the 'Generate Share Link' button, where recipients will interact with the AI using your custom GPT instead of the default one."
                multiline
                withArrow
                arrowSize={10}
                offset={10}
                position="top"
                withinPortal={true}
                className={`${montserrat_paragraph.className}`}
                styles={(theme) => ({
                  tooltip: {
                    backgroundColor: theme.colors.dark[7],
                    color: theme.white,
                    fontSize: '0.875rem',
                    padding: '0.5rem 0.75rem',
                    fontFamily: montserrat_paragraph.variable
                      ? `var(${montserrat_paragraph.variable})`
                      : montserrat_paragraph.className || 'sans-serif',
                    maxWidth: '300px',
                  },
                  arrow: {
                    backgroundColor: theme.colors.dark[7],
                  },
                })}
              >
                <IconInfoCircle
                  size={18}
                  className="text-white/60 transition-colors duration-200 hover:text-white/80"
                  style={{ display: 'block', cursor: 'pointer' }}
                />
              </Tooltip>
            </Group>
            <Button
              leftIcon={<IconPlus size={18} />}
              onClick={() => onOpenAddEditModal()}
              variant="filled"
              radius="md"
              className={`${montserrat_paragraph.className}`}
              sx={(theme) => ({
                background: `linear-gradient(to right, ${theme.colors.violet?.[7] || '#7950f2'}, ${theme.colors.indigo?.[6] || '#4c6ef5'}) !important`,
                border: 'none',
                color: theme.white,
                padding: '10px 20px',
                fontWeight: 600,
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  background: `linear-gradient(to right, ${theme.colors.indigo?.[6] || '#4c6ef5'}, ${theme.colors.violet?.[7] || '#7950f2'}) !important`,
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
                },
                '&:active': {
                  transform: 'translateY(0)',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                },
              })}
            >
              Add New Custom GPT
            </Button>
          </Flex>
        </div>

        <div className="bg-[#1e1f3a]/80 p-4 sm:p-6 md:p-8">
          {customSystemPrompts.length === 0 ? (
            <Text 
              color="dimmed" 
              align="center" 
              py="md" 
              className={`${montserrat_paragraph.className}`}
              style={{ }}
            >
              No Custom GPTs added yet. Click &quot;Add New Custom GPT&quot; to
              create one.
            </Text>
          ) : (
            <Paper
              withBorder
              radius="md"
              style={{
                borderColor: 'rgba(147, 51, 234, 0.3)',
                overflowX: 'auto',
                backgroundColor: '#1A1B34'
              }}
            >
              <table
                className="min-w-full divide-y divide-gray-700"
                style={{ tableLayout: 'fixed' }}
              >
                <thead style={{ backgroundColor: '#15162c' }}>
                  <tr>
                    <th
                      scope="col"
                      className="w-12 px-2 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-400 sm:px-3"
                      style={{ width: '3rem' }}
                    >
                      Pin
                    </th>
                    <th
                      scope="col"
                      className="w-16 px-2 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-400 sm:px-3"
                      style={{ width: '4rem' }}
                    >
                      Enabled
                    </th>
                    <Th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400 sm:px-6"
                      width="20%"
                      sorted={sortColumn === 'name'}
                      reversed={sortDirection === 'desc'}
                      onSort={() => handleSort('name')}
                    >
                      Name
                    </Th>
                    <Th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400 sm:px-6"
                      sorted={sortColumn === 'description'}
                      reversed={sortDirection === 'desc'}
                      onSort={() => handleSort('description')}
                    >
                      Description
                    </Th>
                    <Th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400 sm:px-6"
                      sorted={sortColumn === 'promptText'}
                      reversed={sortDirection === 'desc'}
                      onSort={() => handleSort('promptText')}
                    >
                      Prompt Preview
                    </Th>
                    <Th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400 sm:px-6"
                      sorted={sortColumn === 'documentGroups'}
                      reversed={sortDirection === 'desc'}
                      onSort={() => handleSort('documentGroups')}
                    >
                      Document Group
                    </Th>
                    <Th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400 sm:px-6"
                      sorted={sortColumn === 'tools'}
                      reversed={sortDirection === 'desc'}
                      onSort={() => handleSort('tools')}
                    >
                      Tool
                    </Th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400 sm:px-6"
                      style={{ minWidth: '120px' }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {sortedPrompts.map((prompt) => (
                    <tr key={prompt.id}>
                      <td className="px-2 py-4 text-center sm:px-3">
                        <Tooltip label={prompt.isPinned ? 'Unpin' : 'Pin'} className={`${montserrat_paragraph.className}`}>
                          <ActionIcon
                            variant="subtle"
                            onClick={() => onTogglePinned(prompt.id, !prompt.isPinned)}
                            size="sm"
                          >
                            {prompt.isPinned ? (
                              <IconPinFilled size={18} className="text-blue-400" />
                            ) : (
                              <IconPin size={18} className="text-gray-500 hover:text-blue-400" />
                            )}
                          </ActionIcon>
                        </Tooltip>
                      </td>
                      <td className="px-2 py-4 text-center sm:px-3">
                        <Tooltip 
                          label={prompt.isEnabled !== false ? 'Disable this Custom GPT' : 'Enable this Custom GPT'} 
                          className={`${montserrat_paragraph.className}`}
                        >
                          <Switch
                            checked={prompt.isEnabled !== false}
                            onChange={(event) => handleToggleEnabled(prompt.id, event.currentTarget.checked)}
                            size="sm"
                            color="violet"
                            styles={{
                              track: {
                                backgroundColor: prompt.isEnabled !== false ? theme.colors.violet[6] : theme.colors.gray[6],
                                '&:hover': {
                                  backgroundColor: prompt.isEnabled !== false ? theme.colors.violet[7] : theme.colors.gray[5],
                                },
                              },
                            }}
                          />
                        </Tooltip>
                      </td>
                      <td className={`truncate max-w-0 px-4 py-4 text-sm font-medium text-white sm:px-6 ${montserrat_paragraph.className}`}>
                        {prompt.name}
                      </td>
                      <td className={`truncate max-w-0 px-4 py-4 text-sm text-gray-400 sm:px-6 ${montserrat_paragraph.className}`}>
                        {prompt.description || '-'}
                      </td>
                      <td className={`truncate max-w-0 px-4 py-4 text-sm text-gray-400 sm:px-6`}>
                        <Text truncate className={`${montserrat_paragraph.className}`}>{prompt.promptText}</Text>
                      </td>
                      <td className={`truncate max-w-0 px-4 py-4 text-sm text-gray-300 sm:px-6 ${montserrat_paragraph.className}`}>
                        {prompt.documentGroups && prompt.documentGroups.length > 0 ? prompt.documentGroups.join(', ') : 'None'}
                      </td>
                      <td className={`truncate max-w-0 px-4 py-4 text-sm text-gray-300 sm:px-6 ${montserrat_paragraph.className}`}>
                        {prompt.tools && prompt.tools.length > 0 ? prompt.tools.join(', ') : 'None'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-medium sm:px-6">
                        <Group spacing="xs" noWrap>
                          <Tooltip label="Generate Custom GPT Link" className={`${montserrat_paragraph.className}`}>
                            <Button
                              variant="subtle"
                              color="grape"
                              size="xs"
                              onClick={() => onCopyToClipboard(prompt.gpt_id || prompt.id, 'url')}
                              px={5}
                            >
                              <IconLink size={16} />
                            </Button>
                          </Tooltip>
                          <Tooltip label="Edit" className={`${montserrat_paragraph.className}`}>
                            <Button
                              variant="subtle"
                              color="blue"
                              size="xs"
                              onClick={() => onOpenAddEditModal(prompt)}
                              px={5}
                            >
                              <IconPencil size={16} />
                            </Button>
                          </Tooltip>
                          <Tooltip label="Copy Prompt Text to Clipboard" className={`${montserrat_paragraph.className}`}>
                            <Button
                              variant="subtle"
                              color="teal"
                              size="xs"
                              onClick={() => onCopyToClipboard(prompt.promptText, 'prompt')}
                              px={5}
                            >
                              <IconCopy size={16} />
                            </Button>
                          </Tooltip>
                          <Tooltip label="Delete" className={`${montserrat_paragraph.className}`}>
                            <Button
                              variant="subtle"
                              color="red"
                              size="xs"
                              onClick={() => onDeletePrompt(prompt)}
                              px={5}
                            >
                              <IconTrash size={16} />
                            </Button>
                          </Tooltip>
                        </Group>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Paper>
          )}
        </div>
      </div>
    </Card>
  );
};

export default CustomPromptsTable; 