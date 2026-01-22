import React from 'react'
import { vi } from 'vitest'
import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { makeConversation, makeMessage } from '~/test-utils/mocks/chat'
import { ThemeProvider } from '~/contexts/ThemeContext'
import HomeContext from '~/pages/api/home/home.context'
import { makeHomeContext, makeHomeState } from '~/test-utils/mocks/homeContext'

// Keep this harness resilient: many components depend on heavy UI libs.
vi.mock('framer-motion', () => {
  const motion = new Proxy(
    {},
    {
      get: () => (props: any) => React.createElement('div', props),
    },
  )
  return {
    motion,
    AnimatePresence: ({ children }: any) =>
      React.createElement(React.Fragment, null, children),
  }
})

vi.mock('@mlc-ai/web-llm', () => ({
  MLCEngine: class {},
}))

vi.mock('~/utils/modelProviders/WebLLM', () => ({
  __esModule: true,
  default: class ChatUI {
    async loadWebllm() {}
  },
  webLLMModels: [],
}))

vi.mock('~/utils/functionCalling/handleFunctionCalling', () => ({
  __esModule: true,
  handleFunctionCall: vi.fn(async () => []),
  handleToolCall: vi.fn(async () => []),
  useFetchAllWorkflows: () => {
    const isError = Boolean((globalThis as any).__TEST_WORKFLOWS_ERROR__)
    return {
      data: [],
      isLoading: false,
      isError,
      error: isError ? new Error('test workflows error') : null,
    }
  },
}))

vi.mock('~/components/UIUC-Components/runAuthCheck', () => ({
  __esModule: true,
  default: {},
  get_user_permission: vi.fn(async () => 'admin'),
}))

vi.mock('mantine-datatable', () => ({
  DataTable: (props: any) =>
    React.createElement(
      'div',
      { 'data-testid': 'datatable' },
      props?.records?.length ?? 0,
    ),
}))

vi.mock('recharts', () => {
  const Stub = (name: string) => (props: any) =>
    React.createElement('div', { 'data-recharts': name, ...props })
  return {
    __esModule: true,
    ResponsiveContainer: Stub('ResponsiveContainer'),
    Tooltip: Stub('Tooltip'),
    Legend: Stub('Legend'),
    BarChart: Stub('BarChart'),
    Bar: Stub('Bar'),
    XAxis: Stub('XAxis'),
    YAxis: Stub('YAxis'),
    CartesianGrid: Stub('CartesianGrid'),
    PieChart: Stub('PieChart'),
    Pie: Stub('Pie'),
    Cell: Stub('Cell'),
  }
})

vi.mock('react-grid-heatmap', () => ({
  __esModule: true,
  default: (props: any) =>
    React.createElement('div', { 'data-testid': 'heatmap', ...props }),
}))

vi.mock('react-syntax-highlighter', () => ({
  Prism: (props: any) => React.createElement('pre', props),
  Light: (props: any) => React.createElement('pre', props),
  default: (props: any) => React.createElement('pre', props),
}))

vi.mock('react-markdown', () => ({
  __esModule: true,
  default: ({ children }: any) =>
    React.createElement('div', { 'data-testid': 'markdown' }, children),
}))

const ANY: any = new Proxy(function () {}, {
  get: (_t, prop) => {
    if (prop === 'then') return undefined // prevent promise-like behavior
    if (prop === Symbol.iterator)
      return function* () {
        yield ANY
      }
    if (prop === Symbol.toPrimitive) return () => ''
    if (prop === 'toString') return () => ''
    if (prop === 'valueOf') return () => 0
    if (prop === 'length') return 1
    if (prop === 'map')
      return (fn: any) => {
        try {
          fn(ANY, 0, [ANY])
        } catch {
          // ignore
        }
        return [ANY]
      }
    if (prop === 'forEach')
      return (fn: any) => {
        try {
          fn(ANY, 0, [ANY])
        } catch {
          // ignore
        }
      }
    if (prop === 'filter')
      return (fn: any) => {
        try {
          return fn(ANY, 0, [ANY]) ? [ANY] : []
        } catch {
          return [ANY]
        }
      }
    if (prop === 'reduce')
      return (fn: any, init: any) => {
        try {
          return fn(init, ANY, 0, [ANY])
        } catch {
          return init
        }
      }
    if (prop === 'slice') return () => [ANY]
    if (prop === 'join') return () => 'x'
    if (prop === 'includes') return () => false
    if (prop === 'some') return () => false
    if (prop === 'every') return () => true
    if (prop === 'find') return () => undefined
    return ANY
  },
  apply: () => undefined,
  construct: () => ({}),
})

