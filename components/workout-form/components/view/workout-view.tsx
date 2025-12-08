"use client";

// hooks
import { useGetWorkout } from "../../api/use-get-workout";

// components
import { Loader } from "@/components/shared/loader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CenterWrapper from "@/components/shared/center-wrapper";
import { CheckCircle2, Circle } from "lucide-react";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";

interface WorkoutViewProps {
  workoutId: string;
}

export const WorkoutView = ({ workoutId }: WorkoutViewProps) => {
  const {
    data: workoutData,
    isLoading,
    isError,
    error,
  } = useGetWorkout({
    workoutId,
    enabled: !!workoutId,
  });

  if (isLoading) {
    return (
      <CenterWrapper>
        <Loader />
      </CenterWrapper>
    );
  }

  if (isError || !workoutData) {
    return (
      <CenterWrapper>
        <div className="text-center text-destructive">
          {error?.message || "Failed to load workout data"}
        </div>
      </CenterWrapper>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2 flex-1">
          <label className="text-sm font-medium text-muted-foreground">
            Workout Name
          </label>
          <p className="text-base font-semibold">{workoutData.name || "-"}</p>
        </div>
        {(workoutData.start_date || workoutData.end_date) && (
          <div className="flex flex-col gap-2 items-end">
            {workoutData.start_date && (
              <div className="flex flex-col gap-1 items-end">
                <label className="text-[11px] font-medium text-muted-foreground">
                  Start Date
                </label>
                <p className="text-[11px]">
                  {format(new Date(workoutData.start_date), "d MMMM yyyy", {
                    locale: enUS,
                  })}
                </p>
              </div>
            )}
            {workoutData.end_date && (
              <div className="flex flex-col gap-1 items-end">
                <label className="text-[11px] font-medium text-muted-foreground">
                  Last Updated
                </label>
                <p className="text-[11px]">
                  {format(new Date(workoutData.end_date), "d MMMM yyyy", {
                    locale: enUS,
                  })}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {workoutData.description && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-muted-foreground">
            Description
          </label>
          <p className="text-base">{workoutData.description}</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium text-muted-foreground">
          Exercises
        </label>

        {!workoutData.exercises || workoutData.exercises.length === 0 ? (
          <p className="text-muted-foreground text-sm">No exercises added</p>
        ) : (
          workoutData.exercises.map((exercise) => (
            <Card key={exercise.id}>
              <CardHeader>
                <CardTitle>{exercise.name || "Unnamed Exercise"}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {!exercise.sets || exercise.sets.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No sets added</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-12 gap-2 pb-2 border-b">
                      <div className="col-span-1 text-xs font-medium text-muted-foreground text-center">
                        ✓
                      </div>
                      <div className="col-span-2 text-xs font-medium text-muted-foreground text-center">
                        Set
                      </div>
                      <div className="col-span-2 text-xs font-medium text-muted-foreground text-center">
                        Reps
                      </div>
                      <div className="col-span-2 text-xs font-medium text-muted-foreground text-center">
                        Weight
                      </div>
                      <div className="col-span-3 text-xs font-medium text-muted-foreground text-center">
                        Duration
                      </div>
                    </div>

                    {exercise.sets.map((set) => (
                      <div
                        key={set.id}
                        className="grid grid-cols-12 gap-2 items-center"
                      >
                        <div className="col-span-1 flex items-center justify-center">
                          {set.isChecked ? (
                            <CheckCircle2
                              className="h-5 w-5 text-success"
                              strokeWidth={2}
                            />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="col-span-2 text-sm text-center">
                          {set.set_number ?? "-"}
                        </div>
                        <div className="col-span-2 text-sm text-center">
                          {set.reps !== undefined ? set.reps : "-"}
                        </div>
                        <div className="col-span-2 text-sm text-center">
                          {set.weight !== undefined ? `${set.weight} kg` : "-"}
                        </div>
                        <div className="col-span-3 text-sm text-center">
                          {set.duration !== undefined
                            ? `${set.duration} min`
                            : "-"}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
