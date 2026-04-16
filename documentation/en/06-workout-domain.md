# Workout Domain

## Segment goal

This is the main training segment of the app, but in the current product hierarchy it sits below diet and AI.
It handles daily workout operations:

- browsing workout history
- creating a new workout
- editing an existing workout
- viewing workout details
- reviewing previous exercise performance while editing

## Main routes

- `/main-page`
- `/workout/create`
- `/workout/edit`

## Submodules

### 1. Workout history

- stored workout list
- date filtering
- text search
- pagination
- quick actions: view, edit, delete

### 2. Workout create

- start a new workout
- optionally use a template as a starting point
- build exercise and set lists
- save a new workout

### 3. Workout edit

- fetch an existing workout
- modify exercises and sets
- update data
- delete a workout

### 4. Exercise history strip

- show previous executions of a similar exercise during editing
- help compare the current session with history

## Shared form layer

The key module is `components/workout-form`, which is used for:

- workouts
- workout templates

## Backend and API

- `app/api/workouts/create-new-workout/route.ts`
- `app/api/workouts/get-workout/route.ts`
- `app/api/workouts/update-workout/route.ts`
- `app/api/workouts/delete-workout/route.ts`
- `app/api/workouts/get-workouts-history/route.ts`
