import { http, HttpResponse } from 'msw'

//types
import type { IGetDietHistoryResponse } from '@/app/api/diet/get-history/route'

export const dietHandlers = [
  http.get('/api/diet/get-history', () =>
    HttpResponse.json<IGetDietHistoryResponse>({ days: [] })
  ),
]
