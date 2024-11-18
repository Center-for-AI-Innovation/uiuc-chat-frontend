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
} from '@mantine/core'
import { useClipboard, useMediaQuery } from '@mantine/hooks'
import { showNotification } from '@mantine/notifications'
import { type UserResource } from '@clerk/types'
import { IconCheck, IconCopy, IconExternalLink } from '@tabler/icons-react'
import { montserrat_heading } from 'fonts'
import style from 'react-syntax-highlighter/dist/esm/styles/hljs/a11y-dark'

const ApiKeyManagement = ({
  course_name,
  clerk_user,
}: {
  course_name: string
  clerk_user: {
    isLoaded: boolean
    isSignedIn: boolean
    user: UserResource | undefined
  }
}) => {
  const theme = useMantineTheme()
  const isSmallScreen = useMediaQuery('(max-width: 960px)')
  const { copy } = useClipboard()
  const [apiKey, setApiKey] = useState<string | null>(null)
  const baseUrl = process.env.VERCEL_URL || window.location.origin
  const [loading, setLoading] = useState(true)
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
      const response = await fetch(`/api/chat-api/keys/fetch`, {
        method: 'GET',
        headers: {
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
  }, [clerk_user.isLoaded])

  const handleGenerate = async () => {
    const response = await fetch(`/api/chat-api/keys/generate`, {
      method: 'POST',
      headers: {
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
      style={{ maxWidth: '85%', width: '100%', marginTop: '2%' }}
    >
      <Flex
        direction={isSmallScreen ? 'column' : 'row'}
        style={{ height: '100%' }}
      >
        <div
          style={{
            flex: isSmallScreen ? '1 1 100%' : '1 1 60%',
            padding: '1rem',
            color: 'white',
            alignItems: 'center',
          }}
          className="min-h-full justify-center bg-gradient-to-r from-purple-900 via-indigo-800 to-blue-800"
        >
          <div className="card flex h-full flex-col">
            <Group
              // spacing="lg"
              m="3rem"
              align="center"
              variant="column"
              style={{
                justifyContent: 'center',
                width: '75%',
                alignSelf: 'center',
                overflow: 'hidden',
              }}
            >
              <Title
                order={2}
                variant="gradient"
                gradient={{ from: 'gold', to: 'white', deg: 50 }}
                style={{ marginBottom: '0.5rem' }}
                align="center"
                className={`label ${montserrat_heading.variable} font-montserratHeading`}
              >
                API Key Management
              </Title>
              <Title order={4} w={'90%'}>
                This API is <i>stateless</i>, meaning each request is
                independent of others. For multi-turn conversations, simply
                append new messages to the &apos;messages&apos; array in the
                next call. Our API closely mirrors OpenAI&apos;s Chat API,
                please refer to the{' '}
                <a
                  href="https://platform.openai.com/docs/api-reference/chat/create"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-purple-500 hover:underline ${montserrat_heading.variable} font-montserratHeading`}
                >
                  OpenAI API documentation{' '}
                  <IconExternalLink
                    className="mr-2 inline-block"
                    style={{ position: 'relative', top: '-3px' }}
                  />
                </a>
              </Title>
              <Title order={4} w={'90%'}>
                <code
                  style={{
                    backgroundColor: '#020307',
                    borderRadius: '5px',
                    padding: '1px 5px',
                    fontFamily: 'monospace',
                    alignItems: 'center',
                    justifyItems: 'center',
                  }}
                >
                  llama3.1:70b
                </code>{' '}
                is hosted by NCSA and it&apos;s free. However the best
                price/performance LLM is{' '}
                <code
                  style={{
                    backgroundColor: '#020307',
                    borderRadius: '5px',
                    padding: '1px 5px',
                    fontFamily: 'monospace',
                    alignItems: 'center',
                    justifyItems: 'center',
                  }}
                >
                  GPT-4o-mini
                </code>
                . For OpenAI models, just add your{' '}
                <code
                  style={{
                    backgroundColor: '#020307',
                    borderRadius: '5px',
                    padding: '1px 5px',
                    fontFamily: 'monospace',
                    alignItems: 'center',
                    justifyItems: 'center',
                  }}
                >
                  openai_key
                </code>{' '}
                to the request.
              </Title>
              <Title order={4} w={'90%'}>
                Read our UIUC.chat API docs:{' '}
                <a
                  href="https://docs.uiuc.chat/api/endpoints"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-purple-500 hover:underline ${montserrat_heading.variable} font-montserratHeading`}
                >
                  docs.uiuc.chat/api{' '}
                  <IconExternalLink
                    className="mr-2 inline-block"
                    style={{ position: 'relative', top: '-3px' }}
                  />
                </a>
              </Title>
              <div
                style={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  background: '#15162c',
                  paddingTop: '1rem',
                  borderRadius: '1rem',
                }}
              >
                <div
                  style={{
                    width: '95%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#15162c',
                    paddingBottom: '1rem',
                  }}
                >
                  <Title
                    order={3}
                    align="left"
                    variant="gradient"
                    gradient={{ from: 'gold', to: 'white', deg: 50 }}
                    style={{ flexGrow: 2, marginLeft: '1rem' }}
                  >
                    Example Request
                  </Title>
                  <Select
                    placeholder="Select an option"
                    data={languageOptions}
                    value={selectedLanguage}
                    style={{ width: '7rem' }} // Ensures the button is wide enough to show all text and does not shrink
                    onChange={(value: string | null) => {
                      if (
                        value === 'curl' ||
                        value === 'python' ||
                        value === 'node'
                      ) {
                        setSelectedLanguage(value)
                      }
                    }}
                    // style={{ width: '30%', minWidth: '20px' }}
                  />
                  <Button
                    onClick={() =>
                      handleCopyCodeSnippet(codeSnippets[selectedLanguage])
                    }
                    variant="subtle"
                    size="xs"
                    className="ms-2 min-h-[2.5rem] transform rounded-bl-xl rounded-br-md rounded-tl-md rounded-tr-xl bg-purple-800 text-white hover:border-indigo-600 hover:bg-indigo-600 hover:text-white focus:shadow-none focus:outline-none"
                  >
                    {copiedCodeSnippet ? <IconCheck /> : <IconCopy />}
                  </Button>
                </div>
                <Textarea
                  value={codeSnippets[selectedLanguage] as string}
                  autosize
                  variant="unstyled"
                  wrapperProps={{ overflow: 'hidden' }}
                  className="relative w-[100%] min-w-[20rem] overflow-hidden rounded-b-xl border-t-2 border-gray-400 bg-[#0c0c27] pl-8 text-white"
                  readOnly
                />
              </div>
            </Group>
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
                  className="mt-4 w-full"
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
                  styles={(theme) => ({
                    input: {
                      paddingRight: '90px',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                    },
                  })}
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
