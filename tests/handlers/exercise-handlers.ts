import { http, HttpResponse } from 'msw'

export const exerciseHandlers = [
  http.get('/api/exercises/get-exercises', () =>
    HttpResponse.json({ exercises: [] })
  ),
]
