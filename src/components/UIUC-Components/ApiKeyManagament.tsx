// src/components/UIUC-Components/ApiKeyManagement.tsx
import React, { useEffect, useState } from 'react'
import {
  Card,
  Title,
  Button,
  Text,
  Flex,
  Group,
  Input,
  useMantineTheme,
  Textarea,
  Select,
  Paper,
  Collapse,
  List,
} from '@mantine/core'
import { useClipboard, useMediaQuery } from '@mantine/hooks'
import { showNotification } from '@mantine/notifications'
// import { type UserResource } from '@clerk/types'
import { AuthContextProps } from 'react-oidc-context'
import {
  IconCheck,
  IconCopy,
  IconExternalLink,
  IconBook,
  IconChevronDown,
} from '@tabler/icons-react'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import style from 'react-syntax-highlighter/dist/esm/styles/hljs/a11y-dark'
import APIRequestBuilder from './APIRequestBuilder'
import { fetchCourseMetadata } from '~/utils/apiUtils'

// NOTE: will need to map userID from clerk to id from KeyCloak
const ApiKeyManagement = ({
  course_name,
  // clerk_user,
  auth,
}: {
  course_name: string
  // clerk_user: {
  //   isLoaded: boolean
  //   isSignedIn: boolean
  //   user: UserResource | undefined
  // }
  auth: AuthContextProps
}) => {
  const theme = useMantineTheme()
  const isSmallScreen = useMediaQuery('(max-width: 960px)')
  const { copy } = useClipboard()
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
  // Define a type for the keys of codeSnippets
  type Language = 'curl' | 'python' | 'node'

  // Ensure selectedLanguage is of type Language
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('curl')

  // State to track whether code snippet has been copied
  const [copiedCodeSnippet, setCopiedCodeSnippet] = useState(false)
  // State to track whether API key has been copied
  const [copiedApiKey, setCopiedApiKey] = useState(false)

  // Function to handle copying of code snippet
  const handleCopyCodeSnippet = (text: string) => {
    copy(text)
    setCopiedCodeSnippet(true)
    setTimeout(() => setCopiedCodeSnippet(false), 2000) // Reset after 2 seconds
  }

  // Function to handle copying of API key
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
      const response = await fetch(`/api/chat-api/keys/fetch`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${auth.user?.access_token}`,
          'Content-Type': 'application/json',
        },
      })

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
  // }, [clerk_user.isLoaded])

  const handleGenerate = async () => {
    const response = await fetch(`/api/chat-api/keys/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${auth.user?.access_token}`,
        'Content-Type': 'application/json',
      },
    })

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
    const response = await fetch(`/api/chat-api/keys/rotate`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${auth.user?.access_token}`,
        'Content-Type': 'application/json',
      },
    })

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
    const response = await fetch(`/api/chat-api/keys/delete`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${auth.user?.access_token}`,
        'Content-Type': 'application/json',
      },
    })

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

  return (
    <Card
      shadow="xs"
      padding="none"
      radius="xl"
      // style={{ maxWidth: '85%', width: '100%', marginTop: '2%' }}
      className="mt-[2%] w-[96%] md:w-[90%] 2xl:w-[90%]"
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
          className="min-h-full bg-gradient-to-r from-purple-900 via-indigo-800 to-blue-800"
        >
          <div className="w-full border-b border-white/10 bg-black/20 px-4 py-3 sm:px-6 sm:py-4 md:px-8">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <Title
                  order={2}
                  className={`${montserrat_heading.variable} font-montserratHeading text-lg text-white/90 sm:text-2xl`}
                >
                  API Key Management
                </Title>
                <Text className="text-white/60">/</Text>
                <Title
                  order={3}
                  variant="gradient"
                  gradient={{ from: 'gold', to: 'white', deg: 50 }}
                  className={`${montserrat_heading.variable} min-w-0 font-montserratHeading text-base sm:text-xl ${
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
              padding: '1rem',
              color: 'white',
              alignItems: 'center',
            }}
            className="min-h-full justify-center"
          >
            <div className="card flex h-full flex-col">
              <Group
                m="2rem"
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
                  className="w-full rounded-xl px-4 sm:px-6 md:px-8"
                  shadow="xs"
                  p="md"
                  sx={{
                    backgroundColor: '#15162c',
                    border: '1px solid rgba(147, 51, 234, 0.3)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: '#1a1b34',
                      borderColor: 'rgba(147, 51, 234, 0.5)',
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
                          color: 'hsl(280,100%,70%)',
                        }}
                      />
                      <Text
                        size="md"
                        weight={600}
                        className={`${montserrat_paragraph.variable} select-text font-montserratParagraph`}
                        variant="gradient"
                        gradient={{ from: 'gold', to: 'white', deg: 50 }}
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
                        color: 'hsl(280,100%,70%)',
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
                                backgroundColor: 'hsl(280,100%,70%)',
                                marginTop: '8px',
                              }}
                            />
                          }
                        >
                          <List.Item>
                            <a
                              className={`text-sm transition-colors duration-200 hover:text-purple-400 ${montserrat_paragraph.variable} font-montserratParagraph`}
                              style={{ color: 'hsl(280,100%,70%)' }}
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
                              className={`text-sm transition-colors duration-200 hover:text-purple-400 ${montserrat_paragraph.variable} font-montserratParagraph`}
                              style={{ color: 'hsl(280,100%,70%)' }}
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
                          className={`${montserrat_paragraph.variable} font-montserratParagraph`}
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
                    background: '#15162c',
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
            backgroundColor: '#15162c',
            color: 'white',
          }}
        >
          <div className="card flex h-full flex-col">
            <div className="flex w-full flex-col items-center px-3 pt-12">
              <Title
                className={`label ${montserrat_heading.variable} font-montserratHeading`}
                variant="gradient"
                gradient={{ from: 'gold', to: 'white', deg: 170 }}
                order={2}
                style={{ marginBottom: '1rem' }}
              >
                Your API Key
              </Title>
              {apiKey && (
                <Input
                  value={apiKey}
                  className={`${montserrat_paragraph.variable} mt-4 w-full font-montserratParagraph`}
                  radius={'xl'}
                  size={'md'}
                  readOnly
                  rightSection={
                    <Button
                      onClick={() => handleCopyApiKey(apiKey)}
                      variant="subtle"
                      size="sm"
                      radius={'xl'}
                      className="min-w-[5rem] -translate-x-1 transform rounded-s-md bg-purple-800 text-white hover:border-indigo-600 hover:bg-indigo-600 hover:text-white focus:shadow-none focus:outline-none"
                    >
                      {copiedApiKey ? <IconCheck /> : <IconCopy />}
                    </Button>
                  }
                  rightSectionWidth={'auto'}
                  styles={{
                    input: {
                      backgroundColor: '#1a1b3e',
                      paddingRight: '90px',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      fontFamily: `var(--font-montserratParagraph), ${theme.fontFamily}`,
                      borderColor: '#4a4b6a',
                      '&:focus': {
                        borderColor: '#6e56cf',
                      },
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
                className="min-w-[5rem] self-center rounded-md bg-purple-800 text-white hover:border-indigo-600 hover:bg-indigo-600 hover:text-white focus:shadow-none focus:outline-none"
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
                    className="min-w-[5rem] rounded-md bg-purple-800 text-white hover:border-indigo-600 hover:bg-indigo-600 hover:text-white focus:shadow-none focus:outline-none"
                    w={'auto'}
                  >
                    Rotate API Key
                  </Button>
                  <Button
                    onClick={handleDelete}
                    disabled={loading || apiKey === null}
                    size="md"
                    radius={'xl'}
                    className="min-w-[5rem] rounded-md bg-purple-800 text-white hover:border-indigo-600 hover:bg-indigo-600 hover:text-white focus:shadow-none focus:outline-none"
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
