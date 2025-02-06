import { useState, useEffect } from 'react'
import {
  Textarea,
  Select,
  Button,
  Text,
  Group,
  ActionIcon,
  Title,
} from '@mantine/core'
import { IconCheck, IconCopy } from '@tabler/icons-react'
import { useGetProjectLLMProviders } from '~/hooks/useProjectAPIKeys'
import { findDefaultModel } from './api-inputs/LLMsApiKeyInputForm'
import { CourseMetadata } from '~/types/courseMetadata'

interface APIRequestMakerProps {
  course_name: string
  apiKey: string | null
  courseMetadata?: {
    system_prompt?: string
  }
}

export default function APIRequestMaker({ course_name, apiKey, courseMetadata }: APIRequestMakerProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<'curl' | 'python' | 'node'>('curl')
  const [copiedCodeSnippet, setCopiedCodeSnippet] = useState(false)
  const [userQuery, setUserQuery] = useState('What is in these documents?')
  const [systemPrompt, setSystemPrompt] = useState(
    courseMetadata?.system_prompt || 'You are a helpful AI assistant. Follow instructions carefully. Respond using markdown.'
  )
  console.log(courseMetadata?.system_prompt)
  const [selectedModel, setSelectedModel] = useState<string>('')

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
      console.log("changing system prompt")
      setSystemPrompt(courseMetadata.system_prompt)
    }
  }, [courseMetadata?.system_prompt])

  const languageOptions = [
    { value: 'curl', label: 'cURL' },
    { value: 'python', label: 'Python' },
    { value: 'node', label: 'Node.js' },
  ]

  const handleCopyCodeSnippet = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCodeSnippet(true)
    setTimeout(() => setCopiedCodeSnippet(false), 2000)
  }

  const modelOptions = llmProviders
    ? Object.entries(llmProviders).flatMap(([provider, config]) =>
      config.enabled && config.models
        ? config.models
          .filter((model) => model.enabled)
          .map((model) => ({
            value: model.id,
            label: `${provider} - ${model.name}`,
          }))
        : []
    )
    : []

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
    "stream": true,
    "temperature": 0.1
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
  "stream": True,
  "temperature": 0.1
}

response = requests.post(url, headers=headers, json=data)
print(response.json())`,
    node: `const axios = require('axios');

const data = {
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
  "stream": true,
  "temperature": 0.1
};

axios.post('${baseUrl}/api/chat-api/chat', data, {
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(response => {
  console.log(response.data);
})
.catch(error => {
  console.error(error);
});`
  }

  return (
    <>
      <div className="flex justify-center w-full">
        <div className="w-full max-w-3xl">
        <div className="flex gap-2 mb-4 w-full">
            <Select
              placeholder="Select language"
              data={languageOptions}
              value={selectedLanguage}
              onChange={(value: 'curl' | 'python' | 'node') => setSelectedLanguage(value)}
              style={{ width: '150px', flexShrink: 0 }}
            />
            <Select
              placeholder="Select model"
              data={modelOptions}
              value={selectedModel}
              onChange={(value) => setSelectedModel(value || '')}
              searchable
              style={{ flex: '1' }}
            />
            <Button
              onClick={() => handleCopyCodeSnippet(codeSnippets[selectedLanguage])}
              variant="subtle"
              size="xs"
              style={{ width: '50px', flexShrink: 0, height: '36px' }}
              className="transform rounded-md bg-purple-800 text-white hover:border-indigo-600 hover:bg-indigo-600 hover:text-white focus:shadow-none focus:outline-none"
            >
              {copiedCodeSnippet ? <IconCheck /> : <IconCopy />}
            </Button>
          </div>
          <Title order={4} mb="xs" className="text-white">System Prompt</Title>
          <Textarea
            placeholder="System Prompt"
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.currentTarget.value)}
            minRows={2}
            mb="md"
          />
          <Title order={4} mb="xs" className="text-white">User Query</Title>
          <Textarea
            placeholder="User Query"
            value={userQuery}
            onChange={(e) => setUserQuery(e.currentTarget.value)}
            minRows={2}
            mb="md"
          />

          <Textarea
            value={codeSnippets[selectedLanguage]}
            autosize
            variant="unstyled"
            readOnly
            className="relative w-[100%] min-w-[20rem] overflow-hidden rounded-b-xl border-t-2 border-gray-400 bg-[#0c0c27] pl-8 text-white"
          />
        </div>
      </div>
    </>
  )
}