import { type AppType } from 'next/app'
import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { appWithTranslation } from 'next-i18next'
// import { ClerkLoaded, ClerkProvider, GoogleOneTap } from '@clerk/nextjs'
// import { dark } from '@clerk/themes'

import '~/styles/globals.css'
import Maintenance from '~/components/UIUC-Components/Maintenance'

import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from '@vercel/analytics/next';

import { KeycloakProvider } from '../providers/KeycloakProvider';
import { AuthProvider } from 'react-oidc-context'

// Check that PostHog is client-side (used to handle Next.js SSR)
if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY as string, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
    opt_in_site_apps: true,
    autocapture: false,
    // Enable debug mode in development
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
  
  const BYPASS_MAINTENANCE = ['/sign-in', '/sign-up']
  useEffect(() => {
    const checkMaintenanceMode = async () => {
      if (BYPASS_MAINTENANCE.includes(router.pathname)) {
        setIsMaintenanceMode(false)
        return
      }
      
      if (effectRan.current) return

      try {
        const response = await fetch('/api/UIUC-api/getMaintenanceModeFast')
        const data = await response.json()
        console.log("Maintenance mode", data)
        setIsMaintenanceMode(false)
      } catch (error) {
        console.error('Failed to check maintenance mode:', error)
        setIsMaintenanceMode(false)
      }
    }

    checkMaintenanceMode()
    effectRan.current = true
  }, [])

  if (false) {
    return <Maintenance />
  } else {
    return (
      <KeycloakProvider>
        <PostHogProvider client={posthog}>
          <SpeedInsights />
          <Analytics />
          <Component {...pageProps} />
        </PostHogProvider>
      </KeycloakProvider>
    )
  }
}

// export default .withTRPC(MyApp)

export default appWithTranslation(MyApp)
