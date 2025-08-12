import { createStyles, rem } from '@mantine/core'
import {
  IconChevronLeft,
  IconDeviceLaptop,
  IconHome,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconMenu2,
  IconMoon,
  IconSun,
} from '@tabler/icons-react'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import Link from 'next/link'
import { useRouter } from 'next/router'
import {
  Brain,
  ChartDots3,
  Code,
  MessageCode,
  ReportAnalytics,
} from 'tabler-icons-react'
import { useTheme } from '~/contexts/ThemeContext'
import { ThemeToggle } from '../UIUC-Components/ThemeToggle'

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
  isCollapsed: boolean
  onCollapseToggle: () => void
}

const useStyles = createStyles((theme) => ({
  sidebar: {
    // Base styles - Mobile first approach
    position: 'fixed',
    top: rem(80),
    left: 0,
    bottom: 0,
    width: rem(280),
    height: 'auto',
    minHeight: 'calc(100vh - 80px)',
    backgroundColor: 'var(--sidebar-background)',
    borderRight: '1px solid var(--dashboard-border)',
    zIndex: 30,
    transform: 'translateX(-100%)',
    transition: 'all 0.3s ease-in-out',

    '&.open': {
      transform: 'translateX(0)',
    },

    // Desktop (md and up): allow collapse/expand functionality
    '@media (min-width: 768px)': {
      height: 'calc(100vh - 80px)',
      bottom: 'auto',
      transform: 'translateX(0)',

      '&.collapsed': {
        width: rem(80),
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
    borderRadius: theme.radius.lg,
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
  },

  sidebarContent: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    padding: theme.spacing.md,

    '&.collapsed': {
      padding: `${theme.spacing.md} ${theme.spacing.xs}`,
      alignItems: 'center',
    },
  },

  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
    borderBottom: '1px solid var(--dashboard-border)',

    '&.collapsed': {
      justifyContent: 'center',
      marginBottom: theme.spacing.md,
    },
  },

  collapseButton: {
    width: rem(40),
    height: rem(40),
    backgroundColor: 'transparent',
    color: 'var(--foreground)',
    border: '2px solid var(--dashboard-border)',
    borderRadius: theme.radius.md,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',

    '&:hover': {
      backgroundColor: 'var(--dashboard-faded)',
      color: 'var(--foreground)',
      borderColor: 'var(--dashboard-faded)',
    },
  },

  closeButton: {
    width: rem(32),
    height: rem(32),
    backgroundColor: 'transparent',
    color: 'var(--foreground-faded)',
    border: '1px solid var(--dashboard-border)',
    borderRadius: theme.radius.md,
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

    '&.collapsed': {
      width: rem(48),
      padding: theme.spacing.sm,
      justifyContent: 'center',
      gap: 0,
      minHeight: rem(40),
    },
  },

  breadcrumb: {
    // marginBottom: theme.spacing.lg,
    padding: theme.spacing.sm,
    backgroundColor: 'var(--background-faded)',
    borderRadius: theme.radius.md,
    fontSize: rem(13),
    marginRight: theme.spacing.md,
    color: 'var(--foreground-faded)',

    '&.collapsed': {
      display: 'none',
    },
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
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.xs,
    fontSize: rem(14),
    fontWeight: 500,
    transition: 'all 0.2s ease',
    position: 'relative',

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

    '&.collapsed': {
      padding: theme.spacing.sm,
      justifyContent: 'center',
      gap: 0,

      '&:hover': {
        transform: 'scale(1.05)',
      },
    },
  },

  navText: {
    transition: 'opacity 0.2s ease',

    '&.collapsed': {
      display: 'none',
    },
  },

  themeToggleContainer: {
    marginTop: 'auto',
    borderTop: '1px solid var(--dashboard-border)',
    paddingTop: theme.spacing.md,
    display: 'flex',
    width: '100%',
    justifyContent: 'center',
  },
}))

