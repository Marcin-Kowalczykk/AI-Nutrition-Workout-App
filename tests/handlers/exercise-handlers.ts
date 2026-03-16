import { http, HttpResponse } from 'msw'
import { IListExercisesResponse } from '@/app/api/exercises/route'

export const exerciseHandlers = [
  http.get('/api/exercises', () =>
    HttpResponse.json<IListExercisesResponse>({ exercises: [] })
  ),
]
