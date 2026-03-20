/**
 * Comprehensive axe-core accessibility audit.
 *
 * Renders key UI components and runs the axe engine (~80+ WCAG 2.1 rules)
 * to catch missing aria-labels, invalid roles, missing form labels,
 * heading hierarchy issues, duplicate IDs, etc.
 *
 * Run with: npm run test:a11y
 */
import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'

import { renderWithProviders } from '~/test-utils/renderWithProviders'
import { makeConversation, makeMessage } from '~/test-utils/mocks/chat'

expect.extend(toHaveNoViolations)

// ---------- Shared mocks ----------

vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get: () => (props: any) => React.createElement('div', props),
    },
  ),
  AnimatePresence: ({ children }: any) =>
    React.createElement(React.Fragment, null, children),
}))

vi.mock('~/utils/apiUtils', async (importOriginal) => {
  const actual: any = await importOriginal()
  return {
    ...actual,
    callSetCourseMetadata: vi.fn(async () => true),
    uploadToS3: vi.fn(async () => 'cs101/logo.png'),
    fetchPresignedUrl: vi.fn(async () => 'http://localhost/api/file'),
  }
})

vi.mock('~/utils/toastUtils', () => ({
  showToast: vi.fn(),
  showErrorToast: vi.fn(),
  showWarningToast: vi.fn(),
  showInfoToast: vi.fn(),
}))

vi.mock('@/hooks/__internal__/conversation', async (importOriginal) => {
  const actual: any = await importOriginal()
  return {
    ...actual,
    saveConversationToServer: vi.fn(async () => ({})),
  }
})

vi.mock('@/utils/cryptoRandom', () => ({
  generateSecureRandomString: () => 'abc',
}))

vi.mock('@mantine/notifications', () => ({
  notifications: { show: vi.fn() },
}))

// ---------- Tests ----------

