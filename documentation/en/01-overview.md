# Project Overview

## What the application is

`Training Diet App` is a mobile-first PWA web application for managing:

- diet and nutrition history
- AI-assisted meal analysis
- body measurements
- workouts
- workout templates
- exercises and exercise categories
- records and progress comparisons
- user profile settings

The application is built with `Next.js App Router`, `Supabase`, `React Query`, `shadcn/ui`, and `Tailwind CSS`.

## Main target user

Based on the current codebase, the product is aimed at a single authenticated user who:

- logs diet history
- uses AI to speed up nutrition input
- tracks body weight and circumferences
- records personal workouts
- reviews progress
- uses the app mainly on mobile devices

## Main application segments

### 1. Diet and AI

Scope:

- diet history
- meals and products
- calorie and macro totals
- nutrition label scanning
- AI meal analysis

This is intentionally the highest-ranked functional segment in the product hierarchy.

### 2. Body measurements

Scope:

- body weight
- height
- body circumferences
- measurement history

### 3. Workout domain

Scope:

- workout history
- new workout creation
- existing workout editing
- workout details view
- work with exercises, sets, loads, duration, and notes
- unsaved form protection

### 4. Workout templates

Scope:

- template creation
- template list
- search
- detail preview
- edit and delete
- use template as a starting point for a workout

### 5. Exercises

Scope:

- exercise category management
- exercise management
- search
- single and bulk deletion

### 6. Records and comparisons

Scope:

- record calculation from workout history
- record filtering
- selected exercise history analysis
- chart-based visualization

### 7. Authentication and profile

Scope:

- registration
- login
- password reset
- logout
- profile update
- theme selection
