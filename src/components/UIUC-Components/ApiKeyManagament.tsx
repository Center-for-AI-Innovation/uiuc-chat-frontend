import {
  Button,
  Card,
  Collapse,
  Flex,
  Group,
  Input,
  List,
  Paper,
  Text,
  Title,
  useMantineTheme,
} from '@mantine/core'
import { useClipboard, useMediaQuery } from '@mantine/hooks'
import { showNotification } from '@mantine/notifications'
import {
  IconBook,
  IconCheck,
  IconChevronDown,
  IconCopy,
  IconExternalLink,
} from '@tabler/icons-react'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import { useEffect, useState } from 'react'
import { type AuthContextProps } from 'react-oidc-context'
import { fetchCourseMetadata } from '~/utils/apiUtils'
import { useResponsiveCardWidth } from '~/utils/responsiveGrid'
import APIRequestBuilder from './APIRequestBuilder'

const ApiKeyManagement = ({
  course_name,
  auth,
  sidebarCollapsed = false,
}: {
  course_name: string
  auth: AuthContextProps
  sidebarCollapsed?: boolean
}) => {
  const theme = useMantineTheme()
  const isSmallScreen = useMediaQuery('(max-width: 960px)')
  const { copy } = useClipboard()

  // Get responsive card width classes based on sidebar state
  const cardWidthClasses = useResponsiveCardWidth(sidebarCollapsed || false)
  const [apiKey, setApiKey] = useState<string | null>(null)
  const baseUrl = process.env.VERCEL_URL || window.location.origin
  const [loading, setLoading] = useState(true)
  const [metadata, setMetadata] = useState<{ system_prompt?: string }>()
  const [insightsOpen, setInsightsOpen] = useState(false)

  useEffect(() => {
    const getMetadata = async () => {
      try {
        const courseMetadata = await fetchCourseMetadata(course_name)
        setMetadata(courseMetadata)
      } catch (error) {
        console.error('Error fetching course metadata:', error)
      }
    }

    getMetadata()
  }, [course_name])
  type Language = 'curl' | 'python' | 'node'

  const [selectedLanguage, setSelectedLanguage] = useState<Language>('curl')

  const [copiedCodeSnippet, setCopiedCodeSnippet] = useState(false)
  const [copiedApiKey, setCopiedApiKey] = useState(false)

  const handleCopyCodeSnippet = (text: string) => {
    copy(text)
    setCopiedCodeSnippet(true)
    setTimeout(() => setCopiedCodeSnippet(false), 2000) // Reset after 2 seconds
  }

  const handleCopyApiKey = (text: string) => {
    copy(text)
    setCopiedApiKey(true)
    setTimeout(() => setCopiedApiKey(false), 2000) // Reset after 2 seconds
  }

  const languageOptions = [
    { value: 'curl', label: 'cURL' },
    { value: 'python', label: 'Python' },
    { value: 'node', label: 'Node.js' },
  ]

  const apiKeyPlaceholder = '"your-api-key"' // replace with your API key

  const codeSnippets = {
    curl: `curl -X POST ${baseUrl}/api/chat-api/chat \\
	-H "Content-Type: application/json" \\
	-d '{
		"model": "gpt-4o-mini",
		"messages": [
			{
				"role": "system",
				"content": "Your system prompt here"
			},
			{
				"role": "user",
				"content": "What is in these documents?"
			}
		],
		"openai_key": "YOUR-OPENAI-KEY-HERE",
    "api_key": ${apiKey ? `"${apiKey}"` : apiKeyPlaceholder},
    "retrieval_only": false,
		"course_name": "${course_name}",
		"stream": true,
		"temperature": 0.1
	}'`,
    python: `import requests
	
url = "${baseUrl}/api/chat-api/chat"
headers = {
  'Content-Type': 'application/json'
}
stream = True
data = {
  "model": "gpt-4o-mini",
  "messages": [
    {
      "role": "system",
      "content": "Your system prompt here"
    },
    {
      "role": "user",
      "content": "What is in these documents?"
    }
  ],
  "openai_key": "YOUR-OPENAI-KEY-HERE", # only necessary for OpenAI models
  "api_key": ${apiKey ? `"${apiKey}"` : apiKeyPlaceholder},
  "retrieval_only": False, # If true, the LLM will not be invoked (thus, zero cost). Only relevant documents will be returned.
  "course_name": "${course_name}",
  "stream": stream,
  "temperature": 0.1
}

response = requests.post(url, headers=headers, json=data, stream=stream)
# ⚡️ Stream
if stream: 
  for chunk in response.iter_content(chunk_size=None):
    if chunk:
      print(chunk.decode('utf-8'), end='', flush=True)
# 🐌 No stream, but it includes the retrieved contexts.
else:
  import json
  res = json.loads(response.text)
  print(res['message'])
  print("The contexts used to answer this question:", res['contexts'])`,
    node: `const axios = require('axios');
	
const data = {
  "model": "gpt-4o-mini",
  "messages": [
    {
      "role": "system",
      "content": "Your system prompt here"
    },
    {
      "role": "user",
      "content": "What is in these documents?"
    }
  ],
  "openai_key": "YOUR-OPENAI-KEY-HERE", // only necessary for OpenAI models
  "api_key": ${apiKey ? `"${apiKey}"` : apiKeyPlaceholder},
  "course_name": "${course_name}",
  "stream": true,
  "retrieval_only": false, // If true, the LLM will not be invoked (thus, zero cost). Only relevant documents will be returned.
  "temperature": 0.1
};

axios.post('${baseUrl}/api/chat-api/chat', data, {
  headers: {
    'Content-Type': 'application/json'
  }
})
.then((response) => {
  console.log(response.data);
})
.catch((error) => {
  console.error(error);
});`,
  }

  useEffect(() => {
    const fetchApiKey = async () => {
      if (!auth.isAuthenticated) {
        setLoading(false)
        return
      }
      const response = await fetch(
        `/api/chat-api/keys/fetch?course_name=${course_name}`,
      )

      if (response.ok) {
        const data = await response.json()
        setApiKey(data.apiKey)
      } else {
        showNotification({
          title: 'Error',
          message: 'Failed to fetch API key.',
          color: 'red',
        })
      }
      setLoading(false)
    }

    fetchApiKey()
  }, [auth.isAuthenticated])

  const handleGenerate = async () => {
    const response = await fetch(
      `/api/chat-api/keys/generate?course_name=${course_name}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )

    if (response.ok) {
      const data = await response.json()
      setApiKey(data.apiKey)
      showNotification({
        title: 'Success',
        message: 'API key generated successfully.',
      })
    } else {
      showNotification({
        title: 'Error',
        message: 'Failed to generate API key.',
        color: 'red',
      })
    }
  }

  const handleRotate = async () => {
    const response = await fetch(
      `/api/chat-api/keys/rotate?course_name=${course_name}`,
      {
        method: 'PUT',
      },
    )

    if (response.ok) {
      const data = await response.json()
      setApiKey(data.newApiKey)
      showNotification({
        title: 'Success',
        message: 'API key rotated successfully.',
      })
    } else {
      showNotification({
        title: 'Error',
        message: 'Failed to rotate API key.',
        color: 'red',
      })
    }
  }

  const handleDelete = async () => {
    const response = await fetch(
      `/api/chat-api/keys/delete?course_name=${course_name}`,
      {
        method: 'DELETE',
      },
    )

    if (response.ok) {
      setApiKey(null)
      showNotification({
        title: 'Success',
        message: 'API key deleted successfully.',
      })
    } else {
      showNotification({
        title: 'Error',
        message: 'Failed to delete API key.',
        color: 'red',
      })
    }
  }

  const styles = {
    input: {
      border: '1px solid var(--illinois-storm-light)',
      backgroundColor: 'var(--illinois-background-dark)',
      color: 'var(--illinois-white)',
    },
    button: {
      backgroundColor: 'var(--illinois-orange)',
      color: 'var(--illinois-white)',
      '&:hover': {
        backgroundColor: 'var(--illinois-altgeld)',
      },
    },
  }

  return (
    <Card
      withBorder
      padding="none"
      radius="xl"
      className={`mt-[2%] ${cardWidthClasses}`}
      style={{
        backgroundColor: 'var(--background)',
        borderColor: 'var(--dashboard-border)',
      }}
    >
      <Flex
        direction={isSmallScreen ? 'column' : 'row'}
        style={{ height: '100%' }}
      >
        <div
          style={{
            flex: isSmallScreen ? '1 1 100%' : '1 1 60%',
            border: 'None',
            color: 'white',
          }}
          className="min-h-full bg-[--background] text-[--foreground]"
        >
          <div className="w-full border-b border-white/10 px-4 py-3 sm:px-6 sm:py-4 md:px-8">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 flex-wrap items-center gap-2 text-[--dashboard-foreground]">
                <Title
                  order={2}
                  className={`${montserrat_heading.variable} font-montserratHeading text-lg sm:text-2xl`}
                >
                  API Key Management
                </Title>
                <Text className="">/</Text>
                <Title
                  order={3}
                  className={`${montserrat_heading.variable} min-w-0 font-montserratHeading text-base text-[--illinois-orange] sm:text-xl ${
                    course_name.length > 40
                      ? 'max-w-[120px] truncate sm:max-w-[300px] lg:max-w-[400px]'
                      : ''
                  }`}
                >
                  {course_name}
                </Title>
              </div>
            </div>
          </div>
          <div
            style={{
              // padding: '1rem',
              color: 'white',
              alignItems: 'center',
            }}
            className="min-h-full justify-center"
          >
            <div className="card flex h-full flex-col">
              <Group
                m="1rem"
                align="start"
                variant="column"
                style={{
                  justifyContent: 'start',
                  width: '95%',
                  alignSelf: 'center',
                  overflow: 'hidden',
                }}
              >
                <Paper
                  className="w-full rounded-xl bg-[--dashboard-background-faded] px-4 sm:px-6 md:px-8"
                  p="md"
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
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
                          color: 'var(--dashboard-button)',
                        }}
                      />
                      <Text
                        size="md"
                        weight={600}
                        className={`${montserrat_paragraph.variable} select-text font-montserratParagraph text-[--dashboard-foreground]`}
                      >
                        API Documentation
                      </Text>
                    </Flex>
                    <div
                      className="transition-transform duration-200"
                      style={{
                        transform: insightsOpen
                          ? 'rotate(180deg)'
                          : 'rotate(0deg)',
                        color: 'var(--dashboard-foreground)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <IconChevronDown size={24} />
                    </div>
                  </Flex>

                  <Collapse in={insightsOpen} transitionDuration={200}>
                    <div className="mt-4 px-2 text-[--dashboard-foreground]">
                      <Text
                        size="md"
                        className={`${montserrat_paragraph.variable} select-text font-montserratParagraph`}
                      >
                        This API is <i>stateless</i>, meaning each request is
                        independent of others. For multi-turn conversations,
                        simply append new messages to the &apos;messages&apos;
                        array in the next call.
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
                                backgroundColor: 'var(--dashboard-foreground)',
                                marginTop: '8px',
                              }}
                            />
                          }
                        >
                          <List.Item>
                            <a
                              className={`text-sm text-[--dashboard-button] transition-colors duration-200 hover:text-[--dashboard-button-hover] ${montserrat_paragraph.variable} font-montserratParagraph`}
                              href="https://platform.openai.com/docs/api-reference/chat/create"
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              OpenAI API documentation
                              <IconExternalLink
                                size={18}
                                className="inline-block pl-1"
                                style={{ position: 'relative', top: '-2px' }}
                              />
                            </a>
                          </List.Item>
                          <List.Item>
                            <a
                              className={`text-sm text-[--dashboard-button] transition-colors duration-200 hover:text-[--dashboard-button-hover] ${montserrat_paragraph.variable} font-montserratParagraph`}
                              href="https://docs.uiuc.chat/api/endpoints"
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              UIUC.chat API documentation
                              <IconExternalLink
                                size={18}
                                className="inline-block pl-1"
                                style={{ position: 'relative', top: '-2px' }}
                              />
                            </a>
                          </List.Item>
                        </List>
                        <Title
                          className={`label ${montserrat_paragraph.variable} inline-block select-text font-montserratParagraph`}
                          size="md"
                          order={5}
                          style={{ marginTop: '1.5rem' }}
                        >
                          Notes:
                        </Title>
                        <List
                          withPadding
                          className={`${montserrat_paragraph.variable} font-montserratParagraph text-[--dashboard-foreground]`}
                          spacing="xs"
                        >
                          <List.Item>
                            NCSA hosted models like Qwen and Llama are hosted by
                            NCSA and they are free!
                          </List.Item>
                          <List.Item>
                            GPT-4o-mini offers the best price/performance ratio
                          </List.Item>
                          <List.Item>
                            UIUC.chat automatically manages LLM provider keys -
                            just add them in the LLMs page.
                          </List.Item>
                          <List.Item>
                            For getting only RAG results, set retrieval_only to
                            true. This will not invoke the LLM.
                          </List.Item>
                        </List>
                      </Text>
                    </div>
                  </Collapse>
                </Paper>

                <div
                  style={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    background: 'var(--dashboard-background-faded)',
                    paddingTop: '1.5rem',
                    paddingBottom: '1rem',
                    borderRadius: '1rem',
                  }}
                >
                  <div style={{ width: '100%' }}>
                    <APIRequestBuilder
                      course_name={course_name}
                      apiKey={apiKey}
                      courseMetadata={metadata}
                    />
                  </div>
                </div>
              </Group>
            </div>
          </div>
        </div>
        <div
          style={{
            flex: isSmallScreen ? '1 1 100%' : '1 1 40%',
            padding: '1rem',
            color: 'var(--dashboard-foreground)',
            backgroundColor: 'var(--dashboard-sidebar-background)',
            borderLeft: isSmallScreen
              ? ''
              : '1px solid var(--dashboard-border)',
          }}
        >
          <div className="card flex h-full flex-col">
            <div className="flex w-full flex-col items-center px-3 pt-12">
              <Title
                className={`label ${montserrat_heading.variable} font-montserratHeading`}
                order={2}
                style={{ marginBottom: '1rem' }}
              >
                Your API Key
              </Title>
              {apiKey && (
                <Input
                  value={apiKey}
                  className={`${montserrat_paragraph.variable} mt-4 w-full font-montserratParagraph`}
                  radius={'md'}
                  size={'md'}
                  readOnly
                  rightSection={
                    <Button
                      onClick={() => handleCopyApiKey(apiKey)}
                      variant="subtle"
                      size="sm"
                      radius={'md'}
                      className="min-w-[5rem] -translate-x-1 transform rounded-s-md bg-[--dashboard-button] text-[--dashboard-button-foreground] hover:bg-[--dashboard-button-hover] focus:shadow-none focus:outline-none"
                    >
                      {copiedApiKey ? <IconCheck /> : <IconCopy />}
                    </Button>
                  }
                  rightSectionWidth={'auto'}
                  // className="mt-4 w-full rounded-full"
                  styles={{
                    input: {
                      color: 'var(--foreground)',
                      backgroundColor: 'var(--background-faded)',
                      borderColor: 'var(--background-dark)',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      '&:focus': {
                        borderColor: 'var(--illinois-orange)',
                      },
                    },
                    wrapper: {
                      width: '100%',
                    },
                  }}
                />
              )}
            </div>
            {!apiKey && !loading && (
              <Button
                onClick={handleGenerate}
                disabled={loading || apiKey !== null}
                size="lg"
                radius={'xl'}
                className="min-w-[5rem] self-center rounded-md bg-[--dashboard-button] text-[--dashboard-button-foreground] hover:bg-[--dashboard-button-hover] focus:shadow-none focus:outline-none"
                // w={'60%'}
              >
                Generate API Key
              </Button>
            )}
            {apiKey && !loading && (
              <>
                <Group
                  position="center"
                  variant="column"
                  mt="1rem"
                  mb={'3rem'}
                  pt={'lg'}
                >
                  <Button
                    onClick={handleRotate}
                    disabled={loading || apiKey === null}
                    size="md"
                    radius={'xl'}
                    className="min-w-[5rem] rounded-md bg-[--dashboard-button] text-[--dashboard-button-foreground] hover:bg-[--dashboard-button-hover] focus:shadow-none focus:outline-none"
                    w={'auto'}
                  >
                    Rotate API Key
                  </Button>
                  <Button
                    onClick={handleDelete}
                    disabled={loading || apiKey === null}
                    size="md"
                    radius={'xl'}
                    className="min-w-[5rem] rounded-md bg-[--dashboard-button] text-[--dashboard-button-foreground] hover:bg-[--dashboard-button-hover] focus:shadow-none focus:outline-none"
                    w={'auto'}
                  >
                    Delete API Key
                  </Button>
                </Group>
              </>
            )}
          </div>
        </div>
      </Flex>
    </Card>
  )
}

export default ApiKeyManagement
