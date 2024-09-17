import Link from 'next/link'
import GlobalHeader from '~/components/UIUC-Components/navbars/GlobalHeader'
import { Flex, Indicator, Tooltip } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import {
  createStyles,
  Container,
  Burger,
  rem,
  Transition,
  Paper,
} from '@mantine/core'
import {
  ChartDots3,
  MessageChatbot,
  Folder,
  ReportAnalytics,
  MessageCode,
  Key,
  Code,
  Brain,
  Message,
} from 'tabler-icons-react'
import { useRouter } from 'next/router'
import { montserrat_heading, montserrat_paragraph } from 'fonts'

const styles: Record<string, React.CSSProperties> = {
  logoContainerBox: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    height: '100%',
    maxWidth:
      typeof window !== 'undefined' && window.innerWidth > 600 ? '80%' : '100%',
    paddingRight:
      typeof window !== 'undefined' && window.innerWidth > 600 ? '4px' : '25px',
    paddingLeft: '25px',
  },
  thumbnailImage: {
    objectFit: 'cover',
    objectPosition: 'center',
    height: '100%',
    width: 'auto',
  },
}

const HEADER_HEIGHT = rem(90)

const useStyles = createStyles((theme) => ({
  burger: {
    [theme.fn.largerThan('md')]: {
      // 968px
      display: 'none',
    },
  },
  links: {
    padding: '0em',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',

    [theme.fn.smallerThan('md')]: {
      display: 'none',
    },
  },

  inner: {
    height: HEADER_HEIGHT,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  link: {
    fontSize: rem(13),
    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
    margin: '0.1rem',
    fontWeight: 700,
    transition:
      'border-color 100ms ease, color 100ms ease, background-color 100ms ease',
    borderRadius: theme.radius.sm,

    '&:hover': {
      color: 'hsl(280,100%,70%)',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      textDecoration: 'none',
      borderRadius: '8px',
    },

    '&[data-active="true"]': {
      color: 'hsl(280,100%,70%)',
      borderBottom: '2px solid hsl(280,100%,70%)',
      textDecoration: 'none',
      borderRadius: '8px',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      textAlign: 'right',
    },
    [theme.fn.smallerThan('md')]: {
      display: 'list-item',
      textAlign: 'center',
      borderRadius: 0,
      padding: theme.spacing.xs,
    },
  },

  dropdown: {
    position: 'absolute',
    top: HEADER_HEIGHT,
    right: '20px',
    zIndex: 2,
    borderRadius: '10px',
    overflow: 'hidden',
    width: '200px',
    [theme.fn.largerThan('lg')]: {
      display: 'none',
    },
  },
}))

const Navbar = ({
  course_name = '',
  bannerUrl = '',
  isgpt4 = true,
  isPlain = false,
}) => {
  const { classes, theme } = useStyles()
  const router = useRouter()
  const [activeLink, setActiveLink] = useState(router.asPath)
  const [opened, { toggle, close }] = useDisclosure(false)

  useEffect(() => {
    setActiveLink(router.asPath)
  }, [router.asPath])

  const handleLinkClick = (path: string) => {
    setActiveLink(path)
    // toggle()
    close() // This will always close the menu, regardless of screen size
  }

  const getCurrentCourseName = () => {
    return router.asPath.split('/')[1]
  }

  const items = [
    // {
    //   name: (
    //     <span
    //       className={`${montserrat_heading.variable} font-montserratHeading`}
    //     >
    //       Chat
    //     </span>
    //   ),
    //   icon: <MessageChatIcon />,
    //   link: `/${getCurrentCourseName()}/chat`,
    // },
    {
      name: (
        <span
          className={`${montserrat_heading.variable} font-montserratHeading`}
        >
          Materials
        </span>
      ),
      icon: <FolderIcon />,
      link: `/${getCurrentCourseName()}/materials`,
    },
    {
      name: (
        <Indicator
          label="New"
          color="hsl(280,100%,70%)"
          size={12}
          styles={{ indicator: { top: '-4px !important' } }}
        >
          {' '}
          <span
            className={`${montserrat_heading.variable} font-montserratHeading`}
          >
            LLMs
          </span>
        </Indicator>
      ),
      icon: <LLMIcon />,
      link: `/${getCurrentCourseName()}/llms`,
    },
    {
      name: (
        <span
          className={`${montserrat_heading.variable} font-montserratHeading`}
        >
          Analysis
        </span>
      ),
      icon: <ReportIcon />,
      link: `/${getCurrentCourseName()}/analysis`,
    },
    {
      name: (
        <span
          className={`${montserrat_heading.variable} font-montserratHeading`}
        >
          Prompting
        </span>
      ),
      icon: <MessageCodeIcon />,
      link: `/${getCurrentCourseName()}/prompt`,
    },
    {
      name: (
        <span
          className={`${montserrat_heading.variable} font-montserratHeading`}
        >
          Tools
        </span>
      ),
      icon: <ChartDots3Icon />,
      link: `/${getCurrentCourseName()}/tools`,
    },
    {
      name: (
        <span
          className={`${montserrat_heading.variable} font-montserratHeading`}
        >
          API
        </span>
      ),
      icon: <ApiIcon />,
      link: `/${getCurrentCourseName()}/api`,
    },
  ]

  return (
    <div className="bg-[#2e026d]">
      <Flex direction="row" align="center" justify="center">
        <div className="mt-2 w-full max-w-[98%]">
          <div className="navbar rounded-badge h-20 bg-[#15162c] shadow-lg shadow-purple-800">
            <div className="flex-1">
              <Link href="/">
                <h2 className="ms-4 cursor-pointer text-2xl font-extrabold tracking-tight text-white sm:text-[1.8rem] ">
                  UIUC.<span className="text-[hsl(280,100%,70%)]">chat</span>
                </h2>
              </Link>
            </div>

            {bannerUrl && (
              <div style={{ ...styles.logoContainerBox }}>
                <Image
                  src={bannerUrl}
                  style={{ ...styles.thumbnailImage }}
                  width={2000}
                  height={2000}
                  alt="The course creator uploaded a logo for this chatbot."
                  aria-label="The course creator uploaded a logo for this chatbot."
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              </div>
            )}

            {!isPlain && (
              <>
                <Transition
                  transition="pop-top-right"
                  duration={200}
                  mounted={opened}
                >
                  {(styles) => (
                    <Paper
                      className={classes.dropdown}
                      withBorder
                      style={styles}
                    >
                      {items.map((item, index) => (
                        <Link
                          key={index}
                          href={item.link}
                          onClick={() => handleLinkClick(item.link)}
                          data-active={activeLink === item.link}
                          className={classes.link}
                        >
                          <span
                            style={{ display: 'flex', alignItems: 'center' }}
                          >
                            {item.icon}
                            {item.name}
                          </span>
                        </Link>
                      ))}
                    </Paper>
                  )}
                </Transition>
                <button
                  className={`${classes.link}`}
                  onClick={() => {
                    router.push(`/${getCurrentCourseName()}/chat`)
                  }}
                >
                  <div
                    // ref={topBarRef}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      width: '100%',
                    }}
                  >
                    <MessageChatIcon />
                    <span
                      style={{
                        whiteSpace: 'nowrap',
                        marginRight: '-5px',
                        paddingRight: '2px',
                        padding: `4px 0`,
                      }}
                      className={`${montserrat_heading.variable} font-montserratHeading`}
                    >
                      {/* Model: {modelName} */}
                      {/* {selectedConversation?.model.name} */}
                      Chat
                    </span>
                    {/* </span> */}
                  </div>
                </button>
                <Container
                  className={classes.inner}
                  style={{ paddingLeft: '0px' }}
                >
                  <div className={classes.links}>
                    {items.map((item, index) => (
                      <Link
                        key={index}
                        href={item.link}
                        onClick={() => handleLinkClick(item.link)}
                        data-active={activeLink === item.link}
                        className={classes.link}
                      >
                        <span style={{ display: 'flex', alignItems: 'center' }}>
                          {item.icon}
                          {item.name}
                        </span>
                      </Link>
                    ))}
                  </div>
                </Container>
                <Burger
                  opened={opened}
                  onClick={toggle}
                  className={classes.burger}
                  size="sm"
                />
              </>
            )}

            <GlobalHeader isNavbar={true} />
          </div>
        </div>
      </Flex>
    </div>
  )
}

