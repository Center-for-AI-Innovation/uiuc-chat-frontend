import { type AppType } from 'next/app'
import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { appWithTranslation } from 'next-i18next'

import '~/styles/globals.css'
import '~/styles/citation-tooltips.css'
import Maintenance from '~/components/UIUC-Components/Maintenance'

import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

// import { SpeedInsights } from '@vercel/speed-insights/next'
import { Analytics } from '@vercel/analytics/next'

import { KeycloakProvider } from '../providers/KeycloakProvider'

// Check that PostHog is client-side (used to handle Next.js SSR)
if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY as string, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
    opt_in_site_apps: true,
    autocapture: false,
    session_recording: {
      maskAllInputs: false,
      maskInputOptions: {
        password: true,
        email: true,
        creditCard: true,
      },
    },
    loaded: (posthog) => {
      if (process.env.NODE_ENV === 'development') posthog.debug()
    },
  })
}

const MyApp: AppType = ({ Component, pageProps: { ...pageProps } }) => {
  const router = useRouter()
  const queryClient = new QueryClient()
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false)
  const effectRan = useRef(false)

  useEffect(() => {
    // Track page views in PostHog
    const handleRouteChange = () => posthog?.capture('$pageview')
    router.events.on('routeChangeComplete', handleRouteChange)

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [])

  useEffect(() => {
    const checkMaintenanceMode = async () => {
      if (effectRan.current) return

      try {
        const response = await fetch('/api/UIUC-api/getMaintenanceModeFast')
        const data = await response.json()
        setIsMaintenanceMode(data.isMaintenanceMode)
      } catch (error) {
        console.error('Failed to check maintenance mode:', error)
        setIsMaintenanceMode(false)
      }
    }

    checkMaintenanceMode()
    effectRan.current = true
  }, [])

  if (isMaintenanceMode) {
    return <Maintenance />
  } else {
    return (
      <KeycloakProvider>
        <QueryClientProvider client={queryClient}>
          <PostHogProvider client={posthog}>
            {/* <SpeedInsights /> */}
            <Analytics />
            <Notifications position="bottom-center" zIndex={2077} />
            <ReactQueryDevtools
              initialIsOpen={false}
              position="left"
              buttonPosition="bottom-left"
            />
            <MantineProvider
              withGlobalStyles
              withNormalizeCSS
              theme={{
                colorScheme: 'dark',
                colors: {
                  // Using CSS variables for colors
                  deepBlue: ['var(--illinois-blue)'],
                  primary: ['var(--illinois-orange)'],
                  secondary: ['var(--illinois-blue)'],
                  accent: ['var(--illinois-industrial)'],
                  background: ['var(--illinois-background-dark)'],
                  nearlyBlack: ['var(--illinois-background-darker)'],
                  nearlyWhite: ['var(--illinois-white)'],
                  disabled: ['var(--illinois-storm-dark)'],
                  errorBackground: ['var(--illinois-berry)'],
                  errorBorder: ['var(--illinois-berry)'],
                },
                shadows: {
                  // md: '1px 1px 3px rgba(0, 0, 0, .25)',
                  // xl: '5px 5px 3px rgba(0, 0, 0, .25)',
                },
                headings: {
                  fontFamily: 'Montserrat, Roboto, sans-serif',
                  sizes: {
                    h1: { fontSize: '3rem' },
                    h2: { fontSize: '2.2rem' },
                  },
                },
                defaultGradient: {
                  from: 'var(--illinois-berry)',
                  to: 'var(--illinois-earth)',
                  deg: 80,
                },
              }}
            >
              <Component {...pageProps} />
            </MantineProvider>
          </PostHogProvider>
        </QueryClientProvider>
      </KeycloakProvider>
    )
  }
}

// export default .withTRPC(MyApp)

export default appWithTranslation(MyApp)
