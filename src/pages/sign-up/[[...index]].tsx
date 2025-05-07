import { SignUp } from '@clerk/nextjs'

export default function Page() {
  return (
    <>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[--background] to-[--background-dark]">
        <div className="container flex flex-col items-center justify-center gap-8 px-4 py-16 ">
          <SignUp />
        </div>
      </main>
    </>
  )
}
