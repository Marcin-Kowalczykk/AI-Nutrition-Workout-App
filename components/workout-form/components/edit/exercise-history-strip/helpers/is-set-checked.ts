type WorkoutSetLike = {
  isChecked?: boolean;
  is_checked?: boolean;
};

export const isSetChecked = (set: WorkoutSetLike): boolean =>
  set.isChecked === true || set.is_checked === true;

