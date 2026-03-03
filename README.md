# Training Diet App

A focused fitness app for managing **workouts, templates, exercises, diet history, calories and body measurements**.  
Built with **Next.js App Router**, **Supabase** and a modern UI (shadcn/ui + Tailwind).

## 🔍 Overview

- **Dashboard – Workout history**

  - List of past workouts with date, name and description
  - Date range filters
  - Quick actions: **view**, **edit**, **delete** past workouts

- **Workout creation & editing**

  - Step‑by‑step workout form with autosave (draft cached in `localStorage`)
  - Create from scratch or reuse structure via **templates**
  - Rich editing: exercise list, sets, reps, weights, notes
  - Protecting from lose data due to changing tab during create/editing workout

- **Templates**

  - Create reusable **workout templates** (name, description, exercises)
  - Browse and search templates
  - View details in a side sheet
  - Edit or delete with confirmation dialogs

- **Exercises**

  - Manage exercise **categories** and **exercises**
  - Search and filtering
  - Quick add / delete, multi‑delete mode with confirmation
  - Designed to be your single source of truth for exercise names

- **Diet & body tracking**

  - **Diet history** page for logging diet‑related entries
  - **Kcal calculator** for estimating daily calorie needs
  - **Body measurements** section (structure in place, easy to extend with more metrics)

- **Authentication & profile**
  - Email/password sign up & login via Supabase
  - Password reset flow
  - Profile screen to update name, password and **theme (dark/light)**
  - All main routes are protected; anonymous users are redirected to auth

## 🧭 Main user flows

- **New user**

  - Registers with email and password
  - Sets basic profile data and preferred theme
  - Define exercises
  - Create templates (optional)
  - Create first workout

- **Typical training day**

  - Opens **Workout history** to see last sessions
  - Creates a new workout (optionally from a template)
  - Uses **Exercises** to keep names consistent
  - Edit past workout (optional)
  - Logs diet history and checks **Kcal calculator** if needed

- **Progress tracking**

  - Filters **Workout history** by date range
  - Reviews **diet history** and updates **body measurements**

## 🧠 How it works (architecture)

- **Frontend**

  - **Next.js 16 App Router** with protected routes in `app/(protected)/…`
  - Client components where needed (forms, sheets, search, react-query hooks)
  - **TanStack Query** for all server data: caching, refetching, optimistic UX

- **Backend / data**

  - **Supabase** PostgreSQL as data store
  - Supabase Auth for sessions; Row Level Security to keep each user’s data isolated
  - Next Api
  - All CRUD operations for workouts, templates, exercises, diet entries and measurements go through typed API handlers/hooks

- **CI/CD**
  - Main branch → production
  - Repo is connected to Vercel
  - Every push to `main` automatically triggers a **production deployment**.
  - You don’t run any extra commands

## 🧩 Tech stack

- **[Next.js 16](https://nextjs.org/)** - React framework with App Router for server-side rendering and routing
- **[React 19](https://react.dev/)** - UI library for building user interfaces
- **[TypeScript](https://www.typescriptlang.org/)** - Typed superset of JavaScript for better developer experience
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework for styling
- **[TanStack Query (React Query)](https://tanstack.com/query/latest)** - Powerful data synchronization library for React that provides server state management, caching, background updates, and data fetching with minimal boilerplate
- **[shadcn/ui](https://ui.shadcn.com/)** - Re-usable components built with Radix UI and Tailwind CSS, providing accessible and customizable UI components
- **[next-themes](https://github.com/pacocoursey/next-themes)** - Theme provider for Next.js that enables seamless dark/light mode switching with system preference detection
- **[Supabase](https://supabase.com/)** - Backend-as-a-Service providing:
  - PostgreSQL database
  - Authentication (email/password, password reset)
  - Row Level Security (RLS) for data protection
  - Real-time subscriptions
