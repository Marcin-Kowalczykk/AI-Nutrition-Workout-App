export interface IWorkoutItem {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  exercises?: IWorkoutExerciseItem[];
  created_at: string;
  updated_at?: string;
}

export interface IWorkoutExerciseItem {
  id: string;
  name: string;
  sets: IWorkoutSetItem[];
}

export interface IWorkoutSetItem {
  id: string;
  set_number: number;
  reps: number;
  weight: number;
  duration: number;
  isChecked?: boolean;
  rpe?: number | null;
}
