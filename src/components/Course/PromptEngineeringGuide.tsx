import React from 'react';
import {
  Collapse,
  Flex,
  List,
  Paper,
  Text,
  type MantineTheme,
} from '@mantine/core';
import {
  IconBook,
  IconChevronDown,
  IconExternalLink,
} from '@tabler/icons-react';
import { montserrat_paragraph } from 'fonts';

interface PromptEngineeringGuideProps {
  insightsOpen: boolean;
  setInsightsOpen: (opened: boolean) => void;
  theme: MantineTheme;
}

const PromptEngineeringGuide: React.FC<PromptEngineeringGuideProps> = ({
  insightsOpen,
  setInsightsOpen,
  theme,
}) => {
  return (
    <Paper
      className="w-full rounded-xl px-4 sm:px-6 md:px-8"
      shadow="xs"
      p="md"
      sx={{
        backgroundColor: '#15162c', // Consider using theme.colors.dark[7] or similar
        border: '1px solid rgba(147, 51, 234, 0.3)', // theme.colors.violet[8] with opacity
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
          backgroundColor: '#1a1b34', // theme.colors.dark[6]
          borderColor: 'rgba(147, 51, 234, 0.5)', // theme.colors.violet[7] with opacity
          transform: 'translateY(-1px)',
        },
      }}
      onClick={() => setInsightsOpen(!insightsOpen)}
    >
      <Flex
        align="center"
        justify="space-between"
        sx={{
          padding: '4px 8px',
          borderRadius: '8px',
        }}
      >
        <Flex align="center" gap="md">
          <IconBook
            size={24}
            style={{
              color: 'hsl(280,100%,70%)', // theme.colors.grape[5] or a custom color
            }}
          />
          <Text
            size="md"
            weight={600}
            className={`${montserrat_paragraph.variable} select-text font-montserratParagraph`}
            variant="gradient"
            gradient={{
              from: 'gold',
              to: 'white',
              deg: 50,
            }}
          >
            Prompt Engineering Guide
          </Text>
        </Flex>
        <div
          className="transition-transform duration-200"
          style={{
            transform: insightsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            color: 'hsl(280,100%,70%)', // theme.colors.grape[5]
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconChevronDown size={24} />
        </div>
      </Flex>

      <Collapse in={insightsOpen} transitionDuration={200}>
        <div className="mt-4 px-2">
          <Text
            size="md"
            className={`${montserrat_paragraph.variable} select-text font-montserratParagraph`}
          >
            For additional insights and best practices on prompt creation,
            please review:
            <List
              withPadding
              className="mt-2"
              spacing="sm"
              icon={
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: 'hsl(280,100%,70%)', // theme.colors.grape[5]
                    marginTop: '8px',
                  }}
                />
              }
            >
              <List.Item>
                <a
                  className={`text-sm transition-colors duration-200 hover:text-purple-400 ${montserrat_paragraph.variable} font-montserratParagraph`}
                  style={{ color: 'hsl(280,100%,70%)' }} // theme.colors.grape[4]
                  href="https://platform.openai.com/docs/guides/prompt-engineering"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  The Official OpenAI Prompt Engineering Guide
                  <IconExternalLink
                    size={18}
                    className="inline-block pl-1"
                    style={{
                      position: 'relative',
                      top: '-2px',
                    }}
                  />
                </a>
              </List.Item>
              <List.Item>
                <a
                  className={`text-sm transition-colors duration-200 hover:text-purple-400 ${montserrat_paragraph.variable} font-montserratParagraph`}
                  style={{ color: 'hsl(280,100%,70%)' }} // theme.colors.grape[4]
                  href="https://docs.anthropic.com/claude/prompt-library"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  The Official Anthropic Prompt Library
                  <IconExternalLink
                    size={18}
                    className="inline-block pl-1"
                    style={{
                      position: 'relative',
                      top: '-2px',
                    }}
                  />
                </a>
              </List.Item>
            </List>
            <Text
              className={`label ${montserrat_paragraph.variable} inline-block select-text font-montserratParagraph`}
              size="md"
              style={{ marginTop: '1.5rem' }}
            >
              The System Prompt provides the foundation for every conversation
              in this project. It defines the model&apos;s role, tone, and
              behavior. Consider including:
              <List
                withPadding
                className="mt-2"
                spacing="xs"
                icon={
                  <div
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: 'hsl(280,100%,70%)', // theme.colors.grape[5]
                      marginTop: '8px',
                    }}
                  />
                }
              >
                <List.Item>Key instructions or examples</List.Item>
                <List.Item>A warm welcome message</List.Item>
                <List.Item>Helpful links for further learning</List.Item>
              </List>
            </Text>
          </Text>
        </div>
      </Collapse>
    </Paper>
  );
};

export default PromptEngineeringGuide; 