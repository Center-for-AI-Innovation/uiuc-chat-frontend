import { SignIn } from '@clerk/nextjs'
import { useRouter } from 'next/router'

export default function SignInPage() {
  const router = useRouter()
  const query_param_course_name = Object.keys(router.query)[0]

  return (
    <>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#0E1116]">
        <div className="container flex flex-col items-center justify-center gap-8 px-4 py-16 ">
          <SignIn fallbackRedirectUrl={`/${query_param_course_name}`} />
        </div>
      </main>
    </>
  )
}
