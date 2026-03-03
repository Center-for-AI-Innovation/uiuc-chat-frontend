import { montserrat_heading } from 'fonts'
import Link from 'next/link'
import { Button } from '~/components/shadcn/ui/button'

export function ChatbotsHeroSection() {
  return (
    <section className="relative flex min-h-[560px] items-end overflow-hidden px-4 pb-12 pt-24 sm:px-8 sm:pb-16">
      {/* Campus aerial photo */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/media/flagship-banner.png"
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-top"
      />
      {/* Fade overlay: transparent at top → white at bottom */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/60 to-white dark:from-transparent dark:via-[#081735]/60 dark:to-[#081735]" />
      <div className="relative z-10 max-w-[680px]">
        <h1
          className={`text-4xl font-bold leading-none text-[--illinois-blue] dark:text-white sm:text-5xl ${montserrat_heading.variable} font-montserratHeading`}
        >
          Illinois Flagship
        </h1>
        <p className="mt-8 text-xl leading-8 text-[--illinois-storm-dark] dark:text-[#c8d2e3]">
          The official AI Chatbot for the University of Illinois. Get assistance
          with campus resources, course information, academic support, and
          everything you need to succeed at Illinois.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link href="/chat">
            <Button className="h-10 bg-[--illinois-blue] px-8 text-sm text-white hover:bg-[--foreground-dark] dark:bg-white dark:text-[--illinois-blue] dark:hover:bg-[#e5e7eb]">
              Start Chatting
            </Button>
          </Link>
          <Link href="/disclaimer">
            <Button
              variant="secondary"
              className="h-10 bg-[hsl(var(--muted))] px-8 text-sm text-[--illinois-blue] dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
            >
              More Info
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
