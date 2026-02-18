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
        // Server-side agent SSE route is exercised via integration tests, not unit tests
        'src/app/api/agent/**',
        // Streaming/SSE hook is environment-dependent; keep unit coverage focused on pure hooks
        'src/hooks/useAgentStream.ts',
        'src/hooks/queries/useLogConversation.ts',
        'src/hooks/queries/useQueryRewrite.ts',
        'src/hooks/queries/useRouteChat.ts',
        // Deprecated/migration-only routes aren't exercised in tests
        '**/*DEPRECATED.*',
        '**/MIGRATEALLKEYS.*',
        '**/moveToNewCourseMetadata.*',
        '**/saveOldCourseMetadata.*',
        '**/restoreOldCourseMetadata.*',
        '**/setDisabledModels.*',
        '**/onResponseCompletion.*',
        '**/setCourseStudents.*',
      ],
    },
  },
})