describe('axe accessibility audit', () => {
  it('CodeBlock has no violations', async () => {
    const { CodeBlock } = await import('~/components/Markdown/CodeBlock')
    const { container } = render(
      <CodeBlock language="javascript" value="const x = 1" />,
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('ChatInput has no violations', async () => {
    const { ChatInput } = await import('~/components/Chat/ChatInput')

    vi.mock('~/components/Chat/VariableModal', () => ({
      VariableModal: () => null,
    }))

    const { container } = renderWithProviders(
      <ChatInput
        onSend={vi.fn()}
        onScrollDownClick={vi.fn()}
        stopConversationRef={{ current: false }}
        textareaRef={{ current: null }}
        showScrollDownButton={false}
        inputContent=""
        setInputContent={vi.fn()}
        user_id="u1"
        courseName="CS101"
      />,
      {
        homeState: { messageIsStreaming: false, prompts: [] } as any,
        homeContext: { dispatch: vi.fn() },
      },
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('ChatLoader has no violations', async () => {
    const { ChatLoader } = await import('~/components/Chat/ChatLoader')
    const { container } = renderWithProviders(<ChatLoader />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('MessageActions has no violations', async () => {
    const { MessageActions } = await import('~/components/Chat/MessageActions')
    const message = makeMessage({
      id: 'a1',
      role: 'assistant' as const,
      content: 'Hello',
    })
    const { container } = renderWithProviders(
      <MessageActions
        message={message}
        messageIndex={0}
        isLastMessage={true}
        onRegenerate={vi.fn()}
        onFeedback={vi.fn()}
        onOpenFeedbackModal={vi.fn()}
      />,
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('ProjectTable (empty state) has no violations', async () => {
    globalThis.__TEST_AUTH__ = {
      isAuthenticated: true,
      isLoading: false,
      user: { profile: { email: 'u@example.com' } },
    }
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

    const ProjectTable = (
      await import('~/components/UIUC-Components/ProjectTable')
    ).default

    const { container } = renderWithProviders(<ProjectTable />)
    await screen.findByText(/You haven't created any projects yet/i)

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('ProjectTable (with rows) has no violations', async () => {
    globalThis.__TEST_AUTH__ = {
      isAuthenticated: true,
      isLoading: false,
      user: { profile: { email: 'u@example.com' } },
    }
    globalThis.__TEST_ROUTER__ = { push: vi.fn() }

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            CS101: {
              course_owner: 'owner@example.com',
              course_admins: [],
              is_private: false,
            },
          },
        ]),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    )

    const ProjectTable = (
      await import('~/components/UIUC-Components/ProjectTable')
    ).default

    const { container } = renderWithProviders(<ProjectTable />)
    await screen.findByText('CS101')

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('ShareSettingsModal has no violations', async () => {
    process.env.NEXT_PUBLIC_USE_ILLINOIS_CHAT_CONFIG = 'False'

    vi.mock('~/components/UIUC-Components/EmailListAccordion', () => ({
      default: ({ is_for_admins }: any) =>
        React.createElement('div', null, is_for_admins ? 'Admins' : 'Members'),
    }))

    const ShareSettingsModal = (
      await import('~/components/UIUC-Components/ShareSettingsModal')
    ).default

    const { container } = renderWithProviders(
      <ShareSettingsModal
        opened={true}
        onClose={vi.fn()}
        projectName="CS101"
        metadata={{ is_private: true, allow_logged_in_users: false } as any}
      />,
      { homeContext: { dispatch: vi.fn() } },
    )

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('SetExampleQuestions has no violations', async () => {
    const SetExampleQuestions = (
      await import('~/components/UIUC-Components/SetExampleQuestions')
    ).default

    const { container } = renderWithProviders(
      <SetExampleQuestions
        course_name="CS101"
        course_metadata={{ example_questions: ['Q1', 'Q2'] } as any}
      />,
    )

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('GlobalHeader has no violations', async () => {
    globalThis.__TEST_AUTH__ = {
      isLoading: false,
      isAuthenticated: true,
      user: { profile: { sub: 'u1', email: 'u1@example.com' } },
    }

    vi.mock('~/components/UIUC-Components/navbars/AuthMenu', () => ({
      AuthMenu: () => React.createElement('div', null, 'AuthMenu'),
    }))

    const { LandingPageHeader } = await import(
      '~/components/UIUC-Components/navbars/GlobalHeader'
    )

    const { container } = renderWithProviders(<LandingPageHeader />)

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('ChatNavbar has no violations', async () => {
    globalThis.__TEST_AUTH__ = {
      isLoading: false,
      isAuthenticated: false,
      user: null,
    }
    globalThis.__TEST_ROUTER__ = { asPath: '/CS101/chat', push: vi.fn() }

    vi.mock('@mantine/core', async (importOriginal) => {
      const actual: any = await importOriginal()
      return {
        ...actual,
        Burger: ({ onClick, opened }: any) =>
          React.createElement(
            'button',
            { type: 'button', 'aria-label': 'Toggle menu', onClick },
            opened ? 'open' : 'closed',
          ),
        Transition: ({ mounted, children }: any) =>
          mounted ? React.createElement('div', null, children({})) : null,
      }
    })

    vi.mock('~/components/UIUC-Components/navbars/ThemeToggle', () => ({
      ThemeToggle: () => React.createElement('div'),
    }))

    vi.mock('~/components/Chat/UserSettings', () => ({
      UserSettings: () => React.createElement('div'),
    }))

    const ChatNavbar = (
      await import('~/components/UIUC-Components/navbars/ChatNavbar')
    ).default

    const { container } = renderWithProviders(
      <ChatNavbar bannerUrl="" isgpt4 />,
      {
        homeState: { showModelSettings: false } as any,
        homeContext: {
          dispatch: vi.fn(),
          handleNewConversation: vi.fn(),
        },
      },
    )

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('Conversation has no violations', async () => {
    const ChatbarContext = (
      await import('~/components/Chatbar/Chatbar.context')
    ).default
    const { ConversationComponent } = await import(
      '~/components/Chatbar/components/Conversation'
    )

    const conversation = makeConversation({
      id: 'c1',
      name: 'My Chat',
      projectName: 'CS101',
    } as any) as any

    const { container } = renderWithProviders(
      <ChatbarContext.Provider
        value={
          {
            state: { searchTerm: '', filteredConversations: [] },
            dispatch: vi.fn(),
            handleDeleteConversation: vi.fn(),
            handleClearConversations: vi.fn(),
            handleExportData: vi.fn(),
            handleApiKeyChange: vi.fn(),
            isExporting: false,
          } as any
        }
      >
        <div role="listbox" aria-label="Chat history">
          <ConversationComponent conversation={conversation} />
        </div>
      </ChatbarContext.Provider>,
      {
        homeState: {
          selectedConversation: null,
          messageIsStreaming: false,
        } as any,
        homeContext: {
          handleSelectConversation: vi.fn(),
          handleUpdateConversation: vi.fn(),
        } as any,
      },
    )

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
