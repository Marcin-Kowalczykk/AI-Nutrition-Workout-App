# Przegląd projektu

## Czym jest aplikacja

`Training Diet App` to mobilnie projektowana aplikacja webowa typu PWA do zarządzania:

- dietą i historią żywienia
- analizą posiłków z użyciem AI
- pomiarami ciała
- treningami
- szablonami treningowymi
- ćwiczeniami i kategoriami ćwiczeń
- rekordami i porównaniami postępów
- profilem użytkownika

Aplikacja jest oparta o `Next.js App Router`, `Supabase`, `React Query`, `shadcn/ui` i `Tailwind CSS`.

## Główna grupa docelowa

Na podstawie aktualnego kodu produkt jest skierowany do pojedynczego zalogowanego użytkownika, który:

- prowadzi historię diety
- korzysta z funkcji AI do przyspieszenia wpisów
- śledzi masę ciała i obwody
- zapisuje własne treningi
- analizuje progres
- korzysta głównie na urządzeniu mobilnym

## Główne segmenty aplikacji

### 1. Dieta i AI

Zakres:

- historia diety
- posiłki i produkty
- sumowanie kalorii i makroskładników
- skan etykiet produktów
- analiza posiłków przez AI

To najwyżej ustawiony segment funkcjonalny w hierarchii produktu.

### 2. Pomiary ciała

Zakres:

- masa ciała
- wzrost
- obwody ciała
- historia pomiarów

### 3. Workout domain

Zakres:

- historia treningów
- tworzenie nowego treningu
- edycja istniejącego treningu
- podgląd szczegółów
- praca na ćwiczeniach, seriach, obciążeniach, czasie i notatkach
- ochrona przed utratą formularza

### 4. Workout templates

Zakres:

- tworzenie szablonów
- lista szablonów
- wyszukiwanie
- podgląd szczegółów
- edycja i usuwanie
- użycie szablonu do utworzenia treningu

### 5. Exercises

Zakres:

- zarządzanie kategoriami ćwiczeń
- zarządzanie ćwiczeniami
- wyszukiwanie
- usuwanie pojedyncze i grupowe

### 6. Records i comparisons

Zakres:

- wyliczanie rekordów z historii treningów
- filtrowanie rekordów
- analiza historii konkretnego ćwiczenia
- wizualizacja danych na wykresach

### 7. Authentication i profil

Zakres:

- rejestracja
- logowanie
- reset hasła
- wylogowanie
- aktualizacja danych profilu
- wybór motywu

## Główne założenia UX wynikające z kodu

- aplikacja jest wyraźnie mobile-first
- główne obszary użytkownika są chronione przez auth
- nawigacja opiera się na bocznym menu i widokach chronionych
- formularze i listy są projektowane pod szybkie operacje dzienne
- część danych i cache działa po stronie klienta, aby poprawić płynność działania

## Najważniejsze cechy produktu

- jeden ekosystem do diety, AI, pomiarów i treningu
- nacisk na codzienne użycie, a nie tylko raportowanie
- połączenie klasycznego CRUD z funkcjami AI
- wsparcie dla powtarzalnych procesów przez szablony i kopiowanie danych
