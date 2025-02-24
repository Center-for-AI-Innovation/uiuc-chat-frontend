import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useUser,
} from '@clerk/nextjs'
import { IconClipboardText, IconFile } from '@tabler/icons-react'
import { Menu2 } from 'tabler-icons-react'

// import MagicBell, {
//   FloatingNotificationInbox,
// } from '@magicbell/magicbell-react'

export default function Header({ isNavbar = false }: { isNavbar?: boolean }) {
  const headerStyle = isNavbar
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
        {/* Docs: https://www.magicbell.com/docs/libraries/react#custom-themes */}
        {/* <MagicBell
          apiKey={process.env.NEXT_PUBLIC_MAGIC_BELL_API as string}
          userEmail={userEmail}
          theme={magicBellTheme}
          locale="en"
          images={{
            emptyInboxUrl:
              'https://assets.kastan.ai/minified_empty_chat_art.png',
          }}
        > */}
        {/* {(props) => (
            <FloatingNotificationInbox width={400} height={500} {...props} />
          )}
        </MagicBell> */}
        {/* Add some padding for separation */}
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

let isMenuOpen = true //NOTE: needs to be changed to control the menu div visibility of flex/hidden (line  251)

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
                  <FileIcon />
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
            isMenuOpen = !isMenuOpen
          }}
        >
          <Menu2 size={24} strokeWidth={2} />
        </div>

        {/*        <Group spacing={'xs'}> */}
        <div
          className={`
          w-full
          flex-col items-stretch
          gap-2 p-4

          sm:w-auto sm:flex-row

          sm:items-center sm:p-0

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
                  <FileIcon />
                  <span
                    className={`${montserrat_heading.variable} font-montserratHeading`}
                  >
                    Blog
                  </span>
                </span>
              </Link>

              <Link
                href="/new"
                className={classes.link}
                style={{ borderRadius: '.25rem' }}
              >
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  <FileIcon />
                  <span
                    className={`${montserrat_heading.variable} font-montserratHeading`}
                  >
                    New project
                  </span>
                </span>
              </Link>
            </>
          )}

          <SignedIn>
            {/* Docs: https://www.magicbell.com/docs/libraries/react#custom-themes */}
            {/* <MagicBell
              apiKey={process.env.NEXT_PUBLIC_MAGIC_BELL_API as string}
              userEmail={userEmail}
              theme={magicBellTheme}
              locale="en"
              images={{
                emptyInboxUrl:
                  'https://assets.kastan.ai/minified_empty_chat_art.png',
              }}
            >
              {(props) => (
                <FloatingNotificationInbox width={400} height={500} {...props} />
              )}
            </MagicBell> */}
            {/* Add a bit of spacing with an empty div */}
            <div />
            {/* appearance={ } */}
            <div style={{ all: 'unset' }}>
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

          {/*        </Group> */}
        </div>
      </div>
    </header>
  )
}

export function FileIcon() {
  return (
    <IconFilePlus size={20} strokeWidth={2} style={{ marginRight: '5px' }} />
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

    /* disabling this for now as it changes ALL divs on the page (and is weird when a non-button reacts to a hover)
    '&:hover': {
      color: '#0ff', //'hsl(from var(--illinois-orange) h s 30%)', //'var(--illinois-orange)', //illinois-industrial
      borderColor: 'hsl(from var(--illinois-orange) h s 30%)',
//      backgroundColor: 'color-mix(in srgb, var(--illinois-orange) 10%, transparent);', //'rgba(255, 255, 255, 0.1)',
      textDecoration: 'none',
//      borderRadius: '10px',
    },
    '&[data-active="true"]': {
      color: 'var(--illinois-industrial)',  
      borderBottom: '2px solid var(--illinois-industrial)',  
      textDecoration: 'none',
//      borderRadius: '10px',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      textAlign: 'right',
    },
*/
  },
}))

// DOCS: https://www.magicbell.com/docs/libraries/react#custom-themes
// export const magicBellTheme = {
//   prose: {
//     headings: '#ffffff',
//     links: '#9D4EDD',
//     bold: '#ffffff',
//     hr: '#9D4EDD',
//     quotes: '#ffffff',
//     quoteBorders: '#9D4EDD',
//     captions: '#9D4EDD',
//     code: '#ffffff',
//     preCode: '#9D4EDD',
//     preBg: '#070711',
//     thBorders: '#9D4EDD',
//     tdBorders: '#9D4EDD',
//     buttonBorders: '#9D4EDD',
//     buttons: '#ffffff',
//     fontMono:
//       'ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace',
//   },
//   icon: {
//     borderColor: '#fff',
//     width: '24px',
//   },
//   header: {
//     backgroundColor: '#15162c',
//     backgroundOpacity: 1,
//     borderRadius: '8px',
//     fontFamily:
//       '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
//     fontSize: '14px',
//     fontWeight: 'inherit',
//     textColor: '#e2e8f0',
//     // textAlign: 'left' as "center" | "left" | "right" | "inherit" | "initial" | "justify",
//     // textTransform: 'uppercase' as "uppercase" | "lowercase" | "capitalize" | "none" | "inherit" | "initial" | "revert" | "unset",
//     textTransform: 'uppercase' as
//       | 'inherit'
//       | 'initial'
//       | 'none'
//       | 'capitalize'
//       | 'lowercase'
//       | 'uppercase',
//     padding: '16px 24px',
//     borderColor: '#807f7f',
//   },
//   footer: {
//     backgroundColor: '#15162c',
//     backgroundOpacity: 1,
//     borderRadius: '8px',
//     fontFamily:
//       '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
//     fontSize: '14px',
//     fontWeight: 'inherit',
//     textColor: '#15162c',
//     textAlign: 'left' as
//       | 'center'
//       | 'left'
//       | 'right'
//       | 'inherit'
//       | 'initial'
//       | 'justify',
//     // textTransform: 'none',
//     padding: '16px 24px',
//     borderColor: '#807f7f',
//   },
//   banner: {
//     backgroundColor: '#15162c',
//     backgroundOpacity: 0.1,
//     textColor: '#e2e8f0',
//     fontFamily:
//       '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
//     // textAlign: 'left',
//     fontSize: '14px',
//     boxShadow: 'none',
//   },
//   unseenBadge: {
//     backgroundColor: '#DF4759',
//     backgroundOpacity: 1,
//     borderRadius: '4px',
//     fontFamily:
//       '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
//     fontSize: '14px',
//     fontWeight: 'inherit',
//     textColor: 'white',
//     // textAlign: 'left' as "center" | "left" | "right" | "inherit" | "initial" | "justify",
//     // textTransform: undefined,
//   },
//   container: {
//     backgroundColor: '#15162c',
//     backgroundOpacity: 1,
//     borderRadius: '8px',
//     fontFamily:
//       '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
//     fontWeight: 'inherit',
//     fontSize: '14px',
//     textColor: '#e2e8f0',
//     // textAlign: 'left',
//     // textTransform: 'none',
//     boxShadow:
//       '0px 20px 25px rgba(84, 95, 111, 0.1), 0px 10px 10px rgba(84, 95, 111, 0.04)',
//   },
//   notification: {
//     default: {
//       backgroundColor: 'transparent',
//       backgroundOpacity: 0,
//       borderRadius: '8px',
//       fontFamily:
//         '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
//       fontSize: '14px',
//       fontWeight: 'inherit',
//       textColor: '#e2e8f0',
//       // textAlign: 'left',
//       // textTransform: 'none',
//       margin: '4px',
//       padding: '16px 20px 16px 12px',
//       title: {
//         fontFamily: 'inherit',
//         fontSize: 'inherit',
//         fontWeight: 500,
//         textColor: 'inherit',
//       },
//       hover: {
//         backgroundColor: '#9D4EDD',
//         backgroundOpacity: 0.16,
//       },
//       state: {
//         color: 'transparent',
//       },
//     },
//     unread: {
//       backgroundColor: '#9D4EDD',
//       backgroundOpacity: 0.3,
//       state: {
//         color: '#9D4EDD',
//       },
//     },
//     unseen: {
//       backgroundColor: '#9D4EDD',
//       backgroundOpacity: 0.05,
//       state: {
//         color: '#9D4EDD',
//       },
//     },
//   },
// }