export default Navbar

export function MessageChatIcon() {
  return (
    <MessageChatbot
      size={18}
      strokeWidth={2}
      style={{ marginRight: '3px', marginLeft: '3px' }}
    />
  )
}

export function MessageCodeIcon() {
  return (
    <MessageCode
      size={18}
      strokeWidth={2}
      style={{ marginRight: '3px', marginLeft: '3px' }}
    />
  )
}

export function FolderIcon() {
  return (
    <Folder
      size={18}
      strokeWidth={2}
      style={{ marginRight: '3px', marginLeft: '3px' }}
    />
  )
}

export function ReportIcon() {
  return (
    <ReportAnalytics
      size={18}
      strokeWidth={2}
      style={{ marginRight: '3px', marginLeft: '3px' }}
    />
  )
}

export function LLMIcon() {
  return (
    <Brain
      size={18}
      strokeWidth={2}
      style={{ marginRight: '3px', marginLeft: '3px' }}
    />
  )
}

export function ApiIcon() {
  return (
    <Code
      size={18}
      strokeWidth={2}
      style={{ marginRight: '3px', marginLeft: '3px' }}
    />
  )
}

export function ChartDots3Icon() {
  return (
    <ChartDots3
      size={18}
      strokeWidth={2}
      style={{ marginRight: '3px', marginLeft: '3px' }}
    />
  )
}
