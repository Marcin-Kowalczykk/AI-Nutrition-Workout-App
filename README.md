# Training Diet App

A modern web application for tracking training plans, diet history, and body measurements. Built with Next.js and Supabase for authentication and data management.

## 🔐 Features / Description

- **User Authentication**

  - Email/password registration and login
  - Password reset via email
  - Protected routes with middleware
  - Session management

- **User Profile**

  - Update full name
  - Update password

- **Features**

  - Training plans tracking
  - Kcal calculator
  - Diet history logging
  - Body measurements (coming soon)

## 🚀 Technologies

This project is built with the following technologies:

- **[Next.js 16](https://nextjs.org/)** - React framework with App Router for server-side rendering and routing
- **[React 19](https://react.dev/)** - UI library for building user interfaces
- **[TypeScript](https://www.typescriptlang.org/)** - Typed superset of JavaScript for better developer experience
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework for styling
- **[Supabase](https://supabase.com/)** - Backend-as-a-Service providing:
  - PostgreSQL database
  - Authentication (email/password, password reset)
  - Row Level Security (RLS) for data protection
  - Real-time subscriptions

## 📋 Prerequisites

- **Node.js v20** or higher
- **npm**, **yarn**, **pnpm**, or **bun** package manager
- A Supabase account (free tier available)
- Git (for version control)

## 🛠️ Getting Started

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd Training-diet-app
```

### 2. Install dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

### 3. Set up Supabase

1. Create a project on [Supabase](https://supabase.com)
2. Go to **Settings** → **API** to get your keys
3. Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 🚀 Deployment on Vercel

The easiest way to deploy this Next.js app is using [Vercel](https://vercel.com), the platform created by the Next.js team.

### Quick Deploy

1. Push your code to GitHub
2. Import your repository on [Vercel](https://vercel.com/new)
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy

### Environment Variables on Vercel

Make sure to add all your Supabase environment variables in the Vercel dashboard:

- Go to your project → **Settings** → **Environment Variables**
- Add all variables from your `.env.local` file

## 🛠️ Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
