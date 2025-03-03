import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import { useDisclosure } from '@mantine/hooks'
import Image from 'next/image'
import { useEffect, useState, useContext, useRef } from 'react'
import {
  Burger,
  Container,
  createStyles,
  Flex,
  Group,
  Paper,
  rem,
  Transition,
} from '@mantine/core'
import { IconHome, IconSettings, IconPlus } from '@tabler/icons-react'
import { useRouter } from 'next/router'
import { montserrat_heading } from 'fonts'
import { useUser } from '@clerk/nextjs'
import { extractEmailsFromClerk } from '~/components/UIUC-Components/clerkHelpers'
import HomeContext from '~/pages/api/home/home.context'
import { UserSettings } from '../../Chat/UserSettings'
import { usePostHog } from 'posthog-js/react'
import { ThemeToggle } from '../ThemeToggle'

const styles: Record<string, React.CSSProperties> = {
  logoContainerBox: {
    height: '52px',
    maxWidth:
      typeof window !== 'undefined' && window.innerWidth > 600 ? '80%' : '100%',
    paddingLeft:
      typeof window !== 'undefined' && window.innerWidth > 600 ? '25px' : '5px',
  },
  thumbnailImage: {
    objectFit: 'cover',
    objectPosition: 'center',
    height: '100%',
    width: 'auto',
  },
}

const HEADER = rem(60)
const HEADER_HEIGHT = parseFloat(HEADER) * 16

