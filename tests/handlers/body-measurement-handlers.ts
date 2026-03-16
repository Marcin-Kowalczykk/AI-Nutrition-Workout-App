import { http, HttpResponse } from 'msw'
import { IGetBodyMeasurementsHistoryResponse } from '@/app/api/body-measurements/get-history/route'

export const bodyMeasurementHandlers = [
  http.get('/api/body-measurements/get-history', () =>
    HttpResponse.json<IGetBodyMeasurementsHistoryResponse>({ measurements: [] })
  ),
]
