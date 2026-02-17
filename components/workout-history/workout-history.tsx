"use client";

import { useState, useMemo } from "react";
import { format, startOfDay, endOfDay } from "date-fns";
import { pl } from "date-fns/locale";

// components
import { Loader } from "@/components/shared/loader";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/shared/date-picker";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { toast } from "sonner";

// hooks
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useGetWorkoutHistory } from "./api/use-get-workout-history";
import { useDeleteWorkout } from "@/components/workout-form/api/use-delete-workout";

// types
import { IWorkoutItem } from "@/app/api/workouts/types";
import CenterWrapper from "../shared/center-wrapper";

const WorkoutHistory = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [workoutIdToDelete, setWorkoutIdToDelete] = useState<string | null>(
    null
  );

  const startDateString = useMemo(() => {
    if (!startDate) return undefined;
    return endOfDay(startDate).toISOString();
  }, [startDate]);

  const endDateString = useMemo(() => {
    if (!endDate) return undefined;
    return startOfDay(endDate).toISOString();
  }, [endDate]);

  const { data, isLoading, error, isError } = useGetWorkoutHistory({
    startDate: startDateString,
    endDate: endDateString,
  });

  const { mutate: deleteWorkout, isPending: isDeleting } = useDeleteWorkout({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["get-workout-history"] });
      setWorkoutIdToDelete(null);
      toast.success("Workout deleted");
    },
    onError: (err) => {
      toast.error(err || "Failed to delete workout");
    },
  });

  if (isLoading) {
    return (
      <CenterWrapper className="w-full xl:w-1/2">
        <Loader />
      </CenterWrapper>
    );
  }

  if (isError) {
    return (
      <CenterWrapper>
        <div className="text-destructive">
          Error: {error?.message || "Failed to load workout history"}
        </div>
      </CenterWrapper>
    );
  }

  const workouts = data?.workouts || [];

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return format(date, "d MMMM yyyy", { locale: pl });
  };

  const handleView = (workoutId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("workoutId", workoutId);
    router.replace(`${pathname}?${params.toString()}`);
  };

  const handleEdit = (workoutId: string) => {
    router.push(`/workout/edit?id=${workoutId}`);
  };

  const handleConfirmDelete = () => {
    if (workoutIdToDelete) {
      deleteWorkout(workoutIdToDelete);
    }
  };

  return (
    <div className="justify-start">
      <div className="flex flex-col mb-2 xl:w-1/2 w-full">
        <div className="flex flex-row gap-1">
          <div className="flex-1">
            <DatePicker
              value={startDate}
              onChange={(date) => setStartDate(date || undefined)}
              placeholder="select start date"
            />
          </div>
          <div className="flex-1">
            <DatePicker
              value={endDate}
              onChange={(date) => setEndDate(date || undefined)}
              placeholder="select end date"
              disabled={(date) => {
                if (startDate) {
                  return date > startDate;
                }
                return false;
              }}
            />
          </div>
        </div>
      </div>

      {workouts.length === 0 ? (
        <div className="text-center text-muted-foreground">
          No workouts found. Start creating your first workout!
        </div>
      ) : (
        <ul className="flex flex-col gap-2 xl:w-1/2 w-full">
          {workouts.map((workout: IWorkoutItem) => (
            <li key={workout.id}>
              <Card className="w-full">
                <CardContent className="p-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <div className="text-sm text-muted-foreground border-b-2 border-destructive pb-2 w-fit">
                        {formatDate(workout.created_at)}
                      </div>
                      <div className="font-semibold text-lg">
                        {workout.name}
                      </div>
                      {workout.description && (
                        <div className="text-sm text-muted-foreground">
                          {workout.description}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEdit(workout.id)}
                        className="h-9 w-9 text-foreground"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleView(workout.id)}
                        className="h-9 w-9 text-foreground"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setWorkoutIdToDelete(workout.id)}
                        className="h-9 w-9 text-destructive hover:text-destructive"
                        aria-label="Delete workout"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <ConfirmModal
        open={workoutIdToDelete !== null}
        onOpenChange={(open) => !open && setWorkoutIdToDelete(null)}
        title="Delete workout?"
        description="This will permanently delete this workout. This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDelete}
        isPending={isDeleting}
      />
    </div>
  );
};

export default WorkoutHistory;
