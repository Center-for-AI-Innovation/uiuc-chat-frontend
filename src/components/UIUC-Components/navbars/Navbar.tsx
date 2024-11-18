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
import { IconHome } from '@tabler/icons-react'

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

function Navbar({
  course_name = '',
  bannerUrl = '',
  isPlain = false,
}: NavbarProps) {
  const { classes } = useStyles()
  const router = useRouter()
  const [activeLink, setActiveLink] = useState<string>('')
  const [opened, { toggle, close }] = useDisclosure(false)

  useEffect(() => {
    if (!router.isReady) return
    setActiveLink(router.asPath.split('?')[0]!)
  }, [router.asPath, router.isReady])

  const items: NavItem[] = [
    {
      name: <NavText>Dashboard</NavText>,
      icon: <DashboardIcon />,
      link: `/${course_name}/dashboard`,
    },
    {
      name: (
        <Indicator
          label="New"
          color="hsl(280,100%,70%)"
          size={13}
          styles={{ indicator: { top: '-4px !important' } }}
        >
          <NavText>LLMs</NavText>
        </Indicator>
      ),
      icon: <LLMIcon />,
      link: `/${course_name}/llms`,
    },
    {
      name: <NavText>Analysis</NavText>,
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
            <GlobalHeader isNavbar={true} />
          </div>
        </div>
      </Flex>
    </div>
  )
}

export default Navbar
