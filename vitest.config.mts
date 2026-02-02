import path from 'node:path'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  resolve: {
    alias: {
      'database.types': path.resolve(__dirname, './database.types.ts'),
      fonts: path.resolve(__dirname, './fonts.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: [
      'src/**/*.{test,spec}.{ts,tsx}',
      '__tests__/**/*.{test,spec}.{ts,tsx}',
    ],
    css: true,
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        '**/*.d.ts',
        '**/*.config.*',
        '**/node_modules/**',
        '**/.next/**',
        '**/.cursor/**',
        '**/scripts/**',
        // Legacy/duplicated hooks that are being phased out in favor of
        // src/hooks/{conversation,docGroups,folder}Queries.ts
        'src/hooks/queries/**',
        'src/hooks/__internal__/**',
        // This is UI state/context, not a Next.js API route handler.
        'src/pages/api/home/home.tsx',
      ],
    },
  },
})
