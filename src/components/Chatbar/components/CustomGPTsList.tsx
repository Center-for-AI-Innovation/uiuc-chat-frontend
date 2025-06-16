import React, { useState, useEffect } from 'react';
import { IconRobot, IconStar, IconStarFilled, IconChevronRight, IconSearch } from '@tabler/icons-react';
import { type CustomSystemPrompt } from '~/types/courseMetadata';
import { UnstyledButton, Tooltip, Group, Text, Modal, ScrollArea, TextInput } from '@mantine/core';

interface CustomGPTsListProps {
  customSystemPrompts: CustomSystemPrompt[];
  onSelectGPT: (prompt: CustomSystemPrompt) => void;
  onToggleFavorite: (promptId: string, isFavorite: boolean) => void;
}

const CustomGPTsList: React.FC<CustomGPTsListProps> = ({
  customSystemPrompts,
  onSelectGPT,
  onToggleFavorite,
}) => {
  // Add debug logger for customSystemPrompts
  useEffect(() => {
    console.log('CustomGPTsList - customSystemPrompts:', customSystemPrompts);
  }, [customSystemPrompts]);

  const [modalOpened, setModalOpened] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState<CustomSystemPrompt | null>(null);

  // Sort prompts to show favorites first
  const sortedPrompts = [...customSystemPrompts].sort((a, b) => {
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    return 0;
  });

  // Show first 3 prompts
  const displayedPrompts = sortedPrompts.slice(0, 3);
  const hasMorePrompts = sortedPrompts.length > 3;

  const handlePromptClick = (prompt: CustomSystemPrompt) => {
    onSelectGPT(prompt);
  };

  const handleModalConfirm = () => {
    if (selectedPrompt) {
      onSelectGPT(selectedPrompt);
      setModalOpened(false);
      setSelectedPrompt(null);
      setSearchTerm('');
    }
  };

  const filteredPrompts = searchTerm
    ? sortedPrompts.filter(prompt =>
        prompt.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : sortedPrompts;

  return (
    <div className="mt-4 border-t border-white/20 pt-4">
      <Text size="sm" color="dimmed" className="mb-2 px-3">
        Custom GPTs
      </Text>
      <div className="space-y-1">
        {displayedPrompts.map((prompt) => (
          <div key={prompt.id} className="group relative">
            <UnstyledButton
              className="flex w-full items-center gap-3 rounded-lg px-3 py-1.5 text-sm transition-colors duration-200 hover:bg-[#343541]/90"
              onClick={() => handlePromptClick(prompt)}
            >
              <IconRobot size={16} className="text-blue-400" />
              <div className="flex-1 truncate text-left">
                <Text size="sm" className="truncate">
                  {prompt.name}
                </Text>
              </div>
              <Tooltip label={prompt.isFavorite ? 'Unfavorite' : 'Favorite'}>
                <UnstyledButton
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(prompt.id, !prompt.isFavorite);
                  }}
                  className="opacity-0 group-hover:opacity-100"
                >
                  {prompt.isFavorite ? (
                    <IconStarFilled size={14} className="text-yellow-400" />
                  ) : (
                    <IconStar size={14} className="text-gray-500 hover:text-yellow-400" />
                  )}
                </UnstyledButton>
              </Tooltip>
            </UnstyledButton>
          </div>
        ))}
      </div>

      {hasMorePrompts && (
        <UnstyledButton
          className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-sm text-gray-400 hover:bg-[#343541]/90"
          onClick={() => setModalOpened(true)}
        >
          <Text size="sm">Show More</Text>
          <IconChevronRight size={14} />
        </UnstyledButton>
      )}

      <Modal
        opened={modalOpened}
        onClose={() => {
          setModalOpened(false);
          setSelectedPrompt(null);
          setSearchTerm('');
        }}
        title={
          <Text size="lg" weight={700}>
            Select a Custom GPT
          </Text>
        }
        centered
        size="md"
        styles={{
          title: { color: 'white' },
          header: { backgroundColor: '#1A1B34' },
          content: { backgroundColor: '#1A1B34' },
          body: { color: 'white' },
        }}
      >
        <div className="space-y-4">
          <TextInput
            placeholder="Search GPTs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<IconSearch size={16} />}
            styles={{
              input: {
                backgroundColor: '#2A2A40',
                borderColor: '#3A3A50',
                color: 'white',
                '&::placeholder': {
                  color: '#9CA3AF',
                },
              },
            }}
          />
          <ScrollArea h={300} className="rounded bg-[#2A2A40]">
            <div className="space-y-1 p-2">
              {filteredPrompts.map((prompt) => (
                <UnstyledButton
                  key={prompt.id}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-200 hover:bg-[#343541]/90 ${
                    selectedPrompt?.id === prompt.id ? 'bg-[#343541]/90' : ''
                  }`}
                  onClick={() => {
                    setSelectedPrompt(prompt);
                  }}
                >
                  <IconRobot size={18} className="text-blue-400" />
                  <div className="flex-1 truncate text-left">
                    <Text size="sm" className="truncate">
                      {prompt.name}
                    </Text>
                  </div>
                  {prompt.isFavorite && (
                    <IconStarFilled size={16} className="text-yellow-400" />
                  )}
                </UnstyledButton>
              ))}
            </div>
          </ScrollArea>

          <Group position="right" mt="md">
            <UnstyledButton
              className="rounded bg-gray-700 px-4 py-2 text-sm hover:bg-gray-600"
              onClick={() => {
                setModalOpened(false);
                setSelectedPrompt(null);
                setSearchTerm('');
              }}
            >
              Cancel
            </UnstyledButton>
            <UnstyledButton
              className="rounded bg-blue-600 px-4 py-2 text-sm hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleModalConfirm}
              disabled={!selectedPrompt}
            >
              Start Conversation
            </UnstyledButton>
          </Group>
        </div>
      </Modal>
    </div>
  );
};

export default CustomGPTsList; 