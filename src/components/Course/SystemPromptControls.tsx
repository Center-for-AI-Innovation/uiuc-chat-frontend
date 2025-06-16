import React from 'react';
import {
  Button,
  Flex,
  Group,
  Textarea,
  Title,
  Select,
  Image,
  Modal,
  Paper,
  Text,
  Tooltip,
  type MantineTheme,
} from '@mantine/core';
import {
  IconChevronDown,
  IconInfoCircle,
  IconLayoutSidebarRight,
  IconLayoutSidebarRightExpand,
  IconSparkles,
} from '@tabler/icons-react';
import { montserrat_heading, montserrat_paragraph } from 'fonts';
import { LoadingSpinner } from '~/components/UIUC-Components/LoadingSpinner';
import { getModelLogo } from '~/components/Chat/ModelSelect';
import {
  recommendedModelIds,
  warningLargeModelIds,
} from '~/utils/modelProviders/ConfigWebLLM';
import { type AllLLMProviders, type ProviderNames } from '~/utils/modelProviders/LLMProvider'; // Assuming this path is correct
import { type AnySupportedModel } from '~/utils/modelProviders/LLMProvider';

// Define the props for the component
interface ModelOption {
  group: ProviderNames;
  value: string;
  label: string;
  modelId: string;
  selectedModelId: string;
  modelType: string;
  downloadSize?: string;
  vram_required_MB?: number;
  extendedThinking?: boolean;
}

interface SystemPromptControlsProps {
  theme: MantineTheme;
  baseSystemPrompt: string;
  setBaseSystemPrompt: (value: string) => void;
  selectedModel: string;
  setSelectedModel: (value: string) => void;
  modelOptions: ModelOption[];
  llmProviders: AllLLMProviders | null;
  isOptimizing: boolean;
  handleSubmitPromptOptimization: (e: React.FormEvent) => Promise<void>;
  handleSystemPromptSubmit: (prompt: string) => void;
  isRightSideVisible: boolean;
  setIsRightSideVisible: (visible: boolean) => void;
  // Props for the optimization modal
  optimizationModalOpened: boolean;
  closeOptimizationModal: () => void;
  optimizedMessages: Array<{ role: string; content: string }>;
  setOptimizedSystemPrompt: (prompt: string) => void; // To update the main prompt from modal
  isSmallScreen: boolean; // To adjust layout if necessary
}

