export interface IExerciseCategory {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface IExercise {
  id: string;
  user_id: string;
  category_id: string;
  name: string;
  created_at: string;
}
