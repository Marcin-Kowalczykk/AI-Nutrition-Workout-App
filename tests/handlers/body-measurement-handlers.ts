import { http, HttpResponse } from 'msw'

export const bodyMeasurementHandlers = [
  http.get('/api/body-measurements/get-body-measurements-history', () =>
    HttpResponse.json({ measurements: [], hasMore: false })
  ),
]
