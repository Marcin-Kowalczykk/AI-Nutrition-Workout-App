import { http, HttpResponse } from 'msw'
import { IGetWorkoutsHistoryResponse } from '@/app/api/workouts/get-workouts-history/route'

export const workoutHandlers = [
  http.get('/api/workouts/get-workouts-history', () =>
    HttpResponse.json<IGetWorkoutsHistoryResponse>({
      workouts: [],
      hasMore: false,
      total: 0,
    })
  ),
]
