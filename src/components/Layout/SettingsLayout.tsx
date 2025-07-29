import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import NavigationSidebar from '~/components/Sidebar/NavigationSidebar'
import Navbar from '~/components/UIUC-Components/navbars/Navbar'

interface SettingsLayoutProps {
  children: React.ReactNode
  course_name: string
  bannerUrl?: string
}

export default function SettingsLayout({
  children,
  course_name,
  bannerUrl = '',
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
        />

        {/* Main Content */}
        <main
          className={`flex-1 transition-all duration-300 ${
            sidebarOpen ? 'md:ml-[280px]' : ''
          }`}
        >
          <div className="min-h-[calc(100vh-80px)] px-4 py-2 md:px-6 md:py-3 lg:px-8 lg:py-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
