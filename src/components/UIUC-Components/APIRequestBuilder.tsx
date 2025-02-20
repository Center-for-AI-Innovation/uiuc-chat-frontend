import { useState, useEffect } from 'react'
import {
  Textarea,
  Select,
  Button,
  Title,
  Switch,
  Divider,
  Slider,
  Tooltip,
} from '@mantine/core'
import { IconCheck, IconCopy, IconChevronDown, IconInfoCircle } from '@tabler/icons-react'
import { useGetProjectLLMProviders } from '~/hooks/useProjectAPIKeys'
import { findDefaultModel } from './api-inputs/LLMsApiKeyInputForm'
import { montserrat_heading, montserrat_paragraph } from 'fonts'

interface APIRequestBuilderProps {
  course_name: string
  apiKey: string | null
  courseMetadata?: {
    system_prompt?: string
  }
}

export default function APIRequestBuilder({
  course_name,
  apiKey,
  courseMetadata,
}: APIRequestBuilderProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<
    'curl' | 'python' | 'node'
  >('curl')
  const [copiedCodeSnippet, setCopiedCodeSnippet] = useState(false)
  const [userQuery, setUserQuery] = useState('What is in these documents?')
  const [systemPrompt, setSystemPrompt] = useState(
    courseMetadata?.system_prompt ||
      'You are a helpful AI assistant. Follow instructions carefully. Respond using markdown.',
  )
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [retrievalOnly, setRetrievalOnly] = useState(false)
  const [streamEnabled, setStreamEnabled] = useState(true)
  const [temperature, setTemperature] = useState(0.1)

  const { data: llmProviders } = useGetProjectLLMProviders({
    projectName: course_name,
  })

  useEffect(() => {
    if (llmProviders) {
      const defaultModel = findDefaultModel(llmProviders)
      if (defaultModel) {
        setSelectedModel(defaultModel.id)
      }
    }
  }, [llmProviders])

  useEffect(() => {
    if (courseMetadata?.system_prompt) {
      setSystemPrompt(courseMetadata.system_prompt)
    }
  }, [courseMetadata?.system_prompt])

  const languageOptions = [
    { value: 'curl', label: 'cURL' },
    { value: 'python', label: 'Python' },
    { value: 'node', label: 'Node.js' },
  ]

  const modelOptions = llmProviders
    ? Object.entries(llmProviders).flatMap(([provider, config]) =>
        config.enabled && config.models && provider !== 'WebLLM'
          ? config.models
              .filter((model) => model.enabled)
              .map((model) => ({
                group: provider,
                value: model.id,
                label: model.name,
              }))
          : [],
      )
    : []

  const handleCopyCodeSnippet = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCodeSnippet(true)
    setTimeout(() => setCopiedCodeSnippet(false), 2000)
  }

  const baseUrl = process.env.VERCEL_URL || window.location.origin

  const codeSnippets = {
    curl: `curl -X POST ${baseUrl}/api/chat-api/chat \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${selectedModel}",
    "messages": [
      {
        "role": "system",
        "content": "${systemPrompt}"
      },
      {
        "role": "user",
        "content": "${userQuery}"
      }
    ],
    "api_key": "${apiKey || 'YOUR-API-KEY'}",
    "course_name": "${course_name}",
    "stream": ${streamEnabled},
    "temperature": ${temperature.toFixed(1)},
    "retrieval_only": ${retrievalOnly}
  }'`,
    python: `import requests

url = "${baseUrl}/api/chat-api/chat"
headers = {
  'Content-Type': 'application/json'
}
data = {
  "model": "${selectedModel}",
  "messages": [
    {
      "role": "system",
      "content": "${systemPrompt}"
    },
    {
      "role": "user",
      "content": "${userQuery}"
    }
  ],
  "api_key": "${apiKey || 'YOUR-API-KEY'}",
  "course_name": "${course_name}",
  "stream": ${streamEnabled ? 'True' : 'False'},
  "temperature": ${temperature.toFixed(1)},
  "retrieval_only": ${retrievalOnly ? 'True' : 'False'}
}

response = requests.post(url, headers=headers, json=data)
${streamEnabled ? 'print(response.text)' : 'print(response.json())'}`,
    node: `const data = {
  "model": "${selectedModel}",
  "messages": [
    {
      "role": "system",
      "content": "${systemPrompt}"
    },
    {
      "role": "user",
      "content": "${userQuery}"
    }
  ],
  "api_key": "${apiKey || 'YOUR-API-KEY'}",
  "course_name": "${course_name}",
  "stream": ${streamEnabled},
  "temperature": ${temperature},
  "retrieval_only": ${retrievalOnly}
};

fetch('${baseUrl}/api/chat-api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(data)
})
${
  streamEnabled
    ? `.then(response => response.text())
.then(data => {
  console.log(data);
})`
    : `.then(response => response.json())
.then(data => {
  console.log(data);
})`
}
.catch(error => {
  console.error('Error:', error);
});`,
  }

  return (
    <div className="w-full px-4 sm:px-10">
      <Title
        order={3}
        variant="gradient"
        gradient={{ from: 'gold', to: 'white', deg: 50 }}
        className={`text-left ${montserrat_heading.variable} font-montserratHeading`}
      >
        Request Builder
      </Title>

      <Divider
        my="lg"
        size="md"
        className="-mx-4 border-t-2 border-gray-600 sm:-mx-10"
      />

      <div className="space-y-6">
        <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
          <Select
            placeholder="Select language"
            data={languageOptions}
            value={selectedLanguage}
            radius={'md'}
            onChange={(value: 'curl' | 'python' | 'node') =>
              setSelectedLanguage(value)
            }
            styles={(theme) => ({
              input: {
                '&:focus': {
                  borderColor: '#6e56cf',
                },
                backgroundColor: '#1a1b3e',
                fontFamily: `var(--font-montserratParagraph), ${theme.fontFamily}`,
                cursor: 'pointer',
              },
              dropdown: {
                backgroundColor: '#1a1b3e',
              },
              item: {
                '&[data-selected]': {
                  backgroundColor: theme.colors.grape[9],
                  '&:hover': {
                    backgroundColor: theme.colors.grape[8],
                  },
                },
                fontFamily: `var(--font-montserratParagraph), ${theme.fontFamily}`,
                cursor: 'pointer',
              },
              rightSection: {
                pointerEvents: 'none',
                color: theme.colors.gray[5],
              },
            })}
            className={`w-full flex-shrink-0 sm:w-[150px] ${montserrat_paragraph.variable} font-montserratParagraph`}
            rightSection={<IconChevronDown size={14} />}
          />
          <div className="flex w-full items-center gap-2">
            <Select
              placeholder="Select model"
              data={modelOptions}
              value={selectedModel}
              onChange={(value) => setSelectedModel(value || '')}
              searchable
              radius={'md'}
              maxDropdownHeight={400}
              styles={(theme) => ({
                input: {
                  '&:focus': {
                    borderColor: '#6e56cf',
                  },
                  backgroundColor: '#1a1b3e',
                  fontFamily: `var(--font-montserratParagraph), ${theme.fontFamily}`,
                  cursor: 'pointer',
                  minWidth: 0,
                  flex: '1 1 auto',
                },
                dropdown: {
                  backgroundColor: '#1a1b3e',
                },
                item: {
                  '&[data-selected]': {
                    backgroundColor: theme.colors.grape[9],
                    '&:hover': {
                      backgroundColor: theme.colors.grape[8],
                    },
                  },
                  fontFamily: `var(--font-montserratParagraph), ${theme.fontFamily}`,
                  cursor: 'pointer',
                  whiteSpace: 'normal',
                  lineHeight: 1.2,
                },
                rightSection: {
                  pointerEvents: 'none',
                  color: theme.colors.gray[5],
                },
              })}
              className={`min-w-0 flex-1 ${montserrat_paragraph.variable} font-montserratParagraph`}
              rightSection={<IconChevronDown size={14} />}
            />
            <Button
              onClick={() =>
                handleCopyCodeSnippet(codeSnippets[selectedLanguage])
              }
              variant="subtle"
              size="xs"
              className="h-[36px] w-[50px] flex-shrink-0 transform rounded-md bg-purple-800 text-white hover:border-indigo-600 hover:bg-indigo-600 hover:text-white focus:shadow-none focus:outline-none"
            >
              {copiedCodeSnippet ? <IconCheck /> : <IconCopy />}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Title
            order={4}
            className={`font-medium text-white ${montserrat_paragraph.variable} font-montserratParagraph`}
          >
            System Prompt
          </Title>
          <Textarea
            placeholder="System Prompt"
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.currentTarget.value)}
            minRows={2}
            radius={'md'}
            className={`border-gray-600 bg-[#1a1b3e] ${montserrat_paragraph.variable} font-montserratParagraph`}
            styles={(theme) => ({
              input: {
                backgroundColor: '#1a1b3e',
                borderColor: '#4a4b6a',
                '&:focus': {
                  borderColor: '#6e56cf',
                },
                fontFamily: `var(--font-montserratParagraph), ${theme.fontFamily}`,
              },
            })}
          />
        </div>

        <div className="space-y-2">
          <Title
            order={4}
            className={`font-medium text-white ${montserrat_paragraph.variable} font-montserratParagraph`}
          >
            User Query
          </Title>
          <Textarea
            placeholder="User Query"
            value={userQuery}
            onChange={(e) => setUserQuery(e.currentTarget.value)}
            minRows={2}
            radius={'md'}
            className={`border-gray-600 bg-[#1a1b3e] ${montserrat_paragraph.variable} font-montserratParagraph`}
            styles={(theme) => ({
              input: {
                backgroundColor: '#1a1b3e',
                borderColor: '#4a4b6a',
                '&:focus': {
                  borderColor: '#6e56cf',
                },
                fontFamily: `var(--font-montserratParagraph), ${theme.fontFamily}`,
              },
            })}
          />
        </div>

        <div className="space-y-2">
          <Title
            order={4}
            className={`font-medium text-white ${montserrat_paragraph.variable} font-montserratParagraph`}
          >
            Temperature
          </Title>
          <Slider
            value={temperature}
            onChange={setTemperature}
            min={0}
            max={1}
            step={0.1}
            label={(value) => value.toFixed(1)}
            styles={(theme) => ({
              track: {
                backgroundColor: '#4a4b6a',
              },
              bar: {
                backgroundColor: theme.colors.grape[6],
              },
              thumb: {
                borderColor: theme.colors.grape[6],
                backgroundColor: theme.colors.grape[6],
              },
              label: {
                backgroundColor: theme.colors.grape[6],
                fontFamily: `var(--font-montserratParagraph), ${theme.fontFamily}`,
              },
            })}
            className="mt-4"
          />
        </div>

        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={retrievalOnly}
              onChange={(event) => setRetrievalOnly(event.currentTarget.checked)}
              label="Retrieval Only"
              size="md"
              color="grape"
              className={`mt-4 ${montserrat_paragraph.variable} font-montserratParagraph`}
              styles={(theme) => ({
                track: {
                  backgroundColor: '#4a4b6a',
                },
                label: {
                  fontFamily: `var(--font-montserratParagraph), ${theme.fontFamily}`,
                },
              })}
            />
            <Tooltip
              label="Retrieval Only bypasses the LLM call, making it free to retrieve relevant documents that match your prompt."
              position="top"
              multiline
              width={220}
              withArrow
              styles={(theme) => ({
                tooltip: {
                  backgroundColor: theme.colors.dark[7],
                  color: theme.colors.gray[0],
                  fontFamily: `var(--font-montserratParagraph), ${theme.fontFamily}`,
                },
              })}
            >
              <IconInfoCircle 
                size={16} 
                className="mt-4 text-gray-400 cursor-help"
              />
            </Tooltip>
          </div>

          <Switch
            checked={streamEnabled}
            onChange={(event) => setStreamEnabled(event.currentTarget.checked)}
            label="Stream Response"
            size="md"
            color="grape"
            className={`mt-4 ${montserrat_paragraph.variable} font-montserratParagraph`}
            styles={(theme) => ({
              track: {
                backgroundColor: '#4a4b6a',
              },
              label: {
                fontFamily: `var(--font-montserratParagraph), ${theme.fontFamily}`,
              },
            })}
          />
        </div>

        <div className="text-sm text-gray-400">
          <a 
            href="https://docs.uiuc.chat/api/endpoints#image-input-example" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300"
          >
            Using image inputs (docs) →
          </a>
        </div>

        <Textarea
          value={codeSnippets[selectedLanguage]}
          autosize
          variant="unstyled"
          readOnly
          className="relative mt-4 w-full min-w-0 overflow-x-auto rounded-xl bg-[#0c0c27] pl-4 text-sm text-white sm:min-w-[20rem] sm:pl-8 sm:text-base"
          styles={{
            input: {
              fontFamily: 'monospace',
            },
          }}
        />
      </div>
    </div>
  )
}