const useStyles = createStyles((theme, { isAdmin }: { isAdmin: boolean }) => ({
  inner: {
    height: HEADER_HEIGHT,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  link: {
    fontSize: rem(12),
    textAlign: 'center',
    padding: `3px ${theme.spacing.xs}`,
    margin: '0.2rem 0.1rem',
    fontWeight: 700,
    transition:
      'border-color 100ms ease, color 100ms ease, background-color 100ms ease',
    borderRadius: 'var(--radius-sm)',
    '&:hover': {
      color: 'var(--color-hover)', //hsl(280,100%,70%)
      //      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      backgroundColor: 'var(--button-hover)',
      textDecoration: 'none',
    },
    '&[data-active="true"]': {
      color: 'hsl(280,100%,70%)',
      borderBottom: '2px solid hsl(280,100%,70%)',
      textDecoration: 'none',
      //      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      backgroundColor: 'var(--button-hover)',
      textAlign: 'right',
    },
    [theme.fn.smallerThan(isAdmin ? 825 : 500)]: {
      display: 'list-item',
      textAlign: 'center',
      borderRadius: '0rem',
      padding: theme.spacing.sm,
      margin: '0.2rem 0 0.2rem 0',
      //      margin: '(var(--padding) * .2) 0rem 0rem (var(--padding) * .2)'
    },
  },
  burger: {
    [theme.fn.largerThan(isAdmin ? 825 : 500)]: {
      display: 'none',
    },
    marginRight: '3px',
    marginLeft: '0px',
  },
  dropdown: {
    position: 'absolute',
    top: HEADER_HEIGHT,
    right: '20px',
    zIndex: 10,
    borderRadius: '10px',
    overflow: 'hidden',
    width: '200px',
    [theme.fn.largerThan(isAdmin ? 825 : 500)]: {
      display: 'none',
    },
  },
  adminDashboard: {
    [theme.fn.smallerThan(825)]: {
      display: 'none',
    },
    display: 'block',
  },
  settings: {
    [theme.fn.smallerThan(isAdmin ? 675 : 500)]: {
      display: 'none',
    },
    display: 'block',
  },
  newChat: {
    [theme.fn.smallerThan(isAdmin ? 500 : 350)]: {
      display: 'none',
    },
    display: 'block',
  },
  modelSettings: {
    position: 'absolute',
    zIndex: 10,
    borderRadius: '10px',
    boxShadow: '0px 8px 16px 0px rgba(0,0,0,0.2)',
  },
  modelButtonContainer: {
    position: 'relative',
    top: '100%',
  },
}))

interface ChatNavbarProps {
  bannerUrl?: string
  isgpt4?: boolean
}

const ChatNavbar = ({ bannerUrl = '', isgpt4 = true }: ChatNavbarProps) => {
  const router = useRouter()
  const [opened, { toggle }] = useDisclosure(false)
  const [show, setShow] = useState(true)
  const [isAdminOrOwner, setIsAdminOrOwner] = useState(false)
  const { classes, theme } = useStyles({ isAdmin: isAdminOrOwner })
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 825,
  )
  const clerk_user = useUser()
  const posthog = usePostHog()
  const {
    state: { showModelSettings, selectedConversation },
    dispatch: homeDispatch,
    handleNewConversation,
  } = useContext(HomeContext)

  const topBarRef = useRef<HTMLDivElement | null>(null)
  const getCurrentCourseName = () => {
    return router.asPath.split('/')[1]
  }

  useEffect(() => {
    const fetchCourses = async () => {
      if (clerk_user.isLoaded && clerk_user.isSignedIn) {
        const currUserEmails = extractEmailsFromClerk(clerk_user.user)
        // Posthog identify
        posthog?.identify(clerk_user.user.id, {
          email: currUserEmails[0] || 'no_email',
        })

        const response = await fetch(
          `/api/UIUC-api/getCourseMetadata?course_name=${getCurrentCourseName()}`,
        )
        const courseMetadata = await response.json().then((data) => {
          return data['course_metadata']
        })

        if (
          currUserEmails.includes(courseMetadata.course_owner) ||
          currUserEmails.some((email) =>
            courseMetadata.course_admins?.includes(email),
          )
        ) {
          setIsAdminOrOwner(true)
        } else {
          setIsAdminOrOwner(false)
        }
      }
    }
    fetchCourses()
  }, [clerk_user.isLoaded, clerk_user.isSignedIn])

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
      if (isAdminOrOwner && window.innerWidth > 825) {
        opened && toggle()
      } else if (!isAdminOrOwner && window.innerWidth > 500) {
        opened && toggle()
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [opened, toggle])

  return (
    <div
      className={`-mr-0 bg-[--background] px-12 pb-16 pl-5`}
      style={{ display: show ? 'block' : 'none' }}
    >
      <div
        style={{
          paddingTop: 'Opx',
          maxWidth: '100vw',
          marginRight: '0px',
          paddingLeft: '17px',
        }}
      >
        <Flex
          justify="flex-start"
          direction="row"
          styles={{ height: '10px', flexWrap: 'nowrap', gap: '0rem' }}
          className="navbar rounded-badge bg-[--navbar-background] shadow-lg shadow-[--navbar-shadow]"
        >
          <Link href="/" style={{ flex: 'none', flexWrap: 'nowrap' }}>
            <h2 className="cursor-pointer font-extrabold tracking-tight text-white sm:ms-3 sm:text-[2rem] sm:text-[2rem] md:text-3xl">
              Illinois <span className="text-[--primary]">Chat</span>
            </h2>
          </Link>
          <div className="pl-2">
            <ThemeToggle />
          </div>

          {bannerUrl ? (
            <div style={{ ...styles.logoContainerBox, flex: '1' }}>
              <Image
                src={bannerUrl}
                style={{ ...styles.thumbnailImage }}
                width={2000}
                height={2000}
                alt="The course creator uploaded a logo for this chatbot."
                aria-label="The course creator uploaded a logo for this chatbot."
                onError={(e) => (e.currentTarget.style.display = 'none')} // display nothing if image fails
              />
            </div>
          ) : (
            // Placeholder div
            <div
              style={{
                ...styles.logoContainerBox,
                flex: '1',
                visibility: 'hidden',
              }}
            ></div>
          )}

          <Group
            position="right"
            styles={{ marginLeft: 'auto', flexWrap: 'nowrap' }}
            spacing="0px"
            noWrap
          >
            {/* This is the hamburger menu / dropdown */}
            <Transition
              transition="pop-top-right"
              duration={200}
              mounted={opened}
            >
              {(styles) => (
                <Paper
                  className={classes.dropdown}
                  withBorder
                  style={{
                    ...styles,
                    transform: 'translateY(26px)',
                    minWidth: '120px',
                  }}
                >
                  {/* New Chat button in hamburger when screen is small */}
                  <div
                    className={classes.link}
                    style={{
                      display:
                        windowWidth <= (isAdminOrOwner ? 500 : 350) && opened
                          ? 'block'
                          : 'none',
                      padding: 0,
                    }}
                  >
                    <div
                      onClick={() => {
                        handleNewConversation()
                        toggle()
                        setTimeout(() => {
                          const chatInput = document.querySelector(
                            'textarea.chat-input',
                          ) as HTMLTextAreaElement
                          if (chatInput) {
                            chatInput.focus()
                          }
                        }, 100)
                      }}
                      style={{
                        width: '100%',
                        padding: '8px',
                        cursor: 'pointer',
                        height: '100%',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <IconPlus size={24} />
                        <span
                          className={`${montserrat_heading.variable} font-montserratHeading`}
                          style={{ marginLeft: '8px' }}
                        >
                          New Chat
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Settings button in hamburger when screen is small */}
                  <div
                    className={classes.link}
                    style={{
                      display: windowWidth <= 675 && opened ? 'block' : 'none',
                      padding: 0,
                    }}
                  >
                    <div
                      onClick={() => {
                        homeDispatch({
                          field: 'showModelSettings',
                          value: !showModelSettings,
                        })
                        toggle()
                      }}
                      style={{
                        width: '100%',
                        padding: '8px',
                        cursor: 'pointer',
                        height: '100%',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <IconSettings size={24} />
                        <span
                          className={`${montserrat_heading.variable} font-montserratHeading`}
                          style={{ marginLeft: '8px' }}
                        >
                          Settings
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Admin Dashboard in hamburger when screen is small */}
                  {isAdminOrOwner && (
                    <div
                      className={classes.link}
                      style={{
                        display:
                          windowWidth <= 825 && opened ? 'block' : 'none',
                        padding: 0,
                      }}
                    >
                      <Link
                        href={`/${getCurrentCourseName()}/dashboard`}
                        onClick={() => toggle()}
                        style={{
                          width: '100%',
                          padding: '8px',
                          cursor: 'pointer',
                          textDecoration: 'none',
                          color: 'inherit',
                          display: 'block',
                          height: '100%',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <IconHome size={24} />
                          <span
                            className={`${montserrat_heading.variable} font-montserratHeading`}
                            style={{ marginLeft: '8px' }}
                          >
                            Admin Dashboard
                          </span>
                        </div>
                      </Link>
                    </div>
                  )}
                </Paper>
              )}
            </Transition>

            {/* This is the main links on top  */}
            <Container
              className={classes.inner}
              style={{ padding: 0, margin: 0 }}
            >
              <div className={classes.newChat}>
                <button
                  className={`${classes.link}`}
                  style={{ padding: '3px 8px', minWidth: '100px' }}
                  onClick={() => {
                    handleNewConversation()
                    setTimeout(() => {
                      const chatInput = document.querySelector(
                        'textarea.chat-input',
                      ) as HTMLTextAreaElement
                      if (chatInput) {
                        chatInput.focus()
                      }
                    }, 100)
                  }}
                  aria-label="Start a new chat"
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      width: '100%',
                    }}
                  >
                    <IconPlus
                      size={24}
                      style={{
                        position: 'relative',
                        top: '-2px',
                        paddingLeft: '-3px',
                      }}
                    />
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-center',
                        padding: '0px',
                        height: '40px',
                        whiteSpace: 'nowrap',
                        marginLeft: '5px',
                      }}
                    >
                      <span
                        style={{ whiteSpace: 'nowrap' }}
                        className={`${montserrat_heading.variable} font-montserratHeading`}
                      >
                        New Chat
                      </span>
                    </span>
                  </div>
                </button>
              </div>
              <div className={classes.settings}>
                <button
                  className={`${classes.link}`}
                  style={{ padding: '3px 8px', minWidth: '100px' }}
                  onClick={() => {
                    homeDispatch({
                      field: 'showModelSettings',
                      value: !showModelSettings,
                    })
                  }}
                  aria-label={`Open or close show model settings.`}
                >
                  <div
                    ref={topBarRef}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      width: '100%',
                    }}
                  >
                    <IconSettings
                      size={24}
                      style={{
                        position: 'relative',
                        top: '-2px',
                        paddingLeft: '-3px',
                      }}
                    />
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-center',
                        padding: '0px',
                        height: '40px',
                        whiteSpace: 'nowrap',
                        marginLeft: '5px',
                      }}
                    >
                      <span
                        style={{ whiteSpace: 'nowrap' }}
                        className={`${montserrat_heading.variable} font-montserratHeading`}
                      >
                        Settings
                      </span>
                    </span>
                  </div>
                </button>
              </div>
              {isAdminOrOwner && (
                <div className={classes.adminDashboard}>
                  <button
                    className={`${classes.link}`}
                    style={{ padding: '3px 8px', minWidth: '100px' }}
                    onClick={(e) => {
                      // Handle click with modifier keys
                      if (e.ctrlKey || e.metaKey || e.shiftKey) {
                        window.open(
                          `/${getCurrentCourseName()}/dashboard`,
                          '_blank',
                        )
                      } else {
                        router.push(`/${getCurrentCourseName()}/dashboard`)
                      }
                    }}
                    onAuxClick={(e) => {
                      // Handle middle click (button 1)
                      if (e.button === 1) {
                        window.open(
                          `/${getCurrentCourseName()}/dashboard`,
                          '_blank',
                        )
                      }
                    }}
                    onContextMenu={(e) => {
                      // Don't prevent default to allow normal right-click menu
                      // But add the URL to the clipboard
                      navigator.clipboard.writeText(
                        `${window.location.origin}/${getCurrentCourseName()}/dashboard`,
                      )
                    }}
                    aria-label={`Go to dashboard`}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        width: '100%',
                        position: 'relative',
                      }}
                    >
                      <IconHome
                        size={30}
                        strokeWidth={2}
                        style={{
                          marginRight: '4px',
                          marginLeft: '4px',
                          position: 'relative',
                          top: '-2px',
                        }}
                      />
                      <span
                        style={{
                          backgroundImage:
                            "url('/media/hero-header-underline-reflow.svg')",
                          backgroundRepeat: 'no-repeat',
                          backgroundSize: 'contain',
                          backgroundPosition: 'bottom',
                          width: '100%',
                          height: '40px',
                          position: 'relative',
                          top: '13px',
                        }}
                      >
                        <span
                          className={`${montserrat_heading.variable} font-montserratHeading`}
                        >
                          Admin Dashboard
                        </span>
                      </span>
                    </div>
                  </button>
                </div>
              )}
              <div
                style={{
                  position: 'absolute',
                  zIndex: 100,
                  right: '30px',
                  top: '75px',
                }}
              >
                <UserSettings />
              </div>
            </Container>

            <Container style={{ padding: 0, margin: 0 }}>
              <Burger
                opened={opened}
                onClick={toggle}
                className={classes.burger}
                size="sm"
              />
            </Container>

            {/* Sign in buttons */}
            <div
              className="pl-1 pr-2"
              style={{
                // marginLeft: '-5px',
                position: 'relative',
                top: '-2px',
                justifyContent: 'flex-center',
              }}
            >
              <SignedIn>
                <Group grow spacing={'xs'}>
                  <UserButton afterSignOutUrl="/" />
                </Group>
              </SignedIn>
              <SignedOut>
                <SignInButton>
                  <button className={classes.link}>
                    <div
                      className={`${montserrat_heading.variable} font-montserratHeading`}
                      style={{ fontSize: '12px' }}
                    >
                      <span style={{ whiteSpace: 'nowrap' }}>Sign in / </span>
                      <span> </span>
                      {/* ^^ THIS SPAN IS REQUIRED !!! TO have nice multiline behavior */}
                      <span style={{ whiteSpace: 'nowrap' }}>Sign up</span>
                    </div>
                  </button>
                </SignInButton>
              </SignedOut>
            </div>
          </Group>
        </Flex>
      </div>
    </div>
  )
}
export default ChatNavbar
