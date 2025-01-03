import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { LoadingSpinner } from '~/components/UIUC-Components/LoadingSpinner'
import { MainPageBackground } from '~/components/UIUC-Components/MainPageBackground'

const Gpt4 = () => {
  const router = useRouter()

  const getCurrentPageName = () => {
    // /CS-125/dashboard --> CS-125
    return router.asPath.slice(1).split('/')[0] as string
  }

  useEffect(() => {
    if (!router.isReady) return

    router.replace(`/${getCurrentPageName()}/chat`)
  }, [router.isReady])

  return (
    <MainPageBackground>
      <LoadingSpinner />
    </MainPageBackground>
  )
}

export default Gpt4
