import { http, HttpResponse } from 'msw'

//types
import type { IGetDietHistoryResponse } from '@/app/api/diet/get-history/route'
import type { IAddMealResponse } from '@/app/api/diet/add-meal/route'
import type { IDietDay } from '@/app/api/diet/types'

const makeDietDay = (overrides: Partial<IDietDay> = {}): IDietDay => ({
  id: 'day-1',
  user_id: 'user-1',
  date: '2026-04-08',
  created_at: '2026-04-08T10:00:00.000Z',
  updated_at: '2026-04-08T10:00:00.000Z',
  diet_meals: [],
  total_kcal: 0,
  total_protein_value: 0,
  total_carbs_value: 0,
  total_fat_value: 0,
  ...overrides,
})

export const dietHandlers = [
  http.get('/api/diet/get-history', () =>
    HttpResponse.json<IGetDietHistoryResponse>({ days: [] })
  ),
  http.post('/api/diet/add-meal', () =>
    HttpResponse.json<IAddMealResponse>(makeDietDay(), { status: 201 })
  ),
]
