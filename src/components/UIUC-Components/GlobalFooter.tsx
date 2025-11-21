import Link from 'next/link'
import Image from 'next/image'
import { ThemeToggle } from './ThemeToggle'

export default function Footer({ isNavbar = false }: { isNavbar?: boolean }) {
  return (
    <footer className="footer footer-center rounded bg-[--background] p-10 text-[--foreground] text-base-content">
      {/*       <div className="grid grid-flow-col gap-4"> */}
      <div className="flex flex-col flex-wrap items-center justify-center gap-4 text-[--footer-foreground] sm:flex-row">
        <ThemeToggle />
        <Link
          tabindex="0"
          href="/disclaimer"
          className="link-hover link text-[--footer-link] hover:text-[--footer-link-hover]"
          target="_blank"
          rel="noopener noreferrer"
        >
          Disclaimer
        </Link>
        <Link
          tabindex="0"
          href="https://www.vpaa.uillinois.edu/digital_risk_management/generative_ai/"
          className="link-hover link text-[--footer-link] hover:text-[--footer-link-hover]"
          target="_blank"
          rel="noopener noreferrer"
        >
          Generative AI Policy
        </Link>
        <Link
          tabindex="0"
          href="https://www.vpaa.uillinois.edu/resources/terms_of_use"
          className="link-hover link text-[--footer-link] hover:text-[--footer-link-hover]"
          target="_blank"
          rel="noopener noreferrer"
        >
          Terms
        </Link>
        <Link
          tabindex="0"
          href="https://www.vpaa.uillinois.edu/resources/web_privacy"
          className="link-hover link text-[--footer-link] hover:text-[--footer-link-hover]"
          target="_blank"
          rel="noopener noreferrer"
        >
          Privacy
        </Link>
        <span>
          MIT Licensed{' '}
          <Link
            tabindex="0"
            href="https://github.com/Center-for-AI-Innovation/uiuc-chat-frontend"
            className="link-hover link text-[--footer-link] hover:text-[--footer-link-hover]"
            target="_blank"
            rel="noopener noreferrer"
          >
            frontend
          </Link>{' '}
          and{' '}
          <Link
            tabindex="0"
            href="https://github.com/Center-for-AI-Innovation/ai-ta-backendhttps://github.com/UIUC-Chatbot/ai-ta-backend"
            className="link-hover link text-[--footer-link] hover:text-[--footer-link-hover]"
            target="_blank"
            rel="noopener noreferrer"
          >
            backend
          </Link>{' '}
          code.
        </span>
        <div>
          <Link
            tabindex="0"
            href="https://status.uiuc.chat"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              src="https://status.uiuc.chat/api/badge/1/uptime/24?label=Uptime%2024%20hours"
              alt="Service Uptime Badge"
              width={110}
              height={50}
            />
          </Link>
        </div>
      </div>
    </footer>
  )
}
