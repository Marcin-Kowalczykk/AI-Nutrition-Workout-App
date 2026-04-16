# Authentication i profil

## Cel segmentu

Segment odpowiada za wejście użytkownika do aplikacji i podstawowe ustawienia konta.

## Zakres funkcjonalny

- rejestracja konta e-mail/hasło
- logowanie
- wylogowanie
- reset hasła
- pobieranie profilu
- aktualizacja profilu
- zmiana motywu

## Główne ścieżki

- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`
- `/profile-settings`

## Warstwa komponentów

- `components/auth/login`
- `components/auth/register`
- `components/auth/forgot-password`
- `components/auth/reset-password`
- `components/auth/logout-button`
- `components/profile-settings`

## Backend i API

- `app/api/auth/login/route.ts`
- `app/api/auth/register/route.ts`
- `app/api/auth/logout/route.ts`
- `app/api/auth/forgot-password/route.ts`
- `app/api/auth/reset-password/route.ts`
- `app/api/profile/get-profile/route.ts`
- `app/api/profile/update-profile/route.ts`

## Zachowanie systemowe

- niezalogowany użytkownik nie powinien wejść na główne moduły aplikacji
- zalogowany użytkownik nie powinien wracać na ekran logowania ani rejestracji
- root `/` przekierowuje zależnie od sesji
- reset hasła korzysta z `NEXT_PUBLIC_APP_URL`

## Rola profilu

Profil pełni też rolę konfiguracji działania systemu, ponieważ przechowuje między innymi limity użycia funkcji AI:

- `scan_daily_limit`
- `ai_analyze_daily_limit`
