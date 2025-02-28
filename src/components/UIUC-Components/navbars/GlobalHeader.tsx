import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useUser,
} from '@clerk/nextjs'
import {
  IconCirclePlus,
  IconClipboardText,
  IconFile,
  IconNews,
  IconPlus,
  IconSquareRoundedPlus,
} from '@tabler/icons-react'
import { Menu2 } from 'tabler-icons-react'

// import MagicBell, {
//   FloatingNotificationInbox,
// } from '@magicbell/magicbell-react'

export default function Header({ isNavbar = false }: { isNavbar?: boolean }) {
  const headerStyle = isNavbar
    ? {
        // backgroundColor: 'var(--background)', //illinois-blue -- this caused horrible white background on clerk icon
        display: 'flex',
        justifyContent: 'flex-end',
        padding: '0.2em 0.2em',
      }
    : {
        // backgroundColor: 'var(--background)', //illinois-blue -- this caused horrible white background on clerk icon
        display: 'flex',
        justifyContent: 'flex-end',
        padding: '0.5em',
      }

  const clerk_obj = useUser()
  const posthog = usePostHog()
  const [userEmail, setUserEmail] = useState('no_email')
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (clerk_obj.isLoaded) {
      if (clerk_obj.isSignedIn) {
        const emails = extractEmailsFromClerk(clerk_obj.user)
        setUserEmail(emails[0] || 'no_email')

        // Posthog identify
        posthog?.identify(clerk_obj.user.id, {
          email: emails[0] || 'no_email',
        })
      }
      setIsLoaded(true)
    } else {
      // console.debug('NOT LOADED OR SIGNED IN')
    }
  }, [clerk_obj.isLoaded])

  if (!isLoaded) {
    return (
      <header style={headerStyle} className="py-16">
        {/* Skeleton placeholders for two icons */}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div
            className="skeleton-box"
            style={{ width: '35px', height: '35px', borderRadius: '50%' }}
          ></div>
          <div style={{ paddingLeft: '0px', paddingRight: '10px' }} />
          <div
            className="skeleton-box"
            style={{ width: '35px', height: '35px', borderRadius: '50%' }}
          ></div>
        </div>
      </header>
    )
  }

  return (
    <header style={headerStyle} className="py-16">
      <SignedIn>
        <div style={{ paddingLeft: '0px', paddingRight: '10px' }}></div>
        {/* Mount the UserButton component */}
        <UserButton />
      </SignedIn>
      <SignedOut>
        {/* Signed out users get sign in button */}
        <SignInButton />
      </SignedOut>
    </header>
  )
}

import Link from 'next/link'
import { montserrat_heading } from 'fonts'
import { createStyles, Group, rem } from '@mantine/core'
import { extractEmailsFromClerk } from '../clerkHelpers'
import { useEffect, useState } from 'react'
import { usePostHog } from 'posthog-js/react'
import { IconFilePlus } from '@tabler/icons-react'

