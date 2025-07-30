import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import NavigationSidebar from '~/components/Sidebar/NavigationSidebar'
import Navbar from '~/components/UIUC-Components/navbars/Navbar'

interface SettingsLayoutProps {
  children: React.ReactNode
  course_name: string
  bannerUrl?: string
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
}

// Helper function to safely get initial collapsed state
export const getInitialCollapsedState = (): boolean => {
  if (typeof window === 'undefined') return false // SSR safe

  try {
    const savedCollapsed = localStorage.getItem('sidebar-collapsed')
    return savedCollapsed !== null ? JSON.parse(savedCollapsed) : false
  } catch (error) {
    console.warn(
      'Failed to load sidebar collapsed state from localStorage:',
      error,
    )
    return false
  }
}

export default function SettingsLayout({
  children,
  course_name,
  bannerUrl = '',
  sidebarCollapsed,
  setSidebarCollapsed,
}: SettingsLayoutProps) {
  const router = useRouter()
  const [activeLink, setActiveLink] = useState<string>('')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!router.isReady) return
    const path = router.asPath.split('?')[0]
    if (path) setActiveLink(path)
  }, [router.asPath, router.isReady])

  useEffect(() => {
    // Auto-open sidebar on desktop
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(true)
      } else {
        setSidebarOpen(false)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const toggleSidebarCollapse = () => {
    const newCollapsed = !sidebarCollapsed
    setSidebarCollapsed(newCollapsed)
    try {
      localStorage.setItem('sidebar-collapsed', JSON.stringify(newCollapsed))
    } catch (error) {
      console.warn(
        'Failed to save sidebar collapsed state to localStorage:',
        error,
      )
    }
  }

  return (
    <div className="min-h-screen bg-[--background] pt-20">
      {/* Main Navbar */}
      <Navbar course_name={course_name} bannerUrl={bannerUrl} isPlain={false} />

      <div className="flex">
        {/* Navigation Sidebar */}
        <NavigationSidebar
          course_name={course_name}
          isOpen={sidebarOpen}
          onToggle={toggleSidebar}
          activeLink={activeLink}
          isCollapsed={sidebarCollapsed}
          onCollapseToggle={toggleSidebarCollapse}
        />

        {/* Main Content */}
        <main
          className={`flex-1 transition-all duration-300 
            ${sidebarOpen && !sidebarCollapsed ? 'md:ml-[280px]' : ''} 
            ${sidebarOpen && sidebarCollapsed ? 'md:ml-[80px]' : ''}
          `}
        >
          {/* <div className="min-h-[calc(100vh-80px)] px-4 py-2 md:px-6 md:py-3 lg:px-8 lg:py-4"> */}
          {children}
          {/* </div> */}
        </main>
      </div>
    </div>
  )
}