function NavText({
  children,
  collapsed,
}: {
  children: React.ReactNode
  collapsed?: boolean
}) {
  return (
    <span
      className={`${montserrat_heading.variable} font-montserratHeading ${collapsed ? 'hidden' : ''}`}
    >
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

export function CollapsedThemeToggle() {
  const { theme, setTheme } = useTheme()

  const cycleTheme = () => {
    if (theme === 'system') {
      setTheme('light')
    } else if (theme === 'light') {
      setTheme('dark')
    } else {
      setTheme('system')
    }
  }

  const getCurrentIcon = () => {
    switch (theme) {
      case 'system':
        return <IconDeviceLaptop size={16} className="text-[--foreground]" />
      case 'light':
        return <IconSun size={16} className="text-[--foreground]" />
      case 'dark':
        return <IconMoon size={16} className="text-[--foreground]" />
      default:
        return <IconDeviceLaptop size={16} className="text-[--foreground]" />
    }
  }

  const getCurrentTitle = () => {
    switch (theme) {
      case 'system':
        return 'System theme (click for light)'
      case 'light':
        return 'Light theme (click for dark)'
      case 'dark':
        return 'Dark theme (click for system)'
      default:
        return 'Toggle theme'
    }
  }

  return (
    <button
      onClick={cycleTheme}
      className="rounded-full border border-[--dashboard-border] bg-[--background-faded] p-1.5 transition-all hover:scale-105 hover:border-[--dashboard-faded] hover:bg-[--dashboard-faded]"
      aria-label="Toggle theme"
      title={getCurrentTitle()}
    >
      {getCurrentIcon()}
    </button>
  )
}

export default function NavigationSidebar({
  course_name,
  isOpen,
  onToggle,
  activeLink,
  isCollapsed,
  onCollapseToggle,
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
      {/* Mobile Toggle Button - Hidden on md+ */}
      {!isOpen && (
        <button
          className={`${classes.toggleButton} md:hidden`}
          onClick={onToggle}
        >
          <IconMenu2 size={20} />
        </button>
      )}

      {/* Mobile Overlay - Hidden on md+ */}
      {isOpen && (
        <div
          className={`${classes.sidebarOverlay} md:hidden`}
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={`${classes.sidebar} ${isOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''} md:desktop`}
      >
        <div
          className={`${classes.sidebarContent} ${isCollapsed ? 'collapsed' : ''}`}
        >
          {/* Header */}
          <div
            className={`${classes.header} ${isCollapsed ? 'collapsed' : ''}`}
          >
            {/* Breadcrumb - Always visible on mobile, conditionally on desktop */}
            <div
              className={`${classes.breadcrumb} ${isCollapsed ? 'collapsed' : ''}`}
            >
              <div
                className={`flex items-center gap-2 ${montserrat_heading.variable} font-montserratHeading`}
              >
                <span>Chatbot</span>
                <span>/</span>
                <span className="font-semibold text-[--foreground]">
                  {course_name}
                </span>
              </div>
            </div>
            {/* Collapse Button - Hidden on mobile, visible on desktop */}
            <button
              className={`${classes.collapseButton} hidden md:flex`}
              onClick={onCollapseToggle}
            >
              {isCollapsed ? (
                <IconLayoutSidebarLeftExpand size={20} strokeWidth={2} />
              ) : (
                <IconLayoutSidebarLeftCollapse size={20} strokeWidth={2} />
              )}
            </button>
          </div>

          {/* Chat Button */}
          <button
            className={`${classes.chatButton} ${isCollapsed ? 'collapsed' : ''}`}
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
            <IconChevronLeft size={16} strokeWidth={3} />
            <span
              className={`md:${isCollapsed ? 'hidden' : 'inline'} ${montserrat_paragraph.variable} font-montserratParagraph font-bold`}
            >
              Back to Chat
            </span>
          </button>

          {/* Navigation Links */}
          <div className={classes.navSection}>
            {navItems.map((item, index) => (
              <Link
                key={index}
                href={item.link}
                prefetch={false}
                data-active={activeLink === item.link}
                className={`${classes.navLink} ${isCollapsed ? 'collapsed' : ''}`}
                onMouseEnter={() => handleLinkHover(item.link)}
                onClick={() => {
                  // Close sidebar on mobile after navigation
                  if (window.innerWidth < 768) {
                    onToggle()
                  }
                }}
              >
                {item.icon}
                <span className={`md:${isCollapsed ? 'hidden' : 'inline'}`}>
                  {item.name}
                </span>
              </Link>
            ))}
          </div>

          {/* Theme Toggle at the bottom */}
          <div className={classes.themeToggleContainer}>
            {!isCollapsed ? <ThemeToggle /> : <CollapsedThemeToggle />}
          </div>
        </div>
      </div>
    </>
  )
}
