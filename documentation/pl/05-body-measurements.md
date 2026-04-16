# Pomiary ciała

## Cel segmentu

Segment służy do śledzenia zmian sylwetki i parametrów ciała niezależnie od samych treningów.

## Główna ścieżka

- `/body-measurements`

## Zakres funkcjonalny

- dodawanie pomiaru
- edycja pomiaru
- usuwanie pomiaru
- przegląd historii
- filtrowanie zakresem dat
- paginacja po stronie klienta

## Obsługiwane dane

- masa ciała
- wzrost
- data i czas pomiaru
- obwód ręki
- obwód klatki
- obwód pasa
- obwód bioder
- obwód uda
- obwód łydki

## Backend i API

- `app/api/body-measurements/create/route.ts`
- `app/api/body-measurements/get-history/route.ts`
- `app/api/body-measurements/update/route.ts`
- `app/api/body-measurements/delete/route.ts`

## Powiązane materiały

- `guides/body-measurements-database.md`
