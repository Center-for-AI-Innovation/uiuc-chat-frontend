import { DocumentProps, Head, Html, Main, NextScript } from 'next/document'
import { useEffect, useState } from 'react'
import i18nextConfig from '../../next-i18next.config.mjs'

type Props = DocumentProps & {
  // add custom document props
}

export default function Document(props: Props) {
  const currentLocale =
    props.__NEXT_DATA__.locale ?? i18nextConfig.i18n.defaultLocale
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false)

  useEffect(() => {
    const checkMaintenanceMode = async () => {
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
  }, [])

  if (isMaintenanceMode) {
    return (
      <Html lang={currentLocale}>
        <Head>
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-title" content="UIUC.chat"></meta>
          {/* Prevent search engine indexing of Maintenance page: https://github.com/vercel/next.js/discussions/12850#discussioncomment-3335807  */}
          <meta name="robots" content="noindex" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }

  return (
    <Html lang={currentLocale}>
      <Head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="UIUC.chat"></meta>
        {/* TODO: review if this is actually necessary, given toggle ThemeToggle.tsx */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark')
                } else {
                  document.documentElement.classList.remove('dark')
                }
              } catch (_) {}
            `,
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
