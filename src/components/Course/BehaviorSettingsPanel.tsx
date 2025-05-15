import React from 'react';
import {
  Button,
  Divider,
  Flex,
  Group,
  Indicator,
  List,
  Modal,
  Text,
  Title,
  type MantineTheme,
} from '@mantine/core';
import {
  IconAlertTriangle,
  IconLink,
} from '@tabler/icons-react';
import { montserrat_heading, montserrat_paragraph } from 'fonts';
import CustomSwitch from '~/components/Switches/CustomSwitch';
import CustomCopyButton from '~/components/Buttons/CustomCopyButton';
import { LinkGeneratorModal } from '~/components/Modals/LinkGeneratorModal';
import { type CourseMetadata } from '~/types/courseMetadata';
import { type CustomSystemPrompt } from '~/pages/[course_name]/prompt';

interface BehaviorSettingsPanelProps {
  theme: MantineTheme;
  courseMetadata: CourseMetadata | null;
  vectorSearchRewrite: boolean;
  handleSettingChange: (updates: Partial<CourseMetadata>) => void;
  guidedLearning: boolean;
  documentsOnly: boolean;
  systemPromptOnly: boolean;
  handleCheckboxChange: (updates: Partial<CourseMetadata>) => void;
  handleCopyDefaultPrompt: () => void;
  resetModalOpened: boolean;
  openResetModal: () => void;
  closeResetModal: () => void;
  resetSystemPrompt: () => Promise<void>;
  linkGeneratorOpened: boolean;
  openLinkGenerator: () => void;
  closeLinkGenerator: () => void;
  course_name: string;
  customSystemPrompts: CustomSystemPrompt[];
  initialActivePromptForLink?: string;
}

