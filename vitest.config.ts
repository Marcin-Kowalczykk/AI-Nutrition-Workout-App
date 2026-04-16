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
        '**/index.ts',
        // Next.js boilerplate
        'proxy.ts',
        'app/**/layout.tsx',
        'app/**/page.tsx',
        'app/**/manifest.ts',
        // API route handlers — server-side Supabase calls, require real DB (integration tests only)
        'app/api/**',
        // shadcn/ui generated components - not our code
        'components/ui/**',
        'hooks/use-mobile.tsx',
        'lib/utils.ts',
        // Supabase client config - no logic to test
        'lib/supabase/**',
        // Service worker registration boilerplate
        'components/service-worker/**',
        // Auth — UI forms/screens tested via e2e; keep API hooks for unit tests
        'components/auth/*/components/**',
        'components/auth/logout-button/logout-button.tsx',
        // Comparisons feature — chart components, visual only
        'components/comparisions/**',
        // React context providers — boilerplate wiring
        'components/providers/**',
        // Pure page wrappers
        'components/main-page/**',
        // Pure UI wrappers / navigation — no business logic to unit-test
        'components/shared/sidebar/**',
        'components/shared/theme-toggle/**',
        // Shared UI widgets with no testable logic
        'components/shared/background-image.tsx',
        'components/shared/center-wrapper.tsx',
        'components/shared/dates-select.tsx',
        'components/shared/error-component.tsx',
        'components/shared/exercises-select.tsx',
        'components/shared/ios-viewport.tsx',
        'components/shared/keyword-input.tsx',
        'components/shared/jump-button.tsx',
        'components/shared/password-input.tsx',
        'components/shared/scroll-jump-button.tsx',
        'components/shared/top-bar.tsx',
        // Workout form: context provider and read-only view components
        'components/workout-form/context/**',
        'components/workout-form/components/view/**',
        'components/workout-form/workout.tsx',
        // Workout form: large rendering component (tested separately)
        'components/workout-form/workout-form.tsx',
        'components/workout-form/form/exercise-history-strip/exercise-history-strip.tsx',
        // Page-level UI wrappers — tested via e2e
        'components/workout-create/*.tsx',
        'components/workout-edit/*.tsx',
        'components/workout-history/*.tsx',
        // Records: UI components (helpers already covered in records/helpers)
        'components/records/*.tsx',
        // Workout template UI components (hooks/api already covered)
        'components/workout-template/*.tsx',
        // Exercises: unit-type select widget — pure UI dropdown
        'components/exercises/exercise-unit-type-select.tsx',
        // Body measurements: page wrapper and edit form — tested via e2e
        'components/body-measurements/body-measurements.tsx',
        'components/body-measurements/edit-measurement-sheet.tsx',
        // Diet panel: UI components tested via e2e
        'components/diet/*.tsx',
        // Profile settings: UI form only (API hook tested separately)
        'components/profile-settings/components/**',
        // Global hooks — low ROI
        'hooks/use-get-profile.ts',
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