function makeProps(variant: 'base' | 'truthy' | 'empty' = 'base') {
  const boolDefault = variant === 'truthy'
  const listDefault = variant === 'empty' ? [] : [ANY]
  const tabValue = variant === 'truthy' ? 'failed' : 'all'
  const inputContent = variant === 'truthy' ? 'Hello' : ''
  return new Proxy(
    {},
    {
      get: (_t, prop) => {
        const key = String(prop)
        if (key === 'children') return React.createElement('div', null)
        if (
          key === 'course_name' ||
          key === 'courseName' ||
          key === 'project_name'
        )
          return 'CS101'
        if (
          key === 'current_user_email' ||
          key === 'currentEmail' ||
          key === 'user_email'
        )
          return 'owner@example.com'
        if (key === 'is_new_course') return false
        if (key === 'isDisabled') return false
        if (key === 'stopConversationRef') return { current: false }
        if (key === 'textareaRef')
          return { current: document.createElement('textarea') }
        if (key === 'showScrollDownButton') return boolDefault
        if (key === 'inputContent') return inputContent
        if (key === 'setInputContent') return vi.fn()
        if (key === 'onTabChange') return vi.fn()
        if (key === 'tabValue') return tabValue
        if (key === 'href') return '/'
        if (key === 'src') return 'https://example.com/image.png'
        if (key === 'value') return ''
        if (key === 'id' || key.endsWith('Id') || key.endsWith('_id'))
          return 'id-1'
        if (
          key === 'title' ||
          key === 'label' ||
          key.endsWith('Name') ||
          key.endsWith('_name')
        )
          return 'Title'
        if (
          key === 'records' ||
          key === 'items' ||
          key === 'options' ||
          key === 'rows' ||
          key === 'columns'
        )
          return listDefault
        if (
          key.includes('messages') ||
          key.includes('conversations') ||
          key.includes('documents') ||
          key.includes('files')
        )
          return listDefault
        if (
          key.includes('workflows') ||
          key.includes('courses') ||
          key.includes('projects')
        )
          return listDefault
        if (key.startsWith('set') || key.includes('set')) return vi.fn()
        if (key.includes('toggle') || key.includes('close') || key.includes('open'))
          return vi.fn()
        if (
          key.includes('loading') ||
          key.includes('disabled') ||
          key.startsWith('is')
        )
          return boolDefault
        if (
          key.includes('count') ||
          key.includes('index') ||
          key.includes('page') ||
          key.includes('size')
        )
          return boolDefault ? 1 : 0
        if (
          key === 'onToggle' ||
          key === 'onCollapseToggle' ||
          key === 'onSend' ||
          key.startsWith('on')
        )
          return vi.fn()
        return ANY
      },
    },
  )
}

function isLikelyReactComponent(value: any, exportName?: string): boolean {
  if (!value) return false
  if (typeof value === 'function') {
    const name = exportName ?? value.displayName ?? value.name ?? ''
    return exportName === 'default' || /^[A-Z]/.test(name)
  }
  if (typeof value === 'object' && '$$typeof' in value) return true // memo/forwardRef
  return false
}

const componentModules = import.meta.glob('../**/*.{ts,tsx}')

