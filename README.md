# Training Diet App

A focused fitness app for managing **workouts, templates, exercises, diet history, calories and body measurements**.  
Built with **Next.js App Router**, **Supabase** and a modern UI (shadcn/ui + Tailwind).

## 🔍 Overview

- **Recommended usage**

  - **Best experience on mobile** (layout and interactions are mobile‑first)
  - The app is designed as a **PWA** – ideally install it to your home screen and use it like a native app

- **Dashboard – Workout history**

  - List of past workouts with date, name and description
  - Date range filters
  - Text search
  - Quick actions: **view**, **edit**, **delete** past workouts

- **Records**

  - Personal bests reps / duarion / weights extracted from workouts
  - Quick view of progress for important movements and lifts over time
  - filters by reps / duration / weight in a side sheet

- **Comparisons**

  - Per‑exercise history with configurable charts (reps, weight, duration)
  - Date filters and visualization to compare sessions across time

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

## 📐 Specification (behaviour details)

- **Date filters**

  - Workout history and comparisons use a **default date range of the last 6 months** (from today) when the page loads.
  - Date pickers always open on the **currently selected month** (if any), otherwise on the current month.

- **Date display & locale**

  - Dates are formatted using the **user locale (currently Polish)** for both input labels and calendar dropdowns.
  - Date pickers try to show the **full month name** in the input if there is enough horizontal space; if not, they automatically switch to the **short, 3‑letter month name**.

- **Charts & comparisons**

  - On mobile, rotating the device to **landscape** in the Comparisons view automatically shows the exercise history chart in a **fullscreen overlay** for better readability.
  - The comparisons chart is configurable per exercise (mode, reps/weight/duration). If the chosen configuration yields no matching sets for the selected exercise, the app shows a **non-blocking warning toast** instead of an empty chart.
  - Records and comparisons both derive values based on the **appropriate metric for a given exercise type** (e.g. reps, weight, duration), so PRs and history are comparable within the same exercise category.

- **Pagination**

  - Workout history and comparisons use a **shared, generic pagination component** based on shadcn/ui `Pagination` and `Field`, with a compact, mobile‑friendly layout (rows‑per‑page select + page numbers + arrow icons).
  - Pagination is currently **handled on the client**: the backend returns all results for the selected date range, and the `PaginatedSection` component slices the list into pages and controls which slice is visible.
  - By default only **neighboring page numbers plus the first and last page** are shown (pattern like `1 … 3 4 5 … N`), while simpler cases (≤ 5 pages) render all page numbers without ellipses.
  - On small screens the pagination bar is very compact: **icon‑only arrows (no “Previous/Next” labels), small page chips**, all wrapped in a bordered container aligned to the **right edge** of the list.

- **Safety & UX**

  - Destructive actions (like deleting workouts, templates or exercises) always require **explicit confirmation in a modal**.
  - The workout form uses **autosave to `localStorage`** to protect against accidental data loss when navigating away or switching tabs.
  - When you try to leave a screen with **unsaved changes**, the app can show a **confirm modal** to prevent accidental loss of edits (e.g. when switching tabs or closing a panel).
  - Primary action buttons in forms (save/update) become **enabled only when there are actual changes**, and are hidden/disabled or visually de‑emphasised when the current state matches the persisted data.

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
- **[Recharts](https://ui.shadcn.com/charts/area)** - Charting library for rendering responsive, customizable charts (used for exercise history and records)
