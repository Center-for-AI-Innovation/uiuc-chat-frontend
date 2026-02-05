import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'

import { renderWithProviders } from '~/test-utils/renderWithProviders'

vi.mock('~/hooks/useProjectAPIKeys', () => ({
  useGetProjectLLMProviders: () => ({
    data: {
      OpenAI: {
        provider: 'OpenAI',
        enabled: true,
        models: [
          {
            id: 'gpt-4o-mini',
            name: 'GPT-4o mini',
            enabled: true,
            default: true,
          },
        ],
      },
    },
  }),
}))

import APIRequestBuilder from '../APIRequestBuilder'

describe('APIRequestBuilder', () => {
  it('renders a request builder and shows a code snippet textarea', async () => {
    renderWithProviders(<APIRequestBuilder course_name="CS101" apiKey={null} />)
    expect(screen.getByText('Request Builder')).toBeInTheDocument()

    const snippet = await screen.findByDisplayValue(/curl -X POST/i)
    expect(String((snippet as HTMLTextAreaElement).value)).toContain(
      '/api/chat-api/chat',
    )
  })
})