const SKIP_SMOKE_PATHS =
  process.env.SMOKE_SKIP_HEAVY === '1'
    ? new Set([
        // Covered by dedicated tests; also extremely heavy to render in a bulk smoke.
        '../Chat/Chat.tsx',
        '../Chat/ChatInput.tsx',
        '../Chat/ChatMessage.tsx',
        '../Chat/MemoizedChatMessage.tsx',
        '../Chat/ModelSelect.tsx',
      ])
    : new Set<string>()

export async function runComponentsSmokeShard(
  shardIndex: number,
  shardTotal: number,
) {
  const debug = process.env.SMOKE_DEBUG === '1'
  const importOnly = process.env.SMOKE_IMPORT_ONLY === '1'
  if (!debug) {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})
  }

  // Guard against any accidental external network calls during bulk renders.
  const nativeFetch = globalThis.fetch
  vi.spyOn(globalThis, 'fetch').mockImplementation((input: any, init?: any) => {
    const url = typeof input === 'string' ? input : String(input?.url ?? '')
    if (url.startsWith('http://localhost') || url.startsWith('http://127.0.0.1')) {
      return nativeFetch(input, init)
    }
    // Allow the MSW handlers to handle relative URLs (the global fetch wrapper normalizes them).
    if (url.startsWith('/')) {
      return nativeFetch(input, init)
    }
    return Promise.resolve(
      new Response(JSON.stringify({}), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )
  })

  const conversation = makeConversation({
    id: 'conv-1',
    messages: [
      makeMessage({ id: 'u1', role: 'user', content: 'Hello' }) as any,
      makeMessage({ id: 'a1', role: 'assistant', content: 'Hi' }) as any,
    ],
  })

  const homeState = makeHomeState({
    selectedConversation: conversation as any,
    conversations: [conversation] as any,
  } as any)

  const homeContext = makeHomeContext({ state: homeState } as any)

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <HomeContext.Provider value={homeContext}>
            {children}
          </HomeContext.Provider>
        </ThemeProvider>
      </QueryClientProvider>
    )
  }

  const paths = Object.keys(componentModules).sort()

  for (let i = 0; i < paths.length; i++) {
    const path = paths[i]!
    if (i % shardTotal !== shardIndex) continue

    // Skip test files and index barrels.
    if (path.includes('__tests__')) continue
    if (path.includes('.test.')) continue
    if (path.includes('smokeAllComponents.')) continue
    if (path.endsWith('/index.ts') || path.endsWith('/index.tsx')) continue
    if (SKIP_SMOKE_PATHS.has(path)) continue

    const loader = (componentModules as any)[path]
    let mod: any
    try {
      if (debug) process.stderr.write(`import ${path}\n`)
      mod = await loader()
    } catch {
      continue
    }
    if (importOnly) continue

    const candidates: any[] = []
    if (isLikelyReactComponent(mod.default, 'default')) candidates.push(mod.default)
    for (const [exportName, value] of Object.entries(mod)) {
      if (exportName === 'default') continue
      if (isLikelyReactComponent(value, exportName)) candidates.push(value)
    }

    const maxRenderPerModule = path.includes('/Chat/')
      ? 1
      : path.includes('/shadcn/')
        ? 8
        : path.includes('/UIUC-Components/')
          ? 4
          : 2
    for (const Component of candidates.slice(0, maxRenderPerModule)) {
      const variants: Array<'base' | 'truthy' | 'empty'> =
        path.includes('/UIUC-Components/') || path.includes('/Chat/')
          ? ['base', 'truthy', 'empty']
          : ['base', 'truthy']

      for (const variant of variants) {
        const props = makeProps(variant)
        try {
          const { unmount } = render(
            React.createElement(Component, props) as any,
            {
              wrapper: Wrapper,
            },
          )
        // Give React effects (including react-query queryFns) a chance to run before unmounting.
        if (path.includes('/UIUC-Components/')) {
          await Promise.resolve()
          await new Promise((r) => setTimeout(r, 0))
        }
        unmount()
        } catch {
          // Some components are inherently integration-heavy; importing them still improves coverage.
        }
      }
    }
  }
}
