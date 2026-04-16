# Training Diet App

A mobile-first fitness tracker focused first on **diet logging and AI-assisted nutrition input**, and second on **workout tracking and progress analysis**.

Built with `Next.js App Router`, `Supabase`, `React Query`, `shadcn/ui`, and `Tailwind CSS`.

## Why this project exists

Most fitness apps split the user workflow into disconnected tools:

- one app for calories
- another for workouts
- another for body measurements
- manual nutrition entry that takes too much time

This project brings those flows into one product, with a clear priority:

1. make diet logging faster through AI
2. support body tracking around nutrition progress
3. keep workout tracking and exercise analytics in the same system

## Product focus

### Primary layer: Diet and AI

The highest-priority part of the application is the nutrition workflow:

- diet day history
- meals and products
- calories and macro totals
- product label scanning from photos
- AI meal analysis from text and optional images

The goal is simple: reduce the friction of entering nutrition data.

### Secondary layer: Body measurements

Body tracking complements the diet layer:

- weight history
- height
- body circumferences
- filtered measurement history

### Supporting layer: Training and progress

Training remains an important part of the app, but it sits below the diet and AI layer in the current product hierarchy:

- workout history
- workout creation and editing
- workout templates
- exercise dictionary
- records
- comparisons and charts

## Core features

### Diet history

- full CRUD for diet days
- meals grouped by day
- products with calories, protein, carbs, and fat
- per-day nutrition totals
- copy product and copy meal flows

### AI nutrition tools

- product nutrition label scanning from mobile photos
- AI meal analysis from description and optional 1-2 images
- accepted AI results can be saved directly into diet history
- daily AI usage limits per user

### Body measurements

- quick measurement logging
- editable history
- date filtering
- client-side pagination
- smart defaults based on previous entries

### Workouts

- workout history with search and date filters
- create new workout from scratch or from template
- edit stored workouts
- workout detail preview
- unsaved-changes protection
- draft cache in `IndexedDB` with `localStorage` fallback

### Templates and exercises

- reusable workout templates
- searchable template list
- exercise categories and exercises
- bulk deletion flows
- exercise naming as a shared source of truth for analytics

### Progress analysis

- records derived from workout history
- exercise comparisons with chart configuration
- trend analysis over time

## User flows

### Nutrition-first flow

1. Open diet history.
2. Add a meal manually or use AI assistance.
3. Scan a product label or analyze a meal from description/photos.
4. Save accepted results into the day log.
5. Track body measurements alongside diet consistency.

### Training flow

1. Review workout history.
2. Start a new workout or reuse a template.
3. Edit exercises, sets, reps, loads, duration, and notes.
4. Compare with previous exercise performance.
5. Review records and comparisons later.

## Architecture at a glance

- `app/(auth)` for public auth routes
- `app/(protected)` for the authenticated application
- `app/api` for route handlers
- `components/` organized by domain segment
- `lib/` for Supabase clients, helpers, and form cache
- `TanStack Query` for server-state caching
- `Supabase` for auth and database access
- `Anthropic SDK` for AI features

Main protected routes:

- `/diet-history`
- `/ai-meal-analyzer`
- `/body-measurements`
- `/main-page`
- `/workout/create`
- `/workout/edit`
- `/workout/template`
- `/exercises`
- `/records`
- `/comparisons`
- `/profile-settings`

## Tech stack

- `Next.js 16`
- `React 19`
- `TypeScript`
- `Supabase`
- `TanStack React Query`
- `Tailwind CSS 4`
- `shadcn/ui`
- `Vitest`
- `Playwright`

## Local development

### Prerequisites

- `Node.js >= 20.9.0`
- configured Supabase project

### Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Required environment variables used by the app include:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Additional variables referenced in code:

- `NEXT_PUBLIC_APP_URL`
- `OWNER_USER_ID`
- `NEXT_PUBLIC_ENCRYPTION_KEY`
- `ENCRYPTION_KEY`

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run test
npm run test:coverage
npm run test:watch
npm run test:e2e
npm run test:e2e:ui
npm run test:e2e:sequence
npm run test:e2e:report
```

## Testing

The project includes:

- unit tests for helpers and logic
- component tests for selected UI flows
- API-hook tests
- Playwright e2e coverage for auth, workouts, templates, exercises, records, comparisons, diet, and body measurements

## Documentation

Detailed internal documentation is available in:

- [documentation/pl/README.md](./documentation/pl/README.md)
- [documentation/en/README.md](./documentation/en/README.md)

## Current positioning

If this repository evolves into a public product, the clearest positioning is:

**AI-assisted diet tracking with built-in workout history and progress analysis.**
