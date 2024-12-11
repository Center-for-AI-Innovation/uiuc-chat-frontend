import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { montserrat_heading } from 'fonts'
import GlobalHeader from '~/components/UIUC-Components/navbars/GlobalHeader'
import {
  Flex,
  Indicator,
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
import { IconHome, IconFilePlus, IconClipboardText } from '@tabler/icons-react'

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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',

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

  iconButton: {
    color: '#f1f5f9',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    transition: 'all 0.2s ease',

    '&:hover': {
      color: 'hsl(280,100%,70%)',
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
          UIUC.<span className="text-[hsl(280,100%,70%)]">chat</span>
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
          <Paper className={classes.dropdown} withBorder style={styles}>
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
      <button
        className={classes.link}
        onClick={() => {
          if (courseName) router.push(`/${courseName}/chat`)
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <MessageChatIcon />
          <span
            style={{
              whiteSpace: 'nowrap',
              marginRight: '-5px',
              paddingRight: '2px',
              padding: '4px 0',
            }}
            className={`${montserrat_heading.variable} font-montserratHeading`}
          >
            Chat
          </span>
        </div>
      </button>
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
      />
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
  return <IconFilePlus size={20} strokeWidth={2} style={{ margin: '0' }} />
}

export function ClipboardIcon() {
  return <IconClipboardText size={20} strokeWidth={2} style={{ margin: '0' }} />
}

export default function Navbar({
  course_name = '',
  bannerUrl = '',
  isPlain = false,
}: NavbarProps) {
  const [opened, { toggle, close }] = useDisclosure(false)
  const { classes } = useStyles()
  const router = useRouter()
  const [activeLink, setActiveLink] = useState<string>('')

  useEffect(() => {
    if (!router.isReady) return
    setActiveLink(router.asPath.split('?')[0]!)
  }, [router.asPath, router.isReady])

  const items: NavItem[] = [
    {
      name: <NavText>Dashboard</NavText>,
      icon: <DashboardIcon />,
      link: `/${course_name}`,
    },
    {
      name: <NavText>LLMs</NavText>,
      icon: <LLMIcon />,
      link: `/${course_name}/llms`,
    },
    {
      name: (
        <Indicator
          label="New"
          color="hsl(280,100%,70%)"
          size={13}
          styles={{ indicator: { top: '-4px !important' } }}
        >
          <NavText>Analysis</NavText>
        </Indicator>
      ),
      icon: <ReportIcon />,
      link: `/${course_name}/analysis`,
    },
    {
      name: <NavText>Prompting</NavText>,
      icon: <MessageCodeIcon />,
      link: `/${course_name}/prompt`,
    },
    {
      name: <NavText>Tools</NavText>,
      icon: <ChartDots3Icon />,
      link: `/${course_name}/tools`,
    },
    {
      name: <NavText>API</NavText>,
      icon: <ApiIcon />,
      link: `/${course_name}/api`,
    },
  ]

  return (
    <div className="bg-[#2e026d]">
      <Flex direction="row" align="center" justify="center">
        <div className="mt-2 w-full max-w-[98%]">
          <div className="navbar rounded-badge h-20 bg-[#15162c] shadow-lg shadow-purple-800">
            <Logo />
            {bannerUrl && <BannerImage url={bannerUrl} />}
            {!isPlain && (
              <NavigationContent
                items={items}
                opened={opened}
                activeLink={activeLink}
                onLinkClick={close}
                onToggle={toggle}
                courseName={course_name}
              />
            )}
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
              <GlobalHeader isNavbar={true} />
            </div>
          </div>
        </div>
      </Flex>
    </div>
  )
}
