import { type Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class', // 'media' or 'class' (media uses system settings, class uses globals.css)
  theme: {
    extend: {
      fontFamily: {
        // See fonts.ts for the other half
        montserratHeading: ['var(--font-montserratHeading)'],
        montserratParagraph: ['var(--font-montserratParagraph)'],
        // rubikPuddles: ['var(--font-rubikPuddles)'],
        // mono: ['var(--font-roboto-mono)'],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('daisyui')],
} satisfies Config
