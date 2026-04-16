# Body Measurements

## Segment goal

This segment is used to track physique and body parameter changes independently of workout records.

## Main route

- `/body-measurements`

## Functional scope

- add measurement
- edit measurement
- delete measurement
- browse history
- filter by date range
- client-side pagination

## Supported data

- body weight
- height
- date and time of measurement
- arm circumference
- chest circumference
- waist circumference
- hips circumference
- thigh circumference
- calf circumference

## Backend and API

- `app/api/body-measurements/create/route.ts`
- `app/api/body-measurements/get-history/route.ts`
- `app/api/body-measurements/update/route.ts`
- `app/api/body-measurements/delete/route.ts`

## Related material

- `guides/body-measurements-database.md`
