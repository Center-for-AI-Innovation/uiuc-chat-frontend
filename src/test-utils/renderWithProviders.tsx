import React, { type PropsWithChildren } from 'react'
import { MantineProvider } from '@mantine/core'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, type RenderOptions } from '@testing-library/react'
import { ThemeProvider } from '~/contexts/ThemeContext'
import HomeContext from '~/pages/api/home/home.context'
import { makeHomeContext, makeHomeState } from './mocks/homeContext'
import type { HomeContextProps } from '~/pages/api/home/home.context'
import type { HomeInitialState } from '~/pages/api/home/home.state'

type ProvidersOptions = {
  homeContext?: Partial<HomeContextProps>
  homeState?: Partial<HomeInitialState>
  queryClient?: QueryClient
}

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

export function renderWithProviders(
  ui: React.ReactElement,
  options: ProvidersOptions & Omit<RenderOptions, 'wrapper'> = {},
) {
  const queryClient = options.queryClient ?? createTestQueryClient()
  const state = makeHomeState({
    ...(options.homeContext?.state ?? {}),
    ...(options.homeState ?? {}),
  })
  const homeContextValue = makeHomeContext({
    ...(options.homeContext ?? {}),
    state,
  })

  function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>
        <MantineProvider withGlobalStyles withNormalizeCSS>
          <ThemeProvider>
            <HomeContext.Provider value={homeContextValue}>
              {children}
            </HomeContext.Provider>
          </ThemeProvider>
        </MantineProvider>
      </QueryClientProvider>
    )
  }

  return {
    queryClient,
    homeContext: homeContextValue,
    ...render(ui, { wrapper: Wrapper, ...options }),
  }
}
