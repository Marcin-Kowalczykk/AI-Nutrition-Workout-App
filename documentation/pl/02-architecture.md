# Architektura aplikacji

## Stack technologiczny

- `Next.js 16` z `App Router`
- `React 19`
- `TypeScript`
- `Supabase` jako baza danych i warstwa auth
- `@tanstack/react-query` z persystencją cache
- `shadcn/ui` i `Radix UI`
- `Tailwind CSS 4`
- `Vitest` i `React Testing Library`
- `Playwright` dla e2e
- `Anthropic SDK` dla funkcji AI

## Struktura wysokiego poziomu

### `app/`

Warstwa routingu i endpointów:

- `app/(auth)` - publiczne ścieżki logowania i odzyskiwania dostępu
- `app/(protected)` - główna aplikacja po zalogowaniu
- `app/api` - endpointy serwerowe dla poszczególnych domen

### `components/`

Warstwa UI i logiki klienckiej:

- komponenty domenowe pogrupowane według segmentów
- komponenty współdzielone
- providery aplikacyjne
- komponenty bazowe `ui/`

### `lib/`

Warstwa pomocnicza:

- klienty Supabase
- cache formularzy
- funkcje pomocnicze i testy jednostkowe

### `e2e/` i `tests/`

Warstwa jakości:

- testy Playwright dla głównych przepływów użytkownika
- testy jednostkowe i komponentowe
- mocki MSW dla testów

## Routing i dostęp

### Publiczne ścieżki

- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`

### Chronione ścieżki

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

### Kontrola dostępu

Plik `proxy.ts` odpowiada za:

- przekierowanie `/` na `/login` lub `/main-page`
- blokadę wybranych ścieżek dla niezalogowanych
- przekierowanie zalogowanego użytkownika z `/login` i `/register` do `/main-page`

## Layout aplikacji

### Root layout

`app/layout.tsx` uruchamia globalne providery i elementy infrastrukturalne:

- `ThemeProvider`
- `TooltipProvider`
- `QueryProvider`
- rejestrację service workera
- obsługę viewportu iOS

### Protected layout

`app/(protected)/layout.tsx` buduje główny shell aplikacji:

- sidebar
- top bar na mobile
- prawa szuflada
- kontener przewijania
- tło wizualne
- toaster
- provider ochrony przed utratą danych treningu

## Warstwa danych

### Baza danych

Na podstawie kodu i nazw tabel aplikacja używa co najmniej następujących tabel:

- `workout_plans`
- `workout_templates`
- `exercise_categories`
- `exercises`
- `body_measurements`
- `diet_days`
- `diet_meals`
- `diet_products`
- `diet_scan_usage`

Dodatkowo używana jest tabela `profiles`, z której pobierane są między innymi limity funkcji AI.

### Dostęp do danych

Model dostępu wygląda następująco:

1. komponent kliencki wywołuje hook API
2. hook wysyła żądanie do `app/api/...`
3. endpoint korzysta z serwerowego klienta Supabase
4. odpowiedź wraca do klienta i jest buforowana przez React Query

## Cache i stan klienta

### React Query

`QueryProvider` ustawia:

- `staleTime` 1 minuta
- `gcTime` 24 godziny
- `retry: false`
- persystencję cache w `localStorage`

### Draft cache formularza treningu

`lib/form-cache.ts` używa:

- `IndexedDB` jako podstawowego magazynu draftów
- `localStorage` jako fallbacku

Dotyczy to formularzy treningu i szablonów treningowych.

## AI i integracje zewnętrzne

Funkcje AI są realizowane przez endpointy serwerowe z użyciem `@anthropic-ai/sdk`.

Występują co najmniej dwa scenariusze:

- analiza etykiety produktu z obrazu
- analiza posiłku na podstawie opisu i opcjonalnie 1-2 zdjęć

W kodzie istnieją także:

- fallback modeli przy błędzie 529 po stronie dostawcy
- limity dzienne per użytkownik
- bypass dla właściciela aplikacji przez `OWNER_USER_ID`

## PWA

Projekt zawiera elementy wskazujące na tryb PWA:

- `app/manifest.ts`
- `public/sw.js`
- rejestrację service workera
- cache React Query utrzymywany przez restarty aplikacji

## Jakość i testy

### Unit i component tests

Projekt ma szerokie pokrycie testami dla:

- helperów
- hooków
- warstwy API
- komponentów wybranych modułów

### E2E

Playwright obejmuje przepływy:

- auth
- exercises
- workout templates
- workout create i edit
- records
- comparisons
- body measurements
- diet history
- scan produktu
