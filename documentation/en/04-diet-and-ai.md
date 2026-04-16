# Diet and AI Features

## Segment goal

This segment combines classic diet logging with AI tools that speed up nutrition input.
In the current product hierarchy, this area is more important than the training area.

## Main routes

- `/diet-history`
- `/ai-meal-analyzer`

## Part 1. Diet history

### Scope

- diet day history
- meals and product logging
- macros and calories
- per-day totals
- diet day editing
- deletion
- product copy
- meal copy

### Main components

- `components/diet-history`
- `components/diet-history/add-edit-diet-day-sheet`

### Backend and API

- `app/api/diet/create/route.ts`
- `app/api/diet/get-history/route.ts`
- `app/api/diet/update/route.ts`
- `app/api/diet/delete/route.ts`
- `app/api/diet/copy-product/route.ts`
- `app/api/diet/copy-meal/route.ts`

## Part 2. Product label scanning

### Goal

It speeds up product entry from a nutrition label photo.

### Behavior detected in code

- the endpoint accepts an image
- AI reads values per 100 g or 100 ml
- whole-product nutrition can be returned optionally
- total product grams can be returned optionally
- if all per-100 g values are empty, the request fails with a business error

### Constraints

- allowed image types: `jpeg`, `png`, `gif`, `webp`
- there is a daily usage limit per user
- the app owner can bypass the limit via `OWNER_USER_ID`

## Part 3. AI Meal Analyzer

### Goal

It estimates calories and macros from a meal description and optionally 1-2 images.

### Functional scope

- text meal description
- voice input
- AI analysis
- structured product list output
- saving accepted results into diet history

### Behavior detected in code

- analysis can work without an image
- the model is instructed to split separate food items from a single composed dish
- the AI response includes products, confidence, and warning
- accepted results can be saved into diet history
- there is a separate daily usage limit

### Backend and API

- `app/api/diet/analyze-product/route.ts`
- `app/api/diet/add-meal/route.ts`
- `app/api/diet/scan-product/route.ts`

## Product importance

This is the most distinctive part of the project because it reduces the cost of manual diet logging and creates product differentiation through AI.
