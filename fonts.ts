// Intentionally avoids `next/font/google` so builds can run without outbound
// network access (e.g. self-hosted build environments).
//
// We define the font CSS variables in `src/styles/globals.css` and reference them
// from Tailwind via `tailwind.config.ts`.

export type FontHandle = {
  className: string
  variable: string
  style: {
    fontFamily: string
  }
}

function fontHandle(cssVarName: string): FontHandle {
  return {
    className: '',
    variable: '',
    style: { fontFamily: `var(${cssVarName})` },
  }
}

export const montserrat_heading = fontHandle('--font-montserratHeading')

export const montserrat_paragraph = fontHandle('--font-montserratParagraph')

export const doto_font = fontHandle('--font-doto')

// export const rubik_puddles = Rubik_Puddles({
//   weight: '400',
//   subsets: ['latin'],
//   display: 'swap',
//   variable: '--font-rubikPuddles',
// })

// export const inter = Inter({
//   subsets: ['latin'],
//   display: 'swap',
// })

// export const roboto_mono = Roboto_Mono({
//   subsets: ['latin'],
//   display: 'swap',
// })
