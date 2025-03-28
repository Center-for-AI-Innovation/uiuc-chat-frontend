import {
  IconCirclePlus,
  IconClipboardText,
  IconFile,
  IconNews,
  IconPlus,
  IconSquareRoundedPlus,
} from '@tabler/icons-react'
import { Menu2 } from 'tabler-icons-react'

import { useAuth } from 'react-oidc-context'
import { AuthMenu } from './AuthMenu'

export default function Header({ isNavbar = false }: { isNavbar?: boolean }) {
  const headerStyle = isNavbar
    ? {
        display: 'flex',
        justifyContent: 'flex-end',
        padding: '0.2em 0.2em',
      }
    : {
        display: 'flex',
        justifyContent: 'flex-end',
        padding: '0.5em',
      }

  const auth = useAuth()
  const posthog = usePostHog()
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (!auth.isLoading) {
      if (auth.isAuthenticated) {
        posthog?.identify(auth.user?.profile.sub || 'unknown', {
          email: auth.user?.profile.email || 'no_email',
        })
      }
      setIsLoaded(true)
    }
  }, [auth.isLoading])

  if (!isLoaded) {
    return (
      <header style={headerStyle} className="py-16">
        {/* Skeleton placeholders for two icons */}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div
            className="skeleton-box"
            style={{ width: '35px', height: '35px', borderRadius: '50%' }}
          ></div>
          <div style={{ paddingLeft: '0px', paddingRight: '10px' }} />
          <div
            className="skeleton-box"
            style={{ width: '35px', height: '35px', borderRadius: '50%' }}
          ></div>
        </div>
      </header>
    )
  }

  return (
    <header style={headerStyle} className="py-16">
      <AuthMenu />
    </header>
  )
}

import Link from 'next/link'
import { montserrat_heading } from 'fonts'
import { createStyles, rem } from '@mantine/core'
import { useEffect, useState, useRef } from 'react'
import { usePostHog } from 'posthog-js/react'
import { IconFilePlus } from '@tabler/icons-react'

