import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    exclude: ['**/node_modules/**', '**/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['**/*.{ts,tsx}'],
      exclude: [
        '**/node_modules/**',
        '**/e2e/**',
        '**/*.config.{ts,js}',
        '**/*.d.ts',
        '**/*.test.{ts,tsx}',
        '**/types.ts',
        '**/types/**',
        '**/tests/**',
        // Next.js boilerplate
        'proxy.ts',
        'app/**/layout.tsx',
        'app/**/page.tsx',
        'app/**/manifest.ts',
        // shadcn/ui generated components - not our code
        'components/ui/**',
        'hooks/use-mobile.tsx',
        'lib/utils.ts',
        // Supabase client config - no logic to test
        'lib/supabase/**',
        // Service worker registration boilerplate
        'components/service-worker/**',
      ],
      all: true,
    },
  },
  resolve: {
    alias: {
      '@': path.resolve('.'),
    },
  },
})
