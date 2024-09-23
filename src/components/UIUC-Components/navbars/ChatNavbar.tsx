import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import { magicBellTheme } from '~/components/UIUC-Components/navbars/GlobalHeader'
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
import { spotlight } from '@mantine/spotlight'
import {
  MessageChatbot,
  Folder,
  ReportAnalytics,
  ChartDots3,
  MessageCode,
} from 'tabler-icons-react'
import { IconFileText, IconHome, IconSettings } from '@tabler/icons-react'
import { useRouter } from 'next/router'
import { montserrat_heading } from 'fonts'
import { useUser } from '@clerk/nextjs'
import { extractEmailsFromClerk } from '~/components/UIUC-Components/clerkHelpers'
import { type CourseMetadata } from '~/types/courseMetadata'
import HomeContext from '~/pages/api/home/home.context'
import { UserSettings } from '../../Chat/UserSettings'
import MagicBell, {
  FloatingNotificationInbox,
} from '@magicbell/magicbell-react'
import { usePostHog } from 'posthog-js/react'

const styles: Record<string, React.CSSProperties> = {
  logoContainerBox: {
    // justifyContent: 'center',
    // alignItems: 'center',
    // overflow: 'hidden',
    // position: 'relative',
    // height: '40%',
    height: '52px',
    maxWidth:
      typeof window !== 'undefined' && window.innerWidth > 600 ? '80%' : '100%',
    // maxWidth: '100%',
    // paddingRight:
    //   typeof window !== 'undefined' && window.innerWidth > 600 ? '10px' : '2px',
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

const useStyles = createStyles((theme) => ({
  inner: {
    height: HEADER_HEIGHT,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  links: {
    // padding: 'theme.spacing.sm, 5px, 5px',
    padding: 'theme.spacing.lg, 1em, 1em',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    [theme.fn.smallerThan(1118)]: {
      display: 'none',
    },
  },
  link: {
    // textTransform: 'uppercase',
    fontSize: rem(12),
    textAlign: 'center',
    padding: `3px ${theme.spacing.sm}`,
    margin: '0.2rem',
    fontWeight: 700,
    transition:
      'border-color 100ms ease, color 100ms ease, background-color 100ms ease',
    borderRadius: theme.radius.sm,
    '&:hover': {
      color: 'hsl(280,100%,70%)',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      textDecoration: 'none',
      borderRadius: '10px',
    },
    '&[data-active="true"]': {
      color: 'hsl(280,100%,70%)',
      borderBottom: '2px solid hsl(280,100%,70%)',
      textDecoration: 'none',
      borderRadius: '10px',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      textAlign: 'right',
    },
    [theme.fn.smallerThan(1118)]: {
      display: 'list-item',
      textAlign: 'center',
      borderRadius: 0,
      padding: theme.spacing.sm,
      margin: '0.2rem 0 0.2rem 0',
    },
  },
  burger: {
    [theme.fn.largerThan(1118)]: {
      display: 'none',
      marginRight: '8px',
    },
    marginRight: '3px',
    marginLeft: '0px',
  },
  dropdown: {
    position: 'absolute',
    top: HEADER_HEIGHT,
    // left: '71%',
    right: '20px',
    zIndex: 10,
    borderRadius: '10px',
    overflow: 'hidden',
    width: '200px',
    [theme.fn.largerThan(1118)]: {
      display: 'none',
    },
  },
  modelSettings: {
    position: 'absolute',
    // top: '600px',
    // left: '-50px',
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
  const { classes, theme } = useStyles()
  const router = useRouter()
  const [activeLink, setActiveLink] = useState<null | string>(null)
  const [opened, { toggle }] = useDisclosure(false)
  const [show, setShow] = useState(true)
  const [isAdminOrOwner, setIsAdminOrOwner] = useState(false)
  const clerk_user = useUser()
  const posthog = usePostHog()
  const {
    state: { showModelSettings, selectedConversation },
    dispatch: homeDispatch,
  } = useContext(HomeContext)

  const topBarRef = useRef<HTMLDivElement | null>(null)
  const getCurrentCourseName = () => {
    return router.asPath.split('/')[1]
  }

  const [userEmail, setUserEmail] = useState('no_email')

  useEffect(() => {
    if (!router.isReady) return
    setActiveLink(router.asPath.split('?')[0]!)
  }, [router.asPath])

  useEffect(() => {
    const fetchCourses = async () => {
      if (clerk_user.isLoaded && clerk_user.isSignedIn) {
        const currUserEmails = extractEmailsFromClerk(clerk_user.user)
        // Posthog identify
        posthog?.identify(clerk_user.user.id, {
          email: currUserEmails[0] || 'no_email',
        })
        setUserEmail(currUserEmails[0] || 'no_email')

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

  const items = [
    ...(spotlight
      ? [
          // {
          //   name: (
          //     <span
          //       className={`${montserrat_heading.variable} font-montserratHeading`}
          //     >
          //       Groups/Tools
          //     </span>
          //   ),
          //   icon: <SpotlightIcon />,
          //   action: () => spotlight.open(), // This opens the Spotlight
          // },
        ]
      : []),
    ...(isAdminOrOwner
      ? [
          {
            name: (
              <span
                className={`${montserrat_heading.variable} font-montserratHeading`}
              >
                Chat
              </span>
            ),
            icon: <MessageChatIcon />,
            link: `/${getCurrentCourseName()}/chat`,
          },
          {
            name: (
              <span
                className={`${montserrat_heading.variable} font-montserratHeading`}
              >
                Admin Dashboard
              </span>
            ),
            icon: <FolderIcon />,
            link: `/${getCurrentCourseName()}/materials`,
          },
          // {
          //   name: (
          //     <span
          //       className={`${montserrat_heading.variable} font-montserratHeading`}
          //     >
          //       Analysis
          //     </span>
          //   ),
          //   icon: <ReportIcon />,
          //   link: `/${getCurrentCourseName()}/query-analysis`,
          // },
          // {
          //   name: (
          //     <span
          //       className={`${montserrat_heading.variable} font-montserratHeading`}
          //     >
          //       Prompting
          //     </span>
          //   ),
          //   icon: <SettingIcon />,
          //   link: `/${getCurrentCourseName()}/prompt`,
          // },
        ]
      : []),
  ]

  return (
    <div
      className={`${isgpt4 ? 'bg-[#15162c]' : 'bg-[#2e026d]'} -mr-5 pb-16 pl-5`}
      style={{ display: show ? 'block' : 'none' }}
      // style={{ display: show ? 'flex' : 'none', flexDirection: 'row', height: '40%', alignItems: 'center' }}
    >
      <div
        // className="mt-4"
        style={{ paddingTop: 'Opx', maxWidth: '95vw', marginRight: '45px' }}
      >
        {/* <div > */}
        {/* <Flex style={{ flexDirection: 'row' }} className="navbar rounded-badge h-24 bg-[#15162c] shadow-lg shadow-purple-800"> */}

        <Flex
          justify="flex-start"
          direction="row"
          styles={{ height: '10px', flexWrap: 'nowrap', gap: '0rem' }}
          className="navbar rounded-badge bg-[#15162c] shadow-lg shadow-purple-800"
        >
          {/* <div> */}
          {/* <div
            style={{
              ...styles.logoContainerBox,
              // display: 'flex',
              // alignItems: 'center',
              // justifyContent: 'flex-start',
            }}
          > */}
          <Link href="/" style={{ flex: 'none', flexWrap: 'nowrap' }}>
            <h2 className="cursor-pointer font-extrabold tracking-tight text-white sm:ms-3 sm:text-[2rem] sm:text-[2rem] md:text-3xl">
              UIUC.<span className="text-[hsl(280,100%,70%)]">chat</span>
            </h2>
          </Link>

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
          {/* </Flex> */}
          {/* </div> */}
          {/* </div> */}

          {/* <div style={{ display: 'flex', justifyContent: 'flex-end' }}> */}
          {/* <Flex direction='row' justify='flex-end' styles={{ flex: 1 }}> */}
          <Group
            position="right"
            styles={{ marginLeft: 'auto', flexWrap: 'nowrap' }}
            spacing="0px"
            noWrap
          >
            {/* TODO: .mantine-kivjf7 {gap: 0rem} */}
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
                  {items.map((item, index) => {
                    if (item.link) {
                      return (
                        <Link
                          key={index}
                          href={item.link}
                          onClick={() => {
                            // setActiveLink(router.asPath.split('?')[0]!)
                            toggle()
                          }}
                          data-active={activeLink === item.link}
                          className={classes.link}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {item.icon}
                          <span
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'flex-center',
                              padding: '0px',
                              whiteSpace: 'nowrap',
                              width: '100%',
                            }}
                          >
                            {item.name}
                          </span>
                        </Link>
                      )
                    }
                    // else {
                    //   return (
                    //     <button
                    //       key={index}
                    //       onClick={() => {
                    //         if (item.action) {
                    //           item.action()
                    //         }
                    //         toggle()
                    //       }}
                    //       data-active={activeLink === item.link}
                    //       className={classes.link}
                    //       style={{ width: '100%' }}
                    //     >
                    //       <div
                    //         style={{
                    //           display: 'flex',
                    //           alignItems: 'center',
                    //         }}
                    //       >
                    //         {item.icon}
                    //         <span
                    //           style={{
                    //             display: 'flex',
                    //             alignItems: 'center',
                    //             justifyContent: 'flex-center',
                    //             padding: '0px',
                    //             whiteSpace: 'nowrap',
                    //             width: '100%',
                    //           }}
                    //         >
                    //           {item.name}
                    //         </span>
                    //       </div>
                    //     </button>
                    //   )
                    // }
                  })}
                </Paper>
              )}
            </Transition>

            {/* This is the main links on top  */}
            <Container
              className={classes.inner}
              style={{ padding: 0, margin: 0 }}
            >
              <div className={classes.links}>
                {items.map((item, index) => {
                  if (item.link) {
                    return (
                      <Link
                        key={index}
                        href={item.link}
                        data-active={activeLink === item.link}
                        className={classes.link}
                        style={{ padding: '3px 12px' }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            width: '100%',
                          }}
                        >
                          {item.icon}
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
                            {item.name}
                          </span>
                        </div>
                      </Link>
                    )
                  }
                  // else {
                  //   return (
                  //     <button
                  //       key={index}
                  //       onClick={() => {
                  //         if (item.action) {
                  //           item.action()
                  //         }
                  //       }}
                  //       data-active={activeLink === item.link}
                  //       className={classes.link}
                  //       style={{ padding: '3px 12px' }}
                  //     >
                  //       <div
                  //         style={{
                  //           display: 'flex',
                  //           alignItems: 'center',
                  //           width: '100%',
                  //         }}
                  //       >
                  //         {item.icon}
                  //         <span
                  //           style={{
                  //             display: 'flex',
                  //             alignItems: 'center',
                  //             justifyContent: 'flex-center',
                  //             padding: '0px',
                  //             height: '40px',
                  //             whiteSpace: 'nowrap',
                  //             marginLeft: '5px',
                  //           }}
                  //         >
                  //           {item.name}
                  //         </span>
                  //       </div>
                  //     </button>
                  //   )
                  // }
                })}
              </div>
              <div style={{ display: 'block' }}>
                <button
                  className={`${classes.link}`}
                  style={{ padding: '0px 10px', minWidth: '120px' }}
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
                        marginRight: '-8px',
                      }}
                    />
                    <span
                      className="home-header_text-underline"
                      style={{
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'bottom left',
                        backgroundSize: 'contain',
                        height: '40px',
                        position: 'relative',
                        top: '12px',
                      }}
                    >
                      <span
                        style={{ whiteSpace: 'nowrap' }}
                        className={`${montserrat_heading.variable} font-montserratHeading`}
                      >
                        {/* Model: {modelName} */}
                        {/* {selectedConversation?.model.name} */}
                        Settings
                      </span>
                    </span>
                  </div>
                </button>
              </div>
              <div
                style={{
                  position: 'absolute',
                  zIndex: 100,
                  right: '30px',
                  top: '75px',
                }}
              >
                <UserSettings
                // ref={modelSettingsContainer}
                />
              </div>
            </Container>

            <Container style={{ padding: 0, margin: 0 }}>
              {isAdminOrOwner && (
                <Burger
                  opened={opened}
                  onClick={toggle}
                  className={classes.burger}
                  size="sm"
                />
              )}
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
                  {/* <div /> */}
                  {/* <div style={{ paddingLeft: '10px', paddingRight: '8px' }} /> */}

                  {/* render the MagicBell until userEmail is valid otherwise there is a warning message of userEmail */}
                  {userEmail !== 'no_email' && (
                    <MagicBell
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
                        <FloatingNotificationInbox
                          width={400}
                          height={500}
                          {...props}
                        />
                      )}
                    </MagicBell>
                  )}
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
            {/* </div> */}
            {/* </Flex> */}
          </Group>
        </Flex>
        {/* </div> */}
      </div>
    </div>
  )
}
export default ChatNavbar

export function SpotlightIcon() {
  return (
    <IconFileText
      size={20}
      strokeWidth={2}
      // color={'white'}
      style={{ marginRight: '4px', marginLeft: '4px' }}
    />
  )
}

export function MessageChatIcon() {
  return (
    <MessageChatbot
      size={20}
      strokeWidth={2}
      // color={'white'}
      style={{ marginRight: '4px', marginLeft: '4px' }}
    />
  )
}

export function FolderIcon() {
  return (
    <IconHome
      size={20}
      strokeWidth={2}
      // color={'white'}
      style={{ marginRight: '4px', marginLeft: '4px' }}
    />
  )
}

export function ReportIcon() {
  return (
    <ReportAnalytics
      size={20}
      strokeWidth={2}
      // color={'white'}
      style={{ marginRight: '4px', marginLeft: '4px' }}
    />
  )
}

export function SettingIcon() {
  return (
    <MessageCode
      size={20}
      strokeWidth={2}
      // color={'white'}
      style={{ marginRight: '4px', marginLeft: '4px' }}
    />
  )
}

export function ChartDots3Icon() {
  return (
    <ChartDots3
      size={20}
      strokeWidth={2}
      // color={'white'}
      style={{ marginRight: '4px', marginLeft: '4px' }}
    />
  )
}
