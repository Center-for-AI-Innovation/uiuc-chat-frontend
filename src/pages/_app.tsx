import { type AppType } from 'next/app'
import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { appWithTranslation } from 'next-i18next'
import { ClerkLoaded, ClerkProvider, GoogleOneTap } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import { ThemeProvider } from '~/contexts/ThemeContext'

import '~/styles/globals.css'
import Maintenance from '~/components/UIUC-Components/Maintenance'

import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

import { SpeedInsights } from '@vercel/speed-insights/next'
import { Analytics } from '@vercel/analytics/next'

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
      <PostHogProvider client={posthog}>
        <SpeedInsights />
        <Analytics />
        <ThemeProvider>
          <ClerkProvider
            allowedRedirectOrigins={[
              'https://chat.illinois.edu',
              'https://frontend.kastan.ai',
            ]}
            appearance={{
              baseTheme: dark,
              variables: {
                // Thes FFFFFF are needed to make the text readable.
                colorPrimary: '#FFFFFF',
                colorNeutral: '#FFFFFF',
                // colorText: '#FFFFFF',
                // colorTextSecondary: '#FFFFFF',
                // colorTextOnPrimaryBackground: '#FFFFFF',
              },
            }}
            {...pageProps}
          >
            <ClerkLoaded>
              <GoogleOneTap />
              <QueryClientProvider client={queryClient}>
                <ReactQueryDevtools
                  initialIsOpen={false}
                  position="left"
                  buttonPosition="bottom-left"
                />
                <MantineProvider
                  withGlobalStyles
                  withNormalizeCSS
                  theme={{
                    defaultRadius: 'md',
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
                  <Notifications position="bottom-center" zIndex={2077} />
                  <Component {...pageProps} />
                </MantineProvider>
              </QueryClientProvider>
            </ClerkLoaded>
          </ClerkProvider>
        </ThemeProvider>
      </PostHogProvider>
    )
  }
}

// export default .withTRPC(MyApp)

export default appWithTranslation(MyApp)
