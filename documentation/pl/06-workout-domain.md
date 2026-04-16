# Domena treningowa

## Cel segmentu

To centralna część treningowa aplikacji, ale w aktualnej hierarchii produktu znajduje się niżej niż dieta i AI.
Odpowiada za codzienną pracę użytkownika z treningami:

- przegląd historii
- tworzenie nowego treningu
- edycję istniejącego treningu
- podgląd szczegółów
- analizę wcześniejszych wykonań ćwiczeń podczas edycji

## Główne ścieżki

- `/main-page`
- `/workout/create`
- `/workout/edit`

## Podmoduły

### 1. Workout history

- lista zapisanych treningów
- filtrowanie po dacie
- wyszukiwanie tekstowe
- paginacja
- szybkie akcje: podgląd, edycja, usuwanie

### 2. Workout create

- rozpoczęcie nowego treningu
- opcjonalne użycie szablonu jako punktu startowego
- budowanie listy ćwiczeń i serii
- zapis nowego treningu

### 3. Workout edit

- pobranie istniejącego treningu
- modyfikacja ćwiczeń i serii
- aktualizacja danych
- usuwanie treningu

### 4. Exercise history strip

- pokazanie wcześniejszych wykonań podobnego ćwiczenia w trakcie edycji
- ułatwienie porównania bieżącej sesji z historią

## Wspólna warstwa formularza

Kluczowym modułem jest `components/workout-form`, który służy zarówno do:

- treningów
- szablonów treningowych

## Backend i API

- `app/api/workouts/create-new-workout/route.ts`
- `app/api/workouts/get-workout/route.ts`
- `app/api/workouts/update-workout/route.ts`
- `app/api/workouts/delete-workout/route.ts`
- `app/api/workouts/get-workouts-history/route.ts`
