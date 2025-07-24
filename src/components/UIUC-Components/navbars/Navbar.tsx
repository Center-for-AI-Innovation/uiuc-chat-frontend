import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { montserrat_heading } from 'fonts'
import GlobalHeader from '~/components/UIUC-Components/navbars/GlobalHeader'
import {
  Flex,
  Indicator,
  Collapse,
  Container,
  Burger,
  Paper,
  createStyles,
  rem,
  Transition,
  Tooltip,
  Divider,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  ChartDots3,
  MessageChatbot,
  ReportAnalytics,
  MessageCode,
  Code,
  Brain,
} from 'tabler-icons-react'
import {
  IconChevronDown,
  IconChevronLeft,
  IconCompass,
  IconHome,
  IconFilePlus,
  IconClipboardText,
  IconSparkles,
} from '@tabler/icons-react'

interface NavbarProps {
  course_name?: string
  bannerUrl?: string
  isPlain?: boolean
}

interface NavItem {
  name: React.ReactNode
  icon: React.ReactElement
  link: string
}

interface NavigationContentProps {
  items: NavItem[]
  opened: boolean
  activeLink: string
  onLinkClick: () => void
  onToggle: () => void
  courseName: string
}

const HEADER_HEIGHT = rem(90)

const useStyles = createStyles((theme) => ({
  burger: {
    [theme.fn.largerThan('md')]: {
      display: 'none',
    },
  },

  settingsToggle: {
    marginLeft: '-6rem', //offset further to counter the chatButton wrapper width of w-[6rem]. really should change this to a css variable!!

    [theme.fn.largerThan('md')]: {
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

  settingsLinks: {
    display: 'flex',
    gap: '0rem 0rem',

    marginTop: '.75rem',
    marginLeft: '-1rem', //offset so button text lines up
    padding: '0px',

    [theme.fn.smallerThan('md')]: {
      display: 'none',
    },
  },

  inner: {
    //    height: HEADER_HEIGHT,
    display: 'flex',
    alignItems: 'start',
    justifyContent: 'space-between',
  },

  link: {
    fontSize: rem(13),
    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
    //    margin: '0.1rem',
    fontWeight: 500,
    color: 'var(--navbar-foreground)',
    transition:
      'border-color 100ms ease, color 100ms ease, background-color 100ms ease',
    borderRadius: theme.radius.sm,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',

    '&:hover': {
      color: 'var(--navbar-hover)',
      backgroundColor: 'var(--navbar-hover-background)',
      textDecoration: 'none',
    },

    '&[data-active="true"]': {
      color: 'var(--navbar-active)',
      /*      borderBottom: '2px solid var(--navbar-hover)',*/
      textDecoration: 'none',
      backgroundColor: 'var(--navbar-background)', //keep the same background color, so only changes on hover of non-active links
      //      textAlign: 'left',
    },

    [theme.fn.smallerThan('md')]: {
      justifyContent: 'flex-start',
      borderRadius: 0,
      backgroundColor: 'var(--navbar-background)',
      padding: `${theme.spacing.lg} ${theme.spacing.sm}`, //extra padding for larger tap area
    },
  },

  settingsLink: {
    [theme.fn.smallerThan('md')]: {
      display: 'flex',

      backgroundColor: 'transparent',

      borderRadius: theme.radius.sm,
    },
  },

  chatButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',

    fontSize: rem(13),
    fontWeight: 500,

    color: 'var(--foreground-faded)',

    padding: `.4rem ${theme.spacing.sm}`,
    border: '1px solid var(--navbar-border)',
    borderRadius: theme.radius.sm,

    transition:
      'border-color 100ms ease, color 100ms ease, background-color 100ms ease',

    '&:hover': {
      color: 'var(--dashboard-button)',
      borderColor: 'var(--dashboard-button)',
      textDecoration: 'none',
    },
  },

  dropdown: {
    position: 'absolute',
    top: '4rem',
    right: '.5rem',
    zIndex: 2,
    border: '1px solid var(--navbar-border)',
    borderRadius: '10px',
    overflow: 'hidden',
    width: 'calc(100% - 1rem)',
    maxWidth: '330px',
    backgroundColor: 'var(--background-faded)',
    boxShadow: theme.shadows.lg,
    [theme.fn.largerThan('lg')]: {
      display: 'none',
    },
    '& a': {},
  },

  iconButton: {
    color: 'var(--navbar-foreground)',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    transition: 'all 0.2s ease',

    '&:hover': {
      color: 'var(--navbar-hover)',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
  },

  divider: {
    borderColor: 'rgba(255, 255, 255, 0.2)',
    height: '2rem',
    marginTop: '0.25rem',
  },
}))

const styles = {
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
} as const

function Logo() {
  return (
    <div className="flex-1">
      <Link href="/">
        <h2 className="ms-4 cursor-pointer text-2xl font-extrabold tracking-tight text-white sm:text-[1.8rem]">
          <span className="text-[--illinois-orange]">Illinois</span>{' '}
          <span className="text-[--foreground]">Chat</span>
        </h2>
      </Link>
    </div>
  )
}

function BannerImage({ url }: { url: string }) {
  return (
    <div style={styles.logoContainerBox}>
      <Image
        src={url}
        style={styles.thumbnailImage}
        width={2000}
        height={2000}
        alt="Course chatbot logo"
        aria-label="The course creator uploaded a logo for this chatbot."
        onError={(e) => (e.currentTarget.style.display = 'none')}
      />
    </div>
  )
}

function NavText({ children }: { children: React.ReactNode }) {
  return (
    <span className={`${montserrat_heading.variable} font-montserratHeading`}>
      {children}
    </span>
  )
}

function getCurrentPageName(link: String, items: []) {
  let found = items.filter((item) => link == item.link)

  return found.length > 0 ? found[0].name : ''
}

function NavigationContent({
  items,
  opened,
  activeLink,
  onLinkClick,
  onToggle,
  courseName,
}: NavigationContentProps) {
  const { classes } = useStyles()
  const router = useRouter()

  return (
    <>
      <Transition transition="pop-top-right" duration={200} mounted={opened}>
        {(styles) => (
          <Paper className={classes.dropdown} style={styles}>
            {items.map((item, index) => (
              <Link
                key={index}
                href={item.link}
                onClick={() => onLinkClick()}
                data-active={activeLink === item.link}
                className={classes.link}
              >
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  {item.icon}
                  {item.name}
                </span>
              </Link>
            ))}
          </Paper>
        )}
      </Transition>

      <Container className={classes.inner} style={{ paddingLeft: '0px' }}>
        <div className={classes.links}>
          {items.map((item, index) => (
            <Link
              key={index}
              href={item.link}
              onClick={() => onLinkClick()}
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
        onClick={onToggle}
        className={classes.burger}
        size="sm"
        color="var(--foreground)"
      />
    </>
  )
}

function SettingsNavigationContent({
  items,
  opened,
  activeLink,
  onLinkClick,
  onToggle,
  courseName,
}: NavigationContentProps) {
  const { classes } = useStyles()
  const router = useRouter()

  const [settingsNavOpen, setSettingsNavOpen] = useState(false)

  return (
    <>
      <Paper
        className={`${classes.settingsToggle} mb-4 mt-4 rounded-xl bg-[--dashboard-background-faded] px-4 sm:px-6 md:px-8`}
        p="md"
        sx={{
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onClick={() => setSettingsNavOpen(!settingsNavOpen)}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="text-[--navbar-foreground]">
            {getCurrentPageName(activeLink, items)}
          </div>

          <div
            className="transition-transform duration-200"
            style={{
              transform: settingsNavOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              color: 'var(--dashboard-foreground)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconChevronDown size={24} />
          </div>
        </div>

        <Collapse in={settingsNavOpen} transitionDuration={200}>
          <div className="mt-4">
            {items.map((item, index) => (
              <Link
                key={index}
                href={item.link}
                onClick={() => onLinkClick()}
                data-active={activeLink === item.link}
                className={`${classes.link} ${classes.settingsLink}`}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
          </div>
        </Collapse>
      </Paper>

      {/*
      <button
        className={classes.chatButton}
        onClick={() => {
          if (courseName) router.push(`/${courseName}/chat`)
        }}
      >
        <div className={`flex items-center gap-1 ${montserrat_heading.variable} font-montserratHeading`}>
          <IconChevronLeft />
          <div>Chat</div>
        </div>
      </button>
*/}

      <Container className={classes.settingsLinks}>
        {items.map((item, index) => (
          <Link
            key={index}
            href={item.link}
            onClick={() => onLinkClick()}
            data-active={activeLink === item.link}
            className={classes.link}
          >
            <div className="flex items-center">
              {item.icon}
              {item.name}
            </div>
          </Link>
        ))}
      </Container>

      {/*
      <Burger
        opened={opened}
        onClick={onToggle}
        className={classes.burger}
        size="sm"
        color="var(--foreground)"
      />
*/}
    </>
  )
}

// Icon Components
export function MessageChatIcon() {
  return (
    <MessageChatbot
      size={18}
      strokeWidth={2}
      style={{ marginRight: '3px', marginLeft: '3px' }}
    />
  )
}

export function DashboardIcon() {
  return (
    <IconHome
      size={20}
      strokeWidth={2}
      style={{ marginRight: '4px', marginLeft: '4px' }}
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

export function MessageCodeIcon() {
  return (
    <MessageCode
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

export function FileIcon() {
  return (
    <IconFilePlus
      color="var(--foreground)"
      size={20}
      strokeWidth={2}
      style={{ margin: '0' }}
    />
  )
}

export function ClipboardIcon() {
  return (
    <IconClipboardText
      color="var(--foreground)"
      size={20}
      strokeWidth={2}
      style={{ margin: '0' }}
    />
  )
}

export default function Navbar({
  course_name = '',
  bannerUrl = '',
  isPlain = false,
  showSettingsNav = false,
}: NavbarProps) {
  const [opened, { toggle, close }] = useDisclosure(false)
  const { classes } = useStyles()
  const router = useRouter()
  const [activeLink, setActiveLink] = useState<string>('')

  useEffect(() => {
    if (!router.isReady) return
    const path = router.asPath.split('?')[0]
    if (path) setActiveLink(path)
  }, [router.asPath, router.isReady])

  const navItems: NavItem[] = [
    {
      name: <NavText>My Dashboard</NavText>,
      icon: <DashboardIcon />,
      link: course_name ? `/${course_name}/dashboard` : '/dashboard', // Add conditional
    },
    {
      name: <NavText>Explore Chatbots</NavText>,
      icon: <IconCompass />,
      link: '/explore',
    },
    {
      name: <NavText>Create Your Own Bot</NavText>,
      icon: <IconSparkles />,
      link: '/new',
    },
  ]

  const settingsNavItems: NavItem[] = [
    {
      name: <NavText>Dashboard</NavText>,
      icon: <DashboardIcon />,
      link: course_name ? `/${course_name}/dashboard` : '/dashboard', // Add conditional
    },
    {
      name: <NavText>LLMs</NavText>,
      icon: <LLMIcon />,
      link: course_name ? `/${course_name}/llms` : '/llms', // Add conditional
    },
    {
      name: (
        <Indicator
          label="New"
          color="var(--illinois-orange)"
          size={13}
          styles={{ indicator: { top: '-4px !important' } }}
        >
          <NavText>Analysis</NavText>
        </Indicator>
      ),
      icon: <ReportIcon />,
      link: course_name ? `/${course_name}/analysis` : '/analysis', // Add conditional
    },
    {
      name: <NavText>Prompting</NavText>,
      icon: <MessageCodeIcon />,
      link: course_name ? `/${course_name}/prompt` : '/prompt', // Add conditional
    },
    {
      name: <NavText>Tools</NavText>,
      icon: <ChartDots3Icon />,
      link: course_name ? `/${course_name}/tools` : '/tools', // Add conditional
    },
    {
      name: <NavText>API</NavText>,
      icon: <ApiIcon />,
      link: course_name ? `/${course_name}/api` : '/api', // Add conditional
    },
  ]

  return (
    <div className="bg-[--navbar-background]">
      {/***************** top navigation for all pages *****************/}

      <Flex direction="row" align="center" justify="center">
        <div className="navbar h-20 w-full border-b border-[--navbar-border] bg-[--navbar-background]">
          <Logo />

          {/* no longer show the banner logo image here
          {bannerUrl && <BannerImage url={bannerUrl} />}
*/}

          {!isPlain && (
            <NavigationContent
              items={navItems}
              opened={opened}
              activeLink={activeLink}
              onLinkClick={close}
              onToggle={toggle}
              courseName={course_name}
            />
          )}

          <div className="flex items-center">
            <div className="hidden items-center md:flex">
              <GlobalHeader isNavbar={true} />
            </div>
          </div>
        </div>
      </Flex>

      {showSettingsNav && (
        <div className="mx-auto mt-4 w-[96%] bg-[--navbar-background] md:w-[90%] 2xl:w-[90%]">
          {/***************** sub navigation for admin settings *****************/}
          <div className="flex items-start gap-2">
            <div className="w-[6rem]">
              <button
                className={classes.chatButton}
                onClick={() => {
                  if (course_name) router.push(`/${course_name}/chat`)
                }}
              >
                <div
                  className={`flex items-center gap-1 ${montserrat_heading.variable} font-montserratHeading`}
                >
                  <IconChevronLeft />
                  {/*                  <MessageChatIcon /> */}
                  <div>Chat</div>
                </div>
              </button>
            </div>

            <div className="mt-[.5rem] w-full text-[--navbar-foreground]">
              <div className="flex w-full items-start gap-2">
                <div className="whitespace-nowrap text-[--foreground-faded]">
                  Admin Settings
                </div>
                <div className="text-[--foreground-faded]">/</div>
                <div className="grow font-bold">{course_name}</div>
              </div>

              {/* no longer show the banner logo image here
                {bannerUrl && <BannerImage url={bannerUrl} />}
*/}

              {!isPlain && (
                <SettingsNavigationContent
                  items={settingsNavItems}
                  opened={opened}
                  activeLink={activeLink}
                  onLinkClick={close}
                  onToggle={toggle}
                  courseName={course_name}
                />
              )}
              {/*
                <div className="flex items-center">
                  <div className="hidden items-center md:flex">
                    <Divider orientation="vertical" className={classes.divider} />

                    <div className="flex items-center gap-1 px-2">
                      <Tooltip label="New Project" position="bottom" withArrow>
                        <Link href="/new" className={classes.iconButton}>
                          <FileIcon />
                        </Link>
                      </Tooltip>

                      <Tooltip label="Documentation" position="bottom" withArrow>
                        <Link
                          href="https://docs.uiuc.chat/"
                          className={classes.iconButton}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ClipboardIcon />
                        </Link>
                      </Tooltip>
                    </div>
                  </div>
                </div>
*/}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
