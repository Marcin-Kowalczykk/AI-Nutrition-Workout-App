"use client";

// hooks
import { useGetWorkout } from "../../api/use-get-workout";

// components
import { Loader } from "@/components/shared/loader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CenterWrapper from "@/components/shared/center-wrapper";
import { CheckCircle2, Circle, XCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
          workoutData.exercises.map((exercise) => {
            const sets = exercise.sets ?? [];
            const hasWeight = sets.some(
              (set) => set.weight !== undefined && set.weight !== null
            );
            const hasDuration = sets.some(
              (set) =>
                set.duration !== undefined &&
                set.duration !== null &&
                set.duration > 0
            );

            return (
              <Card key={exercise.id}>
                <CardHeader>
                  <CardTitle>{exercise.name || "Unnamed Exercise"}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  {sets.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      No sets added
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[48px] text-center">
                            ✓
                          </TableHead>
                          <TableHead className="w-[60px] text-center">
                            Set
                          </TableHead>
                          <TableHead className="w-[80px] text-center">
                            Reps
                          </TableHead>
                          {hasWeight && (
                            <TableHead className="w-[90px] text-center">
                              Weight
                            </TableHead>
                          )}
                          {hasDuration && (
                            <TableHead className="w-[110px] text-center">
                              Duration
                            </TableHead>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sets.map((set) => (
                          <TableRow key={set.id}>
                            <TableCell className="text-center flex items-center justify-center gap-1">
                              {set.isChecked ? (
                                <CheckCircle2
                                  className="h-5 w-5 text-success"
                                  strokeWidth={2}
                                />
                              ) : (
                                <XCircle
                                  className="h-5 w-5 text-destructive"
                                  strokeWidth={2}
                                />
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {set.set_number ?? "-"}
                            </TableCell>
                            <TableCell className="text-center">
                              {set.reps !== undefined ? set.reps : "-"}
                            </TableCell>
                            {hasWeight && (
                              <TableCell className="text-center">
                                {set.weight !== undefined && set.weight !== null
                                  ? `${set.weight} kg`
                                  : "-"}
                              </TableCell>
                            )}
                            {hasDuration && (
                              <TableCell className="text-center">
                                {set.duration !== undefined &&
                                set.duration !== null &&
                                set.duration > 0
                                  ? `${set.duration} s`
                                  : "-"}
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};
