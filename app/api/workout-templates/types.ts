export interface IWorkoutTemplateItem {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  exercises?: IWorkoutTemplateExerciseItem[];
  created_at: string;
  updated_at?: string;
}

export interface IWorkoutTemplateExerciseItem {
  id: string;
  name: string;
  sets: IWorkoutTemplateSetItem[];
}

export interface IWorkoutTemplateSetItem {
  id: string;
  set_number: number;
  reps?: number;
  weight?: number;
  duration?: number;
}
