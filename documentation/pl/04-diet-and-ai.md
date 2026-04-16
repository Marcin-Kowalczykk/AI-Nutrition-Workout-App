# Dieta i funkcje AI

## Cel segmentu

Segment łączy klasyczne logowanie diety z narzędziami AI wspierającymi szybkie wprowadzanie danych.
W hierarchii produktu jest to obszar ważniejszy niż część treningowa.

## Główne ścieżki

- `/diet-history`
- `/ai-meal-analyzer`

## Część 1. Diet history

### Zakres

- historia dni dietetycznych
- zapis posiłków i produktów
- makroskładniki i kalorie
- sumy per dzień
- edycja dnia dietetycznego
- usuwanie
- kopiowanie produktu
- kopiowanie posiłku

### Główne komponenty

- `components/diet-history`
- `components/diet-history/add-edit-diet-day-sheet`

### Backend i API

- `app/api/diet/create/route.ts`
- `app/api/diet/get-history/route.ts`
- `app/api/diet/update/route.ts`
- `app/api/diet/delete/route.ts`
- `app/api/diet/copy-product/route.ts`
- `app/api/diet/copy-meal/route.ts`

## Część 2. Skan etykiety produktu

### Cel

Ułatwia wprowadzenie danych produktu na podstawie zdjęcia etykiety żywieniowej.

### Zachowanie wykryte w kodzie

- endpoint przyjmuje obraz
- AI ma odczytać wartości per 100 g lub 100 ml
- opcjonalnie odczytywana jest wartość dla całego produktu
- opcjonalnie odczytywana jest masa całkowita produktu
- jeśli wszystkie wartości per 100 g są puste, request kończy się błędem biznesowym

### Ograniczenia

- dozwolone typy obrazu: `jpeg`, `png`, `gif`, `webp`
- istnieje dzienny limit użycia na użytkownika
- właściciel aplikacji może mieć bypass limitu przez `OWNER_USER_ID`

## Część 3. AI Meal Analyzer

### Cel

Pozwala oszacować kalorie i makro na podstawie opisu posiłku oraz opcjonalnie 1-2 zdjęć.

### Zakres funkcjonalny

- opis tekstowy posiłku
- voice input
- analiza z użyciem AI
- zwrot listy produktów
- zapis zaakceptowanej analizy do historii diety

### Zachowanie wykryte w kodzie

- analiza może działać bez zdjęcia, tylko po opisie
- model ma rozdzielać osobne produkty od jednego złożonego dania
- odpowiedź AI zawiera produkty, confidence i warning
- po akceptacji wynik może zostać zapisany do diet history
- istnieje osobny dzienny limit użycia

### Backend i API

- `app/api/diet/analyze-product/route.ts`
- `app/api/diet/add-meal/route.ts`
- `app/api/diet/scan-product/route.ts`

## Znaczenie produktowe

To najbardziej wyróżniająca się część projektu, bo redukuje koszt ręcznego wpisywania diety i buduje przewagę produktu przez AI.
