import React from 'react'
import { Title, Text } from '@mantine/core'
import Link from 'next/link'

const Maintenance = ({}: {
  // Prevent search engine indexing of Maintenance page (because it'll ruin our entire search results): https://github.com/vercel/next.js/discussions/12850#discussioncomment-3335807
  // in _document.tsx
}) => {
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
            We&apos;ll Be Right Back
          </Title>

          <Text size="xl" className="max-w-2xl text-gray-200">
            Due to a surge in new documents, we are experiencing some technical
            difficulties. Our team is working hard to resolve this and
            we&apos;ll be back online shortly. Thank you for your patience.
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
