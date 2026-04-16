# Authentication and Profile

## Segment goal

This segment handles user entry into the application and basic account settings.

## Functional scope

- email/password registration
- login
- logout
- password reset
- profile retrieval
- profile update
- theme switching

## Main routes

- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`
- `/profile-settings`

## Component layer

- `components/auth/login`
- `components/auth/register`
- `components/auth/forgot-password`
- `components/auth/reset-password`
- `components/auth/logout-button`
- `components/profile-settings`

## Backend and API

- `app/api/auth/login/route.ts`
- `app/api/auth/register/route.ts`
- `app/api/auth/logout/route.ts`
- `app/api/auth/forgot-password/route.ts`
- `app/api/auth/reset-password/route.ts`
- `app/api/profile/get-profile/route.ts`
- `app/api/profile/update-profile/route.ts`

## System behavior

- unauthenticated users should not access the main application modules
- authenticated users should not return to login or registration
- root `/` redirects based on session state
- password reset uses `NEXT_PUBLIC_APP_URL`

## Profile role

The profile also acts as runtime configuration because it stores AI usage limits such as:

- `scan_daily_limit`
- `ai_analyze_daily_limit`