const BehaviorSettingsPanel: React.FC<BehaviorSettingsPanelProps> = ({
  theme,
  courseMetadata,
  vectorSearchRewrite,
  handleSettingChange,
  guidedLearning,
  documentsOnly,
  systemPromptOnly,
  handleCheckboxChange,
  handleCopyDefaultPrompt,
  resetModalOpened,
  openResetModal,
  closeResetModal,
  resetSystemPrompt,
  linkGeneratorOpened,
  openLinkGenerator,
  closeLinkGenerator,
  course_name,
  customSystemPrompts,
  initialActivePromptForLink,
}) => {
  if (!courseMetadata) return null;

  return (
    <div
      style={{
        padding: '1rem',
        backgroundColor: '#15162c',
        color: 'white',
        height: '100%', // Ensure it takes full height of its flex container part
      }}
    >
      <div className="card flex h-full flex-col">
        <Flex direction="column" m="3rem" gap="md">
          <Flex align="center">
            <Title
              className={`${montserrat_heading.variable} font-montserratHeading`}
              variant="gradient"
              gradient={{ from: 'gold', to: 'white', deg: 170 }}
              order={3}
              pl={'md'}
              pr={'md'}
              pt={'sm'}
              pb={'xs'}
              style={{ alignSelf: 'left', marginLeft: '-11px' }}
            >
              Document Search Optimization
            </Title>
            <Indicator
              label={
                <Text
                  className={`${montserrat_heading.variable} font-montserratHeading`}
                >
                  New
                </Text>
              }
              color="hsl(280,100%,70%)"
              size={13}
              styles={{
                indicator: {
                  top: '-17px !important',
                  right: '7px !important',
                },
              }}
            >
              <span
                className={`${montserrat_heading.variable} font-montserratHeading`}
              ></span>
            </Indicator>
          </Flex>

          <CustomSwitch
            label="Smart Document Search"
            tooltip="When enabled, UIUC.chat optimizes your queries to better search through course materials and find relevant content. Note: This only affects how documents are searched - your chat messages remain exactly as you write them."
            checked={vectorSearchRewrite}
            onChange={(value: boolean) => {
              handleSettingChange({
                vector_search_rewrite_disabled: !value,
              })
            }}
          />

          <Divider />

          <Flex align="center" style={{ paddingTop: '15px' }}>
            <Title
              className={`label ${montserrat_heading.variable} mr-[8px] font-montserratHeading`}
              variant="gradient"
              gradient={{ from: 'gold', to: 'white', deg: 170 }}
              order={3}
            >
              AI Behavior Settings
            </Title>
            <Indicator
              label={
                <Text
                  className={`${montserrat_heading.variable} font-montserratHeading`}
                >
                  New
                </Text>
              }
              color="hsl(280,100%,70%)"
              size={13}
              styles={{
                indicator: {
                  top: '-17px !important',
                  right: '7px !important',
                },
              }}
            >
              <span
                className={`${montserrat_heading.variable} font-montserratHeading`}
              ></span>
            </Indicator>
          </Flex>

          <Flex direction="column" gap="md">
            <div className="flex flex-col gap-1">
              <CustomSwitch
                label="Guided Learning"
                tooltip="When enabled course-wide, this setting applies to all students and cannot be disabled by them. The AI will encourage independent problem-solving by providing hints and questions instead of direct answers, while still finding and citing relevant course materials. This promotes critical thinking while ensuring students have access to proper resources."
                checked={guidedLearning}
                onChange={(value: boolean) =>
                  handleCheckboxChange({
                    guidedLearning: value,
                  })
                }
              />

              <CustomSwitch
                label="Document-Based References Only"
                tooltip="Restricts the AI to use only information from the provided documents. Useful for maintaining accuracy in fields like legal research where external knowledge could be problematic."
                checked={documentsOnly}
                onChange={(value: boolean) =>
                  handleCheckboxChange({ documentsOnly: value })
                }
              />

              <CustomSwitch
                label="Bypass UIUC.chat's internal prompting"
                tooltip="Internally, we prompt the model to (1) add citations and (2) always be as helpful as possible. You can bypass this for full un-modified control over your bot."
                checked={systemPromptOnly}
                onChange={(value: boolean) =>
                  handleCheckboxChange({
                    systemPromptOnly: value,
                  })
                }
              />

              {systemPromptOnly && (
                <Flex
                  mt="sm"
                  direction="column"
                  gap="xs"
                  className="mt-[-4px] pl-[82px]"
                >
                  <CustomCopyButton
                    label="Copy UIUC.chat's internal prompt"
                    tooltip="You can use and customize our default internal prompting to suit your needs. Note, only the specific citation formatting described will work with our citation 'find and replace' system. This provides a solid starting point for defining AI behavior in raw prompt mode."
                    onClick={handleCopyDefaultPrompt}
                  />
                </Flex>
              )}

              <Modal
                opened={resetModalOpened}
                onClose={closeResetModal}
                title={
                  <Text
                    className={`${montserrat_heading.variable} font-montserratHeading`}
                    size="lg"
                    weight={700}
                    gradient={{
                      from: 'red',
                      to: 'white',
                      deg: 45,
                    }}
                    variant="gradient"
                  >
                    Reset Prompting Settings
                  </Text>
                }
                centered
                radius="md"
                size="md"
                styles={{
                  header: {
                    backgroundColor: '#15162c',
                    borderBottom: '1px solid #2D2F48',
                    padding: '20px 24px',
                    marginBottom: '16px',
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
                    marginTop: '4px',
                  },
                }}
              >
                <Flex
                  direction="column"
                  gap="xl"
                  style={{ marginTop: '8px' }}
                >
                  <Flex align="flex-start" gap="md">
                    <IconAlertTriangle
                      size={24}
                      color={theme.colors.red[5]}
                      style={{ marginTop: '2px' }}
                    />
                    <Text
                      className={`${montserrat_paragraph.variable} font-montserratParagraph`}
                      size="sm"
                      weight={500}
                      style={{
                        color: 'white',
                        lineHeight: 1.5,
                      }}
                    >
                      Are you sure you want to reset your system
                      prompt and all behavior settings to their
                      default values?
                    </Text>
                  </Flex>

                  <Divider
                    style={{
                      borderColor: 'rgba(255,255,255,0.1)',
                    }}
                  />

                  <div>
                    <Text
                      size="sm"
                      className={`${montserrat_paragraph.variable} font-montserratParagraph`}
                      weight={600}
                      style={{
                        color: '#D1D1D1',
                        marginBottom: '12px',
                      }}
                    >
                      This action will:
                    </Text>
                    <List
                      size="sm"
                      spacing="sm"
                      style={{ color: '#D1D1D1' }}
                      icon={
                        <div
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: 'hsl(0,100%,70%)',
                            marginTop: '8px',
                          }}
                        />
                      }
                    >
                      <List.Item>
                        Restore the system prompt to the default
                        template
                      </List.Item>
                      <List.Item>
                        Disable Guided Learning, Document-Only
                        mode, and other custom settings
                      </List.Item>
                    </List>
                  </div>

                  <Text
                    size="sm"
                    style={{ color: '#D1D1D1' }}
                    className={`${montserrat_paragraph.variable} font-montserratParagraph`}
                  >
                    This cannot be undone. Please confirm you
                    wish to proceed.
                  </Text>

                  <Group position="right" mt="md">
                    <Button
                      variant="outline"
                      color="gray"
                      radius="md"
                      onClick={closeResetModal}
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
                      variant="filled"
                      color="red"
                      radius="md"
                      className={`${montserrat_paragraph.variable} font-montserratParagraph`}
                      sx={(themeParam) => ({
                        backgroundColor: `${themeParam.colors.red[8]} !important`,
                        border: 'none',
                        color: '#fff',
                        padding: '10px 20px',
                        fontWeight: 600,
                        boxShadow:
                          '0 2px 4px rgba(0, 0, 0, 0.2)',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: `${themeParam.colors.red[9]} !important`,
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
                      onClick={() => {
                        resetSystemPrompt();
                        closeResetModal();
                      }}
                    >
                      Confirm
                    </Button>
                  </Group>
                </Flex>
              </Modal>

              <Flex
                mt="md"
                justify="flex-start"
                align="center"
                gap="md"
              >
                <Button
                  variant="filled"
                  color="red"
                  radius="md"
                  leftIcon={<IconAlertTriangle size={16} />}
                  className={`${montserrat_paragraph.variable} font-montserratParagraph`}
                  sx={(themeParam) => ({
                    backgroundColor: `${themeParam.colors.red[8]} !important`,
                    border: 'none',
                    color: '#fff',
                    padding: '10px 20px',
                    fontWeight: 600,
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: `${themeParam.colors.red[9]} !important`,
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
                    },
                    '&:active': {
                      transform: 'translateY(0)',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                    },
                  })}
                  onClick={openResetModal}
                >
                  Reset Prompting Settings
                </Button>

                <Button
                  variant="filled"
                  radius="md"
                  leftIcon={<IconLink size={16} />}
                  onClick={openLinkGenerator}
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
                  })}
                >
                  Generate Share Link
                </Button>
              </Flex>

              {linkGeneratorOpened && (
                <LinkGeneratorModal
                  opened={linkGeneratorOpened}
                  onClose={closeLinkGenerator}
                  course_name={course_name}
                  currentSettings={{
                    guidedLearning: courseMetadata.guidedLearning || false,
                    documentsOnly: courseMetadata.documentsOnly || false,
                    systemPromptOnly: courseMetadata.systemPromptOnly || false,
                  }}
                  customSystemPrompts={customSystemPrompts}
                  initialActivePrompt={initialActivePromptForLink}
                />
              )}
            </div>
          </Flex>
        </Flex>
      </div>
    </div>
  );
};

export default BehaviorSettingsPanel; 