export function LandingPageHeader({
  forGeneralPurposeNotLandingpage = false,
}: {
  forGeneralPurposeNotLandingpage?: boolean
}) {
  const { classes, theme } = useStyles()
  const headerStyle = forGeneralPurposeNotLandingpage
    ? {
        backgroundColor: 'var(--background)', //illinois-blue
        display: 'flex',
        justifyContent: 'flex-end',
        padding: '0.2em 0.2em',
        //      paddingRight: '0.3em', //why?
      }
    : {
        backgroundColor: 'var(--background)', //illinois-blue
        display: 'flex',
        justifyContent: 'flex-end',
        padding: '0.5em',
      }

  const headerRef = useRef<HTMLElement>(null)
  const auth = useAuth()
  const [isLoaded, setIsLoaded] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [windowWidth, setWindowWidth] = useState(0)
  const [headerHeight, setHeaderHeight] = useState(60)
  const posthog = usePostHog()
  const [menuVisible, setMenuVisible] = useState(false)
  const menuButtonRef = useRef<HTMLDivElement>(null)
  const [menuPosition, setMenuPosition] = useState({ right: '20px' })

  // Determine which elements should be visible based on screen width
  // const showDocsInNav = windowWidth >= 640 // Changed from 768 to 568 (subtract 200px)
  // const showNewsInNav = windowWidth >= 700 // Changed from 900 to 700 (subtract 200px)
  // const showNewProjectInNav = windowWidth >= 824 // Changed from 1024 to 824 (subtract 200px)
  // Disable docs, news, new project and hamburger menu for mHealth
  const showDocsInNav = false
  const showNewsInNav = false
  const showNewProjectInNav = false

  // Fix for hamburger menu logic to ensure menu is shown until all items are visible in nav
  // const showHamburgerMenu =
  //   (!showDocsInNav || !showNewsInNav || !showNewProjectInNav) &&
  //   forGeneralPurposeNotLandingpage === false
  const showHamburgerMenu = false

  // Update window width on resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }

    // Initial width
    handleResize()

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (!auth.isLoading) {
      if (auth.isAuthenticated) {
        // Posthog identify
        posthog?.identify(auth.user?.profile.sub || 'unknown', {
          email: auth.user?.profile.email || 'no_email',
        })
      }
      setIsLoaded(true)
    }
  }, [auth.isLoading])

  // Update header height on mount and window resize
  useEffect(() => {
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.offsetHeight)
      }
    }

    updateHeaderHeight()
    window.addEventListener('resize', updateHeaderHeight)
    return () => window.removeEventListener('resize', updateHeaderHeight)
  }, [isLoaded])

  // Toggle menu with animation
  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent event bubbling

    if (isMenuOpen) {
      // First set menuVisible to false (which will trigger fade out animation)
      setMenuVisible(false)
      // Then after animation completes, actually close the menu
      setTimeout(() => {
        setIsMenuOpen(false)
      }, 300) // Match animation duration
    } else {
      setIsMenuOpen(true)
      // Small delay to ensure DOM is updated before animation starts
      setTimeout(() => {
        setMenuVisible(true)
      }, 10)
    }
  }

  // Update menuVisible when isMenuOpen changes directly (edge case handling)
  useEffect(() => {
    if (isMenuOpen) {
      const timer = setTimeout(() => {
        setMenuVisible(true)
      }, 10)
      return () => clearTimeout(timer)
    }
  }, [isMenuOpen])

  // Modify this effect to only reset the menu when ALL nav items are visible
  useEffect(() => {
    if (showDocsInNav && showNewsInNav && showNewProjectInNav) {
      setIsMenuOpen(false)
      setMenuVisible(false)
    }
  }, [windowWidth, showDocsInNav, showNewsInNav, showNewProjectInNav])

  // Handle link click to close menu
  const handleLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent event bubbling

    // First set menuVisible to false (which will trigger fade out animation)
    setMenuVisible(false)
    // Then after animation completes, actually close the menu
    setTimeout(() => {
      setIsMenuOpen(false)
    }, 300) // Match animation duration
  }

  // Update menu position based on hamburger button position
  useEffect(() => {
    const updateMenuPosition = () => {
      if (menuButtonRef.current) {
        const rect = menuButtonRef.current.getBoundingClientRect()
        // Set the right position to align with the right edge of the viewport
        const rightPosition = window.innerWidth - rect.right
        setMenuPosition({ right: `${rightPosition}px` })
      }
    }

    // Update initially and whenever the menu is opened
    if (isMenuOpen) {
      updateMenuPosition()
    }

    window.addEventListener('resize', updateMenuPosition)
    return () => window.removeEventListener('resize', updateMenuPosition)
  }, [isMenuOpen])

  if (!isLoaded) {
    return (
      <header style={headerStyle} className="py-16">
        {/* Skeleton placeholders for two icons */}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          {forGeneralPurposeNotLandingpage === false && (
            <>
              <Link href="/new" className={classes.link}>
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  <IconFilePlus
                    size={20}
                    strokeWidth={2}
                    style={{ marginRight: '5px' }}
                  />
                  <span
                    className={`${montserrat_heading.variable} font-montserratHeading`}
                  >
                    New project
                  </span>
                </span>
              </Link>
              <Link
                href="https://docs.uiuc.chat/"
                className={classes.link}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  <IconClipboardTexts />
                  <span
                    className={`${montserrat_heading.variable} font-montserratHeading`}
                  >
                    Docs
                  </span>
                </span>
              </Link>
            </>
          )}
          <div
            className="skeleton-box"
            style={{ width: '35px', height: '35px', borderRadius: '50%' }}
          ></div>
          <div style={{ paddingLeft: '0px', paddingRight: '10px' }} />
          <div
            className="skeleton-box"
            style={{ width: '35px', height: '35px', borderRadius: '50%' }}
          ></div>
        </div>
      </header>
    )
  }

  return (
    <header style={headerStyle} ref={headerRef}>
      <div className="flex-end m-auto flex w-full max-w-5xl flex-wrap items-center gap-2 sm:flex-nowrap">
        <div
          className={`relative flex grow items-center gap-1 font-bold ${montserrat_heading.variable} font-montserratHeading`}
        >
          <div style={{ width: '1.95rem', height: '1.95rem' }}>
            <img
              src="/media/logo_illinois.png"
              width="auto"
              height="100%"
            ></img>
          </div>
          <div className="text-blue-800 sm:ml-4">mHealth</div>
          <div className="text-[var(--illinois-blue)]">Chat</div>
        </div>

        {/* Navigation links on desktop */}
        <div className="hidden sm:flex sm:flex-row sm:items-center sm:gap-3">
          {forGeneralPurposeNotLandingpage === false && (
            <>
              {showDocsInNav && (
                <Link
                  href="https://docs.uiuc.chat/"
                  className={classes.link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="flex items-center">
                    <IconClipboardText
                      size={18}
                      strokeWidth={2}
                      style={{
                        marginRight: '8px',
                        color: 'var(--illinois-orange)',
                      }}
                    />
                    <span
                      className={`${montserrat_heading.variable} font-montserratHeading`}
                      style={{ color: 'var(--illinois-orange)' }}
                    >
                      Docs
                    </span>
                  </span>
                </Link>
              )}

              {showNewsInNav && (
                <Link
                  href="http://news.uiuc.chat/"
                  target="_blank"
                  className={classes.link}
                >
                  <span className="flex items-center">
                    <IconNews
                      size={18}
                      strokeWidth={2}
                      style={{
                        marginRight: '8px',
                        color: 'var(--illinois-orange)',
                      }}
                    />
                    <span
                      className={`${montserrat_heading.variable} font-montserratHeading`}
                      style={{ color: 'var(--illinois-orange)' }}
                    >
                      News
                    </span>
                  </span>
                </Link>
              )}

              {showNewProjectInNav && (
                <Link href="/new" className={classes.link}>
                  <span className="flex items-center">
                    <IconPlus
                      size={18}
                      strokeWidth={2}
                      style={{
                        marginRight: '8px',
                        color: 'var(--illinois-orange)',
                      }}
                    />
                    <span
                      className={`${montserrat_heading.variable} font-montserratHeading`}
                      style={{ color: 'var(--illinois-orange)' }}
                    >
                      New Project
                    </span>
                  </span>
                </Link>
              )}
            </>
          )}
        </div>

        {/* Login/User button and hamburger menu on mobile */}
        <div className="flex items-center gap-3">
          {/* Login/User button - always visible */}
          <div className="order-1">
            <AuthMenu />
          </div>

          {/* Hamburger menu for small screens */}
          {showHamburgerMenu && (
            <div
              className={`${classes.menuIcon} order-2 ${!showDocsInNav ? 'highlight-button' : ''}`}
              onClick={(e) => toggleMenu(e)}
              ref={menuButtonRef}
            >
              <Menu2 size={24} strokeWidth={2} color="var(--illinois-orange)" />
            </div>
          )}
        </div>

        {/* Mobile dropdown menu with animation */}
        {isMenuOpen && (
          <div
            className="fixed z-50"
            style={{
              top: `${headerHeight + 30}px`,
              right: menuPosition.right,
            }}
          >
            <div
              className={`dropdown-menu ${menuVisible ? 'menu-visible' : 'menu-hidden'}`}
            >
              {/* Menu pointer triangle */}
              <div className="menu-pointer"></div>

              {forGeneralPurposeNotLandingpage === false && (
                <div className="flex flex-col gap-1 p-2">
                  {/* Show Docs in dropdown whenever not visible in main nav */}
                  {!showDocsInNav && (
                    <Link
                      href="https://docs.uiuc.chat/"
                      className="menu-item rounded transition-colors duration-200 hover:bg-orange-100"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => handleLinkClick(e)}
                    >
                      <div className="menu-item-content flex items-center p-2">
                        <IconClipboardText
                          size={18}
                          strokeWidth={2}
                          style={{
                            marginRight: '8px',
                            color: 'var(--illinois-orange)',
                          }}
                        />
                        <span
                          className={`${montserrat_heading.variable} font-montserratHeading`}
                          style={{ color: 'var(--illinois-orange)' }}
                        >
                          Docs
                        </span>
                      </div>
                    </Link>
                  )}

                  {!showNewsInNav && (
                    <Link
                      href="http://news.uiuc.chat/"
                      className="menu-item rounded transition-colors duration-200 hover:bg-orange-100"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => handleLinkClick(e)}
                    >
                      <div className="menu-item-content flex items-center p-2">
                        <IconNews
                          size={18}
                          strokeWidth={2}
                          style={{
                            marginRight: '8px',
                            color: 'var(--illinois-orange)',
                          }}
                        />
                        <span
                          className={`${montserrat_heading.variable} font-montserratHeading`}
                          style={{ color: 'var(--illinois-orange)' }}
                        >
                          News
                        </span>
                      </div>
                    </Link>
                  )}

                  {!showNewProjectInNav && (
                    <Link
                      href="/new"
                      className="menu-item rounded transition-colors duration-200 hover:bg-orange-100"
                      onClick={(e) => handleLinkClick(e)}
                    >
                      <div className="menu-item-content flex items-center p-2">
                        <IconPlus
                          size={18}
                          strokeWidth={2}
                          style={{
                            marginRight: '8px',
                            color: 'var(--illinois-orange)',
                          }}
                        />
                        <span
                          className={`${montserrat_heading.variable} font-montserratHeading`}
                          style={{ color: 'var(--illinois-orange)' }}
                        >
                          New Project
                        </span>
                      </div>
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Click outside to close menu */}
            <div
              className="fixed inset-0 z-[-1]"
              onClick={(e) => {
                e.stopPropagation()
                handleLinkClick(e)
              }}
            />
          </div>
        )}
      </div>

      {/* Animation styles */}
      <style jsx>{`
        @keyframes menuSlideDown {
          from {
            transform: translateY(-10px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes menuSlideUp {
          from {
            transform: translateY(0);
            opacity: 1;
          }
          to {
            transform: translateY(-10px);
            opacity: 0;
          }
        }

        .dropdown-menu {
          transform-origin: top center;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          border-radius: 0.375rem;
          background-color: white;
          border: 1px solid var(--illinois-orange);
          min-width: 160px;
          overflow: hidden;
          margin-top: 10px;
          position: relative;
        }

        .menu-pointer {
          position: absolute;
          top: -8px;
          right: 10px;
          width: 16px;
          height: 8px;
          overflow: hidden;
        }

        .menu-pointer:after {
          content: '';
          position: absolute;
          width: 10px;
          height: 10px;
          background: white;
          transform: translateY(50%) rotate(45deg);
          border-top: 1px solid var(--illinois-orange);
          border-left: 1px solid var(--illinois-orange);
          left: 3px;
        }

        .menu-visible {
          animation: menuSlideDown 0.25s ease forwards;
        }

        .menu-hidden {
          animation: menuSlideUp 0.25s ease forwards;
        }

        /* Revised menu item styles for better hover effects */
        .menu-item {
          display: block;
          text-decoration: none;
          padding: 0.75rem 0.5rem; /* Increased padding from 0.5rem 0.375rem */
          margin: 0.5rem 0.75rem; /* Increased margin from 0.25rem 0.5rem */
          border-radius: 0.375rem;
          transition: all 150ms ease;
          cursor: pointer;
          border: 1px solid transparent;
          font-size: 0.875rem; /* Added to match rem(14) */
        }

        .menu-item:last-child {
          border-bottom: none;
        }

        .menu-item-content {
          display: flex;
          align-items: center;
          font-size: 0.875rem; /* Added to match rem(14) */
          font-weight: 500; /* Added to match navigation links */
        }

        .menu-item:hover {
          background-color: rgba(
            255,
            95,
            5,
            0.18
          ); /* Increased opacity from 0.12 */
          border-color: rgba(255, 95, 5, 0.25); /* Increased opacity from 0.2 */
          box-shadow: 0 2px 4px rgba(255, 95, 5, 0.15); /* Enhanced shadow */
          transform: translateY(-1px); /* Slight lift effect on hover */
        }

        .menu-item svg {
          display: inline-flex;
          vertical-align: middle;
          color: var(--illinois-orange) !important;
        }

        .menu-item span {
          display: inline-flex;
          vertical-align: middle;
          color: var(--illinois-orange) !important;
        }

        /* Optional: add a subtle transition effect for smoother hover */
        .menu-item span,
        .menu-item svg {
          transition: transform 150ms ease;
        }

        .menu-item:hover span,
        .menu-item:hover svg {
          transform: translateX(1px);
        }

        /* Special styling to draw attention to the menu button when Docs is hidden */
        .highlight-button {
          animation: pulse 2s 1;
          box-shadow: 0 0 0 0 rgba(255, 95, 5, 0.4);
        }

        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(255, 95, 5, 0.4);
          }
          70% {
            box-shadow: 0 0 0 8px rgba(255, 95, 5, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(255, 95, 5, 0);
          }
        }
      `}</style>
    </header>
  )
}

export function IconClipboardTexts() {
  return (
    <IconClipboardText
      size={20}
      strokeWidth={2}
      style={{ marginRight: '5px' }}
    />
  )
}

const HEADER_HEIGHT = rem(84)

const useStyles = createStyles((theme) => ({
  inner: {
    height: HEADER_HEIGHT,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  links: {
    padding: '.2em, 1em',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',

    [theme.fn.smallerThan('sm')]: {
      display: 'none',
    },
  },

  menuIcon: {
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '2.2rem',
    width: '2.2rem',
    padding: '0.25rem',
    backgroundColor: 'white',
    border: `1px solid var(--illinois-orange)`,
    borderRadius: '0.375rem',
    transition: 'background-color 100ms ease',
    '&:hover': {
      backgroundColor: 'rgba(255, 95, 5, 0.05)',
    },
  },

  link: {
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',

    height: '2.2rem',
    minWidth: '100px',
    width: 'auto',
    padding: '0 0.75rem',

    color: 'var(--illinois-orange)',
    backgroundColor: 'white',

    fontSize: rem(14),
    fontWeight: 500,

    border: `1px solid var(--illinois-orange)`,
    borderRadius: '0.375rem',

    transition: 'background-color 100ms ease',

    '&:hover': {
      backgroundColor: 'rgba(255, 95, 5, 0.05)',
    },
  },
  userAvatar: {
    cursor: 'pointer',
    backgroundColor: 'hsl(280,100%,70%)',
    color: 'white',
    '&:hover': {
      backgroundColor: 'hsl(280,100%,60%)',
    },
  },
  avatarButton: {
    cursor: 'pointer',
    borderRadius: theme.radius.xl,
    transition: 'background-color 100ms ease',
    padding: rem(2),

    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
  },
  userMenu: {
    backgroundColor: '#15162c',
    border: '1px solid hsl(280,100%,70%)',
    color: '#f1f5f9',
    padding: rem(4),

    '.mantine-Menu-item': {
      padding: `${rem(8)} ${rem(12)}`,
      '&:hover': {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
      },
    },
  },
}))
