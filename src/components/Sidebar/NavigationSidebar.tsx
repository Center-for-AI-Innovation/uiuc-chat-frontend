import { createStyles, rem } from '@mantine/core'
import { IconChevronLeft, IconHome, IconMenu2 } from '@tabler/icons-react'
import { montserrat_heading } from 'fonts'
import Link from 'next/link'
import { useRouter } from 'next/router'
import {
  Brain,
  ChartDots3,
  Code,
  MessageCode,
  ReportAnalytics,
} from 'tabler-icons-react'

interface NavItem {
  name: React.ReactNode
  icon: React.ReactElement
  link: string
}

interface NavigationSidebarProps {
  course_name: string
  isOpen: boolean
  onToggle: () => void
  activeLink: string
}

const useStyles = createStyles((theme) => ({
  sidebar: {
    position: 'fixed',
    top: rem(80), // Below the main navbar (h-20 = 5rem = 80px)
    left: 0,
    width: rem(280),
    height: 'calc(100vh - 80px)',
    backgroundColor: 'var(--sidebar-background)',
    borderRight: '1px solid var(--dashboard-border)',
    zIndex: 30,
    transform: 'translateX(-100%)',
    transition: 'transform 0.3s ease-in-out',

    '&.open': {
      transform: 'translateX(0)',
    },

    [theme.fn.largerThan('md')]: {
      position: 'fixed',
      top: rem(80),
      transform: 'translateX(-100%)',
      '&.open': {
        transform: 'translateX(0)',
      },
    },
  },

  sidebarOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 20,

    [theme.fn.largerThan('md')]: {
      display: 'none',
    },
  },

  toggleButton: {
    position: 'fixed',
    top: rem(90),
    left: rem(16),
    zIndex: 40,
    width: rem(40),
    height: rem(40),
    backgroundColor: 'var(--dashboard-button)',
    color: 'var(--dashboard-button-foreground)',
    border: 'none',
    borderRadius: theme.radius.md,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: theme.shadows.md,

    '&:hover': {
      backgroundColor: 'var(--dashboard-button-hover)',
      transform: 'scale(1.05)',
    },

    [theme.fn.largerThan('md')]: {
      display: 'none',
    },
  },

  sidebarContent: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    padding: theme.spacing.md,
  },

  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
    borderBottom: '1px solid var(--dashboard-border)',
  },

  closeButton: {
    width: rem(32),
    height: rem(32),
    backgroundColor: 'transparent',
    color: 'var(--foreground-faded)',
    border: '1px solid var(--dashboard-border)',
    borderRadius: theme.radius.sm,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',

    '&:hover': {
      backgroundColor: 'var(--dashboard-button)',
      color: 'var(--dashboard-button-foreground)',
      borderColor: 'var(--dashboard-button)',
    },

    [theme.fn.largerThan('md')]: {
      display: 'none',
    },
  },

  chatButton: {
    width: '100%',
    backgroundColor: 'var(--dashboard-button)',
    color: 'var(--dashboard-button-foreground)',
    border: 'none',
    borderRadius: theme.radius.md,
    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
    marginBottom: theme.spacing.lg,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    fontSize: rem(14),
    fontWeight: 500,

    '&:hover': {
      backgroundColor: 'var(--dashboard-button-hover)',
      transform: 'translateY(-1px)',
      boxShadow: theme.shadows.sm,
    },
  },

  breadcrumb: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.sm,
    backgroundColor: 'var(--background-faded)',
    borderRadius: theme.radius.sm,
    fontSize: rem(13),
    color: 'var(--foreground-faded)',
  },

  navSection: {
    flex: 1,
    overflowY: 'auto',
  },

  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
    color: 'var(--navbar-foreground)',
    textDecoration: 'none',
    borderRadius: theme.radius.sm,
    marginBottom: theme.spacing.xs,
    fontSize: rem(14),
    fontWeight: 500,
    transition: 'all 0.2s ease',

    '&:hover': {
      backgroundColor: 'var(--navbar-hover-background)',
      color: 'var(--navbar-hover)',
      transform: 'translateX(4px)',
    },

    '&[data-active="true"]': {
      backgroundColor: 'var(--dashboard-button)',
      color: 'var(--dashboard-button-foreground)',
      fontWeight: 600,

      '&:hover': {
        backgroundColor: 'var(--dashboard-button-hover)',
        color: 'var(--dashboard-button-foreground)',
      },
    },
  },
}))