export function LandingPageHeader({
  forGeneralPurposeNotLandingpage = false,
}: {
  forGeneralPurposeNotLandingpage?: boolean
}) {
  const { classes, theme } = useStyles()
  const headerStyle = forGeneralPurposeNotLandingpage
    ? {
        backgroundColor: 'var(--background)', //illinois-blue
        display: 'flex',
        justifyContent: 'flex-end',
        padding: '0.2em 0.2em',
        //      paddingRight: '0.3em', //why?
      }
    : {
        backgroundColor: 'var(--background)', //illinois-blue
        display: 'flex',
        justifyContent: 'flex-end',
        padding: '0.5em',
      }

  const clerk_obj = useUser()
  const [userEmail, setUserEmail] = useState('no_email')
  const [isLoaded, setIsLoaded] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const posthog = usePostHog()

  useEffect(() => {
    if (clerk_obj.isLoaded) {
      if (clerk_obj.isSignedIn) {
        const emails = extractEmailsFromClerk(clerk_obj.user)
        setUserEmail(emails[0] || 'no_email')

        // Posthog identify
        posthog?.identify(clerk_obj.user.id, {
          email: emails[0] || 'no_email',
        })
      }
      setIsLoaded(true)
    } else {
      // console.debug('NOT LOADED OR SIGNED IN')
    }
  }, [clerk_obj.isLoaded])

  if (!isLoaded) {
    return (
      <header style={headerStyle} className="py-16">
        {/* Skeleton placeholders for two icons */}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          {forGeneralPurposeNotLandingpage === false && (
            <>
              <Link href="/new" className={classes.link}>
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  <IconFilePlus
                    size={20}
                    strokeWidth={2}
                    style={{ marginRight: '5px' }}
                  />
                  <span
                    className={`${montserrat_heading.variable} font-montserratHeading`}
                  >
                    New project
                  </span>
                </span>
              </Link>
              <Link
                href="https://docs.uiuc.chat/"
                className={classes.link}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  <IconClipboardTexts />
                  <span
                    className={`${montserrat_heading.variable} font-montserratHeading`}
                  >
                    Docs
                  </span>
                </span>
              </Link>
            </>
          )}
          <div
            className="skeleton-box"
            style={{ width: '35px', height: '35px', borderRadius: '50%' }}
          ></div>
          <div style={{ paddingLeft: '0px', paddingRight: '10px' }} />
          <div
            className="skeleton-box"
            style={{ width: '35px', height: '35px', borderRadius: '50%' }}
          ></div>
        </div>
      </header>
    )
  }

  return (
    <header style={headerStyle}>
      <div
        className="
        flex-end m-auto
        flex

        w-full max-w-5xl flex-wrap items-center
        gap-2 sm:flex-nowrap
      "
      >
        <div
          className={`
          relative
          flex grow items-center gap-1 font-bold
          ${montserrat_heading.variable} font-montserratHeading
        `}
        >
          <div style={{ width: '1.95rem', height: '1.95rem' }}>
            <img
              src="/media/logo_illinois.png"
              width="auto"
              height="100%"
            ></img>
          </div>
          <div className="text-[var(--illinois-orange)] sm:ml-4">Illinois</div>
          <div className="text-[var(--illinois-blue)]">Chat</div>
        </div>

        <div
          className={`
          ${classes.link}

          border-none
          sm:hidden
        `}
          onClick={() => {
            setIsMenuOpen(!isMenuOpen)
          }}
        >
          <Menu2 size={24} strokeWidth={2} />
        </div>

        <div
          className={`
          w-full
          flex-col items-stretch
          gap-2 p-4

          sm:flex sm:w-auto

          sm:flex-row sm:items-center
          sm:p-0

          ${isMenuOpen ? 'flex' : 'hidden'}
        `}
        >
          <div
            className="
            absolute bottom-0
            left-0 right-0 top-0 z-[-10]
            sm:hidden
          "
            style={{ background: 'var(--illinois-orange-gradient)' }}
          ></div>

          {forGeneralPurposeNotLandingpage === false && (
            <>
              <Link
                href="https://docs.uiuc.chat/"
                className={classes.link}
                target="_blank"
                rel="noopener noreferrer"
                style={{ borderRadius: '.25rem' }}
              >
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  <IconClipboardTexts />
                  <span
                    className={`${montserrat_heading.variable} font-montserratHeading`}
                  >
                    Docs
                  </span>
                </span>
              </Link>

              <Link
                href="http://news.uiuc.chat/"
                target="_blank"
                className={classes.link}
                style={{ borderRadius: '.25rem' }}
              >
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  <IconNews
                    size={20}
                    strokeWidth={2}
                    style={{ marginRight: '5px' }}
                  />
                  <span
                    className={`${montserrat_heading.variable} font-montserratHeading`}
                  >
                    News
                  </span>
                </span>
              </Link>

              <Link
                href="/new"
                className={classes.link}
                style={{ borderRadius: '.25rem' }}
              >
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  <IconPlus
                    size={20}
                    strokeWidth={2}
                    style={{ marginRight: '5px' }}
                  />
                  <span
                    className={`${montserrat_heading.variable} font-montserratHeading`}
                  >
                    New Project
                  </span>
                </span>
              </Link>
            </>
          )}

          <SignedIn>
            <div className="mt-1 pl-1 pr-2">
              <UserButton />
            </div>
          </SignedIn>
          <SignedOut>
            {/* Signed out users get sign in button */}
            <SignInButton>
              <button
                className={classes.link}
                style={{ borderRadius: '.25rem' }}
              >
                <span
                  className={`${montserrat_heading.variable} font-montserratHeading`}
                >
                  Login / Signup
                </span>
              </button>
            </SignInButton>
          </SignedOut>
        </div>
      </div>
    </header>
  )
}

export function IconClipboardTexts() {
  return (
    <IconClipboardText
      size={20}
      strokeWidth={2}
      style={{ marginRight: '5px' }}
    />
  )
}

const HEADER_HEIGHT = rem(84)

const useStyles = createStyles((theme) => ({
  inner: {
    height: HEADER_HEIGHT,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  links: {
    padding: '.2em, 1em',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',

    [theme.fn.smallerThan('sm')]: {
      display: 'none',
    },
  },
  link: {
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',

    height: '2.2rem',

    color: 'var(--illinois-orange)', //illinois-white

    padding: `${theme.spacing.xs}`, //${theme.spacing.sm} ${theme.spacing.xs}

    fontSize: rem(11),
    fontWeight: 700,

    border: `1px solid var(--illinois-orange)}`,
    //    borderRadius: '10px', //theme.radius.sm, //not sure why, but this isn't working here so was placed inline on each button

    transition:
      'border-color 100ms ease, color 100ms ease, background-color 100ms ease',
  },
}))
