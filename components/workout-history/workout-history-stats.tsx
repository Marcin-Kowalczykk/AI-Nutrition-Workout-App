"use client";

// types
type WorkoutHistoryStatsProps = {
  exercisesCount: number;
  setsCount: number;
};

export const WorkoutHistoryStats = ({
  exercisesCount,
  setsCount,
}: WorkoutHistoryStatsProps) => {
  return (
    <div className="flex gap-1.5">
      <div className="flex-1 rounded-lg border border-border bg-background py-1 text-center">
        <span className="block text-lg font-black leading-none text-primary-element/60">
          {exercisesCount}
        </span>
        <span className="mt-0.5 block text-[8px] uppercase tracking-widest text-muted-foreground">
          Exercises
        </span>
      </div>
      <div className="flex-1 rounded-lg border border-border bg-background py-1 text-center">
        <span className="block text-lg font-black leading-none text-primary-element/60">
          {setsCount}
        </span>
        <span className="mt-0.5 block text-[8px] uppercase tracking-widest text-muted-foreground">
          Sets
        </span>
      </div>
    </div>
  );
};
