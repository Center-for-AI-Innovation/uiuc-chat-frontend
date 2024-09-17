import Link from 'next/link'
import React, { ReactNode } from 'react'
import { LandingPageHeader } from './navbars/GlobalHeader'
import Navbar from './navbars/Navbar'
import { useRouter } from 'next/router'
import { LoadingSpinner } from './LoadingSpinner'

interface MainPageBackgroundProps {
  children: ReactNode
}

export const MainPageBackground: React.FC<MainPageBackgroundProps> = ({
  children,
}) => {
  return (
    <>
      <LandingPageHeader forGeneralPurposeNotLandingpage={true} />
      <main className="items-left justify-left course-page-main flex min-h-screen flex-col">
        <div className="container flex flex-col items-center justify-center gap-8 px-4 py-5 ">
          <Link href="/">
            <h2 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
              UIUC.
              <span className="${inter.style.fontFamily} text-[hsl(280,100%,70%)]">
                chat
              </span>
            </h2>
          </Link>
          <br></br>
          {/* 
          LOAD THE SPINNER ELEMENT (or any other body text) here!
          USAGE EXAMPLE: 
          <MainPageBackground>
            <LoadingSpinner />
          </MainPageBackground>
           */}
          {children}
        </div>
        <div className="items-left container flex flex-col justify-center gap-12 px-20 py-16 "></div>
      </main>
    </>
  )
}

export const LoadingPlaceholderForAdminPages = ({}) => {
  const router = useRouter()
  const getCurrentPageName = () => {
    return router.query.course_name as string
  }

  return (
    <>
      {/* <LandingPageHeader forGeneralPurposeNotLandingpage={true} /> */}
      <main className="items-left justify-left course-page-main flex min-h-screen flex-col">
        <Navbar course_name={getCurrentPageName()} />
        <div className="container flex flex-col items-center justify-center gap-8 px-4 py-5 ">
          <div className="pt-4" />
          <LoadingSpinner />
        </div>
      </main>
    </>
  )
}

// export default MainPageBackground
