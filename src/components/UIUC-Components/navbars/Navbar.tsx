import {
  Burger,
  Container,
  createStyles,
  Flex,
  Paper,
  rem,
  Transition,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  IconClipboardText,
  IconFilePlus,
  IconHome,
  IconSparkles,
} from '@tabler/icons-react'
import { montserrat_heading } from 'fonts'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import GlobalHeader from '~/components/UIUC-Components/navbars/GlobalHeader'

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
    gap: '.4rem',

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
        <div
          className={`ms-4 flex items-center gap-1 font-bold ${montserrat_heading.variable} font-montserratHeading`}
        >
          <div style={{ width: '2.5rem', height: '2.5rem' }}>
            <img
              src="/media/logo_illinois.png"
              width="auto"
              height="100%"
              alt="Illinois Logo"
            />
          </div>
          <div className="text-2xl font-extrabold tracking-tight text-[--illinois-orange] sm:ml-2 sm:text-[1.8rem]">
            Illinois
          </div>
          <br />
          <div className="text-2xl font-extrabold tracking-tight text-[--foreground] sm:text-[1.8rem]">
            Chat
          </div>
        </div>
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

function getCurrentPageName(link: string, items: NavItem[]) {
  const found: any = items.filter(
    (item: NavItem) => item.link && link == item.link,
  )

  return found.length > 0 ? found.shift().name : ''
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
                {item.icon}
                {item.name}
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
              {item.icon}
              {item.name}
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

// Icon Components
export function DashboardIcon() {
  return <IconHome size={20} strokeWidth={2} />
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
      name: <NavText>My Chatbots</NavText>,
      icon: <DashboardIcon />,
      link: '/chatbots', // Add conditional course_name ? `/${course_name}/dashboard` :
    },
    // {
    //   name: <NavText>Explore Chatbots</NavText>,
    //   icon: <IconCompass />,
    //   link: '/explore',
    // },
    {
      name: <NavText>Create Your Own Bot</NavText>,
      icon: <IconSparkles />,
      link: '/new',
    },
  ]

  return (
    <div className="fixed left-0 right-0 top-0 z-[999] bg-[--navbar-background]">
      {/***************** top navigation for all pages *****************/}

      <Flex direction="row" align="center" justify="center">
        <div className="navbar h-20 w-full border-b border-[--navbar-border] bg-[--navbar-background]">
          <Logo />

          {/* TODO determine where to show the uploaded banner logo image (assume on the chat sidebar above or replace the project name?)
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
          {/* TODO decide where to move the link to documents (new project button alrady exists in new nav)
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

          <div className="flex items-center">
            <div className="hidden items-center md:flex">
              <GlobalHeader isNavbar={true} />
            </div>
          </div>
        </div>
      </Flex>
    </div>
  )
}