function NavText({ children }: { children: React.ReactNode }) {
  return (
    <span className={`${montserrat_heading.variable} font-montserratHeading`}>
      {children}
    </span>
  )
}

// Icon Components
export function DashboardIcon() {
  return <IconHome size={20} strokeWidth={2} />
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

export default function NavigationSidebar({
  course_name,
  isOpen,
  onToggle,
  activeLink,
}: NavigationSidebarProps) {
  const { classes } = useStyles()
  const router = useRouter()

  const navItems: NavItem[] = [
    {
      name: <NavText>Dashboard</NavText>,
      icon: <DashboardIcon />,
      link: course_name ? `/${course_name}/dashboard` : '/dashboard',
    },
    {
      name: <NavText>LLMs</NavText>,
      icon: <LLMIcon />,
      link: course_name ? `/${course_name}/llms` : '/llms',
    },
    {
      name: <NavText>Analysis</NavText>,
      icon: <ReportIcon />,
      link: course_name ? `/${course_name}/analysis` : '/analysis',
    },
    {
      name: <NavText>Prompting</NavText>,
      icon: <MessageCodeIcon />,
      link: course_name ? `/${course_name}/prompt` : '/prompt',
    },
    {
      name: <NavText>Tools</NavText>,
      icon: <ChartDots3Icon />,
      link: course_name ? `/${course_name}/tools` : '/tools',
    },
    {
      name: <NavText>API</NavText>,
      icon: <ApiIcon />,
      link: course_name ? `/${course_name}/api` : '/api',
    },
  ]

  const handleChatNavigation = () => {
    if (course_name) {
      // Special case: if course_name is "chat", redirect to /chat instead of /chat/chat
      if (course_name === 'chat') {
        router.push('/chat')
      } else {
        router.push(`/${course_name}/chat`)
      }
    }
  }

  const handleLinkHover = (href: string) => {
    // Prefetch the page when user hovers over the link
    router.prefetch(href)
  }

  return (
    <>
      {/* Mobile Toggle Button */}
      {!isOpen && (
        <button className={classes.toggleButton} onClick={onToggle}>
          <IconMenu2 size={20} />
        </button>
      )}

      {/* Mobile Overlay */}
      {isOpen && <div className={classes.sidebarOverlay} onClick={onToggle} />}

      {/* Sidebar */}
      <div className={`${classes.sidebar} ${isOpen ? 'open' : ''}`}>
        <div className={classes.sidebarContent}>
          {/* Header */}
          {/* <div className={classes.header}> */}
          {/* <h3 className="text-lg font-semibold text-[--foreground]">
              Settings
            </h3> */}
          {/* <button className={classes.closeButton} onClick={onToggle}> */}
          {/* <IconX size={16} /> */}
          {/* </button> */}
          {/* </div> */}

          {/* Chat Button */}
          <button
            className={classes.chatButton}
            onClick={handleChatNavigation}
            onMouseEnter={() => {
              if (course_name) {
                // Special case: if course_name is "chat", prefetch /chat instead of /chat/chat
                const chatUrl =
                  course_name === 'chat' ? '/chat' : `/${course_name}/chat`
                handleLinkHover(chatUrl)
              }
            }}
          >
            <IconChevronLeft size={16} />
            <div
              className={`${montserrat_heading.variable} font-montserratHeading`}
            >
              Back to Chat
            </div>
          </button>

          {/* Breadcrumb */}
          <div className={classes.breadcrumb}>
            <div className="flex items-center gap-2">
              <span>Chatbot</span>
              <span>/</span>
              <span className="font-semibold text-[--foreground]">
                {course_name}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className={classes.navSection}>
            {navItems.map((item, index) => (
              <Link
                key={index}
                href={item.link}
                prefetch={false}
                data-active={activeLink === item.link}
                className={classes.navLink}
                onMouseEnter={() => handleLinkHover(item.link)}
                onClick={() => {
                  // Close sidebar on mobile after navigation
                  if (window.innerWidth < 768) {
                    onToggle()
                  }
                }}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
