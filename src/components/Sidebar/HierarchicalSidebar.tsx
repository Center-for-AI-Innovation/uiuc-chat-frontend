import { createStyles, rem } from '@mantine/core'
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconCode,
  IconDatabase,
  IconDeviceLaptop,
  IconHome,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconMenu2,
  IconMoon,
  IconPalette,
  IconSun,
  IconUsers,
} from '@tabler/icons-react'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { Brain, MessageCode, ReportAnalytics } from 'tabler-icons-react'
import { useTheme } from '~/contexts/ThemeContext'
import { ThemeToggle } from '../UIUC-Components/ThemeToggle'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../shadcn/ui/collapsible'

interface NavSubItem {
  name: string
  href: string
}

interface NavSection {
  title: string
  icon: React.ReactElement
  href?: string
  children?: NavSubItem[]
}

interface HierarchicalSidebarProps {
  course_name: string
  isOpen: boolean
  onToggle: () => void
  activeLink: string
  isCollapsed: boolean
  onCollapseToggle: () => void
}

function buildNavSections(courseName: string): NavSection[] {
  const base = `/${courseName}`
  return [
    {
      title: 'Dashboard',
      icon: <IconHome size={20} strokeWidth={2} />,
      href: `${base}/dashboard`,
    },
    {
      title: 'Project Data',
      icon: <IconDatabase size={20} strokeWidth={2} />,
      children: [
        { name: 'Document Upload', href: `${base}/dashboard#document-upload` },
        { name: 'Integrations', href: `${base}/dashboard#integrations` },
        { name: 'Document Groups', href: `${base}/dashboard#document-groups` },
      ],
    },
    {
      title: 'Project Identity',
      icon: <IconPalette size={20} strokeWidth={2} />,
      children: [
        {
          name: 'Branding and Description',
          href: `${base}/dashboard#branding`,
        },
        { name: 'Greetings', href: `${base}/dashboard#greetings` },
        {
          name: 'Example Questions',
          href: `${base}/dashboard#example-questions`,
        },
      ],
    },
    {
      title: 'User Access and Sharing',
      icon: <IconUsers size={20} strokeWidth={2} />,
      children: [
        { name: 'Access Settings', href: `${base}/dashboard#access-settings` },
        { name: 'Members', href: `${base}/dashboard#members` },
        { name: 'Admins', href: `${base}/dashboard#admins` },
      ],
    },
    {
      title: 'AI Models (LLMs)',
      icon: <Brain size={20} strokeWidth={2} />,
      children: [
        { name: 'Set the Default Model', href: `${base}/llms#default-model` },
        { name: 'Open Source LLMs', href: `${base}/llms#open-source` },
        { name: 'Closed Source LLMs', href: `${base}/llms#closed-source` },
      ],
    },
    {
      title: 'Prompting and Behavior',
      icon: <MessageCode size={20} strokeWidth={2} />,
      children: [
        {
          name: 'Document Search Optimization',
          href: `${base}/prompt#search-optimization`,
        },
        { name: 'System Prompt', href: `${base}/prompt#system-prompt` },
        {
          name: 'AI Behavior Settings',
          href: `${base}/prompt#behavior-settings`,
        },
      ],
    },
    {
      title: 'Usage Analysis',
      icon: <ReportAnalytics size={20} strokeWidth={2} />,
      href: `${base}/analysis`,
    },
    {
      title: 'API',
      icon: <IconCode size={20} strokeWidth={2} />,
      href: `${base}/api`,
    },
  ]
}

// Bases owned by a dedicated top-level link (e.g. /dashboard owned by the
// "Dashboard" item). Group sections that merely scroll to anchors on such a
// page must not claim "active" unless their specific hash is in the URL.
function getDirectBases(sections: NavSection[]): Set<string> {
  return new Set(
    sections
      .filter((s) => s.href && !s.children)
      .map((s) => s.href!.split('#')[0]!),
  )
}

