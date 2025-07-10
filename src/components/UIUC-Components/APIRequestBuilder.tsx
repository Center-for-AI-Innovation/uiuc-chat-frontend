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
import {
  IconCheck,
  IconCopy,
  IconChevronDown,
  IconInfoCircle,
} from '@tabler/icons-react'
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
${
  streamEnabled
    ? `for chunk in response.iter_lines():
    if chunk:
        print(chunk.decode())`
    : `# Print just the message
print(response.json().get('message'))

# Optionally print contexts
# print(response.json().get('contexts'))`
}`,
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
  "stream": false,
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
.then(response => response.json())
.then(data => {
  // Print just the message
  console.log(data.message);
  
  // Optionally print contexts
  // console.log(data.contexts);
})
.catch(error => {
  console.error('Error:', error);
});`,
  }

  const styles = {
    container: {
      backgroundColor: 'var(--illinois-background-darker)',
      border: '1px solid var(--illinois-storm-dark)',
    },
    input: {
      backgroundColor: 'var(--illinois-background-dark)',
      color: 'var(--illinois-white)',
      border: '1px solid var(--illinois-storm-light)',
    },
    button: {
      backgroundColor: 'var(--illinois-industrial)',
      color: 'var(--illinois-white)',
      '&:hover': {
        backgroundColor: 'var(--illinois-blue)',
      },
    },
  }

  return (
    <div className="w-full px-4 sm:px-10">
      <Title
        order={3}
        className={`text-left ${montserrat_heading.variable} font-montserratHeading text-[--dashboard-foreground]`}
      >
        Request Builder
      </Title>

      <Divider
        my="lg"
        size="md"
        className="-mx-4 border-[--dashboard-background-dark] sm:-mx-10"
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
                  borderColor: 'var(--dashboard-button)',
                },
                color: 'var(--foreground)',
                backgroundColor: 'var(--background)',
                fontFamily: `var(--font-montserratParagraph), ${theme.fontFamily}`,
                cursor: 'pointer',
                minWidth: 0,
                flex: '1 1 auto',
              },
              dropdown: {
                backgroundColor: 'var(--background)',
                border: '1px solid var(--background-dark)',
              },
              item: {
                color: 'var(--foreground)',
                backgroundColor: 'var(--background)',
                borderRadius: theme.radius.md,
                margin: '2px',
                '&[data-selected]': {
                  '&': {
                    color: 'var(--foreground)',
                    backgroundColor: 'transparent',
                  },
                  '&:hover': {
                    color: 'var(--foreground)',
                    backgroundColor: 'var(--foreground-faded)',
                  },
                },
                '&[data-hovered]': {
                  color: 'var(--foreground)',
                  backgroundColor: 'var(--foreground-faded)',
                },
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
                    borderColor: 'var(--dashboard-button)',
                  },
                  color: 'var(--foreground)',
                  backgroundColor: 'var(--background)',
                  fontFamily: `var(--font-montserratParagraph), ${theme.fontFamily}`,
                  cursor: 'pointer',
                  minWidth: 0,
                  flex: '1 1 auto',
                },
                dropdown: {
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--background-dark)',
                },
                item: {
                  color: 'var(--foreground)',
                  backgroundColor: 'var(--background)',
                  borderRadius: theme.radius.md,
                  margin: '2px',
                  '&[data-selected]': {
                    '&': {
                      backgroundColor: 'transparent',
                    },
                    '&:hover': {
                      color: 'var(--foreground)',
                      backgroundColor: 'var(--foreground-faded)',
                    },
                  },
                  '&[data-hovered]': {
                    color: 'var(--foreground)',
                    backgroundColor: 'var(--foreground-faded)',
                  },
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
              className="h-[36px] w-[50px] flex-shrink-0 transform rounded-md bg-[--dashboard-button] text-[--dashboard-button-foreground] hover:bg-[--dashboard-button-hover] focus:shadow-none focus:outline-none"
            >
              {copiedCodeSnippet ? <IconCheck /> : <IconCopy />}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Title
            order={4}
            className={`font-medium ${montserrat_paragraph.variable} font-montserratParagraph text-[--dashboard-foreground]`}
          >
            System Prompt
          </Title>
          <Textarea
            placeholder="System Prompt"
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.currentTarget.value)}
            minRows={2}
            radius={'md'}
            className={`${montserrat_paragraph.variable} font-montserratParagraph`}
            styles={(theme) => ({
              input: {
                color: 'var(--foreground)',
                backgroundColor: 'var(--background)',
                borderColor: 'var(--foreground-faded)',
                '&:focus': {
                  borderColor: 'var(--dashboard-button)',
                },
                fontFamily: `var(--font-montserratParagraph), ${theme.fontFamily}`,
              },
            })}
          />
        </div>

        <div className="space-y-2">
          <Title
            order={4}
            className={`font-medium ${montserrat_paragraph.variable} font-montserratParagraph text-[--dashboard-foreground]`}
          >
            User Query
          </Title>
          <Textarea
            placeholder="User Query"
            value={userQuery}
            onChange={(e) => setUserQuery(e.currentTarget.value)}
            minRows={2}
            radius={'md'}
            className={`${montserrat_paragraph.variable} font-montserratParagraph`}
            styles={(theme) => ({
              input: {
                color: 'var(--foreground)',
                backgroundColor: 'var(--background)',
                borderColor: 'var(--foreground-faded)',
                '&:focus': {
                  borderColor: 'var(--dashboard-button)',
                },
                fontFamily: `var(--font-montserratParagraph), ${theme.fontFamily}`,
              },
            })}
          />
        </div>

        <div className="space-y-2">
          <Title
            order={4}
            className={`font-medium ${montserrat_paragraph.variable} font-montserratParagraph text-[--dashboard-foreground]`}
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
                backgroundColor: 'var(--foreground-dark)',
              },
              bar: {
                backgroundColor: 'var(--dashboard-button)',
              },
              thumb: {
                border: '1.5px solid var(--dashboard-background-dark)',
                backgroundColor: 'var(--dashboard-button)',
              },
              label: {
                color: 'var(--dashboard-button-foreground)',
                backgroundColor: 'var(--dashboard-button)',
                fontFamily: `var(--font-montserratParagraph), ${theme.fontFamily}`,
                fontWeight: 'bold',
              },
            })}
            className="mt-4"
          />
        </div>

        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={retrievalOnly}
              onChange={(event) =>
                setRetrievalOnly(event.currentTarget.checked)
              }
              label="Retrieval Only"
              size="md"
              className={`mt-4 ${montserrat_paragraph.variable} font-montserratParagraph`}
              styles={(theme) => ({
                track: {
                  backgroundColor: retrievalOnly
                    ? 'var(--dashboard-button) !important'
                    : 'transparent',
                  borderColor: retrievalOnly
                    ? 'var(--dashboard-button) !important'
                    : 'var(--foreground-faded)',
                },
                label: {
                  color: 'var(--dashboard-foreground)',
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
                  backgroundColor: 'var(--background)',
                  color: 'var(--foreground)',
                  fontFamily: `var(--font-montserratParagraph), ${theme.fontFamily}`,
                },
              })}
            >
              <IconInfoCircle
                size={16}
                className="mt-4 cursor-help text-gray-400"
              />
            </Tooltip>
          </div>

          {selectedLanguage !== 'node' && (
            <Switch
              checked={streamEnabled}
              onChange={(event) =>
                setStreamEnabled(event.currentTarget.checked)
              }
              label="Stream Response"
              size="md"
              className={`mt-4 ${montserrat_paragraph.variable} font-montserratParagraph`}
              styles={(theme) => ({
                track: {
                  backgroundColor: streamEnabled
                    ? 'var(--dashboard-button) !important'
                    : 'transparent',
                  borderColor: streamEnabled
                    ? 'var(--dashboard-button) !important'
                    : 'var(--foreground-faded)',
                },
                label: {
                  color: 'var(--dashboard-foreground)',
                  fontFamily: `var(--font-montserratParagraph), ${theme.fontFamily}`,
                },
              })}
            />
          )}
        </div>

        <div className="text-sm text-gray-400">
          <a
            href="https://docs.uiuc.chat/api/endpoints#image-input-example"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[--dashboard-button] hover:text-[--dashboard-button-hover]"
          >
            Using image inputs (docs) →
          </a>
        </div>

        <Textarea
          value={codeSnippets[selectedLanguage]}
          autosize
          variant="unstyled"
          readOnly
          className="relative mt-4 w-full min-w-0 overflow-x-auto rounded-xl bg-[--background] pl-4 text-sm sm:min-w-[20rem] sm:pl-8 sm:text-base"
          styles={{
            input: {
              color: 'var(--foreground)',
              fontFamily: 'monospace',
            },
          }}
        />
      </div>
    </div>
  )
}
