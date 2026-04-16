# Application Architecture

## Technology stack

- `Next.js 16` with `App Router`
- `React 19`
- `TypeScript`
- `Supabase` for database and auth
- `@tanstack/react-query` with persisted cache
- `shadcn/ui` and `Radix UI`
- `Tailwind CSS 4`
- `Vitest` and `React Testing Library`
- `Playwright` for e2e
- `Anthropic SDK` for AI features

## High-level structure

### `app/`

Routing and endpoint layer:

- `app/(auth)` - public auth and account recovery routes
- `app/(protected)` - main authenticated application
- `app/api` - server endpoints for domain operations

### `components/`

UI and client logic layer:

- domain-oriented components
- shared components
- application providers
- base `ui/` components

### `lib/`

Support layer:

- Supabase clients
- form cache
- utility functions and tests

### `e2e/` and `tests/`

Quality layer:

- Playwright tests for main user flows
- unit and component tests
- MSW mocks for tests

## Routing and access

### Public routes

- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`

### Protected routes

- `/main-page`
- `/workout/create`
- `/workout/edit`
- `/workout/template`
- `/workout/template/create`
- `/workout/template/[id]/edit`
- `/exercises`
- `/records`
- `/comparisons`
- `/diet-history`
- `/ai-meal-analyzer`
- `/body-measurements`
- `/profile-settings`

### Access control

`proxy.ts` is responsible for:

- redirecting `/` to `/login` or `/main-page`
- blocking selected routes for unauthenticated users
- redirecting authenticated users away from `/login` and `/register`

## Layout

### Root layout

`app/layout.tsx` initializes:

- `ThemeProvider`
- `TooltipProvider`
- `QueryProvider`
- service worker registration
- iOS viewport handling

### Protected layout

`app/(protected)/layout.tsx` builds the main app shell:

- sidebar
- mobile top bar
- right drawer
- scroll container
- background visuals
- toaster
- unsaved workout protection provider

## Data layer

### Database

Based on code and table names, the app uses at least:

- `workout_plans`
- `workout_templates`
- `exercise_categories`
- `exercises`
- `body_measurements`
- `diet_days`
- `diet_meals`
- `diet_products`
- `diet_scan_usage`

It also uses the `profiles` table for configuration such as AI usage limits.

### Data access model

1. a client component calls an API hook
2. the hook sends a request to `app/api/...`
3. the endpoint uses the server Supabase client
4. the response returns to the client and is cached by React Query

## Client cache and state

### React Query

`QueryProvider` sets:

- `staleTime` to 1 minute
- `gcTime` to 24 hours
- `retry: false`
- cache persistence in `localStorage`

### Workout form draft cache

`lib/form-cache.ts` uses:

- `IndexedDB` as the primary draft store
- `localStorage` as a fallback

This applies to workout and workout template forms.

## AI and external integrations

AI features are implemented through server endpoints using `@anthropic-ai/sdk`.

There are at least two scenarios:

- nutrition label analysis from an image
- meal analysis based on text and optionally 1-2 images

The code also includes:

- model fallback on provider-side 529 errors
- per-user daily limits
- owner bypass through `OWNER_USER_ID`