const SystemPromptControls: React.FC<SystemPromptControlsProps> = ({
  theme,
  baseSystemPrompt,
  setBaseSystemPrompt,
  selectedModel,
  setSelectedModel,
  modelOptions,
  llmProviders,
  isOptimizing,
  handleSubmitPromptOptimization,
  handleSystemPromptSubmit,
  isRightSideVisible,
  setIsRightSideVisible,
  optimizationModalOpened,
  closeOptimizationModal,
  optimizedMessages,
  setOptimizedSystemPrompt,
  isSmallScreen,
}) => {
  return (
    <div
      style={{
        width: isRightSideVisible ? '100%' : '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: '#15162c',
      }}
      className="rounded-xl px-4 py-6 sm:px-6 sm:py-6 md:px-8"
    >
      <div
        style={{
          width: '100%',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#15162c',
        }}
      >
        <Flex
          justify="space-between"
          align="center"
          mb="md"
        >
          <Flex align="center" className="gap-2">
            <Title
              className={`label ${montserrat_heading.variable} pl-1 pr-0 font-montserratHeading md:pl-0 md:pr-2`}
              variant="gradient"
              gradient={{
                from: 'gold',
                to: 'white',
                deg: 170,
              }}
              order={4}
            >
              System Prompt
            </Title>
            <Select
              placeholder="Select model"
              data={modelOptions as any} // Cast to any if type issues with Mantine Select persist for complex itemComponent
              value={selectedModel}
              onChange={(value) =>
                setSelectedModel(value || '')
              }
              searchable
              radius={'md'}
              maxDropdownHeight={280}
              itemComponent={(props: any) => ( // Using any for props here for brevity from original code
                <div {...props}>
                  <Group
                    noWrap
                    style={{ overflow: 'visible' }}
                  >
                    <div
                      style={{
                        width: '100%',
                        paddingLeft: '4px',
                        overflow: 'visible',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          overflow: 'visible',
                        }}
                      >
                        <Image
                          src={getModelLogo(
                            props.modelType,
                          )}
                          alt={`${props.modelType} logo`}
                          width={20}
                          height={20}
                          style={{
                            minWidth: '20px',
                            borderRadius: '4px',
                            overflow: 'hidden',
                          }}
                        />
                        <Text
                          size="sm"
                          style={{ marginLeft: '12px' }}
                        >
                          {props.label}
                        </Text>
                      </div>
                      {props.downloadSize && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            marginTop: '4px',
                            marginLeft: '32px',
                          }}
                        >
                          <Text size="xs" opacity={0.65}>
                            {props.downloadSize}
                          </Text>
                          {recommendedModelIds.includes(
                            props.label,
                          ) && (
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                              }}
                            >
                              <IconSparkles
                                size="1rem"
                                style={{
                                  marginLeft: '8px',
                                }}
                              />
                              <Text
                                size="xs"
                                opacity={0.65}
                                style={{
                                  marginLeft: '4px',
                                }}
                              >
                                recommended
                              </Text>
                            </div>
                          )}
                          {warningLargeModelIds.includes(
                            props.label, // Assuming props.label is the model ID string
                          ) && (
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                              }}
                            >
                              <IconLayoutSidebarRightExpand // Placeholder, original was IconAlertTriangleFilled
                                size="1rem"
                                style={{
                                  marginLeft: '8px',
                                }}
                              />
                              <Text
                                size="xs"
                                opacity={0.65}
                                style={{
                                  marginLeft: '4px',
                                }}
                              >
                                warning, requires large vRAM
                                GPU
                              </Text>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </Group>
                </div>
              )}
              styles={(themeParam) => ({ // Renamed theme to themeParam to avoid conflict with outer scope theme
                root: {
                  width: '320px',
                  zIndex: 200,
                  '@media (maxWidth: 768px)': {
                    width: '240px',
                  },
                  '@media (maxWidth: 480px)': {
                    width: '220px',
                  },
                },
                input: {
                  backgroundColor: 'rgb(107, 33, 168)',
                  border: 'none',
                  color: themeParam.white,
                  '&:focus': {
                    borderColor: '#6e56cf',
                  },
                  fontFamily: `var(--font-montserratParagraph), ${themeParam.fontFamily}`,
                  cursor: 'pointer',
                  minWidth: 0,
                  flex: '1 1 auto',
                  height: '36px',
                  fontSize: '0.9rem',
                  paddingRight: '30px',
                  paddingLeft: '36px',
                  overflow: 'visible',
                  '@media (maxWidth: 768px)': {
                    fontSize: '0.85rem',
                    height: '34px',
                  },
                  '@media (maxWidth: 480px)': {
                    fontSize: '0.8rem',
                    height: '32px',
                  },
                },
                dropdown: {
                  backgroundColor: '#1d1f33',
                  border: '1px solid rgba(42,42,120,1)',
                  borderRadius: themeParam.radius.md,
                  marginTop: '2px',
                  boxShadow: themeParam.shadows.xs,
                  width: '100%',
                  maxWidth: '100%',
                  position: 'absolute',
                  zIndex: 200,
                  overflow: 'visible',
                  '@media (maxWidth: 768px)': {
                    width: 'auto',
                    minWidth: '240px',
                  },
                },
                item: {
                  backgroundColor: '#1d1f33',
                  borderRadius: themeParam.radius.md,
                  margin: '2px',
                  overflow: 'visible',
                  '&[data-selected]': {
                    backgroundColor: 'transparent',
                    '&:hover': {
                      backgroundColor: 'rgb(107, 33, 168)',
                      color: themeParam.white,
                    },
                  },
                  '&[data-hovered]': {
                    backgroundColor: 'rgb(107, 33, 168)',
                    color: themeParam.white,
                  },
                  fontFamily: `var(--font-montserratParagraph), ${themeParam.fontFamily}`,
                  cursor: 'pointer',
                  whiteSpace: 'normal',
                  lineHeight: 1.2,
                  fontSize: '0.9rem',
                  padding: '8px 12px',
                  '@media (maxWidth: 768px)': {
                    fontSize: '0.85rem',
                    padding: '6px 10px',
                  },
                  '@media (maxWidth: 480px)': {
                    fontSize: '0.8rem',
                    padding: '6px 8px',
                  },
                },
                rightSection: {
                  pointerEvents: 'none',
                  color: themeParam.colors.gray[5],
                  width: '30px',
                  '@media (maxWidth: 480px)': {
                    width: '24px',
                  },
                },
              })}
              rightSection={
                <IconChevronDown
                  size={isSmallScreen ? 12 : 14} // Use prop for responsive size
                  style={{ marginRight: '8px' }}
                />
              }
              icon={
                selectedModel ? (
                  <Image
                    src={getModelLogo(
                      modelOptions.find(
                        (opt) =>
                          opt.value === selectedModel,
                      )?.modelType || '',
                    )}
                    alt={`${modelOptions.find((opt) => opt.value === selectedModel)?.modelType || ''} logo`}
                    width={20}
                    height={20}
                    style={{
                      position: 'absolute',
                      left: '8px',
                      minWidth: '20px',
                      borderRadius: '4px',
                      overflow: 'hidden',
                    }}
                  />
                ) : null
              }
            />
            <Tooltip
              label="The selected model will be used when Optimizing System Prompt."
              position="top"
              multiline
              withArrow
              arrowSize={10}
              offset={20}
              styles={(themeParam) => ({
                tooltip: {
                  backgroundColor: themeParam.colors.dark[7],
                  color: themeParam.white,
                  fontSize: '0.875rem',
                  padding: '0.5rem 0.75rem',
                  fontFamily:
                    'var(--font-montserratParagraph)',
                  maxWidth: '300px',
                },
                arrow: {
                  backgroundColor: themeParam.colors.dark[7],
                },
              })}
            >
              <div>
                <IconInfoCircle
                  size={18}
                  className="text-white/60 transition-colors duration-200 hover:text-white/80"
                  style={{ cursor: 'pointer' }}
                />
              </div>
            </Tooltip>
          </Flex>
          {isRightSideVisible ? (
            <Tooltip
              label="Close Prompt Builder"
              key="close"
            >
              <div
                className="cursor-pointer p-0"
                data-right-sidebar-icon
              >
                <IconLayoutSidebarRight
                  stroke={2}
                  onClick={() =>
                    setIsRightSideVisible(false)
                  }
                />
              </div>
            </Tooltip>
          ) : (
            <Tooltip label="Open Prompt Builder" key="open">
              <div
                className="mr-2 cursor-pointer p-0"
                data-right-sidebar-icon
              >
                <IconLayoutSidebarRightExpand
                  stroke={2}
                  onClick={() =>
                    setIsRightSideVisible(true)
                  }
                />
              </div>
            </Tooltip>
          )}
        </Flex>
        <form
          className={`${montserrat_paragraph.variable} font-montserratParagraph`}
          onSubmit={handleSubmitPromptOptimization}
        >
          <Textarea
            autosize
            minRows={3}
            maxRows={20}
            placeholder="Enter the system prompt..."
            className="px-1 pt-3 md:px-0"
            value={baseSystemPrompt}
            onChange={(e) => {
              setBaseSystemPrompt(e.target.value)
            }}
            style={{ width: '100%' }}
            styles={{
              input: {
                fontFamily:
                  'var(--font-montserratParagraph)',
                '&:focus': {
                  borderColor: '#8441ba',
                  boxShadow: '0 0 0 1px #8441ba',
                },
              },
            }}
          />
          <Group mt="md" spacing="sm">
            <Button
              variant="filled"
              radius="md"
              className={`${montserrat_paragraph.variable} font-montserratParagraph`}
              type="button"
              onClick={() => {
                handleSystemPromptSubmit(baseSystemPrompt)
              }}
              sx={(themeParam) => ({
                backgroundColor: `${themeParam.colors?.purple?.[8] || '#6d28d9'} !important`,
                border: 'none',
                color: '#fff',
                padding: '10px 20px',
                fontWeight: 600,
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: `${themeParam.colors?.purple?.[9] || '#5b21b6'} !important`,
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
                },
                '&:active': {
                  transform: 'translateY(0)',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                },
              })}
              style={{ minWidth: 'fit-content' }}
            >
              Update System Prompt
            </Button>
            <Button
              onClick={handleSubmitPromptOptimization}
              disabled={!llmProviders || isOptimizing}
              variant="filled"
              radius="md"
              leftIcon={
                isOptimizing ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <IconSparkles stroke={1} />
                )
              }
              className={`${montserrat_paragraph.variable} font-montserratParagraph`}
              sx={(themeParam) => ({
                background:
                  'linear-gradient(90deg, #6d28d9 0%, #4f46e5 50%, #2563eb 100%) !important',
                border: 'none',
                color: '#fff',
                padding: '10px 20px',
                fontWeight: 600,
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  background:
                    'linear-gradient(90deg, #4f46e5 0%, #2563eb 50%, #6d28d9 100%) !important',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
                },
                '&:active': {
                  transform: 'translateY(0)',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                },
                '&:disabled': {
                  opacity: 0.7,
                  cursor: 'not-allowed',
                  transform: 'none',
                  boxShadow: 'none',
                },
              })}
              style={{ minWidth: 'fit-content' }}
            >
              {isOptimizing
                ? 'Optimizing...'
                : 'Optimize System Prompt'}
            </Button>
          </Group>

          <Modal
            opened={optimizationModalOpened}
            onClose={closeOptimizationModal}
            size="xl"
            title={
              <Text
                className={`${montserrat_heading.variable} font-montserratHeading`}
                size="lg"
                weight={700}
                gradient={{
                  from: 'gold',
                  to: 'white',
                  deg: 45,
                }}
                variant="gradient"
              >
                Optimized System Prompt
              </Text>
            }
            className={`${montserrat_heading.variable} rounded-xl font-montserratHeading`}
            centered
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
                maxHeight: 'calc(85vh - 76px)',
                display: 'flex',
                flexDirection: 'column',
              },
              close: {
                color: '#D1D1D1',
                '&:hover': {
                  backgroundColor:
                    'rgba(255, 255, 255, 0.1)',
                },
              },
            }}
          >
            <div
              style={{
                flex: 1,
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
              }}
            >
              <Paper
                p="md"
                radius="md"
                style={{
                  backgroundColor: '#1a1b34',
                  border:
                    '1px solid rgba(147, 51, 234, 0.3)',
                  flex: 1,
                  overflow: 'auto',
                  minHeight: '200px',
                  maxHeight: 'calc(85vh - 200px)',
                  marginTop: '4px',
                }}
              >
                {optimizedMessages.map((message, i, { length }) => {
                  if (
                    length - 1 === i &&
                    message.role === 'assistant'
                  ) {
                    return (
                      <div
                        key={i}
                        style={{
                          padding: '16px',
                          borderRadius: '8px',
                          whiteSpace: 'pre-wrap',
                          color: '#D1D1D1',
                          lineHeight: '1.6',
                          fontSize: '0.95rem',
                        }}
                        className={`${montserrat_paragraph.variable} font-montserratParagraph`}
                      >
                        {message.content}
                      </div>
                    )
                  }
                  return null; // Added return null for map function
                })}
              </Paper>

              <Group position="right" spacing="sm">
                <Button
                  variant="outline"
                  radius="md"
                  onClick={closeOptimizationModal}
                  className={`${montserrat_paragraph.variable} font-montserratParagraph`}
                  styles={(themeParam) => ({
                    root: {
                      borderColor: themeParam.colors.gray[6],
                      color: '#fff',
                      '&:hover': {
                        backgroundColor:
                          themeParam.colors.gray[8],
                      },
                    },
                  })}
                >
                  Cancel
                </Button>
                <Button
                  radius="md"
                  className={`${montserrat_paragraph.variable} font-montserratParagraph`}
                  onClick={() => {
                    const lastMessage =
                      optimizedMessages[optimizedMessages.length - 1]
                    if (
                      lastMessage &&
                      lastMessage.role === 'assistant'
                    ) {
                      const newSystemPrompt =
                        lastMessage.content
                      // Update the baseSystemPrompt in the parent component
                      setBaseSystemPrompt(newSystemPrompt);
                      // Also call the original handler to save it
                      handleSystemPromptSubmit(newSystemPrompt);
                    }
                    closeOptimizationModal();
                  }}
                  sx={(themeParam) => ({
                    background:
                      'linear-gradient(90deg, #6d28d9 0%, #4f46e5 50%, #2563eb 100%) !important',
                    border: 'none',
                    color: '#fff',
                    padding: '10px 20px',
                    fontWeight: 600,
                    boxShadow:
                      '0 2px 4px rgba(0, 0, 0, 0.2)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      background:
                        'linear-gradient(90deg, #4f46e5 0%, #2563eb 50%, #6d28d9 100%) !important',
                      transform: 'translateY(-1px)',
                      boxShadow:
                        '0 4px 8px rgba(0, 0, 0, 0.3)',
                    },
                    '&:active': {
                      transform: 'translateY(0)',
                      boxShadow:
                        '0 2px 4px rgba(0, 0, 0, 0.2)',
                    },
                  })}
                >
                  Update System Prompt
                </Button>
              </Group>
            </div>
          </Modal>
        </form>
      </div>
    </div>
  );
};

export default SystemPromptControls; 