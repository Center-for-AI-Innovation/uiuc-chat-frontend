import { IconHome, IconSparkles } from '@tabler/icons-react'
import { montserrat_heading } from 'fonts'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { AuthMenu } from '~/components/UIUC-Components/navbars/AuthMenu'

const navItems = [
  { label: 'My Chatbots', icon: IconHome, link: '/chatbots' },
  { label: 'Create Your Own Bot', icon: IconSparkles, link: '/new' },
]

interface ChatbotsGlobalNavProps {
  /** Hide the default bottom border. Useful when the page wants a sticky
   *  sub-bar (e.g. a search/filter bar) to own the divider instead. */
  hideBorder?: boolean
}

export function ChatbotsGlobalNav({
  hideBorder = false,
}: ChatbotsGlobalNavProps = {}) {
  const router = useRouter()
  const activePath = router.asPath.split('?')[0]

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-50 bg-white/95 backdrop-blur-sm dark:bg-[#13294b] ${
        hideBorder
          ? ''
          : 'border-b border-[hsl(var(--border))] dark:border-[#32517a]'
      }`}
    >
      <div className="mx-auto flex h-[72px] w-full max-w-[1680px] items-center justify-between px-4 sm:px-8">
        <Link
          href="/"
          className={`text-xl font-bold text-[--illinois-blue] dark:text-white sm:text-2xl ${montserrat_heading.variable} font-montserratHeading`}
        >
          <span className="text-[--illinois-orange-branding] dark:text-white">
            Illinois{' '}
          </span>
          <span className="dark:text-white">Chat</span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          {navItems.map((item) => {
            const isActive = activePath === item.link
            return (
              <Link
                key={item.link}
                href={item.link}
                data-active={isActive}
                className={`${
                  montserrat_heading.variable
                } flex items-center gap-2 rounded-md px-3 py-2 font-montserratHeading text-xs font-medium text-[--illinois-blue] transition-colors dark:text-white sm:px-4 sm:text-sm ${
                  isActive
                    ? 'bg-[--illinois-orange]/10 dark:bg-white/10'
                    : 'hover:bg-[--illinois-orange]/10 dark:hover:bg-white/10'
                }`}
              >
                <item.icon size={20} strokeWidth={2} />
                {item.label}
              </Link>
            )
          })}
          <AuthMenu size={32} />
        </div>
      </div>
    </header>
  )
}