function isSectionActive(
  section: NavSection,
  activeLink: string,
  directBases: Set<string>,
): boolean {
  const activeBase = activeLink.split('#')[0]!
  const activeHash = activeLink.includes('#') ? activeLink.split('#')[1]! : ''

  // Dedicated link (Dashboard, Usage Analysis, API): active only on its exact
  // page with no section hash present.
  if (section.href && !section.children) {
    return activeBase === section.href.split('#')[0]! && activeHash === ''
  }

  if (section.children) {
    return section.children.some((child) => {
      const childBase = child.href.split('#')[0]!
      const childHash = child.href.includes('#')
        ? child.href.split('#')[1]!
        : ''
      if (activeBase !== childBase) return false
      if (activeHash) return activeHash === childHash
      // No hash in URL: only active if this page has no dedicated link owning
      // it (so /llms, /prompt highlight their group, but /dashboard does not).
      return !directBases.has(childBase)
    })
  }

  return false
}

const useStyles = createStyles((theme) => ({
  sidebar: {
    position: 'fixed',
    top: rem(80),
    left: 0,
    bottom: 0,
    width: rem(280),
    height: 'auto',
    backgroundColor: 'var(--sidebar-background)',
    borderRight: '1px solid var(--dashboard-border)',
    zIndex: 30,
    transform: 'translateX(-100%)',
    transition: 'all 0.3s ease-in-out',

    '&.open': {
      transform: 'translateX(0)',
    },

    '@media (min-width: 768px)': {
      position: 'sticky',
      top: 0,
      left: 'auto',
      bottom: 'auto',
      height: 'auto',
      minHeight: 'calc(100vh - 5rem - 2rem)',
      flexShrink: 0,
      transform: 'none',

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
      flexDirection: 'column',
      justifyContent: 'center',
      gap: theme.spacing.sm,
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

  chatButton: {
    width: '100%',
    backgroundColor: 'transparent',
    color: 'var(--foreground-faded)',
    border: '1.5px dashed var(--dashboard-border)',
    borderRadius: theme.radius.md,
    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
    marginBottom: theme.spacing.md,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    fontSize: rem(14),
    fontWeight: 500,

    '&:hover': {
      backgroundColor: 'var(--navbar-hover-background)',
      borderColor: 'var(--foreground-faded)',
      color: 'var(--foreground)',
    },

    '&.collapsed': {
      width: rem(48),
      padding: theme.spacing.sm,
      justifyContent: 'center',
      gap: 0,
      minHeight: rem(40),
    },
  },

  courseSwitcher: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
    borderRadius: theme.radius.md,
    cursor: 'default',
    flex: 1,
    minWidth: 0,

    '&.collapsed': {
      justifyContent: 'center',
      flex: 'none',
      padding: 0,
    },
  },

  courseLogo: {
    width: rem(32),
    height: rem(32),
    borderRadius: theme.radius.md,
    backgroundColor: 'var(--illinois-orange)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  navSection: {
    flex: 1,
    overflowY: 'auto',
    padding: '4px',
  },

  sectionLabel: {
    fontSize: rem(11),
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    color: 'var(--foreground-faded)',
    padding: `${theme.spacing.md} ${theme.spacing.md} ${theme.spacing.xs}`,
  },

  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
    color: 'var(--navbar-foreground)',
    textDecoration: 'none',
    borderRadius: theme.radius.md,
    marginBottom: '2px',
    fontSize: rem(14),
    fontWeight: 500,
    transition: 'all 0.2s ease',
    position: 'relative',

    '&:hover': {
      backgroundColor: 'var(--navbar-hover-background)',
      color: 'var(--navbar-hover)',
    },

    '&[data-active="true"]': {
      backgroundColor: 'var(--navbar-active-background, var(--foreground))',
      color: 'var(--navbar-active-foreground, var(--background))',
      fontWeight: 600,

      '&:hover': {
        backgroundColor: 'var(--navbar-active-background, var(--foreground))',
        color: 'var(--navbar-active-foreground, var(--background))',
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

  sectionTrigger: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    gap: theme.spacing.sm,
    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
    color: 'var(--navbar-foreground)',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: theme.radius.md,
    marginBottom: '2px',
    fontSize: rem(14),
    fontWeight: 400,
    cursor: 'pointer',
    transition: 'all 0.2s ease',

    '&:hover': {
      backgroundColor: 'var(--navbar-hover-background)',
      color: 'var(--navbar-hover)',
    },

    '&.collapsed': {
      padding: theme.spacing.sm,
      justifyContent: 'center',
      gap: 0,
    },
  },

  subItemsContainer: {
    position: 'relative',
    marginLeft: rem(28),
    paddingLeft: rem(16),
    borderLeft: '1px solid var(--dashboard-border)',
  },

  subItem: {
    display: 'flex',
    alignItems: 'center',
    padding: `6px ${theme.spacing.md} 6px ${theme.spacing.xs}`,
    color: 'var(--navbar-foreground)',
    textDecoration: 'none',
    borderRadius: theme.radius.md,
    marginBottom: '1px',
    fontSize: rem(13),
    fontWeight: 400,
    transition: 'all 0.15s ease',

    '&:hover': {
      backgroundColor: 'var(--navbar-hover-background)',
      color: 'var(--navbar-hover)',
    },

    '&[data-active="true"]': {
      color: 'var(--dashboard-button)',
      fontWeight: 600,
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

function CollapsedThemeToggle() {
  const { theme, setTheme } = useTheme()

  const cycleTheme = () => {
    if (theme === 'system') setTheme('light')
    else if (theme === 'light') setTheme('dark')
    else setTheme('system')
  }

  const icon =
    theme === 'light' ? (
      <IconSun size={16} className="text-[--foreground]" />
    ) : theme === 'dark' ? (
      <IconMoon size={16} className="text-[--foreground]" />
    ) : (
      <IconDeviceLaptop size={16} className="text-[--foreground]" />
    )

  return (
    <button
      onClick={cycleTheme}
      className="rounded-full border border-[--dashboard-border] bg-[--background-faded] p-1.5 transition-all hover:scale-105 hover:border-[--dashboard-faded] hover:bg-[--dashboard-faded]"
      aria-label="Toggle theme"
    >
      {icon}
    </button>
  )
}

export default function HierarchicalSidebar({
  course_name,
  isOpen,
  onToggle,
  activeLink,
  isCollapsed,
  onCollapseToggle,
}: HierarchicalSidebarProps) {
  const { classes } = useStyles()
  const router = useRouter()
  const navSections = buildNavSections(course_name)
  const directBases = getDirectBases(navSections)

  const [openSections, setOpenSections] = useState<Set<string>>(() => {
    const initial = new Set<string>()
    for (const section of navSections) {
      if (
        section.children &&
        isSectionActive(section, activeLink, directBases)
      ) {
        initial.add(section.title)
      }
    }
    return initial
  })

  const toggleSection = (title: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev)
      if (next.has(title)) next.delete(title)
      else next.add(title)
      return next
    })
  }

  const handleChatNavigation = () => {
    if (course_name === 'chat') {
      router.push('/chat')
    } else {
      router.push(`/${course_name}/chat`)
    }
  }

  const handleLinkHover = (href: string) => {
    router.prefetch(href.split('#')[0]!)
  }

  const closeMobileSidebar = () => {
    if (window.innerWidth < 768) onToggle()
  }

  return (
    <>
      {!isOpen && (
        <button
          aria-label="Toggle sidebar"
          className={`${classes.toggleButton} md:hidden`}
          onClick={onToggle}
        >
          <IconMenu2 size={20} />
        </button>
      )}

      {isOpen && (
        <div
          className={`${classes.sidebarOverlay} md:hidden`}
          onClick={onToggle}
        />
      )}

      <aside
        aria-label="Settings navigation"
        className={`${classes.sidebar} ${isOpen ? 'open' : ''} ${
          isCollapsed ? 'collapsed' : ''
        }`}
      >
        <div
          className={`${classes.sidebarContent} ${
            isCollapsed ? 'collapsed' : ''
          }`}
        >
          {/* Header — Course Switcher */}
          <div
            className={`${classes.header} ${isCollapsed ? 'collapsed' : ''}`}
          >
            <div
              className={`${classes.courseSwitcher} ${
                isCollapsed ? 'collapsed' : ''
              }`}
            >
              <div className={classes.courseLogo}>
                <span
                  className={`text-sm font-bold text-white ${montserrat_heading.variable} font-montserratHeading`}
                >
                  I
                </span>
              </div>
              {!isCollapsed && (
                <span
                  className={`truncate text-sm font-semibold text-[--foreground] ${montserrat_heading.variable} font-montserratHeading`}
                >
                  {course_name}
                </span>
              )}
            </div>
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

          {/* Go to Chat Button */}
          <button
            className={`${classes.chatButton} ${
              isCollapsed ? 'collapsed' : ''
            }`}
            onClick={handleChatNavigation}
            onMouseEnter={() => {
              const chatUrl =
                course_name === 'chat' ? '/chat' : `/${course_name}/chat`
              handleLinkHover(chatUrl)
            }}
          >
            <IconChevronLeft size={16} strokeWidth={3} />
            <span
              className={`${isCollapsed ? 'hidden' : 'inline'} ${
                montserrat_paragraph.variable
              } font-montserratParagraph font-bold`}
            >
              Go to Chat
            </span>
          </button>

          {/* Navigation */}
          <div className={classes.navSection}>
            {navSections.map((section) => {
              const isDashboard = section.title === 'Dashboard'

              if (isDashboard) {
                return (
                  <div key={section.title}>
                    <Link
                      href={section.href!}
                      prefetch={false}
                      data-active={isSectionActive(
                        section,
                        activeLink,
                        directBases,
                      )}
                      className={`${classes.navLink} ${
                        isCollapsed ? 'collapsed' : ''
                      }`}
                      onMouseEnter={() => handleLinkHover(section.href!)}
                      onClick={closeMobileSidebar}
                    >
                      {section.icon}
                      <span
                        className={`${isCollapsed ? 'hidden' : 'inline'} ${
                          montserrat_heading.variable
                        } font-montserratHeading`}
                      >
                        {section.title}
                      </span>
                    </Link>
                    {!isCollapsed && (
                      <div className={classes.sectionLabel}>
                        Project Settings
                      </div>
                    )}
                  </div>
                )
              }

              if (section.href && !section.children) {
                return (
                  <Link
                    key={section.title}
                    href={section.href}
                    prefetch={false}
                    data-active={isSectionActive(
                      section,
                      activeLink,
                      directBases,
                    )}
                    className={`${classes.navLink} ${
                      isCollapsed ? 'collapsed' : ''
                    }`}
                    onMouseEnter={() => handleLinkHover(section.href!)}
                    onClick={closeMobileSidebar}
                  >
                    {section.icon}
                    <span
                      className={`${isCollapsed ? 'hidden' : 'inline'} ${
                        montserrat_heading.variable
                      } font-montserratHeading`}
                    >
                      {section.title}
                    </span>
                  </Link>
                )
              }

              if (section.children) {
                const sectionActive = isSectionActive(
                  section,
                  activeLink,
                  directBases,
                )
                const isExpanded = openSections.has(section.title)

                if (isCollapsed) {
                  const firstChildHref = section.children[0]?.href
                  return (
                    <Link
                      key={section.title}
                      href={firstChildHref ?? '#'}
                      prefetch={false}
                      data-active={sectionActive}
                      className={`${classes.navLink} collapsed`}
                      onClick={closeMobileSidebar}
                      title={section.title}
                    >
                      {section.icon}
                    </Link>
                  )
                }

                return (
                  <Collapsible
                    key={section.title}
                    open={isExpanded}
                    onOpenChange={() => toggleSection(section.title)}
                  >
                    <CollapsibleTrigger asChild>
                      <button className={classes.sectionTrigger}>
                        {section.icon}
                        <span
                          className={`flex-1 text-left ${montserrat_heading.variable} font-montserratHeading`}
                        >
                          {section.title}
                        </span>
                        <IconChevronDown
                          size={14}
                          strokeWidth={2}
                          className={`transition-transform duration-200 ${
                            isExpanded ? '' : '-rotate-90'
                          }`}
                        />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className={classes.subItemsContainer}>
                        {section.children.map((child) => (
                          <Link
                            key={child.name}
                            href={child.href}
                            prefetch={false}
                            data-active={activeLink === child.href}
                            className={classes.subItem}
                            onMouseEnter={() => handleLinkHover(child.href)}
                            onClick={closeMobileSidebar}
                          >
                            <span
                              className={`${montserrat_paragraph.variable} font-montserratParagraph`}
                            >
                              {child.name}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )
              }

              return null
            })}
          </div>

          {/* Theme Toggle */}
          <div className={classes.themeToggleContainer}>
            {!isCollapsed ? <ThemeToggle /> : <CollapsedThemeToggle />}
          </div>
        </div>
      </aside>
    </>
  )
}
