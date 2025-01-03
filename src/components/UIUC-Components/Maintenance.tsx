import React, { useEffect, useState } from 'react'
import { Title, Text } from '@mantine/core'
import Link from 'next/link'

const Maintenance = ({ }: {
  // Prevent search engine indexing of Maintenance page (because it'll ruin our entire search results): https://github.com/vercel/next.js/discussions/12850#discussioncomment-3335807
  // in _document.tsx
}) => {
  const [maintenanceBodyText, setMaintenanceBodyText] = useState('')
  const [maintenanceTitleText, setMaintenanceTitleText] = useState('')

  useEffect(() => {
    const checkMaintenanceMode = async () => {
      try {
        const response = await fetch('/api/UIUC-api/getMaintenanceModeDetails')
        const data = await response.json()
        // setIsMaintenanceMode(data.isMaintenanceMode)
        setMaintenanceBodyText(data.maintenanceBodyText)
        setMaintenanceTitleText(data.maintenanceTitleText)
      } catch (error) {
        console.error('Failed to check maintenance mode:', error)
        // setIsMaintenanceMode(false)
      }
    }

    checkMaintenanceMode()
  }, [])

  return (
    <>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
        <div className="container flex flex-col items-center justify-center gap-8 px-4 py-8 text-center">
          <Link href="/">
            <h2 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
              UIUC. <span className="text-[hsl(280,100%,70%)]">chat</span>
            </h2>
          </Link>

          <Title className="mt-8 text-amber-400" order={1}>
            {maintenanceTitleText}
          </Title>

          <Text size="xl" className="max-w-2xl text-gray-200">
            {maintenanceBodyText}
          </Text>

          <div className="mt-8 animate-pulse">
            <div className="h-2 w-24 rounded bg-amber-400"></div>
          </div>
        </div>
      </main>
    </>
  )
}

export default Maintenance
